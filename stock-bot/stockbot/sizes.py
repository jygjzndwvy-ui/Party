"""Размеры: распознаём S/M/L, 42/44/46, «S-2шт, M-1шт», «S-XL» и приводим к одному виду."""
from __future__ import annotations

import re

from .textnorm import clean

# Товар без размеров (сумка, кепка): отслеживаем только «есть / нет».
NOSIZE = "без размера"
# Отметка «x» в ячейке: смысл зависит от таблицы, решаем после разбора листа.
AMBIG = -1

LETTER_ORDER = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL"]
_LETTER_INDEX = {s: i for i, s in enumerate(LETTER_ORDER)}

_CYR_LOOKALIKE = str.maketrans({"Х": "X", "М": "M", "С": "C", "Л": "L", "О": "O", "Е": "E", "А": "A", "Р": "P", "Т": "T", "К": "K", "В": "B", "Н": "H"})
_DASHES = re.compile(r"[‐‑‒–—−]")
_ONE_SIZE = {
    "ONE SIZE", "ONESIZE", "ONE", "OS", "O/S", "UNI", "UNISIZE", "FREE", "FREE SIZE", "FREESIZE",
    "ЕДИНЫЙ", "ЕДИНЫЙ РАЗМЕР", "УНИВЕРСАЛЬНЫЙ", "БЕЗРАЗМЕРНЫЙ", "STD", "СТАНДАРТ",
}
_PREFIX = re.compile(r"^(?:РАЗМЕР|РАЗМ\.?|Р-Р|Р\.|SIZE|EU|EUR|RU|RUS)\s*[:.]?\s*", re.I)
_SUFFIX = re.compile(r"\s*(?:Р-Р|Р\.|РАЗМЕР|EU|EUR|RU|RUS)$", re.I)
_NUM = re.compile(r"^(\d{2,3})(?:[.,](5|0))?$")


def _letter(tok: str) -> str | None:
    m = re.fullmatch(r"(X{0,3})S", tok)
    if m:
        return "X" * len(m.group(1)) + "S"
    if tok == "M":
        return "M"
    m = re.fullmatch(r"(X{0,8})L", tok)
    if m:
        n = len(m.group(1))
        return "X" * n + "L" if n <= 3 else f"{n}XL"
    m = re.fullmatch(r"([2-9])X?L", tok) or re.fullmatch(r"([2-9])X", tok)
    if m:
        n = int(m.group(1))
        return "X" * n + "L" if n <= 3 else f"{n}XL"
    m = re.fullmatch(r"([2-3])XS", tok)
    if m:
        return "X" * int(m.group(1)) + "S"
    return None


def _numeric(tok: str) -> str | None:
    m = _NUM.fullmatch(tok)
    if not m:
        return None
    n = int(m.group(1))
    if not (16 <= n <= 70 or 74 <= n <= 194):
        return None
    return f"{n}.5" if m.group(2) == "5" else str(n)


def _atom(tok: str) -> str | None:
    """Одиночный размер без диапазонов."""
    tok = tok.strip()
    if not tok or len(tok) > 14:
        return None
    if tok in _ONE_SIZE:
        return "ONE SIZE"
    if tok in ("OVERSIZE", "ОВЕРСАЙЗ", "OVER SIZE"):
        return "OVERSIZE"
    latin = tok.translate(_CYR_LOOKALIKE)
    for cand in (tok, latin):
        res = _letter(cand) or _numeric(cand)
        if res:
            return res
    if re.fullmatch(r"\d{2,3}[A-H]{1,2}", latin):        # 75B, 80C
        return latin
    if re.fullmatch(r"W\d{2}(?:\s?L\d{2})?", latin):      # W32, W32 L34
        return latin.replace(" ", "")
    m = re.fullmatch(r"(?:US|UK)\s?(\d{1,2}(?:[.,]5)?)", latin)
    if m:
        return latin[:2] + " " + m.group(1).replace(",", ".")
    return None


def parse_size(text) -> str | None:
    """Один размер из ячейки («XL», «р.46», «42-44», «S/M»). None — это не размер."""
    raw = clean(text)
    if not raw or len(raw) > 24:
        return None
    tok = _DASHES.sub("-", raw.upper())
    tok = re.sub(r"\s*\([^()]*\)\s*$", "", tok)           # «S (44)» → «S»
    if tok in _ONE_SIZE:
        return "ONE SIZE"
    tok = _SUFFIX.sub("", _PREFIX.sub("", tok)).strip()
    one = _atom(tok)
    if one:
        return one
    m = re.fullmatch(r"(.+?)\s*[-/]\s*(.+)", tok)
    if m:
        a, b = _atom(m.group(1)), _atom(m.group(2))
        if a and b and a != b and _same_family(a, b):
            return f"{a}-{b}"
    return None


def _same_family(a: str, b: str) -> bool:
    return (a in _LETTER_INDEX) == (b in _LETTER_INDEX)


def is_letter(size: str) -> bool:
    return size in _LETTER_INDEX


def sort_key(size: str):
    """Порядок показа: S, M, L…; затем числа по возрастанию; остальное по алфавиту."""
    head = size.split("-")[0]
    if head in _LETTER_INDEX:
        return (0, _LETTER_INDEX[head], size)
    try:
        return (1, float(head), size)
    except ValueError:
        return (2, 0, size)


# Российские размеры одежды → буквенные, как принято у продавца: 42 — S, 44 — M, 46 — L, 48 — XL.
RU_LETTERS = {"40": "XS", "42": "S", "44": "M", "46": "L", "48": "XL", "50": "XXL", "52": "XXXL",
              "54": "4XL", "56": "5XL", "58": "6XL"}


def size_matches(wanted: str, have: str) -> bool:
    """Подходит ли размер вещи под запрос: «44» находит и одежду M, и обувь 44.
    Обратно не работает: у одежды числа уже заменены буквами, а 44 у обуви — не M."""
    return wanted == have or RU_LETTERS.get(wanted) == have


def sort_sizes(sizes) -> list[str]:
    return sorted(sizes, key=sort_key)


_QTY_TAIL = re.compile(
    r"^(.+?)\s*(?P<sep>[-:=(]|\s)\s*(\d{1,4})\s*(?:шт\.?|штук[аи]?|pcs?|ед\.?)?\s*\)?$", re.I
)
_LABEL = re.compile(r"^(?:размер(?:ы|ный ряд)?|в наличии|наличие|есть|sizes?|остались?|остаток)\s*[:\-]?\s*", re.I)


def _expand(tok: str) -> list[str]:
    """«S-XL» → [S, M, L, XL]; остальное — как один размер."""
    m = re.fullmatch(r"(.+?)\s*-\s*(.+)", tok)
    if m:
        a, b = _atom(m.group(1).translate(_CYR_LOOKALIKE)), _atom(m.group(2).translate(_CYR_LOOKALIKE))
        if a in _LETTER_INDEX and b in _LETTER_INDEX and _LETTER_INDEX[a] < _LETTER_INDEX[b]:
            return LETTER_ORDER[_LETTER_INDEX[a]: _LETTER_INDEX[b] + 1]
    one = parse_size(tok)
    return [one] if one else []


def _chunk(chunk: str) -> list[tuple[str, int | None]]:
    chunk = chunk.strip(" .")
    if not chunk:
        return []
    m = _QTY_TAIL.fullmatch(chunk)
    if m:
        # «S-2», «S(2)», «42: 3 шт» — количество. «42-44», «S (44)» — это размеры, а не количество.
        size = parse_size(m.group(1))
        if size and (m.group("sep") in ":=" or _atom(m.group(3)) is None):
            return [(size, int(m.group(3)))]
    return [(s, None) for s in _expand(chunk)]


def parse_size_list(text) -> list[tuple[str, int | None]]:
    """Список размеров из одной ячейки.

    «S, M, L» · «S/M/L» · «42 44 46» · «S-XL» · «S-2, M-1» · «S(2) M(1)» · «42:3; 44:0».
    Возвращает пары (размер, количество или None, если количество не указано).
    """
    raw = clean(text)
    if not raw:
        return []
    t = _DASHES.sub("-", raw.upper())
    t = _LABEL.sub("", t)
    out: list[tuple[str, int | None]] = []
    seen: dict[str, int] = {}

    def push(pairs):
        for size, qty in pairs:
            if size in seen:
                idx = seen[size]
                old = out[idx][1]
                if qty is not None:
                    out[idx] = (size, qty if old is None else old + qty)
            else:
                seen[size] = len(out)
                out.append((size, qty))

    for part in re.split(r"[,;|\n]+", t):
        part = part.strip()
        if not part:
            continue
        got = _chunk(part)
        if got:
            push(got)
            continue
        # «S M L», «S/M/L», «S(2) M(1)», «S - 2 шт  M - 1 шт»
        compact = re.sub(r"\s*([-:=])\s*(?=\d{1,4}\b)", r"\1", part)
        compact = re.sub(r"\s*\(\s*(\d+)\s*(?:ШТ\.?)?\s*\)", r"(\1)", compact)
        compact = re.sub(r"(\d)\s+ШТ\.?", r"\1ШТ", compact)
        for sub in re.split(r"[\s/]+", compact):
            push(_chunk(sub))
    return out


_NEG = {
    "-", "--", "нет", "нету", "no", "out", "sold", "sold out", "продано", "продан", "продана",
    "нет в наличии", "отсутствует", "закончился", "закончилась", "закончилось", "закончились",
    "ожидается", "под заказ", "×", "✗", "✘", "❌", "✖", "⛔", "🚫", "н", "n", "0 шт", "ноль",
    "распродано", "нет на складе", "out of stock", "ждем", "ждём", "в пути",
}
_POS = {
    "+", "++", "+++", "✓", "✔", "✅", "☑", "да", "есть", "в наличии", "yes", "y", "ok", "ок",
    "v", "●", "•", "*", "много", "мало", "есть в наличии", "на складе", "in stock", "д",
    "имеется", "доступно", "доступен", "в продаже",
}
_INT = re.compile(r"(\d+)")


def _stock(text, number: float | None, echo: str | None) -> tuple[bool, int | None]:
    """(распознано ли, наличие)."""
    if number is not None:
        return True, (int(number) if number > 0 else 0)
    raw = clean(text)
    if not raw:
        return True, 0
    low = _DASHES.sub("-", raw.lower().replace("ё", "е")).strip(" .,;:!()")
    if raw.strip() in ("-", "--", "—", "–"):
        return True, 0
    if low in ("x", "х"):
        return True, AMBIG
    if low in _NEG or not low:
        return True, 0
    if low in _POS:
        return True, None
    if echo and parse_size(raw) == echo:
        return True, None
    m = re.fullmatch(r"[<>≥≤~]?\s*(\d+)\s*\+?\s*(?:шт\.?|штук[аи]?|pcs?|ед\.?)?", low)
    if m:
        return True, (int(m.group(1)) if int(m.group(1)) > 0 else 0)
    if low.startswith(("нет", "sold", "продан", "отсутств", "законч", "распродан")):
        return True, 0
    if low.startswith(("есть", "много", "в налич")):
        return True, None
    m = _INT.search(low)
    if m and re.search(r"шт|pc|ед", low):
        return True, (int(m.group(1)) if int(m.group(1)) > 0 else 0)
    return False, None  # что-то написано — считаем, что размер есть


def parse_stock(text, number: float | None = None, echo: str | None = None) -> int | None:
    """Ячейка наличия → 0 (нет), None (есть, количество неизвестно), N (есть N штук),
    AMBIG для одиночной «x» (смысл зависит от таблицы)."""
    return _stock(text, number, echo)[1]


def parse_marker(text, number: float | None = None) -> tuple[bool, int | None]:
    """То же, но с признаком «это точно отметка наличия» (есть / нет / много / 5 шт)."""
    known, stock = _stock(text, number, None)
    return known, (None if stock == AMBIG else stock)


def loose_tokens(text) -> list[str]:
    """Запасной разбор ячейки размеров, когда обычные размеры не узнаны («2 3», «1/2/3»)."""
    raw = re.sub(r"\([^()]*\)", " ", clean(text)).upper()
    toks = [t for t in re.split(r"[\s,;/|]+", raw) if t]
    if toks and len(toks) <= 15 and all(len(t) <= 8 for t in toks):
        return list(dict.fromkeys(toks))
    return [clean(text)[:40]] if clean(text) else []


# «Поставка ~ 29.11», «Догруз в пути», «возврат (до 25 нояб)», «через 3-5 дней», «предзаказ», «25.11» —
# вещи сейчас нет, поставщик только обещает. Такая отметка — не наличие.
_PENDING_WORDS = re.compile(
    r"постав(?!щ)|догруз|в\s*пути|\bедет|ожида|\bжд[её]м|предзаказ|под\s*заказ|возврат|прибуд|приед|поступ|"
    r"через\s*\d|после\s*\d|скоро|завоз|привез|привоз|\bбронь|резерв", re.I)
# «25.11», «1.12», «03.12», «29.11.26»; «2.5» — не дата (так могут записать и количество)
_PENDING_DATE = re.compile(r"(?<![\d.,])(?:(?:[0-2]?\d|3[01])[./](?:0[1-9]|1[0-2])|(?:0[1-9]|[12]\d|3[01])[./][1-9])"
                           r"(?:[./](?:\d{4}|\d{2}))?(?![\d.,])")
_PENDING_MONTH = re.compile(r"\b\d{1,2}\s*(?:янв|фев|мар|апр|ма[яй]|июн|июл|авг|сен|окт|ноя|дек)", re.I)


def pending_note(text) -> str:
    """Отметка «будет позже» (поставка, в пути, дата) → её текст как есть; иначе пустая строка."""
    raw = clean(text)
    if not raw or len(raw) > 120:
        return ""
    low = raw.lower().replace("ё", "е")
    if _PENDING_WORDS.search(low) or _PENDING_DATE.search(low) or _PENDING_MONTH.search(low):
        return raw
    return ""


def merge_stock(a: int | None, b: int | None) -> int | None:
    """Складываем наличие одной и той же позиции из двух строк."""
    if a == AMBIG:
        return AMBIG if b in (0, AMBIG) else b
    if b == AMBIG:
        return AMBIG if a == 0 else a
    if a is None or b is None:
        return None
    return max(a, b)


def is_available(stock: int | None) -> bool:
    return stock is None or stock > 0
