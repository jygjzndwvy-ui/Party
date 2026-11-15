import pytest

from stockbot.sizes import AMBIG, parse_size, parse_size_list, parse_stock, sort_sizes


@pytest.mark.parametrize("text,expected", [
    ("XL", "XL"), ("xl", "XL"), ("хл", "XL"), ("2XL", "XXL"), ("XXXXL", "4XL"), ("р.46", "46"),
    ("42,5", "42.5"), ("42-44", "42-44"), ("S/M", "S-M"), ("S (44)", "S"), ("38(25,5)", "38"),
    ("ONE SIZE", "ONE SIZE"), ("75B", "75B"),
    ("Наименование", None), ("Цена", None), ("2024", None), ("7", None), ("", None),
])
def test_parse_size(text, expected):
    assert parse_size(text) == expected


@pytest.mark.parametrize("text,expected", [
    ("S M XL XXL", [("S", None), ("M", None), ("XL", None), ("XXL", None)]),
    ("S, M, L", [("S", None), ("M", None), ("L", None)]),
    ("S/M/L", [("S", None), ("M", None), ("L", None)]),
    ("42 44 46", [("42", None), ("44", None), ("46", None)]),
    ("S-XL", [("S", None), ("M", None), ("L", None), ("XL", None)]),
    ("S-2, M-1", [("S", 2), ("M", 1)]),
    ("S(2) M(1)", [("S", 2), ("M", 1)]),
    ("42:3; 44:0", [("42", 3), ("44", 0)]),
    ("42-44, 46-48", [("42-44", None), ("46-48", None)]),
    ("L XL XXL (через 3-5 дней)", [("L", None), ("XL", None), ("XXL", None)]),
    ("Размеры: M L XL", [("M", None), ("L", None), ("XL", None)]),
    ("-", []), ("нет", []),
])
def test_parse_size_list(text, expected):
    assert parse_size_list(text) == expected


@pytest.mark.parametrize("text,expected", [
    ("", 0), ("0", 0), ("0)", 0), ("-", 0), ("нет", 0), ("❌", 0), ("Нет", 0),
    ("+", None), ("✅", None), ("есть", None), ("много", None), ("Много ", None),
    ("3", 3), ("3 шт", 3), (">10", 10), ("x", AMBIG),
])
def test_parse_stock(text, expected):
    assert parse_stock(text) == expected


def test_stock_number_and_echo():
    assert parse_stock("", 5.0) == 5
    assert parse_stock("", 0.0) == 0
    assert parse_stock("L", echo="L") is None


def test_sort_sizes():
    assert sort_sizes(["XL", "S", "46", "M", "42"]) == ["S", "M", "XL", "42", "46"]
