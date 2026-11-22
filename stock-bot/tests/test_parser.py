from stockbot.gsheets import parse_index, parse_sheet_html
from stockbot.parser import is_active, link_html, parse_override, parse_sheets, parse_table, sizes_text
from stockbot.sizes import NOSIZE


def by_name(table):
    return {i.name: i for i in table.items}


def test_list_layout_like_nord(make_xlsx, nord_rows):
    table = parse_table(make_xlsx(nord_rows))
    items = by_name(table)
    assert len(items) == 7
    assert items["ПУХОВИК ZARA ЧЕРНЫЙ"].available() == ["S", "M", "L", "XL", "XXL"]
    assert items["ПУХОВИК ZARA ЧЕРНЫЙ"].raw == "S M L XL XXL"
    assert items["ПУХОВИК ZARA ЧЕРНЫЙ"].price == "5500"
    assert items["ПУХОВИК LACOSTE БЕЖЕВЫЙ"].available() == []          # «-» — нет в наличии
    assert items["ПУХОВИК MONCLER С МЕХОМ"].available() == ["2", "3"]  # необычные размеры не теряем
    assert table.sheets[0].mode == "list"


def test_wide_layout_like_vega_with_merged_cells(make_html):
    html = make_html([
        [("НАЛИЧИЕ &amp; ПРАЙС VEGA", 10, 1)],
        [],
        [("фото товара", 1, 2), ("название", 1, 2), ("размеры", 6, 1), ("опт цена", 1, 2), ("дроп цена", 1, 2)],
        ["xs", "s", "m", "l", "xl", "xxl"],
        ["", "пуховик Champion белый", "", ("много", 4, 1), "", "3500", "4300"],
        ["", "пуховик Moncler розовый", "", "0", "0", "0", "", "", "5000", "5500"],
        ["", "пуховик Corteiz белый", "", "0", "15", "0)", "4", "", "2950", "3800"],
        ["", "Худи Agent Provocateur", "2", "0", "0", "", "", "", "3000", "3400"],
    ])
    table = parse_sheets([parse_sheet_html(html, "пуховики")])
    items = by_name(table)
    assert items["пуховик Champion белый"].available() == ["S", "M", "L", "XL"]   # «много» на 4 столбца
    assert items["пуховик Moncler розовый"].available() == []
    assert items["пуховик Corteiz белый"].sizes["M"] == 15
    assert items["пуховик Corteiz белый"].available() == ["M", "XL"]              # «0)» — опечатка, это ноль
    assert items["Худи Agent Provocateur"].available() == ["XS"]
    assert items["пуховик Champion белый"].price == "4300"                         # берём дроп-цену
    assert table.sheets[0].mode == "wide"


def test_block_per_item_like_orion(make_html):
    block1 = [
        [("", 3, 5), ("название", 2, 2), ("ЦЕНА ДРОП", 1, 2), ("МРЦ", 1, 2), "S", "M", "L", "XL", "Ссылка на фото"],
        [("✅", 1, 4), ("✅", 1, 4), ("❌", 1, 4), ("❌", 1, 4), "https://t.me/shop/1"],
        [("Джинсы Gallery Dept", 2, 3), ("2500", 1, 3), ("3490", 1, 3), "Замеры"],
        ["https://t.me/shop/100"],
        [""],
    ]
    block2 = [
        [("", 3, 5), ("название", 2, 2), ("ЦЕНА ДРОП", 1, 2), ("МРЦ", 1, 2), "S", "M", "L", "XL", "Ссылка на фото"],
        [("❌", 1, 4), ("❌", 1, 4), ("✅", 1, 4), ("✅", 1, 4), "https://t.me/shop/2"],
        [("Джинсы Gallery Dept", 2, 3), ("2500", 1, 3), ("3490", 1, 3), "Замеры"],
        ["https://t.me/shop/100"],
        [""],
    ]
    table = parse_sheets([parse_sheet_html(make_html([["Orion Opt"], []] + block1 + block2), "Штаны")])
    assert len(table.items) == 2                    # одинаковое название, но разные фото — разные вещи
    first, second = table.items
    assert first.available() == ["S", "M"] and first.link == "https://t.me/shop/1"
    assert second.available() == ["L", "XL"] and second.link == "https://t.me/shop/2"
    assert first.price == "2500" and first.dups == 0


def test_no_sizes_column_means_yes_no(make_xlsx):
    table = parse_table(make_xlsx([
        ["название", "размеры", "дроп цена"],
        ["сумка Polo", "есть", 2400],
        ["сумка Coach", "Нет", 2400],
    ]))
    items = by_name(table)
    assert items["сумка Polo"].sizes == {NOSIZE: None} and sizes_text(items["сумка Polo"]) == "есть"
    assert items["сумка Coach"].available() == []


def test_long_layout_and_strikethrough(make_xlsx):
    table = parse_table(make_xlsx([
        ["Артикул", "Наименование", "Размер", "Остаток"],
        ["A1", "Футболка", "S", 3],
        ["A1", "Футболка", "M", 0],
        ["A1", "Футболка", "L", 2],
        ["B2", "Кепка", "ONE SIZE", 5],
    ], strike=["C4"]))
    items = by_name(table)
    assert items["Футболка"].sizes == {"S": 3, "M": 0, "L": 0}       # L зачёркнут — значит, продан
    assert items["Кепка"].available() == ["ONE SIZE"]


def test_x_marks_mean_available_when_alone(make_xlsx):
    table = parse_table(make_xlsx([["Название", "S", "M", "L"], ["Худи", "x", "", "x"]]))
    assert table.items[0].available() == ["S", "L"]
    table = parse_table(make_xlsx([["Название", "S", "M", "L"], ["Худи", "x", "+", "+"]]))
    assert table.items[0].available() == ["M", "L"]


def test_own_table(make_xlsx, mine_rows):
    extra = make_xlsx([["ID", "Дата", "Тип", "Сумма", "Товар ID"], [1, "2026-11-09", "Закупка", 100, 66]])
    from stockbot.workbook import load_sheets
    sheets = load_sheets(make_xlsx(mine_rows, title="Товары")) + load_sheets(extra)
    table = parse_sheets(sheets, mine=True)
    assert [s.name for s in table.sheets] == ["Товары"]           # лист расходов — не товары
    assert len(table.items) == 9
    active = [i.name for i in table.items if is_active(i)]
    assert "Худи Zara" not in active                               # снят
    assert "Пуховик Lacoste бежевый nord" not in active           # продан
    assert "Cp company зеленая моя" not in active                  # свой товар
    assert len(active) == 6


def test_manual_columns(make_xlsx):
    data = make_xlsx([["a", "b", "c", "d"], ["Худи", "", "S, M", 100], ["Футболка", "", "L", 200]])
    cfg = parse_override("название=A размер=C цена=D")
    table = parse_table(data, config=cfg)
    assert by_name(table)["Худи"].available() == ["S", "M"]
    try:
        parse_override("размеры=Z")
    except ValueError:
        pass
    else:
        raise AssertionError("ожидалась ошибка")


def test_index_page():
    page = ('<title>VEGA НАЛИЧИЕ - Google Drive</title> items.push({name: "ветровки\\/куртки", pageUrl: '
            '"https:\\/\\/docs.google.com\\/x\\/sheet?headers\\x3dtrue&gid=734174550", gid: "734174550",});')
    assert parse_index(page) == ("VEGA НАЛИЧИЕ", [("ветровки/куртки", "734174550")])


def test_invoice_sheet_is_not_stock(make_xlsx):
    from stockbot.workbook import load_sheets
    stock = load_sheets(make_xlsx([["Название", "S", "M"], ["Куртка", 1, 0]], title="Куртки"))
    bill = load_sheets(make_xlsx([["Наименование", "Цена"], ["Куртка Moncler", 5000], ["Доставка", 300]], title="Счет"))
    table = parse_sheets(stock + bill)
    assert [s.name for s in table.sheets] == ["Куртки"] and [i.name for i in table.items] == ["Куртка"]
    assert len(parse_sheets(bill).items) == 2          # если других листов нет — берём что есть


def test_dash_is_not_a_price(make_xlsx):
    table = parse_table(make_xlsx([["Название", "S", "M", "Цена дроп"], ["Куртка", 1, 1, "-"], ["Худи", 1, 0, "2 500 ₽"]]))
    assert [i.price for i in table.items] == ["", "2500"]


def test_supply_dates_are_not_stock(make_html):
    """Таблица как у кросс-маркета: «Поставка ~ 29.11» объединённой ячейкой на все размеры — это не наличие."""
    tg = "https://t.me/krossdrop/"
    html = make_html([
        ["НАЛИЧИЕ drop"],
        [],
        [("Фото", 1, 2), ("Название", 1, 2), ("Город отправки", 1, 2), ("Размеры", 6, 1), ("ДРОП цена", 1, 2),
         ("Фото в канале", 1, 2)],
        ["S", "M", "L", "XL", "2XL", "3XL"],
        ["", "Пуховик VT x Moncler", "г. Екатеринбург", ("Поставка ~ 29.11", 5, 1), "-", "-", "-"],
        ["", "Пуховик CP Company", "г. Екатеринбург", ("Догруз в пути", 3, 1), "✅ 1 шт", "-", "-", "4350",
         (tg + "364", 1, 1, tg + "364")],
        ["", "Пуховик CP Company", "г. Екатеринбург", "возврат (до 25 нояб)", "❌", "✅2 шт", "✅1 шт", "-", "-",
         "4350", ("Пост", 1, 1, tg + "385")],
        ["", "Куртка Canada Goose", "г. Екатеринбург", "❌", "❌", "❌", "❌", "✅ 1 шт", "-", "4200",
         ("Замеры", 1, 1, tg + "999")],
    ])
    table = parse_sheets([parse_sheet_html(html, "Верхняя одежда")])
    by_link = {i.link: i for i in table.items}
    assert len(table.items) == 4                       # два «Пуховика CP Company» с разными постами — разные вещи

    moncler = by_name(table)["Пуховик VT x Moncler"]
    assert moncler.available() == [] and moncler.link == ""
    assert sizes_text(moncler) == "сейчас нет · ⏳ S, M, L, XL, XXL — Поставка ~ 29.11"

    cp1, cp2 = by_link[tg + "364"], by_link[tg + "385"]
    assert cp1.available() == ["XL"] and cp1.sizes["XL"] == 1
    assert sizes_text(cp1) == "XL (1 шт) · ⏳ S, M, L — Догруз в пути"
    assert cp2.available() == ["L", "XL"]                # ссылка взята из гиперссылки «Пост»
    assert sizes_text(cp2) == "L (2 шт), XL (1 шт) · ⏳ S — возврат (до 25 нояб)"

    goose = by_name(table)["Куртка Canada Goose"]
    assert goose.link == "" and goose.soon == {}         # ссылка на замеры — не ссылка на вещь

    assert link_html(tg + "364") == f'<a href="{tg}364">пост в ТГ</a>'
    assert link_html("https://disk.yandex.ru/i/x") == '<a href="https://disk.yandex.ru/i/x">фото</a>'
    assert link_html("") == ""


def test_supply_notes_in_size_lists(make_xlsx):
    table = parse_table(make_xlsx([
        ["Наименование", "Размеры", "Цена"],
        ["Пуховик Zara бордовый", "S M L XL XXL (через 3-5 дней)", 5500],
        ["Пуховик Zara синий", "S M, XL - поставка 29.11", 5500],
        ["Пуховик Prada", "Поставка 29.11", 5000],
        ["Пуховик Valentino", "S M L (поставка 29.11, вечером), XL", 5000],
        ["Пуховик Boss", "S M L", 4500],
    ]))
    items = by_name(table)
    assert items["Пуховик Zara бордовый"].available() == []
    assert sizes_text(items["Пуховик Zara бордовый"]) == "сейчас нет · ⏳ S, M, L, XL, XXL — через 3-5 дней"
    assert items["Пуховик Zara синий"].available() == ["S", "M"]
    assert items["Пуховик Zara синий"].soon == {"XL": "XL - поставка 29.11"}
    assert sizes_text(items["Пуховик Prada"]) == "сейчас нет · ⏳ Поставка 29.11"
    assert items["Пуховик Valentino"].available() == ["XL"]
    assert sizes_text(items["Пуховик Valentino"]) == "XL · ⏳ S, M, L — поставка 29.11, вечером"
    assert items["Пуховик Boss"].soon == {} and items["Пуховик Boss"].available() == ["S", "M", "L"]


def test_supply_notes_in_note_column_and_name(make_xlsx):
    table = parse_table(make_xlsx([
        ["Название", "S", "M", "Примечание"],
        ["Худи Nike", 2, 1, "в пути, будет 25.11"],
        ["Худи Puma", 2, 0, "маломерит"],
        ["Куртка Moncler (предзаказ)", 1, 1, ""],
    ]))
    items = by_name(table)
    assert items["Худи Nike"].available() == [] and items["Худи Nike"].soon == {"S": "в пути, будет 25.11",
                                                                               "M": "в пути, будет 25.11"}
    assert items["Худи Puma"].available() == ["S"] and items["Худи Puma"].soon == {}
    assert items["Куртка Moncler (предзаказ)"].available() == []
    assert set(items["Куртка Moncler (предзаказ)"].soon.values()) == {"предзаказ"}


def test_xlsx_hyperlinks(make_xlsx):
    import io

    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(make_xlsx([["Название", "S", "Фото"], ["Худи", 1, "Пост"],
                                                      ["Кепка", 1, "https://t.me/shop/7"]])))
    wb.active["C2"].hyperlink = "https://t.me/shop/5"
    buf = io.BytesIO()
    wb.save(buf)
    items = by_name(parse_table(buf.getvalue()))
    assert items["Худи"].link == "https://t.me/shop/5" and items["Кепка"].link == "https://t.me/shop/7"


def test_russian_clothing_sizes_become_letters(make_xlsx):
    from stockbot.workbook import load_sheets
    clothes = load_sheets(make_xlsx([
        ["Название", "42", "44", "46", "48", "Цена"],
        ["Худи Stone Island", 1, 0, 2, "+", 4000],
    ], title="Худи"))
    lists = load_sheets(make_xlsx([
        ["Наименование", "Размеры", "Цена"],
        ["Пуховик Zara", "44, 46 (поставка 29.11), 50", 5000],
        ["Кроссовки Nike", "42 44", 6000],
        ["Джинсы Diesel", "30 32", 3000],
    ], title="Наличие"))
    shoes = load_sheets(make_xlsx([["Название", "40", "41", "42", "44"], ["Jordan 11", 0, 1, 1, 2]], title="Обувь"))
    shoes_even = load_sheets(make_xlsx([["Название", "42", "44"], ["Golden Goose", 1, 1]], title="Кроссовки"))
    items = by_name(parse_sheets(clothes + lists + shoes + shoes_even))
    assert items["Худи Stone Island"].sizes == {"S": 1, "M": 0, "L": 2, "XL": None}
    assert items["Пуховик Zara"].available() == ["M", "XXL"] and items["Пуховик Zara"].soon == {"L": "поставка 29.11"}
    assert sizes_text(items["Пуховик Zara"]) == "M, XXL · ⏳ L — поставка 29.11"
    assert list(items["Кроссовки Nike"].sizes) == ["42", "44"]                 # обувь по названию
    assert list(items["Джинсы Diesel"].sizes) == ["30", "32"]                  # джинсовые размеры — не одежда 42–48
    assert list(items["Jordan 11"].sizes) == ["40", "41", "42", "44"]          # есть нечётный — обувь
    assert list(items["Golden Goose"].sizes) == ["42", "44"]                   # лист «Кроссовки»


def test_same_names_told_apart_by_photo_color(make_html):
    html = make_html([
        ["Фото", "Название", "Размеры"],
        ['<img src="https://docs.google.com/sheets-images-rt/A1=w100-h175">', "Ветровка Stone", "S-5, M-2"],
        ['<img src="https://docs.google.com/sheets-images-rt/B2=w100-h175">', "Ветровка Stone", "S-4, L-3"],
        ['<img src="https://docs.google.com/sheets-images-rt/C3=w100-h133">', "Ветровка Stone", "XL-1"],
    ])
    sheet = parse_sheet_html(html, "Mavlutov")
    assert sheet.images == {1: "https://docs.google.com/sheets-images-rt/A1=w100-h175",
                            2: "https://docs.google.com/sheets-images-rt/B2=w100-h175",
                            3: "https://docs.google.com/sheets-images-rt/C3=w100-h133"}
    assert len(parse_sheets([sheet]).items) == 1             # без цветов три строки — одна вещь
    sheet.row_colors = {1: "чёрно-синяя", 2: "чёрно-жёлтая"}
    table = parse_sheets([sheet], {"photo_colors": {"x": "y"}})
    got = {i.title: i.sizes for i in table.items}
    assert got == {"Ветровка Stone, чёрно-синяя": {"S": 5, "M": 2},
                   "Ветровка Stone, чёрно-жёлтая": {"S": 4, "L": 3},
                   "Ветровка Stone": {"XL": 1}}            # фото не узнали — остаётся без цвета


async def test_label_photos_by_fingerprint():
    from aiohttp import ClientSession, web
    from aiohttp.test_utils import TestServer

    from stockbot import fetch
    from stockbot.workbook import Sheet

    pictures = {"A1": b"blue-jacket", "B2": b"yellow-jacket", "C3": b"blue-jacket"}
    seen = []

    async def image(request):
        name, size = request.match_info["name"].split("=", 1)
        seen.append(size)
        return web.Response(body=pictures[name], content_type="image/jpeg")

    app = web.Application()
    app.router.add_get("/sheets-images-rt/{name}", image)
    server = TestServer(app)
    await server.start_server()
    base = str(server.make_url("/sheets-images-rt/"))
    sheet = Sheet("Mavlutov", rows=[], images={1: base + "A1=w100-h175", 2: base + "B2=w100-h133", 3: base + "C3"})
    blue = __import__("hashlib").sha1(b"blue-jacket").hexdigest()[:16]
    try:
        async with ClientSession() as session:
            assert await fetch.photo_fingerprint(session, base + "A1=w100-h175") == blue
            labeled = await fetch.label_photos(session, [sheet], {blue: "чёрно-синяя"})
    finally:
        await server.close()
    assert labeled == 2 and sheet.row_colors == {1: "чёрно-синяя", 3: "чёрно-синяя"}
    assert set(seen) == {"w100-h100"}                         # превью всегда одного размера
