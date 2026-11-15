import pytest

from conftest import xlsx
from stockbot.db import DB
from stockbot.engine import Engine, diff


def texts(notices):
    return "\n".join(n.text for n in notices)


@pytest.fixture
async def world(tmp_path, mine_rows, nord_rows):
    db = DB(tmp_path / "bot.sqlite3")
    engine = Engine(db, tmp_path)
    mine = db.add_source("mine", "Мои вещи", "file", file_name="mine.xlsx")
    sup = db.add_source("supplier", "NORD", "file", file_name="nord.xlsx", tags=["nord"])

    def write(source, rows):
        engine.file_path(source.id).write_bytes(xlsx(rows))

    write(mine, mine_rows)
    write(sup, nord_rows)
    yield db, engine, mine, sup, write
    await engine.close()
    db.close()


async def test_first_cycle_links_items(world):
    db, engine, mine, sup, write = world
    notices = await engine.cycle()
    text = texts(notices)
    assert "начал следить за вещами: 2" in text
    assert "Пуховик Zara черный nord → <i>ПУХОВИК ZARA ЧЕРНЫЙ</i>: S, M, L, XL, XXL" in text
    assert "Пуховик Hugo Boss синий nord → <i>ПУХОВИК BOSS СИНИЙ</i>" in text
    assert "Не уверен насчёт вещей: 1" in text and notices[-1].review       # «Пуховик Moncler nord» — два варианта
    statuses = {l.my_name: l.status for l in db.links()}
    assert statuses == {"Пуховик Zara черный nord": "auto", "Пуховик Hugo Boss синий nord": "auto",
                        "Пуховик Moncler nord": "ask"}                      # снятые, свои и чужие не трогаем
    assert await engine.cycle() == []                                        # повторная проверка молчит


async def test_changes_are_reported_once(world, nord_rows):
    db, engine, mine, sup, write = world
    await engine.cycle()
    nord_rows[3][2] = "S L"                 # ZARA ЧЕРНЫЙ: было S M L XL XXL
    nord_rows[5][2] = "-"                   # BOSS СИНИЙ: закончился
    nord_rows[5][3] = "5000р"
    write(sup, nord_rows)
    text = texts(await engine.cycle())
    assert "🔔 <b>NORD</b> — изменения" in text
    assert "➖ Убрали: M, XL, XXL" in text and "Сейчас: S, L" in text
    assert "🚫 Закончилась" in text and "💰 Цена: 4500 → 5000" in text
    assert await engine.cycle() == []

    nord_rows[3][2] = "L"
    nord_rows[5][2] = "M XL"
    write(sup, nord_rows)
    text = texts(await engine.cycle())
    assert "⚠️ Остался только размер L" in text
    assert "✅ Снова в наличии: M, XL" in text


async def test_removed_and_renamed_rows(world, nord_rows):
    db, engine, mine, sup, write = world
    await engine.cycle()
    nord_rows[3][0] = "ПУХОВИК ZARA ЧЁРНЫЙ NEW"       # переименовали — находим заново
    del nord_rows[5]                                    # BOSS СИНИЙ убрали совсем
    write(sup, nord_rows)
    text = texts(await engine.cycle())
    assert "У поставщика теперь называется «ПУХОВИК ZARA ЧЁРНЫЙ NEW»" in text
    assert "<b>Пуховик Hugo Boss синий nord</b>\n❗️ Пропала из таблицы поставщика" in text
    assert await engine.cycle() == []


async def test_delisted_items_are_ignored(world, mine_rows, nord_rows):
    db, engine, mine, sup, write = world
    await engine.cycle()
    mine_rows[2][2] = "продан"                           # Zara черный продан
    write(mine, mine_rows)
    nord_rows[3][2] = "S"
    write(sup, nord_rows)
    assert "Zara" not in texts(await engine.cycle())
    mine_rows[2][2] = "выставлен"                        # снова выставили — старые изменения не вываливаем
    write(mine, mine_rows)
    assert await engine.cycle() == []
    nord_rows[3][2] = "-"
    write(sup, nord_rows)
    assert "Закончилась" in texts(await engine.cycle())


async def test_new_item_in_own_table_is_picked_up(world, mine_rows):
    db, engine, mine, sup, write = world
    await engine.cycle()
    mine_rows.append([10, "Пуховик Zara синий Nord", "выставлен", "2026-11-16", 6000, "Дроп"])
    write(mine, mine_rows)
    text = texts(await engine.cycle())
    assert "Пуховик Zara синий Nord → <i>ПУХОВИК ZARA СИНИЙ</i>: L, XL, XXL" in text


async def test_broken_table_does_not_spam(world, nord_rows):
    db, engine, mine, sup, write = world
    await engine.cycle()
    engine.file_path(sup.id).write_bytes(b"PK\x03\x04 broken")
    assert await engine.cycle() == []
    assert await engine.cycle() == []
    third = texts(await engine.cycle())
    assert "Не могу прочитать таблицу «NORD»" in third and "Пропала" not in third
    assert await engine.cycle() == []
    write(sup, nord_rows)
    assert "снова открывается" in texts(await engine.cycle())


async def test_manual_choice(world):
    db, engine, mine, sup, write = world
    await engine.cycle()
    link = db.links(status="ask")[0]
    names = [i.name for i in engine.candidates(link)]
    assert "ПУХОВИК MONCLER С МЕХОМ" in names and "ПУХОВИК MONCLER MONTBELIARD ЧЕРНЫЙ" in names
    engine.choose(link, engine.candidates(link)[names.index("ПУХОВИК MONCLER С МЕХОМ")])
    assert db.link(link.id).status == "manual"
    assert await engine.cycle() == []
    engine.dismiss(db.link(link.id))
    assert db.link(link.id).status == "none" and await engine.cycle() == []


def test_diff_details():
    opts = {"added": True, "price": True, "low": True, "note": True}
    old = {"present": True, "avail": {"S": 3, "M": 2}, "price": "100", "raw": ""}
    assert diff(old, {"present": True, "avail": {"S": 1, "M": 2}, "price": "100", "raw": ""}, opts) == ["⚠️ S: осталась 1 шт"]
    assert diff(old, {"present": True, "avail": {"S": 3, "M": 2, "L": 1}, "price": "100", "raw": ""}, opts) == ["➕ Появились: L"]
    assert diff(old, {"present": True, "avail": {"S": 3, "M": 2, "L": 1}, "price": "100", "raw": ""}, {**opts, "added": False}) == []
    note_old = {"present": True, "avail": {"S": None}, "price": "", "raw": "S"}
    note_new = {"present": True, "avail": {"S": None}, "price": "", "raw": "S (через 3-5 дней)"}
    assert diff(note_old, note_new, opts) == ["ℹ️ Запись изменилась: «S» → «S (через 3-5 дней)»"]
    assert diff(old, old, opts) == []


def test_only_one_bot_per_data_folder(tmp_path):
    from stockbot.config import lock_instance
    first = lock_instance(tmp_path)
    assert first is not None
    assert lock_instance(tmp_path) is None          # второй запуск в той же папке не проходит
    first.close()
    again = lock_instance(tmp_path)                  # после остановки первого — снова можно
    assert again is not None
    again.close()
