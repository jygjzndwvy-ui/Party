"""Сопоставление вещей из своей таблицы с товарами поставщиков и поиск по базе."""
from __future__ import annotations

import re
from collections import Counter

from .parser import Item
from .sizes import is_available, parse_size, size_matches
from .textnorm import BRAND_ALIASES, canon_token, norm, same_token, tokens

AUTO_SCORE = 0.89      # выше — считаем, что нашли ту самую вещь
AUTO_MARGIN = 0.08     # и она заметно лучше следующего варианта
ASK_SCORE = 0.45       # ниже — даже не предлагаем как вариант

# Английские слова в названиях = русские у поставщика (и наоборот).
BRAND_ALIASES.update({
    "black": "chern", "white": "bel", "blue": "sin", "navy": "sin", "red": "krasn", "green": "zelen",
    "grey": "ser", "gray": "ser", "pink": "rozov", "beige": "bezhev", "brown": "korichnev",
    "purple": "fioletov", "yellow": "zhelt", "orange": "oranzhev", "khaki": "haki",
    "dsq2": "dsquared2", "dsquared": "dsquared2", "дискваред": "dsquared2", "cp": "cp", "сп": "cp",
    "компани": "company", "ральф": "ralph", "спайдер": "spyder", "spider": "spyder",
    "монклер": "moncler", "кортез": "corteiz", "кортейз": "corteiz", "сувене": "suvene", "сувеню": "suvene",
})
_COLORS = {"chern", "bel", "sin", "krasn", "zelen", "ser", "bezh", "bezhev", "rozov", "zhelt", "fioletov",
           "oranzhev", "korichnev", "golub", "haki", "bordov", "molochn", "olivkov", "malinov", "kamuflyazh"}
_SYNONYMS = [{"пуховик", "куртка", "парка"}, {"худи", "толстовка"}, {"зипка", "зип"},
             {"свитер", "джемпер"}, {"штаны", "брюки"}, {"кроссовки", "кеды"}]
_SYN = {canon_token(w): i for i, group in enumerate(_SYNONYMS) for w in group}
_EXTRA_STOP = {"x", "х"}
_WORD = re.compile(r"[^\w]+", re.UNICODE)


def words(text) -> list[str]:
    """Слова названия как написаны (нижний регистр) — для поиска пометки поставщика."""
    return [w for w in _WORD.sub(" ", norm(text)).replace("_", " ").split() if w]


def name_tokens(text) -> list[str]:
    out, seen = [], set()
    for t in tokens(text):
        if t not in seen and t not in _EXTRA_STOP:
            seen.add(t)
            out.append(t)
    return out


def _find(seq: list[str], sub: list[str]) -> int:
    """Позиция последнего вхождения sub в seq (подряд идущие слова) или -1."""
    if not sub:
        return -1
    for i in range(len(seq) - len(sub), -1, -1):
        if seq[i:i + len(sub)] == sub:
            return i
    return -1


def split_tag(name: str, tags_by_source: dict[int, list[str]]) -> tuple[int | None, str]:
    """По пометке в названии находим поставщика.

    «Пуховик Zara черный nord» + {7: ["nord"]} → (7, «пуховик zara черный»)."""
    seq = words(name)
    best = None
    for source_id, tags in tags_by_source.items():
        for tag in tags:
            sub = words(tag)
            pos = _find(seq, sub)
            if pos >= 0 and (best is None or (len(sub), pos) > (best[1], best[2])):
                best = (source_id, len(sub), pos)
    if best is None:
        return None, " ".join(seq)
    source_id, n, pos = best
    return source_id, " ".join(seq[:pos] + seq[pos + n:])


def _weight(a: str, b: str) -> float:
    if same_token(a, b):
        return 1.0
    if a in _SYN and _SYN.get(a) == _SYN.get(b):
        return 0.6
    return 0.0


def _colors(toks: list[str]) -> list[str]:
    return [t for t in toks if any(same_token(t, c) for c in _COLORS)]


def score(a: list[str], b: list[str]) -> float:
    """Похожесть двух названий от 0 до 1 (списки слов из name_tokens)."""
    if not a or not b:
        return 0.0
    used: set[int] = set()
    matched = 0.0
    for x in a:
        best, best_j = 0.0, None
        for j, y in enumerate(b):
            if j in used:
                continue
            w = _weight(x, y)
            if w > best:
                best, best_j = w, j
        if best_j is not None:
            used.add(best_j)
            matched += best
    value = 0.5 * (2 * matched / (len(a) + len(b))) + 0.5 * (matched / min(len(a), len(b)))
    ca, cb = _colors(a), _colors(b)
    if ca and cb and not any(same_token(x, y) for x in ca for y in cb):
        value *= 0.55          # «чёрный» и «синий» — разные вещи
    return min(value, 1.0)


def rank(name: str, items: list[Item], limit: int = 8) -> list[tuple[float, Item]]:
    """Лучшие кандидаты у поставщика для названия (уже без пометки поставщика)."""
    a = name_tokens(name)
    scored = []
    for item in items:
        b = name_tokens(item.title if item.color else item.name)
        s = score(a, b)
        if s >= ASK_SCORE:
            scored.append((s, item))
    scored.sort(key=lambda x: (-x[0], x[1].row))
    return scored[:limit]


def decide(ranked: list[tuple[float, Item]]) -> Item | None:
    """Уверенное совпадение или None (тогда спрашиваем человека)."""
    if not ranked:
        return None
    top = ranked[0][0]
    second = ranked[1][0] if len(ranked) > 1 else 0.0
    if top >= 0.999 and second < 0.999:
        return ranked[0][1]
    if top >= AUTO_SCORE and top - second >= AUTO_MARGIN:
        return ranked[0][1]
    return None


def tag_stats(names: list[str]) -> list[tuple[str, int]]:
    """Какими пометками заканчиваются названия: [(«vega», 38), («top drop», 4), …]."""
    last, last2 = Counter(), Counter()
    for name in names:
        seq = words(name)
        if len(seq) >= 2:
            last[seq[-1]] += 1
        if len(seq) >= 3:
            last2[" ".join(seq[-2:])] += 1
    out: dict[str, int] = {}
    for word, n in last.items():
        if n < 2 or word.isdigit() or len(word) < 2:
            continue
        double = [(t, c) for t, c in last2.items() if t.endswith(" " + word) and c == n]
        out[double[0][0] if double else word] = n
    return sorted(out.items(), key=lambda x: (-x[1], x[0]))


_FILLER = {
    "размер", "размеры", "размера", "размерами", "размеров", "есть", "пришли", "покажи", "найди", "вещи",
    "вещей", "вещь", "у", "которых", "которые", "одновременно", "все", "всё", "с", "и", "в", "наличии",
    "где", "что", "какие", "товары", "товар", "название", "названия", "сразу", "мне", "дай", "список",
    "на", "по", "из", "или", "чтобы", "были", "было", "нужны", "нужен", "нужно", "ищу", "хочу",
}


def parse_query(text: str) -> tuple[list[str], list[str]]:
    """«пуховик s m l» → (размеры [S, M, L], слова [«пуховик»])."""
    sizes, rest = [], []
    for raw in re.split(r"[\s,;]+", text.strip()):
        low = norm(raw).strip(".:!?()\"«»")
        if not low:
            continue
        if low in _FILLER:
            continue
        size = parse_size(low) if len(low) <= 8 else None
        if size and (len(low) <= 4 or low[0].isdigit()):
            if size not in sizes:
                sizes.append(size)
        else:
            rest.append(low)
    return sizes, rest


# Общие слова в запросе раскрываем: «куртки» — это и пуховики, и ветровки, и бомберы.
_GROUPS = {
    "куртка": ["куртка", "пуховик", "микропуховик", "парка", "бомбер", "аляска", "ветровка", "анорак",
               "джинсовка", "верхняя"],
    "кофта": ["кофта", "худи", "свитер", "свитшот", "толстовка", "зипка", "зип", "лонгслив", "кардиган",
              "полузамок", "джемпер"],
    "штаны": ["штаны", "брюки", "джинсы", "карго"],
    "обувь": ["обувь", "кроссовки", "кеды", "ботинки"],
}
_UMBRELLA = {canon_token(k): [canon_token(w) for w in v] for k, v in _GROUPS.items()}


def expand(word: str) -> list[str]:
    """Слово запроса → варианты, которые ему подходят (в каноническом виде)."""
    canon = canon_token(word)
    for key, variants in _UMBRELLA.items():
        if same_token(canon, key):
            return variants
    return [canon]


def search(items: list[Item], sizes: list[str], query_words: list[str]) -> list[Item]:
    """Товары, у которых есть ВСЕ указанные размеры и которые подходят под все слова запроса.

    Слово ищем в названии вещи и в названии листа: у поставщиков листы — это категории
    («Куртки/Пуховики», «Обувь»), и вещь с листа курток — куртка, даже если в названии только бренд."""
    want = [expand(w) for w in query_words]
    found = []
    sheet_cache: dict[str, list[str]] = {}
    for item in items:
        if not all(any(size_matches(s, have) and is_available(q) for have, q in item.sizes.items()) for s in sizes):
            continue                              # «44» находит M и наоборот
        if want:
            if item.sheet not in sheet_cache:
                sheet_cache[item.sheet] = name_tokens(item.sheet)
            toks = name_tokens(item.title + " " + item.article) + sheet_cache[item.sheet]
            if not all(any(same_token(v, t) or t.startswith(v) for v in variants for t in toks)
                       for variants in want):
                continue
        found.append(item)
    return found
