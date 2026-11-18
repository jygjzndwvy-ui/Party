"""Telegram-бот: меню, добавление таблиц, уведомления, поиск по базе поставщиков."""
from __future__ import annotations

import asyncio
import io
import logging
import re
import time
from datetime import datetime
from html import escape
from zoneinfo import ZoneInfo

from aiogram import BaseMiddleware, Bot, Dispatcher, F, Router
from aiogram.exceptions import TelegramNetworkError
from aiogram.filters import Command, CommandStart, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (CallbackQuery, ErrorEvent, InlineKeyboardButton, InlineKeyboardMarkup,
                           KeyboardButton, LinkPreviewOptions, Message, ReplyKeyboardMarkup)

from . import fetch
from .db import DB, Link, Source
from .engine import Engine, Notice, _sizes
from .matching import parse_query, search, tag_stats, words
from .parser import ParsedTable, TableError, is_active, parse_override, sizes_text

log = logging.getLogger("stockbot.bot")
router = Router()

B_ITEMS, B_SEARCH, B_TABLES, B_CHECK, B_SETTINGS, B_HELP = (
    "📦 Мои вещи", "🔎 Поиск по базе", "📊 Таблицы", "📋 Проверить наличие", "⚙️ Настройки", "❓ Помощь")
OLD_CHECK = "🔄 Проверить сейчас"      # кнопка из прошлой версии: у владельца она ещё может висеть в меню
MENU = ReplyKeyboardMarkup(resize_keyboard=True, keyboard=[
    [KeyboardButton(text=B_ITEMS), KeyboardButton(text=B_SEARCH)],
    [KeyboardButton(text=B_TABLES), KeyboardButton(text=B_CHECK)],
    [KeyboardButton(text=B_SETTINGS), KeyboardButton(text=B_HELP)],
])
MENU_TEXTS = {B_ITEMS, B_SEARCH, B_TABLES, B_CHECK, OLD_CHECK, B_SETTINGS, B_HELP}
# «проверь наличие», «что снять с авито», «каких вещей нет у поставщиков» — просьба об отчёте, а не поиск
REPORT_WORDS = re.compile(r"провер|нет в наличии|нету|нет у постав|закончил|снять|снимать|убрать|отсутству", re.I)
NO_PREVIEW = LinkPreviewOptions(is_disabled=True)
LIMIT = 3800

HELP = (
    "<b>Как это работает</b>\n\n"
    "1. Пришлите ссылку на <b>вашу таблицу</b> с вещами (Google Таблица, доступ «все, у кого есть ссылка»). "
    "Я слежу только за вещами со статусом «выставлен».\n"
    "2. Пришлите ссылки на <b>таблицы поставщиков</b>. Для каждой я спрошу, как этот поставщик помечен "
    "в названиях ваших вещей — например, «Пуховик Zara черный <u>nord</u>».\n"
    "3. Дальше я сам проверяю таблицы и пишу, когда у поставщика по вашей вещи пропал или появился размер, "
    "вещь закончилась, изменилась цена.\n\n"
    "<b>Поиск по базе</b> — просто напишите мне:\n"
    "• <code>куртки s m l</code> — куртки (и пуховики, ветровки, бомберы), у которых есть все эти размеры сразу\n"
    "• <code>s m l</code> — любые вещи с такими размерами\n"
    "• <code>пуховик zara</code> — поиск по названию\n"
    "• <code>худи xl vega</code> — худи размера XL у поставщика VEGA\n"
    "Вещи, которые уже есть в вашей таблице, в поиске скрыты — показываю то, чего у вас ещё нет.\n\n"
    "<b>Проверить наличие</b> — кнопка внизу или напишите «проверь наличие». Пришлю список ваших "
    "выставленных вещей, которых нет у поставщиков, чтобы вы сняли их с Авито.\n\n"
    "Новую вещь добавлять не нужно: внесите её в свою таблицу с пометкой поставщика в конце названия — "
    "я подхвачу её при следующей проверке."
)


class Add(StatesGroup):
    tag = State()


class Fix(StatesGroup):
    query = State()
    name = State()


class Edit(StatesGroup):
    columns = State()
    tags = State()


def kb(*rows: list[tuple[str, str]]) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t, callback_data=d) for t, d in row] for row in rows if row])


def chunks(text: str, limit: int = LIMIT) -> list[str]:
    """Режем длинное сообщение по строкам (теги у нас не переходят через строку)."""
    out, cur = [], ""
    for line in text.split("\n"):
        while len(line) > limit:
            if cur:
                out.append(cur)
                cur = ""
            out.append(line[:limit])
            line = line[limit:]
        if cur and len(cur) + len(line) + 1 > limit:
            out.append(cur)
            cur = line
        else:
            cur = f"{cur}\n{line}" if cur else line
    if cur.strip():
        out.append(cur)
    return out


async def send(bot: Bot, chat_id: int, text: str, markup=None) -> None:
    parts = chunks(text)
    for i, part in enumerate(parts):
        last = i == len(parts) - 1
        await bot.send_message(chat_id, part, reply_markup=markup if last else None,
                               link_preview_options=NO_PREVIEW)


async def deliver(bot: Bot, chat_id: int, notices: list[Notice]) -> None:
    for n in notices:
        await send(bot, chat_id, n.text, kb([("❓ Разобрать", "rev")]) if n.review else None)


async def flush_outbox(bot: Bot, db: DB, chat_id: int) -> None:
    """Досылаем уведомления фоновой проверки. Если Telegram недоступен, они ждут в очереди
    и уйдут при следующей попытке — изменение у поставщика не потеряется."""
    box = db.get("outbox") or []
    while box:
        item = box[0]
        await send(bot, chat_id, item["text"], kb([("❓ Разобрать", "rev")]) if item.get("review") else None)
        box.pop(0)
        db.set("outbox", box)


class OwnerOnly(BaseMiddleware):
    """Бот личный: отвечает только владельцу (первому, кто нажал /start, либо OWNER_ID)."""

    def __init__(self, db: DB, owner_id: int | None):
        self.db = db
        if owner_id:
            db.set("owner", owner_id)

    async def __call__(self, handler, event, data):
        user = data.get("event_from_user")
        if user is None:
            return None
        owner = self.db.get("owner")
        if owner is None:
            self.db.set("owner", user.id)
            log.info("owner set to %s", user.id)
        elif owner != user.id:
            if isinstance(event, Message):
                await event.answer("Это личный бот, он отвечает только своему владельцу.")
            return None
        return await handler(event, data)


# ── команды и меню ──────────────────────────────────────────────────────────
@router.message(CommandStart())
async def cmd_start(m: Message, state: FSMContext, db: DB):
    await state.clear()
    text = "Привет! Я слежу за наличием ваших вещей у поставщиков.\n\n" + HELP
    if db.mine() is None:
        text += "\n\n👉 Начнём: пришлите ссылку на вашу таблицу с вещами."
    await m.answer(text, reply_markup=MENU, link_preview_options=NO_PREVIEW)


@router.message(Command("help"))
@router.message(F.text == B_HELP)
async def cmd_help(m: Message, state: FSMContext):
    await state.clear()
    await m.answer(HELP, reply_markup=MENU)


@router.message(Command("check"))
@router.message(F.text.in_({B_CHECK, OLD_CHECK}))
async def cmd_check(m: Message, state: FSMContext, engine: Engine, db: DB, tz: ZoneInfo):
    await state.clear()
    if db.mine() is None:
        await m.answer("Сначала пришлите ссылку на вашу таблицу с вещами.")
        return
    if m.text == OLD_CHECK:
        await m.answer("Обновил кнопки меню.", reply_markup=MENU)
    wait = await m.answer("⏳ Перечитываю таблицы и проверяю наличие…")
    notices = await engine.cycle(manual=True)
    await wait.delete()
    # «не уверен насчёт вещей» не шлём отдельно — эти вещи есть в отчёте, и под ним та же кнопка
    await deliver(m.bot, m.chat.id, [n for n in notices if not n.review])
    text, markup = report_view(engine, tz)
    await send(m.bot, m.chat.id, text, markup)


def report_view(engine: Engine, tz: ZoneInfo) -> tuple[str, InlineKeyboardMarkup | None]:
    """Отчёт «Проверить наличие»: какие выставленные вещи пора снять с Авито."""
    r = engine.stock_report()
    lines = [f"📋 <b>Проверка наличия</b> · выставлено вещей: {r['active']}"]
    if r["missing"]:
        lines.append(f"\n🚫 <b>Нет у поставщика — снимите с Авито: {len(r['missing'])}</b>")
        groups: dict[int, list] = {}
        for src, name, why in r["missing"]:
            groups.setdefault(src.id, []).append((src, name, why))
        for rows in groups.values():
            lines.append(f"\n<b>{escape(rows[0][0].name)}</b>")
            lines += [f"• {escape(name)} — {escape(why)}" for _src, name, why in rows]
    else:
        lines.append("\n✅ Вещей, которых нет у поставщиков, не нашёл.")
    if r["unsure"]:
        lines.append(f"\n❓ <b>Не уверен, какая это вещь у поставщика: {len(r['unsure'])}</b>\n"
                     "Нажмите «Разобрать» — после этого проверю и их.")
        lines += [f"• {escape(name)} · {escape(src.name)}" for src, name in r["unsure"]]
    if r["unchecked"]:
        lines.append(f"\n⚠️ <b>Не проверил — таблица поставщика не открылась: {len(r['unchecked'])}</b>")
        lines += [f"• {escape(name)} · {escape(src.name)}" for src, name in r["unchecked"]]
    for src in r["stale"]:
        lines.append(f"\n⚠️ Таблица «{escape(src.name)}» сейчас не открывается ({escape(src.last_error)}). "
                     f"По ней данные на {_when(src.checked_at, tz)}.")
    if r["untagged"]:
        lines.append(f"\n⚪️ <b>Не проверял — нет таблицы поставщика: {len(r['untagged'])}</b>")
        stats = ", ".join(f"{t} — {n}" for t, n in r["untagged_tags"][:12])
        if stats:
            lines.append(f"Пометки в названиях: {escape(stats)}")
        lines.append("Пришлите мне таблицы этих поставщиков — буду проверять и их.")
    lines.append(f"\n✅ Есть у поставщиков: {r['ok']}")
    markup = kb([(f"❓ Разобрать ({len(r['unsure'])})", "rev")]) if r["unsure"] else None
    return "\n".join(lines), markup


@router.message(Command("items"))
@router.message(F.text == B_ITEMS)
async def cmd_items(m: Message, state: FSMContext, engine: Engine, db: DB):
    await state.clear()
    if db.mine() is None:
        await m.answer("Сначала пришлите ссылку на вашу таблицу с вещами.")
        return
    ov = engine.overview()
    tracked = sum(len(g["tracked"]) for g in ov["groups"].values())
    ask = sum(len(g["ask"]) for g in ov["groups"].values())
    lines = [f"📦 Выставлено вещей: {ov['active']}",
             f"Слежу: {tracked} · нужно уточнить: {ask} · без таблицы поставщика: {len(ov['untagged'])}"]
    for source_id, g in ov["groups"].items():
        src = ov["suppliers"][source_id]
        lines.append(f"\n<b>{escape(src.name)}</b> — слежу за {len(g['tracked'])}")
        for link in sorted(g["tracked"], key=lambda x: x.my_name.lower()):
            state_ = link.state
            now_ = _sizes(state_.get("avail") or {}) if state_.get("present") else "пропала из таблицы"
            lines.append(f"• {escape(link.my_name)} — {escape(now_)}")
        if g["ask"]:
            lines.append(f"❓ нужно уточнить: {len(g['ask'])}")
        if g["none"]:
            lines.append(f"🚫 нет у поставщика: {len(g['none'])}")
    if ov["untagged"]:
        stats = ", ".join(f"{escape(t)} — {n}" for t, n in ov["untagged_tags"][:10])
        lines.append(f"\nБез таблицы поставщика: {len(ov['untagged'])}" + (f"\nПометки в названиях: {stats}" if stats else ""))
        lines.append("Пришлите ссылки на таблицы этих поставщиков — начну следить и за ними.")
    row = [("🔧 Исправить привязку", "fix")]
    if ask:
        row.insert(0, (f"❓ Разобрать ({ask})", "rev"))
    await send(m.bot, m.chat.id, "\n".join(lines), kb(row))


@router.message(Command("search"))
@router.message(F.text == B_SEARCH)
async def cmd_search(m: Message, state: FSMContext):
    await state.clear()
    await m.answer(
        "Напишите, что искать по таблицам поставщиков:\n\n"
        "• <code>куртки s m l</code> — куртки, у которых есть все эти размеры сразу\n"
        "• <code>s m l</code> — любые вещи с такими размерами\n"
        "• <code>пуховик zara</code> — по названию\n"
        "• <code>худи xl vega</code> — худи XL у поставщика VEGA\n\n"
        "Вещи, которые уже есть в вашей таблице, не показываю.")


@router.message(Command("tables"))
@router.message(F.text == B_TABLES)
async def cmd_tables(m: Message, state: FSMContext, db: DB, tz: ZoneInfo):
    await state.clear()
    text, markup = tables_view(db, tz)
    await m.answer(text, reply_markup=markup)


def _when(iso: str, tz: ZoneInfo) -> str:
    if not iso:
        return "ещё не проверял"
    return datetime.fromisoformat(iso).astimezone(tz).strftime("%d.%m %H:%M")


def tables_view(db: DB, tz: ZoneInfo) -> tuple[str, InlineKeyboardMarkup | None]:
    sources = db.sources()
    if not sources:
        return "Таблиц пока нет. Пришлите ссылку на вашу таблицу с вещами.", None
    lines, rows = ["📊 <b>Таблицы</b>\n"], []
    for s in sources:
        icon = "🏠" if s.role == "mine" else "🚚"
        status = f"⚠️ {escape(s.last_error)}" if s.last_error else f"{s.item_count} поз., проверено {_when(s.checked_at, tz)}"
        lines.append(f"{icon} <b>{escape(s.name)}</b> — {status}")
        rows.append([(f"{icon} {s.name}", f"src:{s.id}")])
    lines.append("\nЧтобы добавить таблицу, просто пришлите ссылку на неё или файл Excel.")
    return "\n".join(lines), kb(*rows)


@router.message(Command("settings"))
@router.message(F.text == B_SETTINGS)
async def cmd_settings(m: Message, state: FSMContext, engine: Engine):
    await state.clear()
    text, markup = settings_view(engine)
    await m.answer(text, reply_markup=markup)


def settings_view(engine: Engine) -> tuple[str, InlineKeyboardMarkup]:
    o = engine.opts()

    def flag(key: str, title: str) -> tuple[str, str]:
        return (("✅ " if o[key] else "▫️ ") + title, f"tog:{key}")

    text = ("⚙️ <b>Настройки</b>\n\n"
            f"Проверяю таблицы каждые <b>{o['interval']} мин</b>.\n"
            "О пропавших размерах и закончившихся вещах пишу всегда. Остальное можно выключить:")
    return text, kb(
        [((("• " if o["interval"] == n else "") + f"{n} мин"), f"int:{n}") for n in (5, 10, 15, 30, 60)],
        [flag("added", "Появились размеры")], [flag("price", "Изменилась цена")],
        [flag("low", "Осталась 1 шт")], [flag("note", "Изменилась запись поставщика")])


@router.callback_query(F.data.startswith("int:"))
async def cb_interval(c: CallbackQuery, engine: Engine):
    engine.set_opt("interval", int(c.data.split(":")[1]))
    text, markup = settings_view(engine)
    await c.message.edit_text(text, reply_markup=markup)
    await c.answer("Сохранил")


@router.callback_query(F.data.startswith("tog:"))
async def cb_toggle(c: CallbackQuery, engine: Engine):
    key = c.data.split(":")[1]
    engine.set_opt(key, not engine.opts()[key])
    text, markup = settings_view(engine)
    await c.message.edit_text(text, reply_markup=markup)
    await c.answer("Сохранил")


# ── добавление таблицы ──────────────────────────────────────────────────────
def _head_words(sheets) -> set[str]:
    """Слова из названий листов и первых строк — в них часто написано имя поставщика."""
    out: set[str] = set()
    for sheet in sheets:
        out.update(words(sheet.name))
        for row in sheet.rows[:6]:
            for cell in row:
                out.update(words(cell))
    return out


async def _offer_role(m: Message, state: FSMContext, db: DB, title: str, sup: ParsedTable,
                      mine: ParsedTable, payload: dict, sheets) -> None:
    looks_mine = any(info.has_status for info in mine.sheets) or not any(i.has_real_sizes() for i in sup.items)
    await state.update_data(**payload, title=title, head=sorted(_head_words(sheets) | set(words(title))))
    name = f"«{escape(title)}»" if title else "таблицу"
    count = len(mine.items) if looks_mine else len(sup.items)
    row_mine = ("🏠 Это моя таблица" + (" ✓" if looks_mine else ""), "role:mine")
    row_sup = ("🚚 Это таблица поставщика" + ("" if looks_mine else " ✓"), "role:sup")
    rows = [[row_mine], [row_sup]] if looks_mine else [[row_sup], [row_mine]]
    if payload.get("kind") == "file":
        for s in db.sources():
            if s.kind == "file":
                rows.append([(f"🔁 Обновить «{s.name}»", f"upd:{s.id}")])
    await m.answer(f"Прочитал {name}: позиций — {count}. Что это за таблица?", reply_markup=kb(*rows))


@router.message(F.document)
async def on_document(m: Message, state: FSMContext, engine: Engine, db: DB):
    await state.clear()
    doc = m.document
    if (doc.file_size or 0) > 20 * 1024 * 1024:
        await m.answer("Файл больше 20 МБ — Telegram не даёт ботам такие скачивать. Обычно это из-за фотографий "
                       "в таблице. Пришлите ссылку на Google Таблицу или файл без картинок.")
        return
    wait = await m.answer("⏳ Читаю файл…")
    buf = io.BytesIO()
    await m.bot.download(doc, destination=buf)
    data, name = buf.getvalue(), doc.file_name or "table.xlsx"
    try:
        from .workbook import load_sheets
        sheets = await asyncio.to_thread(load_sheets, data, name)
        sup = await engine.read_bytes(data, name, mine=False)
        mine = await engine.read_bytes(data, name, mine=True)
    except TableError as exc:
        await wait.edit_text(f"⚠️ {escape(str(exc))}")
        return
    await wait.delete()
    if not sup.items and not mine.items:
        await m.answer("Не нашёл в файле товаров. Пришлите таблицу, где есть столбец с названиями.")
        return
    tmp = engine.files / f"_upload_{m.chat.id}.bin"
    tmp.write_bytes(data)
    title = name.rsplit(".", 1)[0]
    await _offer_role(m, state, db, title, sup, mine, {"kind": "file", "file_name": name}, sheets)


@router.message(F.text.regexp(r"https?://"))
async def on_url(m: Message, state: FSMContext, engine: Engine, db: DB):
    await state.clear()
    url = fetch.find_url(m.text)
    wait = await m.answer("⏳ Читаю таблицу…")
    try:
        await engine.start()
        title, sheets = await fetch.load_url(engine.session, url)
        from .parser import parse_sheets
        sup = await asyncio.to_thread(parse_sheets, sheets, None, False)
        mine = await asyncio.to_thread(parse_sheets, sheets, None, True)
    except TableError as exc:
        await wait.edit_text(f"⚠️ {escape(str(exc))}")
        return
    await wait.delete()
    if not sup.items and not mine.items:
        await m.answer("Таблица открылась, но товаров в ней я не нашёл. Нужен столбец с названиями вещей.")
        return
    for s in db.sources():
        if s.kind == "url" and s.url == url:
            await m.answer(f"Эта таблица уже добавлена как «{escape(s.name)}».")
            return
    await _offer_role(m, state, db, title, sup, mine, {"kind": "url", "url": url}, sheets)


async def _save_source(c: CallbackQuery, state: FSMContext, engine: Engine, db: DB, role: str,
                       name: str, tags: list[str]) -> Source:
    data = await state.get_data()
    src = db.add_source(role, name, data["kind"], url=data.get("url", ""),
                        file_name=data.get("file_name", ""), tags=tags, title=data.get("title", ""))
    if data["kind"] == "file":
        (engine.files / f"_upload_{c.message.chat.id}.bin").replace(engine.file_path(src.id))
    await state.clear()
    return src


@router.callback_query(F.data == "role:mine")
async def cb_role_mine(c: CallbackQuery, state: FSMContext, engine: Engine, db: DB):
    data = await state.get_data()
    if "kind" not in data:
        await c.answer("Пришлите ссылку ещё раз", show_alert=True)
        return
    old = db.mine()
    if old is not None:
        db.delete_source(old.id)
    await _save_source(c, state, engine, db, "mine", data.get("title") or "Моя таблица", [])
    await c.message.edit_text("⏳ Запоминаю вашу таблицу…")
    notices = await engine.cycle(manual=True)
    mine_src = db.mine()
    items = db.snapshot(mine_src.id)
    active = [i for i in items if is_active(i)]
    tags = {s.id: (s.tags or [s.name]) for s in db.sources("supplier")}
    from .matching import split_tag
    untagged = [i.name for i in active if split_tag(i.name, tags)[0] is None]
    stats = tag_stats(untagged)
    text = f"🏠 Запомнил вашу таблицу: всего вещей — {len(items)}, выставлено — {len(active)}."
    if stats:
        text += ("\n\nПохоже, поставщик у вас указан в конце названия:\n"
                 + "\n".join(f"• <b>{escape(t)}</b> — вещей: {n}" for t, n in stats[:12])
                 + "\n\n👉 Теперь присылайте ссылки на таблицы этих поставщиков, по одной.")
    else:
        text += "\n\n👉 Теперь присылайте ссылки на таблицы поставщиков, по одной."
    await c.message.edit_text(text)
    await deliver(c.bot, c.message.chat.id, [n for n in notices if "Сначала" not in n.text])
    await c.answer()


@router.callback_query(F.data == "role:sup")
async def cb_role_sup(c: CallbackQuery, state: FSMContext, engine: Engine, db: DB):
    data = await state.get_data()
    if "kind" not in data:
        await c.answer("Пришлите ссылку ещё раз", show_alert=True)
        return
    ov = engine.overview()
    head = set(data.get("head") or [])
    options = [t for t, _n in ov["untagged_tags"][:10]]
    options.sort(key=lambda t: not all(w in head for w in words(t)))      # угаданная пометка — первой
    counts = dict(ov["untagged_tags"])
    await state.update_data(tag_options=options)
    await state.set_state(Add.tag)
    rows = [[(f"{t} — вещей: {counts[t]}", f"tag:{i}")] for i, t in enumerate(options)]
    text = ("Как этот поставщик помечен в названиях ваших вещей?\n"
            "Например, у вещи «Пуховик Zara черный <u>nord</u>» пометка — <code>nord</code>.\n\n")
    text += "Выберите из списка или напишите пометку сообщением." if options else "Напишите пометку сообщением."
    await c.message.edit_text(text, reply_markup=kb(*rows) if rows else None)
    await c.answer()


async def _finish_supplier(target: Message, c: CallbackQuery | None, state: FSMContext, engine: Engine,
                           db: DB, tag: str) -> None:
    tag = " ".join(words(tag))
    if not tag:
        await target.answer("Пометка не может быть пустой. Напишите её ещё раз.")
        return
    for s in db.sources("supplier"):
        if tag in [" ".join(words(t)) for t in (s.tags or [s.name])]:
            await target.answer(f"Пометка «{escape(tag)}» уже занята таблицей «{escape(s.name)}». Напишите другую.")
            return
    data = await state.get_data()
    src = db.add_source("supplier", tag.upper() if len(tag) <= 6 else tag.capitalize(), data["kind"],
                        url=data.get("url", ""), file_name=data.get("file_name", ""), tags=[tag],
                        title=data.get("title", ""))
    if data["kind"] == "file":
        (engine.files / f"_upload_{target.chat.id}.bin").replace(engine.file_path(src.id))
    await state.clear()
    wait = await target.answer(f"⏳ Добавил поставщика «{escape(src.name)}», сверяю с вашими вещами…")
    notices = await engine.cycle(manual=True)
    await wait.delete()
    src = db.source(src.id)
    await target.answer(f"🚚 <b>{escape(src.name)}</b>: в таблице позиций — {src.item_count}.")
    if notices:
        await deliver(target.bot, target.chat.id, notices)
    else:
        await target.answer(f"В вашей таблице пока нет выставленных вещей с пометкой «{escape(tag)}». "
                            "Когда появятся — начну следить автоматически.")


@router.callback_query(F.data.startswith("tag:"), StateFilter(Add.tag))
async def cb_tag(c: CallbackQuery, state: FSMContext, engine: Engine, db: DB):
    options = (await state.get_data()).get("tag_options") or []
    idx = int(c.data.split(":")[1])
    if idx >= len(options):
        await c.answer("Пришлите ссылку ещё раз", show_alert=True)
        return
    await c.message.edit_reply_markup(reply_markup=None)
    await c.answer()
    await _finish_supplier(c.message, c, state, engine, db, options[idx])


@router.message(StateFilter(Add.tag), F.text, ~F.text.in_(MENU_TEXTS))
async def msg_tag(m: Message, state: FSMContext, engine: Engine, db: DB):
    await _finish_supplier(m, None, state, engine, db, m.text)


@router.callback_query(F.data.startswith("upd:"))
async def cb_update_file(c: CallbackQuery, state: FSMContext, engine: Engine, db: DB):
    src = db.source(int(c.data.split(":")[1]))
    tmp = engine.files / f"_upload_{c.message.chat.id}.bin"
    data = await state.get_data()
    if src is None or not tmp.exists():
        await c.answer("Пришлите файл ещё раз", show_alert=True)
        return
    tmp.replace(engine.file_path(src.id))
    db.update_source(src.id, file_name=data.get("file_name", src.file_name))
    await state.clear()
    await c.message.edit_text(f"⏳ Обновил «{escape(src.name)}», ищу изменения…")
    notices = await engine.cycle(manual=True)
    await c.message.edit_text(f"🔁 Таблица «{escape(src.name)}» обновлена." + ("" if notices else " Изменений по вашим вещам нет."))
    await deliver(c.bot, c.message.chat.id, notices)
    await c.answer()


# ── карточка таблицы ────────────────────────────────────────────────────────
def source_view(src: Source, tz: ZoneInfo) -> tuple[str, InlineKeyboardMarkup]:
    icon = "🏠 Моя таблица" if src.role == "mine" else "🚚 Поставщик"
    lines = [f"{icon}: <b>{escape(src.name)}</b>"]
    if src.title:
        lines.append(f"Документ: {escape(src.title)}")
    if src.role == "supplier":
        lines.append("Пометка в названиях: " + ", ".join(f"<code>{escape(t)}</code>" for t in (src.tags or [src.name])))
    lines.append(f"Источник: {escape(src.url) if src.kind == 'url' else 'файл ' + escape(src.file_name)}")
    lines.append(f"Позиций: {src.item_count} · проверено: {_when(src.checked_at, tz)}")
    if src.last_error:
        lines.append(f"⚠️ {escape(src.last_error)}")
    rows = [[("👁 Как я понял таблицу", f"sum:{src.id}")]]
    if src.role == "supplier":
        rows.append([("🏷 Изменить пометку", f"stag:{src.id}")])
    rows += [[("🛠 Настроить столбцы", f"cols:{src.id}")], [("🗑 Удалить", f"del:{src.id}")], [("« К таблицам", "tables")]]
    return "\n".join(lines), kb(*rows)


@router.callback_query(F.data == "tables")
async def cb_tables(c: CallbackQuery, db: DB, tz: ZoneInfo):
    text, markup = tables_view(db, tz)
    await c.message.edit_text(text, reply_markup=markup)
    await c.answer()


@router.callback_query(F.data.startswith("src:"))
async def cb_source(c: CallbackQuery, db: DB, tz: ZoneInfo):
    src = db.source(int(c.data.split(":")[1]))
    if src is None:
        await c.answer("Таблица уже удалена", show_alert=True)
        return
    text, markup = source_view(src, tz)
    await c.message.edit_text(text, reply_markup=markup, link_preview_options=NO_PREVIEW)
    await c.answer()


@router.callback_query(F.data.startswith("sum:"))
async def cb_summary(c: CallbackQuery, db: DB):
    src = db.source(int(c.data.split(":")[1]))
    if src is None:
        await c.answer("Таблица уже удалена", show_alert=True)
        return
    await send(c.bot, c.message.chat.id,
               f"👁 <b>{escape(src.name)}</b>\n\n{escape(src.summary or 'Таблица ещё не проверялась.')}")
    await c.answer()


@router.callback_query(F.data.startswith("del:"))
async def cb_delete(c: CallbackQuery, db: DB):
    src = db.source(int(c.data.split(":")[1]))
    if src is None:
        await c.answer("Таблица уже удалена", show_alert=True)
        return
    await c.message.edit_text(f"Удалить таблицу «{escape(src.name)}»? Я перестану следить за вещами этого поставщика.",
                              reply_markup=kb([("🗑 Да, удалить", f"delyes:{src.id}"), ("Отмена", f"src:{src.id}")]))
    await c.answer()


@router.callback_query(F.data.startswith("delyes:"))
async def cb_delete_yes(c: CallbackQuery, engine: Engine, db: DB, tz: ZoneInfo):
    source_id = int(c.data.split(":")[1])
    db.delete_source(source_id)
    engine.file_path(source_id).unlink(missing_ok=True)
    text, markup = tables_view(db, tz)
    await c.message.edit_text("Удалил.\n\n" + text, reply_markup=markup)
    await c.answer()


@router.callback_query(F.data.startswith("stag:"))
async def cb_edit_tag(c: CallbackQuery, state: FSMContext):
    await state.set_state(Edit.tags)
    await state.update_data(source_id=int(c.data.split(":")[1]))
    await c.message.answer("Напишите, как этот поставщик помечен в названиях ваших вещей. "
                           "Если пометок несколько — через запятую, например: <code>vega, вега</code>")
    await c.answer()


@router.message(StateFilter(Edit.tags), F.text, ~F.text.in_(MENU_TEXTS))
async def msg_edit_tag(m: Message, state: FSMContext, engine: Engine, db: DB):
    src = db.source((await state.get_data()).get("source_id", 0))
    tags = [" ".join(words(t)) for t in m.text.split(",")]
    tags = [t for t in tags if t]
    if src is None or not tags:
        await m.answer("Не понял. Напишите пометку словами, например: <code>vega</code>")
        return
    db.update_source(src.id, tags=tags)
    await state.clear()
    wait = await m.answer("⏳ Сохранил, пересверяю вещи…")
    notices = await engine.cycle(manual=True)
    await wait.edit_text("🏷 Пометки сохранены: " + ", ".join(escape(t) for t in tags))
    await deliver(m.bot, m.chat.id, notices)


@router.callback_query(F.data.startswith("cols:"))
async def cb_columns(c: CallbackQuery, state: FSMContext):
    await state.set_state(Edit.columns)
    await state.update_data(source_id=int(c.data.split(":")[1]))
    await c.message.answer(
        "Обычно я сам понимаю, где что в таблице. Если ошибся — напишите столбцы буквами, как в Excel:\n\n"
        "<code>название=B размеры=D:I заголовок=6</code> — размеры в столбцах D…I, шапка в строке 6\n"
        "<code>название=A размер=C цена=D</code> — все размеры в одной ячейке\n\n"
        "Можно добавить <code>лист=Наличие</code>. Чтобы вернуть автоматический разбор, напишите <code>авто</code>.")
    await c.answer()


@router.message(StateFilter(Edit.columns), F.text, ~F.text.in_(MENU_TEXTS))
async def msg_columns(m: Message, state: FSMContext, engine: Engine, db: DB):
    src = db.source((await state.get_data()).get("source_id", 0))
    if src is None:
        await state.clear()
        return
    if m.text.strip().lower() in ("авто", "auto"):
        config: dict = {}
    else:
        try:
            config = parse_override(m.text)
        except ValueError as exc:
            await m.answer(f"⚠️ {escape(str(exc))}")
            return
    db.update_source(src.id, config=config)
    await state.clear()
    wait = await m.answer("⏳ Перечитываю таблицу…")
    notices = await engine.cycle(manual=True)
    src = db.source(src.id)
    await wait.delete()
    await send(m.bot, m.chat.id, f"🛠 <b>{escape(src.name)}</b>\n\n{escape(src.summary)}")
    await deliver(m.bot, m.chat.id, notices)


# ── уточнение и исправление привязок ────────────────────────────────────────
def review_view(engine: Engine, db: DB, link: Link, left: int | None = None) -> tuple[str, InlineKeyboardMarkup]:
    src = db.source(link.source_id)
    cands = engine.candidates(link)
    lines = []
    if left is not None:
        lines.append(f"❓ Осталось уточнить: {left}\n")
    lines.append(f"<b>{escape(link.my_name)}</b>\nПоставщик: {escape(src.name if src else '?')}\n")
    if cands:
        lines.append("Какая это вещь у поставщика?")
        for i, item in enumerate(cands, 1):
            extra = f" · {escape(item.sheet)}" if item.sheet else ""
            link_ = f" · <a href=\"{escape(item.link)}\">фото</a>" if item.link else ""
            lines.append(f"{i}. {escape(item.title)} — {escape(sizes_text(item))}{extra}{link_}")
    else:
        lines.append("Похожих вещей у поставщика не нашёл.")
    nums = [(str(i), f"p:{link.id}:{i - 1}") for i in range(1, len(cands) + 1)]
    return "\n".join(lines), kb(nums[:4], nums[4:], [("🔍 Найти по словам", f"m:{link.id}")],
                                [("🚫 Нет у поставщика", f"n:{link.id}"), ("⏭ Пропустить", f"s:{link.id}")])


async def _next_review(bot: Bot, chat_id: int, engine: Engine, db: DB, after: int = 0) -> None:
    pending = db.links(status="ask", active_only=True)
    if not pending:
        await bot.send_message(chat_id, "✅ Всё разобрано. Дальше слежу сам.")
        return
    link = next((x for x in pending if x.id > after), None)
    if link is None:
        await bot.send_message(chat_id, f"Пропущено вещей: {len(pending)}. Вернуться к ним можно в «📦 Мои вещи».")
        return
    if not engine.candidates(link):
        engine.refresh_candidates(link)
        link = db.link(link.id)
    text, markup = review_view(engine, db, link, len(pending))
    await bot.send_message(chat_id, text, reply_markup=markup, link_preview_options=NO_PREVIEW)


@router.callback_query(F.data == "rev")
async def cb_review(c: CallbackQuery, engine: Engine, db: DB):
    await c.answer()
    await _next_review(c.bot, c.message.chat.id, engine, db)


def _link_or_none(db: DB, data: str) -> Link | None:
    return db.link(int(data.split(":")[1]))


@router.callback_query(F.data.startswith("p:"))
async def cb_pick(c: CallbackQuery, engine: Engine, db: DB):
    link = _link_or_none(db, c.data)
    idx = int(c.data.split(":")[2])
    cands = engine.candidates(link) if link else []
    if link is None or idx >= len(cands):
        await c.answer("Список устарел, откройте вещь заново", show_alert=True)
        return
    was_review = link.status == "ask"
    item = cands[idx]
    engine.choose(link, item)
    await c.message.edit_text(f"✅ <b>{escape(link.my_name)}</b> → <i>{escape(item.title)}</i>\n"
                              f"Сейчас: {escape(sizes_text(item))}", link_preview_options=NO_PREVIEW)
    await c.answer("Запомнил")
    if was_review:
        await _next_review(c.bot, c.message.chat.id, engine, db, after=link.id)


@router.callback_query(F.data.startswith("n:"))
async def cb_none(c: CallbackQuery, engine: Engine, db: DB):
    link = _link_or_none(db, c.data)
    if link is None:
        await c.answer("Уже неактуально", show_alert=True)
        return
    was_review = link.status == "ask"
    engine.dismiss(link)
    await c.message.edit_text(f"🚫 <b>{escape(link.my_name)}</b> — не слежу (нет у поставщика).",
                              reply_markup=kb([("↩️ Вернуть", f"l:{link.id}")]))
    await c.answer()
    if was_review:
        await _next_review(c.bot, c.message.chat.id, engine, db, after=link.id)


@router.callback_query(F.data.startswith("s:"))
async def cb_skip(c: CallbackQuery, engine: Engine, db: DB):
    link_id = int(c.data.split(":")[1])
    await c.message.edit_reply_markup(reply_markup=None)
    await c.answer()
    await _next_review(c.bot, c.message.chat.id, engine, db, after=link_id)


@router.callback_query(F.data.startswith("m:"))
async def cb_manual(c: CallbackQuery, state: FSMContext, db: DB):
    link = _link_or_none(db, c.data)
    if link is None:
        await c.answer("Уже неактуально", show_alert=True)
        return
    await state.set_state(Fix.query)
    await state.update_data(link_id=link.id)
    await c.message.answer(f"Напишите пару слов, как эта вещь называется у поставщика — найду варианты.\n"
                           f"Вещь: <b>{escape(link.my_name)}</b>")
    await c.answer()


@router.message(StateFilter(Fix.query), F.text, ~F.text.in_(MENU_TEXTS))
async def msg_manual(m: Message, state: FSMContext, engine: Engine, db: DB):
    link = db.link((await state.get_data()).get("link_id", 0))
    if link is None:
        await state.clear()
        return
    found = engine.refresh_candidates(link, m.text)
    if not found:
        await m.answer("По этим словам у поставщика ничего нет. Попробуйте другие слова.")
        return
    await state.clear()
    text, markup = review_view(engine, db, db.link(link.id))
    await m.answer(text, reply_markup=markup, link_preview_options=NO_PREVIEW)


@router.callback_query(F.data == "fix")
async def cb_fix(c: CallbackQuery, state: FSMContext):
    await state.set_state(Fix.name)
    await c.message.answer("Напишите часть названия вашей вещи — покажу, к чему она привязана.")
    await c.answer()


@router.message(StateFilter(Fix.name), F.text, ~F.text.in_(MENU_TEXTS))
async def msg_fix(m: Message, state: FSMContext, db: DB):
    want = words(m.text)
    found = [x for x in db.links(active_only=True) if all(any(w in t for t in words(x.my_name)) for w in want)]
    if not found:
        await m.answer("Среди выставленных вещей такой нет. Попробуйте другое слово.")
        return
    await state.clear()
    marks = {"auto": "🔗", "manual": "🔗", "ask": "❓", "none": "🚫"}
    rows = [[(f"{marks[x.status]} {x.my_name}"[:60], f"l:{x.id}")] for x in found[:12]]
    await m.answer("Выберите вещь:", reply_markup=kb(*rows))


@router.callback_query(F.data.startswith("l:"))
async def cb_link(c: CallbackQuery, engine: Engine, db: DB):
    link = _link_or_none(db, c.data)
    if link is None:
        await c.answer("Вещь больше не отслеживается", show_alert=True)
        return
    src = db.source(link.source_id)
    lines = [f"<b>{escape(link.my_name)}</b>", f"Поставщик: {escape(src.name if src else '?')}"]
    if link.status in ("auto", "manual"):
        st = link.state
        lines.append(f"Привязана к: <i>{escape(link.sup_name)}</i>")
        lines.append("Сейчас: " + (escape(_sizes(st.get("avail") or {})) if st.get("present") else "пропала из таблицы"))
    elif link.status == "none":
        lines.append("Не слежу: отмечено «нет у поставщика».")
    else:
        lines.append("Пара ещё не выбрана.")
    await c.message.edit_text("\n".join(lines), reply_markup=kb(
        [("🔗 Выбрать другую вещь", f"re:{link.id}")], [("🚫 Не следить", f"n:{link.id}")]))
    await c.answer()


@router.callback_query(F.data.startswith("re:"))
async def cb_relink(c: CallbackQuery, engine: Engine, db: DB):
    link = _link_or_none(db, c.data)
    if link is None:
        await c.answer("Вещь больше не отслеживается", show_alert=True)
        return
    engine.refresh_candidates(link)
    text, markup = review_view(engine, db, db.link(link.id))
    await c.message.edit_text(text, reply_markup=markup, link_preview_options=NO_PREVIEW)
    await c.answer()


# ── поиск по базе поставщиков ───────────────────────────────────────────────
def search_view(db: DB, engine: Engine, text: str, show_owned: bool) -> tuple[str, InlineKeyboardMarkup | None]:
    """Ответ на поисковый запрос. По умолчанию прячем вещи, которые уже есть в своей таблице."""
    suppliers = db.sources("supplier")
    sizes, rest = parse_query(text)
    only = None
    for s in suppliers:                        # «худи xl vega» — ищем только у VEGA
        for tag in (s.tags or []) + [s.name]:
            tw = words(tag)
            if tw and all(w in rest for w in tw):
                only, rest = s, [w for w in rest if w not in tw]
                break
        if only:
            break
    if not sizes and not rest:
        return ("Напишите размеры или название, например: <code>куртки s m l</code> "
                "или <code>пуховик zara</code>."), None
    owned = engine.owned()
    total, hidden, blocks = 0, 0, []
    for s in ([only] if only else suppliers):
        found = search(db.snapshot(s.id), sizes, rest)
        if sizes or not rest:
            found = [i for i in found if i.available()]
        mine_keys = owned.get(s.id, set())
        if not show_owned:
            hidden += sum(1 for i in found if i.key in mine_keys)
            found = [i for i in found if i.key not in mine_keys]
        if not found:
            continue
        total += len(found)
        lines = [f"<b>{escape(s.name)}</b>"]
        for item in found[:60]:
            price = f" — {escape(item.price)} ₽" if item.price else ""
            mark = " · ✅ уже у вас" if item.key in mine_keys else ""
            lines.append(f"• {escape(item.title)} — {escape(sizes_text(item))}{price}{mark}")
        if len(found) > 60:
            lines.append(f"…и ещё {len(found) - 60}. Уточните запрос, чтобы увидеть остальные.")
        blocks.append("\n".join(lines))
    what = []
    if rest:
        what.append("«" + " ".join(rest) + "»")
    if sizes:
        what.append("размеры " + ", ".join(sizes) + (" одновременно" if len(sizes) > 1 else ""))
    title = escape(" · ".join(what) + (f" · только {only.name}" if only else ""))
    markup = kb([(f"Показать вместе с моими ({hidden})", "srch:all")]) if hidden else None
    note = f"\nСкрыл те, что уже есть в вашей таблице: {hidden}." if hidden else ""
    if not blocks:
        if hidden:
            return f"🔎 {title}: новых вещей нет — все подходящие ({hidden}) уже есть в вашей таблице.", markup
        return f"🔎 {title}: ничего не нашёл.", None
    return f"🔎 {title} — нашёл вещей: {total}{note}\n\n" + "\n\n".join(blocks), markup


@router.message(F.text, ~F.text.startswith("/"))
async def on_text(m: Message, state: FSMContext, db: DB, engine: Engine, tz: ZoneInfo):
    await state.clear()
    if REPORT_WORDS.search(m.text) and not parse_query(m.text)[0]:
        await cmd_check(m, state, engine, db, tz)
        return
    if not db.sources("supplier"):
        await m.answer("Пока искать негде: пришлите ссылку на вашу таблицу, а затем на таблицы поставщиков.")
        return
    db.set("last_search", m.text)
    text, markup = search_view(db, engine, m.text, show_owned=False)
    await send(m.bot, m.chat.id, text, markup)


@router.callback_query(F.data == "srch:all")
async def cb_search_all(c: CallbackQuery, db: DB, engine: Engine):
    query = db.get("last_search")
    if not query:
        await c.answer("Напишите запрос ещё раз", show_alert=True)
        return
    text, markup = search_view(db, engine, query, show_owned=True)
    await c.answer()
    await send(c.bot, c.message.chat.id, text, markup)


@router.errors()
async def on_error(event: ErrorEvent):
    log.exception("handler failed", exc_info=event.exception)
    update = event.update
    msg = update.message or (update.callback_query.message if update.callback_query else None)
    if msg is not None:
        try:
            await msg.answer("⚠️ Что-то пошло не так. Попробуйте ещё раз; если повторится — напишите разработчику.")
        except Exception:
            pass
    return True


# ── фоновая проверка ────────────────────────────────────────────────────────
async def monitor(bot: Bot, engine: Engine, db: DB) -> None:
    """Раз в N минут проверяем таблицы и шлём владельцу изменения."""
    last = 0.0
    while True:
        await asyncio.sleep(15)
        owner = db.get("owner")
        if owner is None or db.mine() is None:
            continue
        try:
            await flush_outbox(bot, db, owner)
            if time.monotonic() - last < engine.opts()["interval"] * 60:
                continue
            last = time.monotonic()
            notices = await engine.cycle()
            if notices:
                db.set("outbox", (db.get("outbox") or []) + [{"text": n.text, "review": n.review} for n in notices])
                await flush_outbox(bot, db, owner)
        except TelegramNetworkError:
            log.warning("Telegram недоступен — уведомления дошлю, когда связь вернётся")
            await asyncio.sleep(45)
        except Exception:
            log.exception("background check failed")


def build(db: DB, engine: Engine, owner_id: int | None, tz_name: str) -> Dispatcher:
    dp = Dispatcher()
    guard = OwnerOnly(db, owner_id)
    dp.message.outer_middleware(guard)
    dp.callback_query.outer_middleware(guard)
    dp.include_router(router)
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("UTC")
    dp["db"], dp["engine"], dp["tz"] = db, engine, tz
    return dp
