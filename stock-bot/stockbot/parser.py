"""Разбор таблицы наличия: из произвольного листа Excel получаем список товаров с размерами.

Понимаем три частых вида таблиц:
  • «широкая»  — размеры в столбцах:      Название | S | M | L | XL
  • «список»   — размеры в одной ячейке:  Название | Размеры: «S, M, L»
                 или по строке на размер: Название | Размер | Кол-во
  • «простая»  — без столбца размеров:    Название (L, чёрный) | Остаток, либо выгрузка 1С,
                 где под строкой товара идут строки размеров.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field

from .sizes import (AMBIG, NOSIZE, is_available, is_letter, loose_tokens, merge_stock, parse_marker,
                    parse_size, parse_size_list, parse_stock, sort_sizes)
from .textnorm import clean, norm, norm_article
from .workbook import Sheet, TableError, load_sheets

__all__ = ["Item", "SheetInfo", "ParsedTable", "parse_table", "parse_sheets", "TableError",
           "col_letter", "parse_override", "is_active"]


@dataclass
class Item:
    sheet: str
    name: str
    article: str = ""
    color: str = ""
    price: str = ""
    status: str = ""                        # «выставлен / снят / продан» — из своей таблицы
    kind: str = ""                          # «Дроп / Свой» — из своей таблицы
    raw: str = ""                           # ячейка размеров как её написал поставщик
    link: str = ""                          # ссылка на фото — различает вещи с одинаковым названием
    sizes: dict[str, int | None] = field(default_factory=dict)   # 0 — нет, None — есть, N — штук
    row: int = 0
    dups: int = 0                           # сколько ещё строк с таким же названием слилось в эту

    @property
    def key(self) -> str:
        return make_key(self.article, self.name, self.color, self.link)

    def available(self) -> list[str]:
        return [s for s, q in self.sizes.items() if is_available(q)]

    def has_real_sizes(self) -> bool:
        return any(s != NOSIZE for s in self.sizes)

    @property
    def title(self) -> str:
        parts = [self.name or self.article]
        if self.color and norm(self.color) not in norm(self.name):
            parts.append(self.color)
        return ", ".join(p for p in parts if p)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "Item":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


_INACTIVE = ("снят", "продан", "возврат", "архив", "удал", "закрыт", "неактив", "sold", "нет", "отмен", "черновик")
_OWN = ("сво", "мой", "моя", "мое", "own")


def is_active(item: Item) -> bool:
    """Нужно ли следить за вещью из своей таблицы: она выставлена и это не свой товар."""
    status, kind = norm(item.status), norm(item.kind)
    if status and status.startswith(_INACTIVE):
        return False
    return not (kind and kind.startswith(_OWN))


def make_key(article: str, name: str, color: str, link: str = "") -> str:
    parts = [norm_article(article), norm(name).replace("|", " "), norm(color).replace("|", " ")]
    if link:
        parts.append(clean(link).replace("|", ""))
    return "|".join(parts)


@dataclass
class SheetInfo:
    name: str
    items: int
    mode: str
    header_row: int                         # номер строки заголовка, как в Excel (0 — без заголовка)
    columns: dict[str, str]                 # роль → буква столбца
    sizes: list[str]
    has_status: bool = False


@dataclass
class ParsedTable:
    items: list[Item]
    sheets: list[SheetInfo]

    def describe(self) -> str:
        return describe(self)


ROLE_TITLES = {
    "name": "название", "article": "артикул", "color": "цвет", "price": "цена",
    "qty": "количество", "size": "размеры", "brand": "бренд", "status": "статус", "kind": "тип",
}
MODE_TITLES = {
    "wide": "размеры в столбцах",
    "list": "размеры в одной ячейке / по строкам",
    "plain": "без столбца размеров",
}

# Порядок важен: «Размеры в наличии» — это размеры, «Цена за шт» — цена.
_ROLE_PATTERNS = [
    ("link", r"^(ссылк|link|url)"),
    ("skip", r"^(№|n$|no$|#|п/п|п\.п|фото|photo|image|изображени|картинк|итого|всего|сумма"
             r"|примечани|комментари|состав|материал|ткань|упаков|в упаковке|в коробке|вес\b|объем|страна"
             r"|производител|категори|раздел|пол$|сезон|дата|штрих|barcode|ean|кратност|в ряду|ряд$"
             r"|выставлен|продан$|комисси|прибыл|доставк|замер)"),
    ("size", r"(размер|^р-р|^рр$|^р\.?$|\bsizes?\b|ростовк)"),
    ("id", r"^(id|ид)$"),
    ("status", r"^(статус|состояни|status)"),
    ("kind", r"^(тип|вид)$"),
    ("article", r"^(артикул|арт$|арт\.|арт |код|sku|article|art$|модель|model)"),
    ("color", r"(^|\s)(цвет|расцветк|colou?r)"),
    ("brand", r"^(бренд|brand|марка|фирма)"),
    ("price", r"(цена|^опт|розниц|стоимост|price|^ррц|^мрц|закуп|прайс|руб\b|₽)"),
    ("qty", r"(кол-?\s?во|количеств|остат|наличи|qty|quantity|stock|доступн|^шт\.?$|^штук)"),
    ("name", r"(наименован|назван|^товар|номенклатур|^позици|^name|title|product|^item|издели|^вещь|^вещи|ассортимент)"),
    ("desc", r"^(описани|description|характеристик)"),
]
_ROLE_RE = [(role, re.compile(pat, re.I)) for role, pat in _ROLE_PATTERNS]
_TOTAL = re.compile(r"^(итого|всего|total|сумма)\b", re.I)
_LETTERS = re.compile(r"[^\W\d_]{3,}")


def header_role(text: str) -> str | None:
    t = norm(text).strip(" :.*")
    if not t or len(t) > 45:
        return None
    for role, rx in _ROLE_RE:
        if rx.search(t):
            return role
    return None


def col_letter(idx: int) -> str:
    s = ""
    idx += 1
    while idx:
        idx, rem = divmod(idx - 1, 26)
        s = chr(65 + rem) + s
    return s


def col_index(letter: str) -> int:
    n = 0
    for ch in letter.strip().upper():
        if not "A" <= ch <= "Z":
            raise ValueError(letter)
        n = n * 26 + ord(ch) - 64
    if not n:
        raise ValueError(letter)
    return n - 1


@dataclass
class Layout:
    header_row: int = -1
    cols: dict[str, int] = field(default_factory=dict)
    size_cols: dict[int, str] = field(default_factory=dict)

    @property
    def mode(self) -> str:
        if self.size_cols:
            return "wide"
        return "list" if "size" in self.cols else "plain"

    def col(self, role: str) -> int | None:
        return self.cols.get(role)


def _row_roles(sheet: Sheet, r: int) -> tuple[dict[int, str], dict[int, str]]:
    roles: dict[int, str] = {}
    toks: dict[int, str] = {}
    if r < 0 or r >= len(sheet.rows):
        return roles, toks
    for c, text in enumerate(sheet.rows[r]):
        if not text:
            continue
        role = header_role(text)
        if role:
            roles[c] = role
        elif len(text) <= 14:
            size = parse_size(text)
            if size:
                toks[c] = size
    return roles, toks


def _size_header_ok(toks: dict[int, str], lenient: bool) -> bool:
    """Похожа ли строка на шапку с размерами (S M L XL / 42 44 46)."""
    if len(toks) < 2:
        return False
    vals = [toks[c] for c in sorted(toks)]
    if any(is_letter(v.split("-")[0]) or v in ("ONE SIZE", "OVERSIZE") for v in vals):
        return True
    try:
        nums = [float(v.split("-")[0]) for v in vals]
    except ValueError:
        return len(vals) >= 3
    increasing = all(a < b for a, b in zip(nums, nums[1:]))
    return increasing and (len(nums) >= 3 or lenient)


def _real(roles: dict[int, str]) -> set[str]:
    return {r for r in roles.values() if r != "skip"}


def _build_layout(sheet: Sheet, r: int, roles: dict[int, str], size_cols: dict[int, str],
                  consumed: int, mine: bool = False) -> Layout | None:
    cols: dict[str, int] = {}
    for c in sorted(roles):
        role = roles[c]
        if role == "skip" or c in size_cols:
            continue
        if role == "price" and "price" in cols:
            # дропшипперу нужна дроп-цена, а не опт или РРЦ
            if any("дроп" in norm(sheet.cell(rr, c)) for rr in (r, r + 1)) and not any(
                    "дроп" in norm(sheet.cell(rr, cols["price"])) for rr in (r, r + 1)):
                cols["price"] = c
            continue
        cols.setdefault(role, c)
    if size_cols:
        cols.pop("size", None)
        cols.pop("qty", None)
    if "id" in cols:
        ident = cols.pop("id")
        if not mine:
            cols.setdefault("article", ident)
    data_start = r + consumed
    sample = range(data_start, min(len(sheet.rows), data_start + 200))

    # «Наличие» бывает и количеством, и списком размеров — смотрим на содержимое.
    if not size_cols and "size" not in cols and "qty" in cols:
        qc = cols["qty"]
        filled = [sheet.cell(i, qc) for i in sample if sheet.cell(i, qc)]
        listy = [t for t in filled if _looks_like_size_list(t)]
        if filled and len(listy) >= max(1, len(filled) // 2):
            cols["size"] = cols.pop("qty")
    if "qty" in cols and not any(sheet.cell(i, cols["qty"]) for i in sample):
        cols.pop("qty")

    if "name" not in cols and "article" not in cols and "desc" not in cols:
        taken = set(cols.values()) | set(size_cols) | {c for c, role in roles.items() if role == "skip"}
        best, best_n = None, 0
        width = max((len(sheet.rows[i]) for i in sample), default=0)
        for c in range(width):
            if c in taken:
                continue
            n = sum(1 for i in sample if _LETTERS.search(sheet.cell(i, c)) and not parse_size_list(sheet.cell(i, c)))
            if n > best_n:
                best, best_n = c, n
        if best is None:
            return None
        cols["name"] = best
    return Layout(header_row=r + consumed - 1, cols=cols, size_cols=dict(size_cols))


def _looks_like_size_list(text: str) -> bool:
    pairs = parse_size_list(text)
    return bool(pairs) and (len(pairs) >= 2 or any(is_letter(s.split("-")[0]) for s, _ in pairs))


def _detect_header(sheet: Sheet, r: int, cur: Layout | None, mine: bool = False) -> tuple[Layout, int] | None:
    roles, toks = _row_roles(sheet, r)
    real = _real(roles)
    if not real and len(toks) < 2:
        return None

    if cur is not None:
        # Строка с данными — не шапка: в ней есть обычный текст.
        for c, text in enumerate(sheet.rows[r]):
            if text and c not in roles and c not in toks:
                return None
        if len(real) < 2:
            if cur.mode == "wide" and _size_header_ok(toks, lenient=False):
                return Layout(header_row=r, cols=dict(cur.cols), size_cols=dict(toks)), 1
            return None

    if _size_header_ok(toks, lenient=bool(real)):
        # Названия столбцов могут стоять строкой выше (двухэтажная шапка).
        above, _ = _row_roles(sheet, r - 1) if cur is None else ({}, {})
        merged = dict(roles)
        for c, role in above.items():
            if c not in merged and c not in toks:
                merged[c] = role
        layout = _build_layout(sheet, r, merged, toks, 1, mine)
        return (layout, 1) if layout else None

    if real:
        roles2, toks2 = _row_roles(sheet, r + 1)
        if _size_header_ok(toks2, lenient=True):
            merged = dict(roles)
            for c, role in roles2.items():
                merged.setdefault(c, role)
            for c in toks2:                       # под «Размеры» стоят сами размеры
                merged.pop(c, None)
            layout = _build_layout(sheet, r, merged, toks2, 2, mine)
            return (layout, 2) if layout else None
        if len(real) >= 2 and real & {"name", "article", "size", "desc"}:
            layout = _build_layout(sheet, r, roles, {}, 1, mine)
            return (layout, 1) if layout else None
    return None


def _infer_layout(sheet: Sheet) -> Layout | None:
    """Таблица без шапки: ищем столбец с названиями и столбец с размерами по содержимому."""
    sample = range(min(len(sheet.rows), 300))
    width = max((len(sheet.rows[i]) for i in sample), default=0)
    best_size, best_frac, best_name, best_text = None, 0.0, None, 0
    stats = []
    for c in range(width):
        filled = [sheet.cell(i, c) for i in sample if sheet.cell(i, c)]
        if not filled:
            stats.append((0, 0))
            continue
        sizey = sum(1 for t in filled if _looks_like_size_list(t))
        texty = sum(1 for t in filled if _LETTERS.search(t) and not parse_size_list(t))
        stats.append((sizey, texty))
        frac = sizey / len(filled)
        if sizey >= 3 and frac >= 0.6 and frac > best_frac:
            best_size, best_frac = c, frac
    for c, (_sizey, texty) in enumerate(stats):
        if c != best_size and texty > best_text:
            best_name, best_text = c, texty
    if best_name is None or best_text < 2:
        return None
    cols = {"name": best_name}
    if best_size is not None:
        cols["size"] = best_size
    return Layout(header_row=-1, cols=cols)


_PAREN_TAIL = re.compile(r"^(.*\S)\s*\(([^()]*)\)\s*$")
_MARK_TAIL = re.compile(r"^(.*\S)[\s,;]+(?:р\.|р-р|размер|size)\s*[:.]?\s*([\w./-]+)\s*$", re.I)
_COMMA_TAIL = re.compile(r"^(.*\S)\s*[,;]\s*([\w./-]+)\s*$")


def split_name_size(name: str) -> tuple[str, str, str] | None:
    """«Футболка (L, чёрный)» → («Футболка», «L», «чёрный»)."""
    m = _PAREN_TAIL.match(name)
    if m:
        parts = [p.strip() for p in re.split(r"[,;/]", m.group(2)) if p.strip()]
        found = [(p, parse_size(p)) for p in parts]
        sized = [x for x in found if x[1]]
        if len(sized) == 1:
            rest = ", ".join(p for p, s in found if not s)
            return m.group(1), sized[0][1], rest
    for rx in (_MARK_TAIL, _COMMA_TAIL):
        m = rx.match(name)
        if m:
            size = parse_size(m.group(2))
            if size:
                return m.group(1).rstrip(" ,;"), size, ""
    return None


def _child_size(text: str) -> tuple[str, str] | None:
    """Строка-характеристика под товаром (выгрузка 1С): «L», «Размер: 46», «L, чёрный»."""
    if not text or len(text) > 30:
        return None
    size = parse_size(text)
    if size:
        return size, ""
    parts = [p.strip() for p in re.split(r"[,;/]", text) if p.strip()]
    if 2 <= len(parts) <= 3:
        sized = [(p, parse_size(p)) for p in parts]
        hits = [x for x in sized if x[1]]
        if len(hits) == 1:
            return hits[0][1], ", ".join(p for p, s in sized if not s)
    return None


def _price(text: str, number: float | None) -> str:
    if number is not None:
        return str(int(number)) if float(number).is_integer() else f"{number:.2f}"
    return re.sub(r"[^\d.,]", "", text.replace(" ", "")).strip(".,")     # «-», «по запросу» — цены нет


class _SheetParser:
    def __init__(self, sheet: Sheet, layout: Layout | None = None, mine: bool = False):
        self.sheet = sheet
        self.layout = layout
        self.mine = mine
        self.first_layout: Layout | None = layout
        self.items: dict[str, Item] = {}
        self.prev: dict | None = None        # поля предыдущего товара — для строк-продолжений
        self.parent: Item | None = None      # товар, к которому относятся строки размеров (1С)
        self.pending: dict | None = None     # отметки наличия, стоящие строкой выше названия
        self.pending_link = ""               # ссылка на фото, стоящая строкой выше названия
        self.block_name = ""
        self.block_link = ""
        self.x_marks = 0
        self.pos_marks = 0

    # -- основной проход ---------------------------------------------------
    def run(self) -> None:
        sheet = self.sheet
        r = 0
        if self.layout is None:
            limit = min(len(sheet.rows), 80)
            while r < limit:
                found = _detect_header(sheet, r, None, self.mine)
                if found:
                    self.layout, consumed = found
                    self.first_layout = self.layout
                    r += consumed
                    break
                r += 1
            else:
                self.layout = self.first_layout = _infer_layout(sheet)
                r = 0
            if self.layout is None:
                return
        else:
            r = self.layout.header_row + 1

        while r < len(sheet.rows):
            row = sheet.rows[r]
            if not any(row):
                r += 1
                continue
            found = _detect_header(sheet, r, self.layout, self.mine)
            if found:
                self.layout, consumed = found
                self.prev = self.parent = self.pending = None
                self.pending_link = self.block_name = self.block_link = ""
                r += consumed
                continue
            self._data_row(r)
            r += 1
        self._resolve_ambiguous()

    def _fields(self, r: int) -> dict:
        s, lay = self.sheet, self.layout
        name = s.cell(r, lay.col("name")) or s.cell(r, lay.col("desc"))
        article = s.cell(r, lay.col("article"))
        brand = s.cell(r, lay.col("brand"))
        if brand and name and norm(brand) not in norm(name):
            name = f"{brand} {name}"
        pc = lay.col("price")
        return {
            "name": name,
            "article": article,
            "color": s.cell(r, lay.col("color")),
            "price": _price(s.cell(r, pc), s.num(r, pc)) if s.cell(r, pc) else "",
            "status": s.cell(r, lay.col("status")),
            "kind": s.cell(r, lay.col("kind")),
            "raw": "",
            "link": "",
        }

    def _url(self, r: int) -> str:
        return next((v for v in self.sheet.rows[r] if v.startswith(("http://", "https://"))), "")

    def _struck(self, r: int) -> bool:
        s, lay = self.sheet, self.layout
        c = lay.col("name") if s.cell(r, lay.col("name")) else lay.col("article")
        return bool(s.cell(r, c)) and s.live_cell(r, c) == ""

    def _stock(self, r: int, c: int, echo: str | None = None) -> int | None:
        s = self.sheet
        if not s.cell(r, c) and (r, c) in s.hmerge and s.hmerge[(r, c)] in self.layout.size_cols:
            c = s.hmerge[(r, c)]             # «много» на несколько размеров сразу
        st = parse_stock(s.live_cell(r, c), s.num(r, c), echo)
        if st == AMBIG:
            self.x_marks += 1
        elif is_available(st) and s.cell(r, c):
            self.pos_marks += 1
        return st

    def _data_row(self, r: int) -> None:
        s, lay = self.sheet, self.layout
        f = self._fields(r)
        filled = sum(1 for v in s.rows[r] if v)
        role_cols = len(lay.cols) + (1 if lay.size_cols else 0)
        wide = lay.mode == "wide"
        marks = wide and any(s.cell(r, c) for c in lay.size_cols)

        if f["name"] and (header_role(f["name"]) in ("name", "article", "size", "qty", "price") or _TOTAL.match(f["name"])):
            if not self.prev:                 # продолжение шапки (объединённые ячейки) — в нём бывает ссылка на фото
                self.pending_link = self.pending_link or self._url(r)
            return
        if not f["name"] and not f["article"]:
            # строка-продолжение: другой размер или цвет того же товара
            if filled == 0:
                return
            if not self.prev:
                self.pending_link = self.pending_link or self._url(r)
                if marks:                     # отметки стоят над названием (объединённые ячейки)
                    self.pending = {lay.size_cols[c]: self._stock(r, c, lay.size_cols[c]) for c in sorted(lay.size_cols)}
                return
            if wide and not marks:
                return
            if lay.mode == "list" and not s.cell(r, lay.col("size")) and not s.cell(r, lay.col("qty")):
                return
            if lay.mode == "plain":
                return
            f = {**self.prev, "color": f["color"] or self.prev["color"], "price": f["price"] or self.prev["price"]}
        elif filled == 1 and role_cols >= 3 and not self.mine and lay.mode != "plain":
            # одинокая надпись в таблице с несколькими столбцами — заголовок раздела
            self.prev = self.parent = None
            return
        else:
            if not f["name"]:
                f["name"] = f["article"]
            if not self.mine:
                if norm(f["name"]) != self.block_name:
                    self.block_name = norm(f["name"])
                    self.block_link = self.pending_link or self._url(r)
                    self.pending_link = ""
                f["link"] = self.block_link
            self.prev = dict(f)

        if self.mine:
            self._add(f, {}, r)
            return
        struck = self._struck(r)
        if wide:
            sizes: dict[str, int | None] = {}
            if not marks and self.pending:
                sizes = self.pending
            else:
                for c in sorted(lay.size_cols):
                    size = lay.size_cols[c]
                    st = self._stock(r, c, echo=size)
                    sizes[size] = merge_stock(sizes[size], st) if size in sizes else st
            self.pending = None
        elif lay.mode == "list":
            sizes, f["raw"] = self._list_sizes(r)
        else:
            self._plain_row(r, f, struck)
            return
        if struck:
            sizes = {k: 0 for k in sizes}
        self._add(f, sizes, r)

    def _list_sizes(self, r: int) -> tuple[dict[str, int | None], str]:
        s, lay = self.sheet, self.layout
        sc, qc = lay.col("size"), lay.col("qty")
        full, live = s.cell(r, sc), s.live_cell(r, sc)
        qty = self._stock(r, qc) if qc is not None else None
        if qty == AMBIG:
            qty = None
        if not full:
            return ({NOSIZE: qty} if qc is not None else {}), ""
        pairs_full = parse_size_list(full)
        if not pairs_full:
            known, stock = parse_marker(live, s.num(r, sc))
            if known:                         # «есть», «нет», «-», «много», «5 шт»
                if is_available(stock):
                    self.pos_marks += 1
                return {NOSIZE: stock}, full
            live_toks = set(loose_tokens(live))
            return {t: (None if t in live_toks else 0) for t in loose_tokens(full)}, full
        pairs_live = dict(parse_size_list(live)) if live != full else dict(pairs_full)
        sizes: dict[str, int | None] = {}
        for size, _q in pairs_full:
            sizes[size] = pairs_live[size] if size in pairs_live else 0
        if qc is not None:
            if len(sizes) == 1:
                only = next(iter(sizes))
                if sizes[only] is None:
                    sizes[only] = qty
            elif qty == 0:
                sizes = {k: 0 for k in sizes}
        return sizes, full

    def _plain_row(self, r: int, f: dict, struck: bool) -> None:
        lay = self.layout
        qc = lay.col("qty")
        stock = self._stock(r, qc) if qc is not None else None
        if stock == AMBIG:
            stock = None
        if struck:
            stock = 0
        name = f["name"]
        child = _child_size(name) if self.parent is not None else None
        if child:
            size, extra = child
            parent = self.parent
            if extra and not parent.color:
                target = self._add({**self._parent_fields, "color": extra}, {}, r)
            else:
                target = parent
            target.sizes.pop(NOSIZE, None)
            target.sizes[size] = merge_stock(target.sizes[size], stock) if size in target.sizes else stock
            self.prev = None
            return
        split = split_name_size(name)
        if split:
            base, size, extra = split
            fields = {**f, "name": base, "color": f["color"] or extra}
            self._add(fields, {size: stock}, r)
            self.parent = None
            return
        item = self._add(f, {NOSIZE: stock}, r)
        self.parent = item
        self._parent_fields = dict(f)

    def _add(self, f: dict, sizes: dict[str, int | None], r: int) -> Item:
        item = Item(sheet=self.sheet.name, name=clean(f["name"]), article=clean(f["article"]),
                    color=clean(f["color"]), price=f["price"], status=clean(f["status"]),
                    kind=clean(f["kind"]), raw=clean(f["raw"]), link=f.get("link", ""),
                    sizes=dict(sizes), row=r + 1)
        old = self.items.get(item.key)
        if old is None:
            self.items[item.key] = item
            return item
        lay = self.layout
        name_col = lay.col("name") if lay.col("name") is not None else lay.col("article")
        if (r, name_col) not in self.sheet.vfill:
            old.dups += 1                      # настоящая вторая строка, а не объединённая ячейка
        for size, st in sizes.items():
            old.sizes[size] = merge_stock(old.sizes[size], st) if size in old.sizes else st
        if any(k != NOSIZE for k in old.sizes) and NOSIZE in old.sizes:
            if not is_available(old.sizes[NOSIZE]) or any(is_available(v) for k, v in old.sizes.items() if k != NOSIZE):
                old.sizes.pop(NOSIZE)
        if self.mine and is_active(item) and not is_active(old):
            old.status, old.kind = item.status, item.kind   # выставлен хотя бы один из одноимённых
        if item.raw and item.raw != old.raw:
            old.raw = ""                                     # строки разные — одной записью не показать
        old.price = old.price or item.price
        return old

    def _resolve_ambiguous(self) -> None:
        if not self.x_marks:
            return
        # «x» при наличии «+» и цифр значит «нет»; если других отметок нет — «x» и есть отметка наличия.
        value = None if self.pos_marks == 0 else 0
        for item in self.items.values():
            for size, st in item.sizes.items():
                if st == AMBIG:
                    item.sizes[size] = value

    def info(self) -> SheetInfo | None:
        lay = self.first_layout
        if lay is None:
            return None
        sizes: list[str] = []
        seen = set()
        for item in self.items.values():
            for sz in item.sizes:
                if sz not in seen and sz != NOSIZE:
                    seen.add(sz)
                    sizes.append(sz)
        return SheetInfo(
            name=self.sheet.name, items=len(self.items), mode=lay.mode, header_row=lay.header_row + 1,
            columns={role: col_letter(c) for role, c in lay.cols.items() if role in ROLE_TITLES},
            sizes=sort_sizes(sizes),
            has_status="status" in lay.cols,
        )


def parse_override(text: str) -> dict:
    """Ручная настройка столбцов: «название=B размеры=E:I заголовок=3».

    Бросает ValueError с понятным текстом."""
    names = {
        "название": "name", "наименование": "name", "товар": "name", "артикул": "article",
        "цвет": "color", "цена": "price", "количество": "qty", "колво": "qty", "остаток": "qty",
        "наличие": "qty", "размер": "size", "размеры": "sizes", "статус": "status", "тип": "kind",
        "бренд": "brand", "заголовок": "header", "шапка": "header", "лист": "sheet",
    }
    cfg: dict = {}
    pairs = re.findall(r"([^\s=:]+)\s*[=:]\s*(\"[^\"]+\"|«[^»]+»|\S+)", text)
    if not pairs:
        raise ValueError("Не вижу настроек. Пример: название=B размеры=E:I заголовок=2")
    for key, value in pairs:
        role = names.get(norm(key).replace("-", ""))
        value = value.strip("\"«»")
        if role is None:
            raise ValueError(f"Не знаю настройку «{key}».")
        try:
            if role == "header":
                cfg["header"] = int(value)
                if cfg["header"] < 0:
                    raise ValueError
            elif role == "sheet":
                cfg["sheet"] = value
            elif role == "sizes" or (role == "size" and re.search(r"[-:]", value)):
                a, b = re.split(r"[-:]", value, maxsplit=1)
                ia, ib = col_index(a), col_index(b)
                if ib < ia or ib - ia > 80:
                    raise ValueError
                cfg["sizes"] = f"{col_letter(ia)}:{col_letter(ib)}"
            else:
                cfg[role] = col_letter(col_index(value))
        except ValueError:
            raise ValueError(f"Не понял значение «{value}» для «{key}». Столбцы — буквами, как в Excel: A, B, C…") from None
    if not ({"name", "article"} & cfg.keys()):
        raise ValueError("Укажите хотя бы столбец названия, например: название=B")
    return cfg


def _layout_from_override(sheet: Sheet, cfg: dict) -> Layout | None:
    cols = {role: col_index(cfg[role]) for role in ("name", "article", "color", "price", "qty", "size", "status", "kind", "brand") if cfg.get(role)}
    header = int(cfg["header"]) - 1 if cfg.get("header") else None
    size_cols: dict[int, str] = {}
    if cfg.get("sizes"):
        a, b = (col_index(x) for x in cfg["sizes"].split(":"))
        rows = [header] if header is not None else range(min(len(sheet.rows), 80))
        for r in rows:
            toks = {c: parse_size(sheet.cell(r, c)) for c in range(a, b + 1)}
            toks = {c: t for c, t in toks.items() if t}
            if len(toks) >= 2 or (header is not None and toks):
                size_cols, header = toks, r
                break
        if not size_cols:
            return None
        cols.pop("size", None)
    return Layout(header_row=header if header is not None else -1, cols=cols, size_cols=size_cols)


def parse_sheets(sheets: list[Sheet], config: dict | None = None, mine: bool = False) -> ParsedTable:
    """Листы → товары. mine=True — это своя таблица: берём названия и статусы, размеры не ищем."""
    items: list[Item] = []
    infos: list[SheetInfo] = []
    config = config or {}
    parsed = []
    for sheet in sheets:
        layout = None
        has_cols = any(k for k in config if k not in ("sheet",))
        if config.get("sheet") and norm(config["sheet"]) != norm(sheet.name):
            continue
        if has_cols:
            layout = _layout_from_override(sheet, config)
        parser = _SheetParser(sheet, layout, mine)
        parser.run()
        info = parser.info()
        if info and parser.items:
            parsed.append((info, list(parser.items.values())))
    if mine and any(info.has_status for info, _ in parsed):
        # В своей таблице есть лист со статусами — остальные листы (расходы, сводка) не товары.
        parsed = [(info, its) for info, its in parsed if info.has_status]
    if not mine:
        # У поставщика лист без размеров и без остатков (счёт, условия работы) — не наличие,
        # если на других листах наличие есть.
        def informative(info: SheetInfo, its: list[Item]) -> bool:
            return info.mode != "plain" or "qty" in info.columns or any(i.has_real_sizes() for i in its)

        if any(informative(info, its) for info, its in parsed):
            parsed = [(info, its) for info, its in parsed if informative(info, its)]
    for info, its in parsed:
        infos.append(info)
        items.extend(its)
    return ParsedTable(items=items, sheets=infos)


def parse_table(data: bytes, filename: str = "", config: dict | None = None, mine: bool = False) -> ParsedTable:
    """Файл таблицы → товары. Бросает TableError, если файл не читается."""
    return parse_sheets(load_sheets(data, filename), config, mine)


def describe(table: ParsedTable, limit: int = 4) -> str:
    """Короткий человеческий отчёт: как бот понял таблицу."""
    if not table.items:
        return "Не нашёл в таблице товаров."
    lines = [f"Товаров: {len(table.items)} · листов: {len(table.sheets)}"]
    for info in table.sheets[:12]:
        cols = ", ".join(f"{ROLE_TITLES[r]} — {c}" for r, c in info.columns.items())
        lines.append(f"\nЛист «{info.name}»: {info.items} тов., {MODE_TITLES[info.mode]}")
        if cols:
            lines.append(f"  столбцы: {cols}")
        if info.sizes:
            shown = ", ".join(info.sizes[:14]) + (" …" if len(info.sizes) > 14 else "")
            lines.append(f"  размеры: {shown}")
    if len(table.sheets) > 12:
        lines.append(f"\n…и ещё листов: {len(table.sheets) - 12}")
    lines.append("\nПримеры:")
    for item in table.items[:limit]:
        lines.append("• " + item_line(item))
    return "\n".join(lines)


def sizes_text(item: Item) -> str:
    """Размеры в наличии одной строкой: «S, M (2 шт), L»."""
    avail = item.available()
    if not item.has_real_sizes():
        if not avail:
            return "нет в наличии"
        qty = item.sizes.get(NOSIZE)
        return f"есть, {qty} шт" if qty else "есть"
    if not avail:
        return "нет размеров"
    parts = []
    for size in sort_sizes(avail):
        qty = item.sizes[size]
        parts.append(f"{size} ({qty} шт)" if qty else size)
    return ", ".join(parts)


def item_line(item: Item) -> str:
    art = f" (арт. {item.article})" if item.article and norm(item.article) != norm(item.name) else ""
    return f"{item.title}{art} — {sizes_text(item)}"
