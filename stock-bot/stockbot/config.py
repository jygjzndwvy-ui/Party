"""Настройки запуска: читаются из файла .env рядом с ботом или из переменных окружения."""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import NoReturn

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"


@dataclass
class Config:
    token: str
    owner_id: int | None
    data_dir: Path
    proxy: str | None
    tz: str


def _read_env_file() -> dict[str, str]:
    values: dict[str, str] = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8-sig").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def _ask_token() -> str:
    """Первый запуск: спрашиваем токен прямо в окне и сохраняем в .env."""
    if not sys.stdin or not sys.stdin.isatty():
        return ""
    print("\nНужен токен бота. Его выдаёт @BotFather в Telegram: команда /newbot, затем скопируйте строку вида")
    print("123456789:AAH...  и вставьте сюда.\n")
    try:
        token = input("Токен бота: ").strip()
    except (EOFError, KeyboardInterrupt):
        return ""
    if token:
        with ENV_FILE.open("a", encoding="utf-8") as fh:
            fh.write(f"BOT_TOKEN={token}\n")
        print("Токен сохранён в файле .env — больше спрашивать не буду.\n")
    return token


def fail(message: str) -> NoReturn:
    """Ошибка настройки: перезапуск не поможет, файл запуска увидит код 2 и остановится."""
    print("\n" + message)
    raise SystemExit(2)


def forget_token() -> None:
    """Убираем неподошедший токен из .env, чтобы при следующем запуске спросить заново."""
    if ENV_FILE.exists():
        lines = [ln for ln in ENV_FILE.read_text(encoding="utf-8-sig").splitlines()
                 if not ln.strip().startswith("BOT_TOKEN")]
        ENV_FILE.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def load() -> Config:
    env = {**_read_env_file(), **os.environ}
    token = env.get("BOT_TOKEN", "").strip() or _ask_token()
    if not token:
        fail("Не задан токен бота. Запустите ещё раз и вставьте токен от @BotFather "
             "(или впишите его в файл .env, пример — в .env.example).")
    owner = env.get("OWNER_ID", "").strip()
    data_dir = Path(env.get("DATA_DIR", "").strip() or ROOT / "data")
    return Config(
        token=token,
        owner_id=int(owner) if owner.lstrip("-").isdigit() else None,
        data_dir=data_dir,
        proxy=env.get("TELEGRAM_PROXY", "").strip() or None,
        tz=env.get("TZ_NAME", "").strip() or "Europe/Moscow",
    )
