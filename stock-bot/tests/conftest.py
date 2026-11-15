import io
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))


def xlsx(rows, merges=(), strike=(), title="Лист1") -> bytes:
    """Собрать .xlsx из списка строк. merges — диапазоны «C2:F2», strike — адреса зачёркнутых ячеек."""
    import openpyxl
    from openpyxl.styles import Font

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = title
    for row in rows:
        ws.append(row)
    for rng in merges:
        ws.merge_cells(rng)
    for addr in strike:
        ws[addr].font = Font(strike=True)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def gsheet_html(rows) -> str:
    """Страница листа в том виде, как её отдаёт Google (htmlview). Ячейка — строка
    или кортеж (текст, colspan, rowspan)."""
    out = ['<style>.ritz .waffle .s9{text-decoration:line-through;}</style><table class="waffle"><thead><tr>'
           '<th class="row-header freezebar-origin-ltr"></th><th>A</th></tr></thead><tbody>']
    for n, row in enumerate(rows, 1):
        out.append(f'<tr style="height: 20px"><th id="0R{n - 1}" class="row-headers-background"><div>{n}</div></th>')
        for cell in row:
            text, cs, rs = cell if isinstance(cell, tuple) else (cell, 1, 1)
            attrs = (f' colspan="{cs}"' if cs > 1 else "") + (f' rowspan="{rs}"' if rs > 1 else "")
            out.append(f'<td class="s1"{attrs}>{text}</td>')
        out.append("</tr>")
        if n == 2:      # закреплённые строки: Google вставляет служебную строку-разделитель
            out.append('<tr><th class="freezebar-cell"></th><td class="freezebar-cell"></td></tr>')
    out.append("</tbody></table>")
    return "".join(out)


@pytest.fixture
def make_xlsx():
    return xlsx


@pytest.fixture
def make_html():
    return gsheet_html


MINE_ROWS = [
    ["ID", "Товар", "Статус", "Выставлен", "Цена объявления", "Тип"],
    [1, "Худи Zara", "снят", "2026-10-30", 3490, "Дроп"],
    [2, "Пуховик Zara черный nord", "выставлен", "2026-11-03", 6510, "Дроп"],
    [3, "Пуховик Hugo Boss синий nord", "выставлен", "2026-11-03", 6033, "Дроп"],
    [4, "Пуховик Moncler nord", "выставлен", "2026-11-03", 6000, "Дроп"],
    [5, "Пуховик Champion белый VEGA", "выставлен", "2026-11-07", 3825, "Дроп"],
    [6, "Cp company зеленая моя", "выставлен", "2026-11-09", 9000, "Свой"],
    [7, "Худи Vetements LUX", "выставлен", "2026-11-15", 4000, "Дроп"],
    [8, "Худи Stone Island LUX", "выставлен", "2026-11-15", 4000, "Дроп"],
    [9, "Пуховик Lacoste бежевый nord", "продан", "2026-11-03", 6045, "Дроп"],
]

NORD_ROWS = [
    ["НАЛИЧИЕ NORD_DROP"],
    [],
    ["Наименование", "Фото", "Размеры", "Цена"],
    ["ПУХОВИК ZARA ЧЕРНЫЙ", "", "S M L XL XXL (через 3-5 дней)", "5500р"],
    ["ПУХОВИК ZARA СИНИЙ", "", "L XL XXL", "5500р"],
    ["ПУХОВИК BOSS СИНИЙ", "", "S M L XL XXL", "4500р"],
    ["ПУХОВИК BOSS ЧЕРНЫЙ", "", "S M XL XXL", "4500р"],
    ["ПУХОВИК MONCLER MONTBELIARD ЧЕРНЫЙ", "", "S M L", "5500р"],
    ["ПУХОВИК MONCLER С МЕХОМ", "", "2 3", "6000р"],
    ["ПУХОВИК LACOSTE БЕЖЕВЫЙ", "", "-", "5000р"],
]


@pytest.fixture
def mine_rows():
    return [list(r) for r in MINE_ROWS]


@pytest.fixture
def nord_rows():
    return [list(r) for r in NORD_ROWS]
