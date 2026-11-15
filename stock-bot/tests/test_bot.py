import re

import pytest
from aiogram.types import User

from conftest import xlsx
from fakes import make


def plain(recs) -> str:
    return "\n".join(re.sub(r"<[^>]+>", "", r["text"]) for r in recs)


@pytest.fixture
async def app(tmp_path):
    client, db, engine = make(tmp_path)
    yield client, db, engine
    await engine.close()
    await client.bot.session.close()
    db.close()


async def setup(client, mine_rows, nord_rows):
    await client.say("/start")
    await client.upload("Учёт.xlsx", xlsx(mine_rows, title="Товары"))
    await client.press("моя таблица")
    await client.upload("NORD наличие.xlsx", xlsx(nord_rows))
    await client.press("поставщика")
    return await client.press("nord —")


async def test_full_setup_flow(app, mine_rows, nord_rows):
    client, db, engine = app
    assert "пришлите ссылку на вашу таблицу" in plain(await client.say("/start"))
    assert db.get("owner") == 111

    recs = await client.upload("Учёт.xlsx", xlsx(mine_rows, title="Товары"))
    assert "позиций — 9" in plain(recs)
    assert client.buttons()[0][0] == "🏠 Это моя таблица ✓"             # сам понял, что таблица своя
    await client.press("моя таблица")
    summary = plain([client.session.sent[-1]])
    assert "выставлено — 6" in summary and "nord — вещей: 3" in summary and "lux — вещей: 2" in summary

    await client.upload("NORD наличие.xlsx", xlsx(nord_rows))
    assert client.buttons()[0][0] == "🚚 Это таблица поставщика ✓"
    await client.press("поставщика")
    assert client.buttons()[0][0] == "nord — вещей: 3"                 # угадал пометку по названию файла
    recs = await client.press("nord —")
    text = plain(recs)
    assert "NORD: в таблице позиций — 7" in text
    assert "начал следить за вещами: 2" in text and "Не уверен насчёт вещей: 1" in text

    recs = await client.press("Разобрать")
    card = plain(recs)
    assert "Пуховик Moncler nord" in card and "ПУХОВИК MONCLER С МЕХОМ — 2, 3" in card
    number = re.search(r"(\d)\. ПУХОВИК MONCLER С МЕХОМ", card).group(1)
    recs = await client.press(number)
    assert "Всё разобрано" in plain(recs)
    assert "Пуховик Moncler nord → ПУХОВИК MONCLER С МЕХОМ" in plain(client.session.sent)
    assert {l.status for l in db.links()} == {"auto", "manual"}


async def test_search_by_sizes_and_name(app, mine_rows, nord_rows):
    client, db, engine = app
    await setup(client, mine_rows, nord_rows)
    recs = await client.say("пришли вещи у которых есть размеры s m l одновременно")
    text = plain(recs)
    # Zara чёрный и Boss синий уже есть в своей таблице — в поиске их быть не должно
    assert "размеры S, M, L одновременно — нашёл вещей: 1" in text
    assert "Скрыл те, что уже есть в вашей таблице: 2" in text
    assert "ПУХОВИК MONCLER MONTBELIARD ЧЕРНЫЙ — S, M, L — 5500 ₽" in text
    assert "ZARA" not in text and "BOSS" not in text
    text = plain(await client.press("Показать вместе с моими"))
    assert "нашёл вещей: 3" in text and "ПУХОВИК ZARA ЧЕРНЫЙ — S, M, L, XL, XXL — 5500 ₽ · ✅ уже у вас" in text
    assert "ПУХОВИК BOSS ЧЕРНЫЙ" not in text                             # у него нет L

    text = plain(await client.say("куртки s m l"))                       # «куртки» — это и пуховики
    assert "«куртки» · размеры S, M, L одновременно — нашёл вещей: 1" in text and "MONTBELIARD" in text
    assert "ничего не нашёл" in plain(await client.say("кофты s m l"))
    text = plain(await client.say("boss nord"))
    assert "ПУХОВИК BOSS ЧЕРНЫЙ — S, M, XL, XXL" in text and "ZARA" not in text
    assert "ничего не нашёл" in plain(await client.say("4xl"))


async def test_search_hides_delisted_items_too(app, mine_rows, nord_rows):
    client, db, engine = app
    await setup(client, mine_rows, nord_rows)
    # «Пуховик Lacoste бежевый nord» в своей таблице продан — но он в таблице есть, значит, не новинка
    text = plain(await client.say("lacoste"))
    assert "новых вещей нет" in text and "(1) уже есть в вашей таблице" in text


async def test_file_update_reports_changes(app, mine_rows, nord_rows):
    client, db, engine = app
    await setup(client, mine_rows, nord_rows)
    nord_rows[3][2] = "XL"
    await client.upload("NORD наличие 16.11.xlsx", xlsx(nord_rows))
    recs = await client.press("Обновить «NORD»")
    text = plain(recs)
    assert "Пуховик Zara черный nord" in text and "➖ Убрали: S, M, L, XXL" in text
    assert "⚠️ Остался только размер XL" in text
    assert "Изменений нет" in plain(await client.say("🔄 Проверить сейчас"))


async def test_screens(app, mine_rows, nord_rows):
    client, db, engine = app
    await setup(client, mine_rows, nord_rows)
    text = plain(await client.say("📦 Мои вещи"))
    assert "Выставлено вещей: 6" in text and "NORD — слежу за 2" in text
    assert "Без таблицы поставщика: 3" in text and "lux — 2" in text
    await client.say("⚙️ Настройки")
    await client.press("30 мин")
    await client.press("Изменилась цена")
    assert engine.opts()["interval"] == 30 and engine.opts()["price"] is False
    await client.say("📊 Таблицы")
    await client.press("NORD")
    assert "Пометка в названиях: nord" in plain([client.session.sent[-1]])
    assert "размеры в одной ячейке" in plain(await client.press("Как я понял"))
    await client.press("Удалить")
    await client.press("Да, удалить")
    assert db.sources("supplier") == [] and db.links() == []
    assert "/start" not in plain(await client.say("❓ Помощь"))


async def test_fix_link_and_strangers(app, mine_rows, nord_rows):
    client, db, engine = app
    await setup(client, mine_rows, nord_rows)
    stranger = User(id=999, is_bot=False, first_name="X")
    assert "личный бот" in plain(await client.say("s m l", user=stranger))
    await client.say("📦 Мои вещи")
    await client.press("Исправить")
    await client.say("boss")
    await client.press("Hugo Boss")
    await client.press("Выбрать другую")
    card = plain([client.session.sent[-1]])
    number = re.search(r"(\d)\. ПУХОВИК BOSS ЧЕРНЫЙ", card).group(1)
    await client.press(number)
    link = next(l for l in db.links() if "Boss" in l.my_name)
    assert link.sup_name == "ПУХОВИК BOSS ЧЕРНЫЙ" and link.status == "manual"


async def test_not_a_table(app):
    client, db, engine = app
    await client.say("/start")
    recs = await client.upload("фото.xlsx", b"\x89PNG not a table at all")
    assert "⚠️" in client.session.sent[-1]["text"] or "Не нашёл" in plain(recs)


async def test_edit_tag_and_columns(app, mine_rows, nord_rows):
    client, db, engine = app
    await setup(client, mine_rows, nord_rows)
    await client.say("📊 Таблицы")
    await client.press("NORD")
    await client.press("Изменить пометку")
    await client.say("nord, lux")                      # теперь и «LUX» считаем этим поставщиком
    assert db.sources("supplier")[0].tags == ["nord", "lux"]
    assert {l.my_name for l in db.links()} >= {"Худи Vetements LUX", "Худи Stone Island LUX"}

    await client.say("📊 Таблицы")
    await client.press("NORD")
    await client.press("Настроить столбцы")
    assert "Не знаю настройку" in plain(await client.say("чтото=B"))
    recs = await client.say("название=A размер=C цена=D заголовок=3")
    assert db.sources("supplier")[0].config == {"name": "A", "size": "C", "price": "D", "header": 3}
    assert "Товаров: 7" in plain(recs)
    await client.say("📊 Таблицы")
    await client.press("NORD")
    await client.press("Настроить столбцы")
    await client.say("авто")
    assert db.sources("supplier")[0].config == {}


def test_long_messages_are_split():
    from stockbot.bot import chunks
    text = "\n".join(f"• вещь номер {i} — S, M, L" for i in range(600))
    parts = chunks(text)
    assert len(parts) > 1 and all(len(p) <= 3800 for p in parts)
    assert "\n".join(parts) == text
