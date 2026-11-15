"""Чтение файла таблицы (.xlsx / .xls / .csv) в простой вид: листы → строки → текст ячеек.

Помимо текста запоминаем зачёркивание: поставщики часто зачёркивают проданные размеры.
"""
from __future__ import annotations

import csv
import datetime as dt
import io
import zipfile
from dataclasses import dataclass, field

from .textnorm import clean

MAX_ROWS = 30000
MAX_COLS = 150
MAX_UNZIPPED = 300 * 1024 * 1024


class TableError(Exception):
    """Файл не удалось прочитать как таблицу (текст ошибки показываем пользователю)."""


@dataclass
class Sheet:
    name: str
    rows: list[list[str]]
    # Текст ячейки без зачёркнутых частей — только там, где он отличается от полного.
    live: dict[tuple[int, int], str] = field(default_factory=dict)
    # Числовые значения ячеек.
    nums: dict[tuple[int, int], float] = field(default_factory=dict)
    # Ячейки, накрытые объединением по горизонтали: (строка, столбец) → столбец с текстом.
    hmerge: dict[tuple[int, int], int] = field(default_factory=dict)
    # Ячейки, заполненные из объединения по вертикали (это не отдельные строки таблицы).
    vfill: set[tuple[int, int]] = field(default_factory=set)

    def cell(self, r: int, c: int | None) -> str:
        if c is None or r < 0 or r >= len(self.rows):
            return ""
        row = self.rows[r]
        return row[c] if 0 <= c < len(row) else ""

    def live_cell(self, r: int, c: int | None) -> str:
        if c is None:
            return ""
        return self.live.get((r, c), self.cell(r, c))

    def num(self, r: int, c: int | None) -> float | None:
        if c is None or (r, c) in self.live:
            return None
        return self.nums.get((r, c))


def _fmt(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "да" if value else "нет"
    if isinstance(value, float):
        if value != value:  # NaN
            return ""
        return str(int(value)) if value.is_integer() else f"{value:.10g}"
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        return value.isoformat(sep=" ") if isinstance(value, dt.datetime) else value.isoformat()
    return clean(value)


def sniff(data: bytes) -> str:
    """Тип файла по первым байтам."""
    if data[:4] == b"PK\x03\x04":
        return "xlsx"
    if data[:8] == b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
        return "xls"
    head = data[:2000].lstrip().lower()
    if head.startswith((b"<!doctype html", b"<html", b"<head", b"<?xml")):
        return "html"
    return "csv"


def load_sheets(data: bytes, filename: str = "") -> list[Sheet]:
    """Файл → список листов. Бросает TableError с понятным текстом."""
    if not data:
        raise TableError("Файл пустой.")
    kind = sniff(data)
    if kind == "xlsx":
        return _load_xlsx(data)
    if kind == "xls":
        return _load_xls(data)
    if kind == "html":
        raise TableError(
            "Вместо таблицы пришла веб-страница. Скорее всего, доступ по ссылке закрыт — "
            "откройте таблицу «для всех, у кого есть ссылка»."
        )
    return _load_csv(data, filename)


def _load_xlsx(data: bytes) -> list[Sheet]:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            names = zf.namelist()
            if sum(i.file_size for i in zf.infolist()) > MAX_UNZIPPED:
                raise TableError("Файл слишком большой.")
        if not any(n.startswith("xl/") for n in names):
            raise TableError("Это не Excel-файл (.xlsx). Пришлите таблицу в формате Excel или CSV.")
    except zipfile.BadZipFile as exc:
        raise TableError("Файл повреждён или это не Excel.") from exc

    import warnings

    import openpyxl
    from openpyxl.cell.rich_text import CellRichText, TextBlock

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, rich_text=True)
    except Exception as exc:  # openpyxl бросает самые разные ошибки на битых файлах
        raise TableError(f"Не получилось открыть Excel-файл: {exc}") from exc

    sheets: list[Sheet] = []
    for ws in wb.worksheets:
        if ws.sheet_state != "visible":
            continue
        cells = getattr(ws, "_cells", None)
        if cells is None:
            cells = {(c.row, c.column): c for row in ws.iter_rows(max_row=MAX_ROWS, max_col=MAX_COLS) for c in row}
        grid: dict[int, dict[int, str]] = {}
        sheet = Sheet(name=clean(ws.title), rows=[])
        for (r1, c1), cell in cells.items():
            r, c = r1 - 1, c1 - 1
            if r >= MAX_ROWS or c >= MAX_COLS:
                continue
            value = cell.value
            if value is None:
                continue
            live = None
            if isinstance(value, CellRichText):
                full_parts, live_parts = [], []
                for part in value:
                    if isinstance(part, TextBlock):
                        full_parts.append(part.text)
                        if not (part.font is not None and part.font.strike):
                            live_parts.append(part.text)
                        else:
                            live_parts.append(" ")
                    else:
                        full_parts.append(str(part))
                        live_parts.append(str(part))
                text = clean("".join(full_parts))
                live = clean("".join(live_parts))
            else:
                text = _fmt(value)
                if isinstance(value, (int, float)) and not isinstance(value, bool):
                    sheet.nums[(r, c)] = float(value)
            if not text:
                continue
            try:
                if cell.font is not None and cell.font.strike:
                    live = ""
            except Exception:
                pass
            grid.setdefault(r, {})[c] = text
            if live is not None and live != text:
                sheet.live[(r, c)] = live

        # Объединённые по вертикали ячейки: значение действует на все строки объединения.
        try:
            merged = list(ws.merged_cells.ranges)
        except Exception:
            merged = []
        for rng in merged:
            r0, c0 = rng.min_row - 1, rng.min_col - 1
            if rng.max_col > rng.min_col and rng.max_col - rng.min_col < MAX_COLS:
                for r in range(r0, min(rng.max_row, MAX_ROWS)):
                    for c in range(c0 + 1, rng.max_col):
                        sheet.hmerge[(r, c)] = c0
            if rng.max_row == rng.min_row or r0 not in grid or c0 not in grid[r0]:
                continue
            for r in range(r0 + 1, min(rng.max_row, MAX_ROWS)):
                grid.setdefault(r, {})[c0] = grid[r0][c0]
                sheet.vfill.add((r, c0))
                if (r0, c0) in sheet.live:
                    sheet.live[(r, c0)] = sheet.live[(r0, c0)]
                if (r0, c0) in sheet.nums:
                    sheet.nums[(r, c0)] = sheet.nums[(r0, c0)]

        sheet.rows = _grid_to_rows(grid)
        if sheet.rows:
            sheets.append(sheet)
    return sheets


def _grid_to_rows(grid: dict[int, dict[int, str]]) -> list[list[str]]:
    if not grid:
        return []
    rows: list[list[str]] = []
    for r in range(max(grid) + 1):
        cols = grid.get(r)
        if not cols:
            rows.append([])
            continue
        row = [""] * (max(cols) + 1)
        for c, text in cols.items():
            row[c] = text
        rows.append(row)
    return rows


def _load_xls(data: bytes) -> list[Sheet]:
    import xlrd

    book = None
    for formatting in (True, False):
        try:
            book = xlrd.open_workbook(file_contents=data, formatting_info=formatting)
            break
        except Exception as exc:
            err = exc
    if book is None:
        raise TableError(f"Не получилось открыть файл .xls: {err}")

    sheets: list[Sheet] = []
    for sh in book.sheets():
        if getattr(sh, "visibility", 0):
            continue
        sheet = Sheet(name=clean(sh.name), rows=[])
        grid: dict[int, dict[int, str]] = {}
        for r in range(min(sh.nrows, MAX_ROWS)):
            for c in range(min(sh.ncols, MAX_COLS)):
                cell = sh.cell(r, c)
                if cell.ctype in (xlrd.XL_CELL_EMPTY, xlrd.XL_CELL_BLANK, xlrd.XL_CELL_ERROR):
                    continue
                if cell.ctype == xlrd.XL_CELL_NUMBER:
                    text = _fmt(float(cell.value))
                    sheet.nums[(r, c)] = float(cell.value)
                elif cell.ctype == xlrd.XL_CELL_DATE:
                    try:
                        text = _fmt(xlrd.xldate_as_datetime(cell.value, book.datemode))
                    except Exception:
                        text = _fmt(cell.value)
                elif cell.ctype == xlrd.XL_CELL_BOOLEAN:
                    text = _fmt(bool(cell.value))
                else:
                    text = _fmt(cell.value)
                if not text:
                    continue
                grid.setdefault(r, {})[c] = text
                if book.formatting_info:
                    try:
                        font = book.font_list[book.xf_list[cell.xf_index].font_index]
                        if font.struck_out:
                            sheet.live[(r, c)] = ""
                    except Exception:
                        pass
        for r0, r1, c0, _c1 in getattr(sh, "merged_cells", []) or []:
            if r1 - r0 <= 1 or r0 not in grid or c0 not in grid[r0]:
                continue
            for r in range(r0 + 1, min(r1, MAX_ROWS)):
                grid.setdefault(r, {})[c0] = grid[r0][c0]
                sheet.vfill.add((r, c0))
                if (r0, c0) in sheet.nums:
                    sheet.nums[(r, c0)] = sheet.nums[(r0, c0)]
        sheet.rows = _grid_to_rows(grid)
        if sheet.rows:
            sheets.append(sheet)
    return sheets


def _load_csv(data: bytes, filename: str) -> list[Sheet]:
    text = None
    for enc in ("utf-8-sig", "cp1251", "utf-16"):
        try:
            text = data.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if text is None or "\x00" in text[:2000]:
        raise TableError("Не понимаю формат файла. Подойдут Excel (.xlsx, .xls), CSV или ссылка на Google Таблицу.")
    sample = text[:8000]
    delim = max(";,\t|", key=sample.count)
    rows: list[list[str]] = []
    sheet = Sheet(name=clean(filename.rsplit(".", 1)[0]) or "Лист1", rows=rows)
    for r, raw in enumerate(csv.reader(io.StringIO(text), delimiter=delim)):
        if r >= MAX_ROWS:
            break
        row = [clean(v) for v in raw[:MAX_COLS]]
        for c, v in enumerate(row):
            if v:
                try:
                    sheet.nums[(r, c)] = float(v.replace(" ", "").replace(",", "."))
                except ValueError:
                    pass
        while row and not row[-1]:
            row.pop()
        rows.append(row)
    if not any(rows):
        raise TableError("В файле нет данных.")
    return [sheet]
