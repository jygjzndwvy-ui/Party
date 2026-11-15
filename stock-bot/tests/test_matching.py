from stockbot.matching import decide, parse_query, rank, search, split_tag, tag_stats
from stockbot.parser import Item

TAGS = {1: ["nord"], 2: ["vega"], 3: ["top drop"]}


def items(*names):
    return [Item(sheet="s", name=n, sizes={"S": None, "M": None, "L": 0}, row=i) for i, n in enumerate(names)]


def test_split_tag():
    assert split_tag("Пуховик Zara черный nord", TAGS) == (1, "пуховик zara черный")
    assert split_tag("Пуховик Armani белый VEGA Петя", TAGS) == (2, "пуховик armani белый петя")
    assert split_tag("Tommy зеленый top drop", TAGS) == (3, "tommy зеленый")
    assert split_tag("Бомбер черный", TAGS)[0] is None
    assert split_tag("Кроссовки vega-style", {5: ["кросс"]})[0] is None      # «кросс» ≠ «кроссовки»


def best(name, *candidates):
    hit = decide(rank(name, items(*candidates)))
    return hit.name if hit else None


def test_confident_matches():
    assert best("пуховик zara черный", "ПУХОВИК ZARA ЧЕРНЫЙ", "ПУХОВИК ZARA СИНИЙ") == "ПУХОВИК ZARA ЧЕРНЫЙ"
    assert best("пуховик hugo boss синий", "ПУХОВИК BOSS СИНИЙ", "ПУХОВИК BOSS ЧЕРНЫЙ") == "ПУХОВИК BOSS СИНИЙ"
    assert best("жилетка moncler розовая", "Жилетка Moncler Pink", "Жилетка Moncler черная") == "Жилетка Moncler Pink"
    assert best("moncler x spyder", "пуховик Moncler Spyder", "Пуховик Moncler x Batman") == "пуховик Moncler Spyder"
    assert best("пуховик zara белый", "пуховик Zara белый", "пуховик Zara Type белый") == "пуховик Zara белый"
    assert best("пуховик zara x suvene молочная", "Пуховик Zara X Suvene молочный") == "Пуховик Zara X Suvene молочный"


def test_ambiguous_goes_to_human():
    assert best("пуховик moncler", "пуховик Moncler Spyder", "пуховик Moncler розовый") is None
    assert best("пуховик corteiz", "пуховик Corteiz белый", "пуховик Corteiz черный") is None
    assert best("пуховик stone island", "Худи Nike", "Кепка USA") is None
    assert best("пуховик zara черный", "ПУХОВИК ZARA СИНИЙ") is None           # другой цвет — другая вещь


def test_tag_stats():
    names = ["A b VEGA", "C d vega", "E vega", "Худи LUX", "Свитер lux", "X top drop", "Y top drop", "Z один"]
    assert tag_stats(names) == [("vega", 3), ("lux", 2), ("top drop", 2)]


def test_query_and_search():
    assert parse_query("пришли вещи у которых есть размеры s m l одновременно") == (["S", "M", "L"], [])
    assert parse_query("пуховик zara") == ([], ["пуховик", "zara"])
    assert parse_query("худи xl vega") == (["XL"], ["худи", "vega"])
    base = [Item(sheet="s", name="Пуховик Zara", sizes={"S": None, "M": 2, "L": 1}),
            Item(sheet="s", name="Пуховик Boss", sizes={"S": None, "M": 0, "L": 1}),
            Item(sheet="s", name="Худи Zara", sizes={"S": 1, "M": 1, "L": 1, "XL": 1})]
    assert [i.name for i in search(base, ["S", "M", "L"], [])] == ["Пуховик Zara", "Худи Zara"]
    assert [i.name for i in search(base, ["S", "M", "L"], ["пуховики"])] == ["Пуховик Zara"]
    assert [i.name for i in search(base, [], ["zara"])] == ["Пуховик Zara", "Худи Zara"]
