"""Вход в Telegram на поддельном клиенте: проверяем подсказки, повтор кода и пароль."""
import unittest

try:
    from telethon import errors, functions
    from telethon.tl.types import auth as A
    from giftbot.login import QR_GIVE_UP_SEC, LoginBlocked, describe, normalize_phone, qr_sign_in, sign_in
except ImportError:  # Telethon не установлен
    A = None


def sent_code(kind, next_type=None, timeout=None):
    return A.SentCode(type=kind, phone_code_hash="hash1", next_type=next_type, timeout=timeout)


class FakeClient:
    api_id, api_hash = 1, "0" * 32

    def __init__(self, first, resend=None, sign_in_results=()):
        self.first, self.resend = first, resend
        self.sign_in_results = list(sign_in_results)
        self.requests, self.sign_ins = [], []

    async def connect(self):
        pass

    async def is_user_authorized(self):
        return False

    async def __call__(self, request):
        self.requests.append(type(request).__name__)
        if isinstance(request, functions.auth.SendCodeRequest):
            return self.first
        return self.resend

    async def sign_in(self, **kwargs):
        self.sign_ins.append(kwargs)
        result = self.sign_in_results.pop(0)
        if isinstance(result, Exception):
            raise result
        return result


def scripted(*answers):
    replies = iter(answers)

    async def ask(prompt):
        return next(replies)
    return ask


@unittest.skipIf(A is None, "нужен Telethon: pip install -r requirements.txt")
class LoginTest(unittest.IsolatedAsyncioTestCase):
    async def test_code_in_app_then_resend_by_sms(self):
        client = FakeClient(sent_code(A.SentCodeTypeApp(length=5), A.CodeTypeSms(), 60),
                            resend=sent_code(A.SentCodeTypeSms(length=5)), sign_in_results=["user"])
        said = []
        user = await sign_in(client, "+70000000042", ask=scripted("", "12345"), say=said.append)
        self.assertEqual(user, "user")
        self.assertEqual(client.requests, ["SendCodeRequest", "ResendCodeRequest"])
        self.assertIn("чат «Telegram»", said[0])
        self.assertIn("по SMS", said[0])
        self.assertEqual(client.sign_ins[0]["code"], "12345")

    async def test_wrong_code_then_two_step_password(self):
        client = FakeClient(sent_code(A.SentCodeTypeApp(length=5)), sign_in_results=[
            errors.PhoneCodeInvalidError(request=None),
            errors.SessionPasswordNeededError(request=None),
            "user",
        ])
        said = []

        async def password(prompt):
            return "secret"
        user = await sign_in(client, "+70000000042", ask=scripted("11111", "22222"), ask_password=password,
                             say=said.append)
        self.assertEqual(user, "user")
        self.assertTrue(any("не подошёл" in s for s in said))
        self.assertEqual(client.sign_ins[-1], {"password": "secret"})

    async def test_email_code_is_explained(self):
        text = describe(sent_code(A.SentCodeTypeEmailCode(email_pattern="a***@mail.ru", length=6)))
        self.assertIn("a***@mail.ru", text)

    async def test_email_setup_required_is_blocking(self):
        client = FakeClient(sent_code(A.SentCodeTypeSetUpEmailRequired()))
        with self.assertRaises(LoginBlocked):
            await sign_in(client, "+70000000042", ask=scripted(), say=lambda s: None)

    async def test_paid_sms_is_blocking(self):
        paid = A.SentCodePaymentRequired(store_product="p", phone_code_hash="h", support_email_address="s",
                                         support_email_subject="s", premium_days=7, currency="USD", amount=100)
        with self.assertRaises(LoginBlocked):
            await sign_in(FakeClient(paid), "+70000000042", ask=scripted(), say=lambda s: None)

    def test_normalize_phone(self):
        self.assertEqual(normalize_phone("8 988 000-00-42"), "+79880000042")
        self.assertEqual(normalize_phone("+7 (988) 000 00 42"), "+79880000042")


class FakeQR:
    def __init__(self, outcomes):
        self.outcomes = list(outcomes)
        self.url = "tg://login?token=first"
        self.recreated = 0

    async def wait(self):
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, BaseException):
            raise outcome
        return outcome

    async def recreate(self):
        self.recreated += 1
        self.url = f"tg://login?token=new{self.recreated}"


class FakeQRClient(FakeClient):
    def __init__(self, qr, sign_in_results=()):
        super().__init__(None, sign_in_results=sign_in_results)
        self.qr = qr

    async def qr_login(self):
        return self.qr


@unittest.skipIf(A is None, "нужен Telethon: pip install -r requirements.txt")
class QRLoginTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        import tempfile
        from pathlib import Path
        self.page = Path(tempfile.mkdtemp()) / "data" / "login-qr.html"
        self.opened = []

    async def test_expired_code_is_replaced_then_scanned(self):
        import asyncio
        qr = FakeQR([asyncio.TimeoutError(), "user"])
        pages = []

        async def wait_and_capture():
            pages.append(self.page.read_text(encoding="utf-8"))
            return await FakeQR.wait(qr)
        qr.wait = wait_and_capture
        user = await qr_sign_in(FakeQRClient(qr), self.page, open_page=self.opened.append, say=lambda s: None)
        self.assertEqual(user, "user")
        self.assertEqual(qr.recreated, 1)
        self.assertEqual(self.opened, [self.page])  # страницу открываем один раз, дальше она обновляется сама
        self.assertIn("<svg", pages[0])
        self.assertIn('http-equiv="refresh"', pages[0])
        self.assertNotEqual(pages[0], pages[1])     # после истечения на странице новый код
        self.assertIn("можно закрыть", self.page.read_text(encoding="utf-8"))

    async def test_two_step_password_after_scan(self):
        qr = FakeQR([errors.SessionPasswordNeededError(request=None)])
        client = FakeQRClient(qr, sign_in_results=[errors.PasswordHashInvalidError(request=None), "user"])

        async def password(prompt):
            return "secret"
        user = await qr_sign_in(client, self.page, open_page=self.opened.append, ask_password=password,
                                say=lambda s: None)
        self.assertEqual(user, "user")
        self.assertEqual(client.sign_ins, [{"password": "secret"}, {"password": "secret"}])

    async def test_gives_up_after_ten_minutes(self):
        import asyncio
        ticks = iter([0, QR_GIVE_UP_SEC + 1])
        qr = FakeQR([asyncio.TimeoutError()])
        with self.assertRaises(LoginBlocked):
            await qr_sign_in(FakeQRClient(qr), self.page, open_page=self.opened.append, say=lambda s: None,
                             clock=lambda: next(ticks))
        self.assertIn("можно закрыть", self.page.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
