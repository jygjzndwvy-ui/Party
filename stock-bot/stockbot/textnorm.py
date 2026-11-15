"""Нормализация текста: приводим названия из разных таблиц к сравнимому виду."""
from __future__ import annotations

import re

_WS = re.compile(r"\s+")
_NON_WORD = re.compile(r"[^\w]+", re.UNICODE)

# Бренды, которые по-русски пишут не так, как получится простой транслитерацией.
BRAND_ALIASES = {
    "найк": "nike", "найки": "nike", "адидас": "adidas", "пума": "puma", "рибок": "reebok",
    "гуччи": "gucci", "гучи": "gucci", "диор": "dior", "шанель": "chanel", "прада": "prada",
    "баленсиага": "balenciaga", "монклер": "moncler", "монклео": "moncler",
    "лакоста": "lacoste", "лакост": "lacoste", "томми": "tommy", "хилфигер": "hilfiger",
    "кельвин": "calvin", "кляйн": "klein", "бершка": "bershka", "юникло": "uniqlo",
    "левис": "levis", "ливайс": "levis", "левайс": "levis", "levi's": "levis",
    "джордан": "jordan", "конверс": "converse", "ванс": "vans", "нью": "new",
    "баланс": "balance", "бэланс": "balance", "стоун": "stone", "айленд": "island",
    "норт": "north", "фейс": "face", "фэйс": "face", "кархарт": "carhartt",
    "стуси": "stussy", "стусси": "stussy", "суприм": "supreme", "оф": "off", "вайт": "white",
    "хьюго": "hugo", "босс": "boss", "армани": "armani", "версаче": "versace",
    "барбери": "burberry", "бёрберри": "burberry", "берберри": "burberry",
    "ральф": "ralph", "лорен": "lauren", "поло": "polo", "луи": "louis", "виттон": "vuitton",
    "витон": "vuitton", "массимо": "massimo", "дутти": "dutti", "пул": "pull", "беар": "bear",
    "эйч": "h", "энд": "and", "асикс": "asics", "саломон": "salomon", "коламбия": "columbia",
    "аляска": "alaska", "канада": "canada", "гус": "goose", "гуз": "goose",
    "трэшер": "thrasher", "трешер": "thrasher", "чемпион": "champion", "фила": "fila",
    "каппа": "kappa", "умбро": "umbro", "эссеншиалс": "essentials", "эссеншлс": "essentials",
    "фир": "fear", "год": "god", "рик": "rick", "овенс": "owens", "мейсон": "maison",
    "маржела": "margiela", "марджела": "margiela", "лоро": "loro", "пиана": "piana",
    "зегна": "zegna", "бриони": "brioni", "кензо": "kenzo", "дизель": "diesel",
    "гесс": "guess", "гэсс": "guess", "майкл": "michael", "корс": "kors",
    "скечерс": "skechers", "тимберленд": "timberland", "угги": "ugg",
}

_STOP = {
    "и", "в", "на", "с", "со", "для", "по", "из", "от", "the", "a", "of", "арт", "art",
    "артикул", "new", "новинка", "новинки", "хит", "sale", "шт", "модель", "цвет",
}

_TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ж": "zh", "з": "z",
    "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p",
    "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "h", "ц": "ts", "ч": "ch",
    "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}

_ENDINGS = (
    "ами", "ями", "ого", "его", "ому", "ему", "ыми", "ими", "ая", "яя", "ое", "ее", "ые",
    "ие", "ый", "ий", "ой", "ую", "юю", "ам", "ям", "ах", "ях", "ов", "ев", "ом", "ем",
    "ей", "а", "я", "ы", "и", "у", "ю", "е", "о", "ь",
)

_CYR = re.compile(r"[а-я]")


def clean(value) -> str:
    """Строка без лишних пробелов и неразрывных пробелов."""
    if value is None:
        return ""
    return _WS.sub(" ", str(value).replace(" ", " ").replace("​", "")).strip()


def norm(value) -> str:
    """Нижний регистр, ё→е, схлопнутые пробелы."""
    return clean(value).lower().replace("ё", "е")


def norm_article(value) -> str:
    """Артикул: только буквы и цифры в верхнем регистре."""
    return _NON_WORD.sub("", clean(value).upper().replace("Ё", "Е")).replace("_", "")


def translit(word: str) -> str:
    return "".join(_TRANSLIT.get(ch, ch) for ch in word)


def stem(word: str) -> str:
    """Очень грубое отсечение русских окончаний: куртка/куртки → куртк."""
    if len(word) < 5 or not _CYR.search(word):
        return word
    for ending in _ENDINGS:
        if word.endswith(ending) and len(word) - len(ending) >= 3:
            return word[: -len(ending)]
    return word


def canon_token(word: str) -> str:
    """Каноническая форма слова для сравнения названий."""
    alias = BRAND_ALIASES.get(word)
    if alias:
        return alias
    if _CYR.search(word):
        return translit(stem(word))
    return word


def tokens(text) -> list[str]:
    """Слова названия в каноническом виде, без служебных слов."""
    out = []
    for raw in _NON_WORD.sub(" ", norm(text).replace("'", "")).replace("_", " ").split():
        if raw in _STOP:
            continue
        out.append(canon_token(raw))
    return out


def same_token(a: str, b: str) -> bool:
    """Слова совпадают точно или отличаются только окончанием."""
    if a == b:
        return True
    if any(ch.isdigit() for ch in a) or any(ch.isdigit() for ch in b):
        return False
    short, long_ = (a, b) if len(a) <= len(b) else (b, a)
    return len(short) >= 3 and len(long_) - len(short) <= 2 and long_.startswith(short)


def index_key(token: str) -> str:
    """Ключ для быстрого поиска кандидатов (первые буквы слова)."""
    if any(ch.isdigit() for ch in token):
        return token
    return token[:3]
