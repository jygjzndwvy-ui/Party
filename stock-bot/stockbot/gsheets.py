"""Google Таблицы: читаем лёгкую веб-версию листа (текст и объединения ячеек, без картинок).

Выгрузка в .xlsx у таблиц с фотографиями весит десятки и сотни мегабайт, а веб-версия
листа — около ста килобайт, поэтому проверять её можно хоть каждые пять минут.
"""
from __future__ import annotations

import html as html_mod
import re
from html.parser import HTMLParser
from urllib.parse import parse_qs, urlparse

from .textnorm import clean
from .workbook import MAX_COLS, MAX_ROWS, Sheet

DOC_ID = re.compile(r"docs\.google\.com/spreadsheets/(?:u/\d+/)?d/(?!e/)([\w-]{20,})")
_ITEM = re.compile(r'items\.push\(\{name: "((?:[^"\\]|\\.)*)", pageUrl: "(?:[^"\\]|\\.)*?gid=(\d+)"')
_TITLE = re.compile(r"<title>(.*?)</title>", re.S | re.I)
_STRUCK_CSS = re.compile(r"\.(s\d+)\s*\{[^}]*line-through[^}]*\}")
_JS_ESC = re.compile(r"\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|.)")
_NUMERIC = re.compile(r"-?\d+(?:[.,]\d+)?")
_INLINE = {"span", "s", "strike", "del", "a", "div", "b", "i", "u", "font", "p", "em", "strong", "sup", "sub"}


def doc_id(url: str) -> str | None:
    m = DOC_ID.search(url or "")
    return m.group(1) if m else None


def unwrap_link(href: str) -> str:
    """Ссылка из ячейки: Google заворачивает её в google.com/url?q=… — достаём настоящую."""
    href = html_mod.unescape(href or "").strip()
    if re.match(r"https?://(?:www\.)?google\.[a-z.]+/url\?", href):
        q = parse_qs(urlparse(href).query).get("q")
        href = q[0] if q else ""
    return href if href.startswith(("http://", "https://")) else ""


def _js_unescape(s: str) -> str:
    def rep(m: re.Match) -> str:
        g = m.group(1)
        if g[0] in "xu" and len(g) > 1:
            return chr(int(g[1:], 16))
        return {"n": "\n", "t": "\t"}.get(g, g)
    return _JS_ESC.sub(rep, s)


def parse_index(page: str) -> tuple[str, list[tuple[str, str]]]:
    """Страница htmlview → (название документа, [(имя листа, gid)])."""
    title = ""
    m = _TITLE.search(page)
    if m:
        title = html_mod.unescape(m.group(1))
        title = re.sub(r"\s*[-–—]\s*Google\s+(Drive|Диск|Sheets|Таблицы)\s*$", "", title).strip()
        title = re.sub(r"\.(xlsx|xls|csv)$", "", title, flags=re.I)
    sheets = [(clean(_js_unescape(name)), gid) for name, gid in _ITEM.findall(page)]
    return title, sheets


class _Table(HTMLParser):
    def __init__(self, struck: set[str]):
        super().__init__(convert_charrefs=True)
        self.struck = struck
        self.rows: list[dict] = []
        self.row: dict | None = None
        self.cell: dict | None = None
        self.in_th = False
        self.skip = False
        self.stack: list[tuple[str, bool]] = []

    def _is_struck(self, tag: str, attrs: dict) -> bool:
        if tag in ("s", "strike", "del"):
            return True
        if "line-through" in (attrs.get("style") or ""):
            return True
        return any(c in self.struck for c in (attrs.get("class") or "").split())

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "tr":
            self.row = {"num": None, "cells": []}
        elif self.row is None:
            return
        elif tag == "th":
            self.in_th, self._th = True, ""
        elif tag == "td":
            if "freezebar" in (a.get("class") or ""):
                self.skip = True
                return

            def span(key):
                try:
                    return max(1, min(int(a.get(key) or 1), 2000))
                except ValueError:
                    return 1

            self.cell = {"full": [], "live": [], "cs": span("colspan"), "rs": span("rowspan"),
                         "struck": self._is_struck("td", a)}
            self.stack = []
        elif self.cell is not None:
            if tag == "a" and not self.cell.get("href"):
                self.cell["href"] = unwrap_link(a.get("href") or "")
            if tag == "br":
                self.cell["full"].append("\n")
                self.cell["live"].append("\n")
            elif tag in _INLINE:
                self.stack.append((tag, self._is_struck(tag, a)))

    def handle_endtag(self, tag):
        if tag == "tr":
            if self.row is not None:
                self.rows.append(self.row)
            self.row = self.cell = None
        elif tag == "th":
            if self.in_th and self.row is not None and self._th.strip().isdigit():
                self.row["num"] = int(self._th.strip())
            self.in_th = False
        elif tag == "td":
            if self.skip:
                self.skip = False
            elif self.cell is not None and self.row is not None:
                self.row["cells"].append(self.cell)
            self.cell = None
        elif self.cell is not None and tag in _INLINE:
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == tag:
                    del self.stack[i:]
                    break

    def handle_data(self, data):
        if self.in_th:
            self._th += data
        elif self.cell is not None:
            self.cell["full"].append(data)
            struck = self.cell["struck"] or any(flag for _t, flag in self.stack)
            self.cell["live"].append(" " if struck else data)


def parse_sheet_html(page: str, name: str) -> Sheet:
    """HTML одного листа (htmlview/sheet) → Sheet."""
    struck = set(_STRUCK_CSS.findall(page))
    start = page.find("<table")
    parser = _Table(struck)
    parser.feed(page[start:] if start >= 0 else page)
    parser.close()

    sheet = Sheet(name=name, rows=[])
    grid: dict[int, dict[int, str]] = {}
    occupied: set[tuple[int, int]] = set()
    nums = {i: row["num"] for i, row in enumerate(parser.rows)}

    def put(r: int, c: int, text: str, live: str, href: str) -> None:
        grid.setdefault(r, {})[c] = text
        if live != text:
            sheet.live[(r, c)] = live
        if href:
            sheet.links[(r, c)] = href
        if _NUMERIC.fullmatch(text):
            sheet.nums[(r, c)] = float(text.replace(",", "."))

    for i, row in enumerate(parser.rows):
        col = 0
        for cell in row["cells"]:
            while (i, col) in occupied:
                col += 1
            cs, rs = cell["cs"], cell["rs"]
            for di in range(rs):
                for dc in range(cs):
                    if di or dc:
                        occupied.add((i + di, col + dc))
            text = clean("".join(cell["full"]))
            live = clean("".join(cell["live"]))
            if nums[i] is not None and text and col < MAX_COLS and nums[i] <= MAX_ROWS:
                r = nums[i] - 1
                href = cell.get("href", "")
                put(r, col, text, live, href)
                for di in range(rs):
                    rr = nums.get(i + di)
                    if rr is None or rr > MAX_ROWS:
                        continue
                    if di:
                        put(rr - 1, col, text, live, href)      # объединение по вертикали
                        sheet.vfill.add((rr - 1, col))
                    for dc in range(1, cs):
                        sheet.hmerge[(rr - 1, col + dc)] = col
            col += cs

    if grid:
        for r in range(max(grid) + 1):
            cols = grid.get(r)
            if not cols:
                sheet.rows.append([])
                continue
            line = [""] * (max(cols) + 1)
            for c, text in cols.items():
                line[c] = text
            sheet.rows.append(line)
    return sheet
