"""Проверка таблиц: читаем свою таблицу и поставщиков, сопоставляем вещи, находим изменения."""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from html import escape
from pathlib import Path

import aiohttp

from . import fetch
from .db import DB, Link, Source, now
from .matching import decide, name_tokens, rank, score, split_tag, tag_stats
from .parser import Item, ParsedTable, TableError, is_active, parse_sheets, sizes_text
from .sizes import NOSIZE, sort_sizes
from .textnorm import norm

log = logging.getLogger("stockbot.engine")

DEFAULTS = {"interval": 10, "added": True, "price": True, "low": True, "note": True}
ERRORS_BEFORE_ALERT = 3


@dataclass
class Notice:
    text: str
    review: bool = False     # приложить кнопку «Разобрать»


def state_of(item: Item | None) -> dict:
    if item is None:
        return {"present": False}
    return {"present": True, "avail": {s: item.sizes[s] for s in item.available()},
            "price": item.price, "raw": item.raw}


def _sizes(avail: dict) -> str:
    real = [s for s in avail if s != NOSIZE]
    if not real:
        return "есть" if avail else "нет"
    return ", ".join(f"{s} ({avail[s]} шт)" if avail[s] else s for s in sort_sizes(real))


def diff(old: dict, new: dict, opts: dict) -> list[str]:
    """Что изменилось у поставщика по одной вещи — готовые строки для сообщения."""
    if not new.get("present"):
        return ["❗️ Пропала из таблицы поставщика — возможно, сняли с продажи"] if old.get("present") else []
    lines: list[str] = []
    if old.get("present") is False:
        lines.append("✅ Снова появилась в таблице поставщика")
    oa, na = old.get("avail") or {}, new.get("avail") or {}
    removed = [s for s in oa if s not in na and s != NOSIZE]
    added = [s for s in na if s not in oa and s != NOSIZE]
    size_change = False
    if oa and not na:
        lines.append("🚫 Закончилась — размеров больше нет")
        size_change = True
    elif not oa and na and old.get("present"):
        lines.append("✅ Снова в наличии: " + _sizes(na))
        size_change = True
    else:
        if removed:
            lines.append("➖ Убрали: " + ", ".join(sort_sizes(removed)))
            size_change = True
        if added and opts.get("added", True):
            lines.append("➕ Появились: " + ", ".join(sort_sizes(added)))
            size_change = True
        left = [s for s in na if s != NOSIZE]
        if removed and len(left) == 1:
            lines.append(f"⚠️ Остался только размер {left[0]}")
    if opts.get("low", True):
        for size in sort_sizes(na):
            was = oa.get(size, 0)
            if na[size] == 1 and size in oa and (was is None or was > 1):
                label = "" if size == NOSIZE else f"{size}: "
                lines.append(f"⚠️ {label}осталась 1 шт")
    if opts.get("price", True) and old.get("price") and new.get("price") and old["price"] != new["price"]:
        lines.append(f"💰 Цена: {old['price']} → {new['price']}")
    if (opts.get("note", True) and not size_change and old.get("raw") and new.get("raw")
            and norm(old["raw"]) != norm(new["raw"])):
        lines.append(f"ℹ️ Запись изменилась: «{old['raw']}» → «{new['raw']}»")
    return lines


def resolve(link: Link, items: list[Item]) -> Item | None:
    """Находим привязанную вещь в свежей таблице поставщика."""
    by_key = {i.key: i for i in items}
    if link.sup_key in by_key:
        return by_key[link.sup_key]
    # ссылку на фото могли заменить — ищем по тому же названию, если оно одно такое
    base = link.sup_key.split("|")[:3]
    same = [i for i in items if i.key.split("|")[:3] == base]
    return same[0] if len(same) == 1 else None


class Engine:
    def __init__(self, db: DB, data_dir: Path):
        self.db = db
        self.files = Path(data_dir) / "files"
        self.files.mkdir(parents=True, exist_ok=True)
        self.lock = asyncio.Lock()
        self.gate = asyncio.Semaphore(3)     # не больше трёх таблиц одновременно — бережём Google от наплыва
        self.session: aiohttp.ClientSession | None = None
        self.last_cycle = ""

    async def start(self) -> None:
        if self.session is None:
            self.session = fetch.new_session()

    async def close(self) -> None:
        if self.session is not None:
            await self.session.close()
            self.session = None

    def opts(self) -> dict:
        return {**DEFAULTS, **(self.db.get("settings") or {})}

    def set_opt(self, key: str, value) -> None:
        settings = self.db.get("settings") or {}
        settings[key] = value
        self.db.set("settings", settings)

    def file_path(self, source_id: int) -> Path:
        return self.files / f"{source_id}.bin"

    # -- чтение таблиц -----------------------------------------------------
    async def read_url(self, url: str, mine: bool, config: dict | None = None) -> tuple[str, ParsedTable]:
        await self.start()
        title, sheets = await fetch.load_url(self.session, url)
        return title, await asyncio.to_thread(parse_sheets, sheets, config, mine)

    async def read_bytes(self, data: bytes, name: str, mine: bool, config: dict | None = None) -> ParsedTable:
        from .workbook import load_sheets
        sheets = await asyncio.to_thread(load_sheets, data, name)
        return await asyncio.to_thread(parse_sheets, sheets, config, mine)

    async def read(self, src: Source) -> ParsedTable:
        mine = src.role == "mine"
        if src.kind == "url":
            _title, table = await self.read_url(src.url, mine, src.config)
        else:
            path = self.file_path(src.id)
            if not path.exists():
                raise TableError("Файл таблицы потерялся — пришлите его ещё раз.")
            sheets = await fetch.load_file(path, src.file_name)
            table = await asyncio.to_thread(parse_sheets, sheets, src.config, mine)
        if not table.items:
            raise TableError("Не нашёл в таблице товаров — возможно, поменялась её структура.")
        return table

    async def _load(self, src: Source, notices: list[Notice], manual: bool) -> ParsedTable | None:
        try:
            async with self.gate:
                table = await self.read(src)
        except TableError as exc:
            reason = str(exc)
        except Exception as exc:  # неожиданная ошибка не должна ронять проверку остальных таблиц
            log.exception("source %s failed", src.name)
            reason = f"внутренняя ошибка: {exc.__class__.__name__}"
        else:
            if src.error_notified:
                notices.append(Notice(f"✅ Таблица «{escape(src.name)}» снова открывается."))
            self.db.update_source(src.id, checked_at=now(), last_error="", error_count=0, error_notified=0,
                                  item_count=len(table.items), summary=table.describe())
            self.db.save_snapshot(src.id, table.items)
            return table
        count = src.error_count + 1
        notify = manual or (count >= ERRORS_BEFORE_ALERT and not src.error_notified)
        self.db.update_source(src.id, last_error=reason, error_count=count,
                              error_notified=1 if (notify or src.error_notified) else 0)
        if notify:
            notices.append(Notice(f"⚠️ Не могу прочитать таблицу «{escape(src.name)}»:\n{escape(reason)}"))
        return None

    # -- главный цикл ------------------------------------------------------
    async def cycle(self, manual: bool = False) -> list[Notice]:
        async with self.lock:
            await self.start()
            return await self._cycle(manual)

    async def _cycle(self, manual: bool) -> list[Notice]:
        db, notices, opts = self.db, [], self.opts()
        mine_src = db.mine()
        suppliers = db.sources("supplier")
        if mine_src is None:
            return [Notice("Сначала пришлите ссылку на вашу таблицу с вещами.")] if manual else []

        results = await asyncio.gather(self._load(mine_src, notices, manual),
                                       *(self._load(s, notices, manual) for s in suppliers))
        self.last_cycle = now()
        my_table, sup_tables = results[0], dict(zip((s.id for s in suppliers), results[1:]))
        if my_table is None:
            return notices

        tags = {s.id: (s.tags or [s.name]) for s in suppliers}
        names = {s.id: s.name for s in suppliers}
        active_keys: set[str] = set()
        changes: dict[int, list[str]] = {}
        fresh: dict[int, list[str]] = {}
        gone: dict[int, list[tuple[Link, str]]] = {}
        tracked: dict[int, int] = {}
        need_review = 0

        for item in my_table.items:
            if not is_active(item):
                continue
            source_id, bare = split_tag(item.name, tags)
            if source_id is None:
                continue
            active_keys.add(item.key)
            table = sup_tables.get(source_id)
            if table is None:
                continue                      # таблица поставщика сейчас не открылась — не трогаем
            link = db.link_by_key(item.key)
            if link is not None and link.source_id != source_id:
                db.delete_link(link.id)
                link = None
            if link is not None and link.status == "none":
                if not link.active:
                    db.update_link(link.id, active=1)
                continue

            if link is None or link.status == "ask":
                ranked = rank(bare, table.items)
                hit = decide(ranked)
                if hit is not None:
                    db.save_link(item.key, item.name, source_id, "auto", hit.key, hit.title, state_of(hit))
                    fresh.setdefault(source_id, []).append(
                        f"• {escape(item.name)} → <i>{escape(hit.title)}</i>: {escape(sizes_text(hit))}")
                    tracked[source_id] = tracked.get(source_id, 0) + 1
                else:
                    asked = link.asked if link else 0
                    if not asked:
                        need_review += 1
                    db.save_link(item.key, item.name, source_id, "ask",
                                 candidates=[c.key for _s, c in ranked[:6]], asked=1)
                continue

            tracked[source_id] = tracked.get(source_id, 0) + 1
            sup = resolve(link, table.items)
            renamed = ""
            if sup is None:
                # поставщик мог переименовать вещь — пробуем найти её заново по названию
                sup = decide(rank(bare, table.items))
                if sup is not None:
                    renamed = f"ℹ️ У поставщика теперь называется «{sup.title}»"
            new_state = state_of(sup)
            if sup is not None and sup.key != link.sup_key:
                db.update_link(link.id, sup_key=sup.key, sup_name=sup.title)
            if not link.active:
                db.update_link(link.id, state=new_state, active=1)   # вещь снова выставлена — начинаем с чистого листа
                continue
            lines = diff(link.state, new_state, opts)
            if renamed and link.state.get("present"):
                lines.insert(0, renamed)
            if new_state != link.state:
                db.update_link(link.id, state=new_state)
            if not lines:
                continue
            block = f"<b>{escape(item.name)}</b>\n" + "\n".join(escape(x) for x in lines)
            if sup is not None:
                block += f"\nСейчас: {escape(sizes_text(sup))}"
                if sup.dups:
                    block += f"\n<i>строк с таким названием у поставщика: {sup.dups + 1} — показываю общее наличие</i>"
                changes.setdefault(source_id, []).append(block)
            else:
                gone.setdefault(source_id, []).append((link, block))

        for link in db.links(active_only=True):
            if link.my_key not in active_keys and sup_tables.get(link.source_id) is not None:
                db.update_link(link.id, active=0)          # вещь сняли или продали — больше не следим

        for source_id, lost in gone.items():
            total = tracked.get(source_id, 0)
            if len(lost) >= 4 and len(lost) * 2 > total:
                notices.append(Notice(
                    f"⚠️ <b>{escape(names[source_id])}</b>: из таблицы разом пропало {len(lost)} из {total} ваших вещей. "
                    "Похоже, поставщик переделал таблицу или переименовал товары. Загляните в неё; "
                    "привязки можно поправить в «📦 Мои вещи»."))
            else:
                changes.setdefault(source_id, []).extend(block for _l, block in lost)

        for source_id, blocks in changes.items():
            notices.append(Notice(f"🔔 <b>{escape(names[source_id])}</b> — изменения\n\n" + "\n\n".join(blocks)))
        for source_id, lines in fresh.items():
            notices.append(Notice(f"🆕 <b>{escape(names[source_id])}</b> — начал следить за вещами: {len(lines)}\n\n"
                                  + "\n".join(lines)))
        if need_review:
            notices.append(Notice(f"❓ Не уверен насчёт вещей: {need_review}. Нужно один раз выбрать, "
                                  "какая это вещь у поставщика.", review=True))
        return notices

    # -- ручные действия ---------------------------------------------------
    def candidates(self, link: Link) -> list[Item]:
        by_key = {i.key: i for i in self.db.snapshot(link.source_id)}
        return [by_key[k] for k in link.candidates if k in by_key]

    def refresh_candidates(self, link: Link, query: str | None = None) -> list[Item]:
        """Пересчитать варианты: по названию вещи или по словам, которые ввёл человек."""
        items = self.db.snapshot(link.source_id)
        if query is None:
            src = self.db.source(link.source_id)
            _sid, query = split_tag(link.my_name, {link.source_id: (src.tags or [src.name]) if src else []})
        want = name_tokens(query)
        scored = [(score(want, name_tokens(i.title)), i) for i in items]
        scored = [(s, i) for s, i in scored if s > 0.2]
        scored.sort(key=lambda x: (-x[0], x[1].row))
        found = [i for _s, i in scored[:8]]
        self.db.update_link(link.id, candidates=[i.key for i in found])
        return found

    def choose(self, link: Link, item: Item) -> None:
        self.db.update_link(link.id, status="manual", sup_key=item.key, sup_name=item.title,
                            state=state_of(item), candidates=[], active=1)

    def dismiss(self, link: Link) -> None:
        self.db.update_link(link.id, status="none", sup_key="", sup_name="", state={}, candidates=[])

    def owned(self) -> dict[int, set[str]]:
        """Вещи поставщиков, которые уже есть в своей таблице (в любом статусе) — по каждому поставщику.

        Нужно поиску: показывать только то, чего у владельца ещё нет."""
        db = self.db
        suppliers = db.sources("supplier")
        out: dict[int, set[str]] = {s.id: set() for s in suppliers}
        decided: set[str] = set()
        for link in db.links():
            if link.status in ("auto", "manual") and link.source_id in out:
                out[link.source_id].add(link.sup_key)
            if link.status != "ask":
                decided.add(link.my_key)
        mine_src = db.mine()
        if mine_src is None:
            return out
        tags = {s.id: (s.tags or [s.name]) for s in suppliers}
        snaps: dict[int, list[Item]] = {}
        for item in db.snapshot(mine_src.id):       # снятые и проданные тоже «уже есть в таблице»
            if item.key in decided:
                continue
            source_id, bare = split_tag(item.name, tags)
            if source_id is None:
                continue
            if source_id not in snaps:
                snaps[source_id] = db.snapshot(source_id)
            hit = decide(rank(bare, snaps[source_id]))
            if hit is not None:
                out[source_id].add(hit.key)
        return out

    def overview(self) -> dict:
        """Сводка для экрана «Мои вещи»."""
        db = self.db
        suppliers = {s.id: s for s in db.sources("supplier")}
        mine_src = db.mine()
        my_items = [i for i in (db.snapshot(mine_src.id) if mine_src else []) if is_active(i)]
        tags = {s.id: (s.tags or [s.name]) for s in suppliers.values()}
        untagged = [i.name for i in my_items if split_tag(i.name, tags)[0] is None]
        groups: dict[int, dict] = {}
        for link in db.links(active_only=True):
            if link.source_id not in suppliers:
                continue
            g = groups.setdefault(link.source_id, {"tracked": [], "ask": [], "none": []})
            g["tracked" if link.status in ("auto", "manual") else link.status].append(link)
        return {"suppliers": suppliers, "groups": groups, "untagged": untagged,
                "untagged_tags": tag_stats(untagged), "active": len(my_items)}
