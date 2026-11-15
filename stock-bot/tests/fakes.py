"""Поддельный Telegram для тестов: запоминает, что бот отправил, и умеет «нажимать кнопки»."""
from __future__ import annotations

import datetime as dt
import itertools

from aiogram import Bot
from aiogram.client.session.base import BaseSession
from aiogram.methods import TelegramMethod
from aiogram.types import CallbackQuery, Chat, Document, File, Message, Update, User

USER = User(id=111, is_bot=False, first_name="Owner")
CHAT = Chat(id=111, type="private")


class FakeSession(BaseSession):
    def __init__(self):
        super().__init__()
        self.sent: list[dict] = []          # {"id", "text", "markup"}
        self.files: dict[str, bytes] = {}
        self._ids = itertools.count(1000)

    async def close(self):
        pass

    async def stream_content(self, url, headers=None, timeout=30, chunk_size=65536, raise_for_status=True):
        yield self.files[url.rsplit("/", 1)[-1]]

    async def make_request(self, bot: Bot, method: TelegramMethod, timeout=None):
        name = type(method).__name__
        now = dt.datetime.now(dt.timezone.utc)
        if name == "SendMessage":
            mid = next(self._ids)
            self.sent.append({"id": mid, "text": method.text, "markup": method.reply_markup})
            return Message(message_id=mid, date=now, chat=CHAT, text=method.text).as_(bot)
        if name in ("EditMessageText", "EditMessageReplyMarkup"):
            for rec in self.sent:
                if rec["id"] == method.message_id:
                    if name == "EditMessageText":
                        rec["text"] = method.text
                    rec["markup"] = method.reply_markup
            return True
        if name == "GetFile":
            return File(file_id=method.file_id, file_unique_id=method.file_id, file_path=method.file_id)
        if name == "GetMe":
            return User(id=1, is_bot=True, first_name="bot", username="test_bot")
        return True


class Client:
    """Пользователь: пишет боту и нажимает кнопки."""

    def __init__(self, dp, bot: Bot, session: FakeSession):
        self.dp, self.bot, self.session = dp, bot, session
        self._ids = itertools.count(1)

    async def _feed(self, **kw):
        mark = len(self.session.sent)
        await self.dp.feed_update(self.bot, Update(update_id=next(self._ids), **kw))
        return self.session.sent[mark:]

    async def say(self, text: str, user: User = USER):
        msg = Message(message_id=next(self._ids), date=dt.datetime.now(dt.timezone.utc), chat=CHAT,
                      from_user=user, text=text)
        return await self._feed(message=msg)

    async def upload(self, name: str, data: bytes):
        fid = f"file{next(self._ids)}"
        self.session.files[fid] = data
        doc = Document(file_id=fid, file_unique_id=fid, file_name=name, file_size=len(data))
        msg = Message(message_id=next(self._ids), date=dt.datetime.now(dt.timezone.utc), chat=CHAT,
                      from_user=USER, document=doc)
        return await self._feed(message=msg)

    def buttons(self, rec: dict | None = None) -> list[tuple[str, str]]:
        """Кнопки под сообщением (по умолчанию — под последним, у которого они есть)."""
        recs = [rec] if rec else reversed(self.session.sent)
        for r in recs:
            markup = r.get("markup")
            if markup is not None and getattr(markup, "inline_keyboard", None):
                return [(b.text, b.callback_data) for row in markup.inline_keyboard for b in row]
        return []

    async def press(self, part: str, rec: dict | None = None):
        """Нажать кнопку, в подписи которой есть part."""
        recs = [rec] if rec else list(reversed(self.session.sent))
        for r in recs:
            markup = r.get("markup")
            if markup is None or not getattr(markup, "inline_keyboard", None):
                continue
            for row in markup.inline_keyboard:
                for b in row:
                    if part in b.text:
                        msg = Message(message_id=r["id"], date=dt.datetime.now(dt.timezone.utc), chat=CHAT,
                                      from_user=User(id=1, is_bot=True, first_name="bot"), text=r["text"])
                        cq = CallbackQuery(id=str(next(self._ids)), from_user=USER, chat_instance="x",
                                           data=b.callback_data, message=msg)
                        return await self._feed(callback_query=cq)
            if rec is None:
                break
        raise AssertionError(f"нет кнопки «{part}»; есть: {self.buttons(rec)}")


def make(tmp_path):
    from aiogram.client.default import DefaultBotProperties

    from stockbot import bot as bot_module
    from stockbot.bot import build
    from stockbot.db import DB
    from stockbot.engine import Engine

    bot_module.router._parent_router = None     # в тестах бот собирается заново для каждого теста
    db = DB(tmp_path / "bot.sqlite3")
    engine = Engine(db, tmp_path)
    session = FakeSession()
    bot = Bot("42:TEST", session=session, default=DefaultBotProperties(parse_mode="HTML"))
    dp = build(db, engine, None, "Europe/Moscow")
    return Client(dp, bot, session), db, engine
