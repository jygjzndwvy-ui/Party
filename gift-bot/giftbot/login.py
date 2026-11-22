"""Вход в Telegram: бот говорит, куда Telegram отправил код, и умеет попросить другой способ."""
from __future__ import annotations

import asyncio
import getpass
import re

from telethon import errors, functions, types
from telethon.tl.types import auth as A


class LoginBlocked(Exception):
    """Войти сейчас нельзя: Telegram требует то, что бот сделать не может."""


async def ainput(prompt: str) -> str:
    """input() в отдельном потоке, чтобы связь с Telegram не рвалась, пока вы набираете код."""
    return (await asyncio.get_running_loop().run_in_executor(None, input, prompt)).strip()


async def agetpass(prompt: str) -> str:
    return await asyncio.get_running_loop().run_in_executor(None, getpass.getpass, prompt)


def normalize_phone(raw: str) -> str:
    """8 988 123-45-67 → +79881234567: российское «8» превращаем в +7."""
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    return "+" + digits


NEXT_WAY = {
    A.CodeTypeSms: "по SMS",
    A.CodeTypeCall: "звонком",
    A.CodeTypeFlashCall: "коротким звонком",
    A.CodeTypeMissedCall: "пропущенным звонком",
    A.CodeTypeFragmentSms: "через Fragment",
}


def describe(sent: A.SentCode) -> str:
    t = sent.type
    if isinstance(t, A.SentCodeTypeApp):
        text = ("Код отправлен НЕ по SMS, а в само приложение Telegram. Откройте Telegram на телефоне "
                "или компьютере: код пришёл в чат «Telegram» с синей галочкой.")
    elif isinstance(t, (A.SentCodeTypeSms, A.SentCodeTypeFirebaseSms)):
        text = "Код отправлен по SMS."
    elif isinstance(t, A.SentCodeTypeCall):
        text = "Вам позвонят и продиктуют код."
    elif isinstance(t, A.SentCodeTypeFlashCall):
        text = "Придёт короткий звонок: код — последние цифры номера, с которого позвонили."
    elif isinstance(t, A.SentCodeTypeMissedCall):
        text = f"Придёт пропущенный звонок: код — последние {t.length} цифр номера, с которого позвонили."
    elif isinstance(t, A.SentCodeTypeEmailCode):
        text = f"Код отправлен на почту для входа: {t.email_pattern}. Проверьте и папку «Спам»."
    elif isinstance(t, A.SentCodeTypeFragmentSms):
        text = f"Код можно получить на Fragment: {t.url}"
    elif isinstance(t, (A.SentCodeTypeSmsWord, A.SentCodeTypeSmsPhrase)):
        text = "Придёт SMS со словом или фразой: введите их вместо кода."
    else:
        text = f"Telegram отправил код способом {type(t).__name__}."
    way = NEXT_WAY.get(type(sent.next_type)) if sent.next_type else None
    if way:
        wait = f" (Telegram разрешает через {sent.timeout} с)" if sent.timeout else ""
        text += f"\nЕсли кода нет, просто нажмите Enter: Telegram пришлёт его {way}{wait}."
    return text


def check_sent(sent) -> A.SentCode:
    if isinstance(sent, A.SentCodePaymentRequired):
        raise LoginBlocked("Telegram требует оплатить SMS с кодом для входа на новом устройстве. "
                           "Бот так войти не может. Попробуйте позже или с другим номером.")
    if not isinstance(sent, A.SentCode):
        raise LoginBlocked(f"Неожиданный ответ Telegram: {type(sent).__name__}.")
    if isinstance(sent.type, A.SentCodeTypeSetUpEmailRequired):
        raise LoginBlocked("Telegram просит сначала привязать почту для входа. В приложении Telegram откройте "
                           "Настройки → Конфиденциальность → Почта для входа, затем запустите вход ещё раз.")
    return sent


async def request_code(client, phone: str) -> A.SentCode:
    for attempt in range(3):
        try:
            return check_sent(await client(functions.auth.SendCodeRequest(
                phone_number=phone, api_id=client.api_id, api_hash=client.api_hash, settings=types.CodeSettings(),
            )))
        except errors.AuthRestartError:
            if attempt == 2:
                raise
    raise AssertionError("unreachable")


async def sign_in(client, phone: str, ask=ainput, ask_password=agetpass, say=print):
    """Возвращает пользователя после входа. Код и пароль вводятся только здесь, в окне программы."""
    await client.connect()
    if await client.is_user_authorized():
        return await client.get_me()
    sent = await request_code(client, phone)
    while True:
        say(describe(sent))
        code = await ask("Код из Telegram (или Enter, чтобы прислать код по-другому): ")
        if not code:
            if not sent.next_type:
                say("Другого способа Telegram не предлагает. Проверьте чат «Telegram» в приложении и почту.")
                continue
            try:
                sent = check_sent(await client(functions.auth.ResendCodeRequest(
                    phone_number=phone, phone_code_hash=sent.phone_code_hash)))
            except errors.SendCodeUnavailableError:
                say("Telegram больше не может прислать код другим способом. Введите код, который уже пришёл.")
            continue
        try:
            return await client.sign_in(phone=phone, code=code, phone_code_hash=sent.phone_code_hash)
        except errors.PhoneCodeInvalidError:
            say("Код не подошёл. Проверьте цифры и введите ещё раз.")
        except errors.PhoneCodeExpiredError:
            say("Код устарел. Прошу у Telegram новый.")
            sent = await request_code(client, phone)
        except errors.SessionPasswordNeededError:
            for _ in range(3):
                password = await ask_password("Пароль двухэтапной проверки (символы не видны при вводе): ")
                try:
                    return await client.sign_in(password=password)
                except errors.PasswordHashInvalidError:
                    say("Пароль не подошёл.")
            raise LoginBlocked("Пароль не подошёл три раза. Запустите вход ещё раз.")
