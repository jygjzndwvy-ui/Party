"""Запуск: python -m stockbot"""
from __future__ import annotations

import asyncio
import logging
import sys

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramNetworkError, TelegramUnauthorizedError
from aiogram.types import BotCommand

from . import config, fetch
from .bot import build, monitor
from .db import DB
from .engine import Engine


async def run() -> None:
    cfg = config.load()
    cfg.data_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=[logging.StreamHandler(), logging.FileHandler(cfg.data_dir / "bot.log", encoding="utf-8")])
    logging.getLogger("aiogram.event").setLevel(logging.WARNING)

    db = DB(cfg.data_dir / "bot.sqlite3")
    engine = Engine(db, cfg.data_dir)
    session = AiohttpSession(proxy=cfg.proxy) if cfg.proxy else AiohttpSession()
    if isinstance(getattr(session, "_connector_init", None), dict):
        session._connector_init["ssl"] = fetch.ssl_context()
    bot = Bot(cfg.token, session=session, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = build(db, engine, cfg.owner_id, cfg.tz)

    try:
        me = await bot.get_me()
    except TelegramUnauthorizedError:
        await bot.session.close()
        config.forget_token()
        config.fail("Telegram не принял токен. Скопируйте его у @BotFather целиком "
                    "(вид: 123456789:AAH...) и запустите бота ещё раз — я спрошу токен заново.")
    except TelegramNetworkError as exc:
        await bot.session.close()
        raise SystemExit("Нет связи с Telegram. Проверьте интернет; если Telegram на этом компьютере "
                         "открывается только через VPN или прокси — включите VPN либо впишите прокси "
                         "в .env (строка TELEGRAM_PROXY).\n"
                         f"Техническая причина: {str(exc)[:200]}") from None
    await bot.set_my_commands([
        BotCommand(command="items", description="Мои вещи"),
        BotCommand(command="check", description="Проверить сейчас"),
        BotCommand(command="search", description="Поиск по базе"),
        BotCommand(command="tables", description="Таблицы"),
        BotCommand(command="settings", description="Настройки"),
        BotCommand(command="help", description="Помощь"),
    ])
    print(f"\nБот @{me.username} запущен. Откройте его в Telegram и нажмите «Старт».")
    print("Это окно должно оставаться открытым. Остановить бота — Ctrl+C.\n")

    task = asyncio.create_task(monitor(bot, engine, db))
    try:
        await dp.start_polling(bot)
    finally:
        task.cancel()
        await engine.close()
        await bot.session.close()
        db.close()


def main() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        print("\nБот остановлен.")


if __name__ == "__main__":
    main()
