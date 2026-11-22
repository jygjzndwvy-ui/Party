#!/usr/bin/env python3
"""Бот для NFT-подарков Telegram. Этап 1: только наблюдение и бумажная торговля.

Команды:
  python bot.py login     войти в Telegram (один раз)
  python bot.py check     проверить, что всё работает
  python bot.py mygifts   оценить ваши подарки
  python bot.py scan      один проход по рынку
  python bot.py run       работать постоянно (сообщения приходят в «Избранное»)
  python bot.py report    итоги бумажной торговли
"""
import sys

if sys.version_info < (3, 11):
    sys.exit("Нужен Python 3.11 или новее. Скачайте его с https://www.python.org/downloads/")

import argparse
import asyncio
import getpass
import json
import time
from contextlib import asynccontextmanager, suppress
from datetime import datetime

try:
    from telethon import errors, events
except ImportError:
    sys.exit("Не установлена библиотека Telethon. Выполните: pip install -r requirements.txt")

from giftbot import report
from giftbot.config import DATA, PRIVATE, Config, load_config
from giftbot.credentials import ask_credentials
from giftbot.models import RateLimited
from giftbot.scanner import Market, Scanner
from giftbot.store import Store
from giftbot.telegram_api import CREDENTIALS, SESSION_FILE, GiftApi, listing_from_unique, make_client

LOG_FILE = DATA / "bot.log"
PAPER_DB = DATA / "paper.db"


def log(message: str) -> None:
    line = f"{datetime.now():%d.%m %H:%M:%S} {message}"
    print(line, flush=True)
    DATA.mkdir(exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


@asynccontextmanager
async def connected(cfg: Config):
    if not CREDENTIALS.exists():
        sys.exit("Сначала войдите в Telegram: python bot.py login")
    client = make_client()
    await client.connect()
    try:
        if not await client.is_user_authorized():
            sys.exit("Вход в Telegram не выполнен или сброшен. Запустите: python bot.py login")
        yield client, GiftApi(client, cfg.request_pause_sec)
    finally:
        await client.disconnect()


def mask_phone(phone: str) -> str:
    phone = phone.strip()
    if len(phone) <= 4:
        return phone
    return phone[:2] + "*" * (len(phone) - 4) + phone[-2:]


def save_credentials(data: dict) -> None:
    CREDENTIALS.write_text(json.dumps(data), encoding="utf-8")
    CREDENTIALS.chmod(0o600)


async def cmd_login(cfg: Config) -> None:
    PRIVATE.mkdir(exist_ok=True)
    saved = json.loads(CREDENTIALS.read_text(encoding="utf-8")) if CREDENTIALS.exists() else {}
    if saved.get("api_id") and saved.get("api_hash"):
        api_id, api_hash = int(saved["api_id"]), saved["api_hash"]
    else:
        api_id, api_hash = ask_credentials()
    phone = saved.get("phone")  # номер можно заранее записать в telegram.json, тогда бот его не спросит
    if phone:
        print(f"Вход по номеру {mask_phone(phone)}. Telegram пришлёт код в приложение Telegram.")
    client = make_client(api_id, api_hash)
    try:
        await client.start(
            phone=phone or (lambda: input("Телефон в формате +79991234567: ").strip()),
            code_callback=lambda: input("Код из Telegram (пришёл в приложение Telegram): ").strip(),
            password=lambda: getpass.getpass("Пароль двухэтапной проверки (символы не видны при вводе): "),
        )
        me = await client.get_me()
    except Exception as e:
        await client.disconnect()
        SESSION_FILE.unlink(missing_ok=True)  # недоделанный вход не оставляем
        if isinstance(e, errors.ApiIdInvalidError):
            CREDENTIALS.unlink(missing_ok=True)
            sys.exit("Telegram не принял api_id и api_hash. Проверьте их на my.telegram.org и запустите вход ещё раз.")
        if isinstance(e, errors.PhoneNumberInvalidError):
            if phone:
                save_credentials({"api_id": api_id, "api_hash": api_hash})  # неверный номер больше не подставляем
            sys.exit("Telegram не узнал номер. Запустите вход ещё раз и введите номер в формате +79991234567.")
        if isinstance(e, errors.FloodWaitError):
            sys.exit(f"Слишком много попыток входа. Telegram просит подождать {e.seconds // 60 + 1} мин.")
        sys.exit(f"Вход не удался: {e}. Запустите вход ещё раз.")
    save_credentials({"api_id": api_id, "api_hash": api_hash})  # номер телефона после входа не храним
    await client.disconnect()
    print(f"Готово, вход выполнен: {me.first_name}.")
    print("Файлы входа лежат в папке private. Никому их не отправляйте: это ключ к вашему аккаунту.")


async def cmd_check(cfg: Config) -> None:
    async with connected(cfg) as (client, api):
        me = await client.get_me()
        print(f"✔ Вход выполнен: {me.first_name}")
        cols = await api.collections()
        print(f"✔ Коллекций с лотами на перепродаже: {len(cols)}")
        conf = await api.app_config()
        keys = sorted(k for k in conf if any(w in k for w in ("resale", "resell", "commission")))
        if keys:
            print("Настройки Telegram про перепродажу и комиссии:")
            for k in keys:
                print(f"   {k} = {str(conf[k])[:120]}")
        else:
            print("В настройках Telegram не нашлось ключей про комиссии перепродажи.")
        if cols:
            col = max(cols, key=lambda c: c.resale_count)
            print(f"Пример лотов из «{col.title}» (лотов на продаже: {col.resale_count}):")
            for g in await api.raw_resale(col.gift_id, limit=3):
                l = listing_from_unique(g)
                raw = ", ".join(f"{type(a).__name__}({a.amount})" for a in (g.resell_amount or []))
                print(f"   {l.title}: {raw} → {l.price_ton} TON, {l.price_stars} звёзд, только за TON: {l.ton_only}")
        print("Готово. Пришлите этот вывод Claude, если что-то выглядит странно.")


async def cmd_mygifts(cfg: Config) -> None:
    async with connected(cfg) as (client, api):
        gifts = await api.my_gifts()
        if not gifts:
            print("На аккаунте не найдено NFT-подарков (улучшенных).")
            return
        market = Market(api, cfg)
        now = int(time.time())
        for owned in gifts:
            segments = await market.segments_for(owned.listing)
            try:
                value = await api.value_info(owned.listing.slug)
            except Exception as e:
                value = None
                log(f"Оценка Telegram для {owned.listing.title} недоступна: {e!r}")
            print(report.my_gift(owned, segments, value, cfg, now))
            print()


async def cmd_scan(cfg: Config) -> None:
    async with connected(cfg) as (client, api):
        store = Store(PAPER_DB)
        scanner = Scanner(api, store, cfg, log=log)
        log("Проход по рынку начат, это займёт несколько минут...")
        for ev in await scanner.cycle():
            print(ev.text)
            print()
        print(report.summary(store, cfg, int(time.time())))


async def cmd_report(cfg: Config) -> None:
    store = Store(PAPER_DB)
    print(report.summary(store, cfg, int(time.time())))


async def cmd_run(cfg: Config) -> None:
    async with connected(cfg) as (client, api):
        store = Store(PAPER_DB)
        scanner = Scanner(api, store, cfg, log=log)
        stop = asyncio.Event()

        async def notify(text: str) -> None:
            try:
                for i in range(0, len(text), 4000):
                    await client.send_message("me", text[i:i + 4000], link_preview=False)
            except Exception as e:
                log(f"Не удалось отправить сообщение в «Избранное»: {e!r}")

        async def notify_error(text: str) -> None:
            now = time.time()
            if now - (store.get_float("last_error_notice") or 0) > 3600:  # не чаще раза в час
                store.set("last_error_notice", now)
                await notify("⚠️ " + text)

        async def on_command(event) -> None:
            command = event.pattern_match.group(1).lower()
            if command == "status":
                await notify(report.summary(store, cfg, int(time.time())))
            else:
                stop.set()
                await notify("⏹ Останавливаюсь по команде /stop.")

        client.add_event_handler(
            on_command, events.NewMessage(chats="me", outgoing=True, pattern=r"(?i)^/(stop|status)\b")
        )
        await notify(
            "▶️ Бот запущен. Режим: наблюдение и бумажная торговля, реальных покупок нет.\n"
            f"Проход по рынку раз в {cfg.interval_minutes:g} мин.\n"
            "Команды пишите сюда, в «Избранное»: /status — сводка, /stop — остановить."
        )
        log("Бот запущен. Остановить: Ctrl+C или /stop в «Избранном».")

        while not stop.is_set():
            cycle = asyncio.create_task(scanner.cycle())
            stopper = asyncio.create_task(stop.wait())
            await asyncio.wait({cycle, stopper}, return_when=asyncio.FIRST_COMPLETED)
            stopper.cancel()
            if not cycle.done():
                cycle.cancel()
                with suppress(asyncio.CancelledError):
                    await cycle
                break

            pause = cfg.interval_minutes * 60
            found = []
            try:
                found = cycle.result()
            except RateLimited as e:
                pause = max(pause, e.seconds + 60)
                log(f"{e}. Следующий проход через {pause / 60:.0f} мин.")
                await notify_error(f"{e}. Бот подождёт и продолжит сам.")
            except Exception as e:
                log(f"Ошибка прохода: {e!r}")
                await notify_error(f"Ошибка прохода: {e!r}. Бот продолжит работу.")

            for ev in found:
                log(ev.text.splitlines()[0])
                await notify(ev.text)
            s = scanner.stats
            log(f"Проход завершён: коллекций {s.collections}, лотов {s.listings}, кандидатов {s.candidates}, "
                f"сигналов {s.signals}, ошибок {s.errors}.")

            today = datetime.now()
            if today.hour >= cfg.daily_summary_hour and store.get("last_summary") != f"{today:%Y-%m-%d}":
                store.set("last_summary", f"{today:%Y-%m-%d}")
                await notify(report.summary(store, cfg, int(time.time())))

            with suppress(asyncio.TimeoutError):
                await asyncio.wait_for(stop.wait(), timeout=pause)
        log("Бот остановлен.")


COMMANDS = {
    "login": (cmd_login, "войти в Telegram (один раз)"),
    "check": (cmd_check, "проверить, что всё работает"),
    "mygifts": (cmd_mygifts, "оценить ваши подарки"),
    "scan": (cmd_scan, "один проход по рынку"),
    "run": (cmd_run, "работать постоянно, сообщения приходят в «Избранное»"),
    "report": (cmd_report, "итоги бумажной торговли"),
}


def main() -> None:
    with suppress(Exception):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Бот для NFT-подарков Telegram (этап 1: наблюдение и бумажная торговля)")
    sub = parser.add_subparsers(dest="command", required=True, metavar="команда")
    for name, (_, help_text) in COMMANDS.items():
        sub.add_parser(name, help=help_text)
    args = parser.parse_args()
    try:
        cfg = load_config()
    except ValueError as e:
        sys.exit(str(e))
    try:
        asyncio.run(COMMANDS[args.command][0](cfg))
    except KeyboardInterrupt:
        print("\nОстановлено.")


if __name__ == "__main__":
    main()
