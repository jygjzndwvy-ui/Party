"""Ввод api_id и api_hash с подсказками: ошибиться полем не страшно, бот переспросит."""
from __future__ import annotations

import re
from typing import Callable

HASH_RE = re.compile(r"[0-9a-fA-F]{32}")

INTRO = (
    "1) Откройте https://my.telegram.org и войдите по номеру телефона.\n"
    "2) Откройте «API development tools» и создайте приложение (название любое).\n"
    "3) Скопируйте сюда два значения со страницы приложения. Никому их не отправляйте.\n"
)


def ask_credentials(ask: Callable[[str], str] = input,
                    say: Callable[[str], None] = print) -> tuple[int, str]:
    say(INTRO)
    while True:
        api_id = ask("api_id (только цифры, строка «App api_id»): ").strip()
        if api_id.isdigit():
            break
        if HASH_RE.fullmatch(api_id):
            say("Это api_hash, его спросим следующим. Сначала нужен api_id: число из строки «App api_id».")
        else:
            say("api_id состоит только из цифр, например 12345678. Попробуйте ещё раз.")
    while True:
        api_hash = ask("api_hash (32 знака, строка «App api_hash»): ").strip()
        if HASH_RE.fullmatch(api_hash):
            return int(api_id), api_hash
        say("api_hash — это 32 знака: цифры и латинские буквы a–f. Скопируйте его целиком и попробуйте ещё раз.")
