"""Обращения к Telegram через официальный API (библиотека Telethon).

Здесь только ЧТЕНИЕ: список коллекций, лоты на перепродаже, оценка подарка,
ваши подарки. Функций покупки, продажи, выставления цены и передачи подарков нет.
"""
from __future__ import annotations

import asyncio
import json
import time
from datetime import datetime

from telethon import TelegramClient, errors, functions, types

from .config import PRIVATE
from .models import Collection, Listing, OwnedGift, RateLimited, Trait, ValueInfo

NANOTON = 1_000_000_000
CURRENCY_EXP = {"TON": 9, "XTR": 0, "JPY": 0, "KRW": 0, "VND": 0}  # остальные валюты: 2 знака
CREDENTIALS = PRIVATE / "telegram.json"
SESSION = PRIVATE / "gift"
MAX_FLOOD_WAIT = 3600


def make_client() -> TelegramClient:
    data = json.loads(CREDENTIALS.read_text(encoding="utf-8"))
    return TelegramClient(str(SESSION), int(data["api_id"]), data["api_hash"], flood_sleep_threshold=60)


def _ts(value) -> int | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return int(value.timestamp())
    return int(value)


def _rarity(r) -> tuple[int | None, str | None]:
    if isinstance(r, types.StarGiftAttributeRarity):
        return r.permille, None
    if r is None:
        return None, None
    tier = type(r).__name__.removeprefix("StarGiftAttributeRarity").lower()
    return None, tier or None


def _trait(attr, attr_id: int | None) -> Trait:
    permille, tier = _rarity(getattr(attr, "rarity", None))
    return Trait(name=attr.name, attr_id=attr_id, permille=permille, tier=tier)


def listing_from_unique(g) -> Listing:
    model = backdrop = pattern = None
    for a in g.attributes or []:
        if isinstance(a, types.StarGiftAttributeModel):
            model = _trait(a, getattr(a.document, "id", None))
        elif isinstance(a, types.StarGiftAttributeBackdrop):
            backdrop = _trait(a, a.backdrop_id)
        elif isinstance(a, types.StarGiftAttributePattern):
            pattern = _trait(a, getattr(a.document, "id", None))
    price_ton = price_stars = None
    for amount in g.resell_amount or []:
        if isinstance(amount, types.StarsTonAmount):
            price_ton = amount.amount / NANOTON
        elif isinstance(amount, types.StarsAmount):
            price_stars = amount.amount
    return Listing(
        slug=g.slug, gift_id=g.gift_id, collection=g.title, num=g.num, model=model, backdrop=backdrop,
        pattern=pattern, price_ton=price_ton, price_stars=price_stars, ton_only=bool(g.resale_ton_only),
    )


def value_from_tl(v) -> ValueInfo:
    k = 10 ** CURRENCY_EXP.get(v.currency, 2)

    def conv(x):
        return None if x is None else x / k

    return ValueInfo(
        currency=v.currency, value=conv(v.value), floor_price=conv(v.floor_price),
        average_price=conv(v.average_price), last_sale_price=conv(v.last_sale_price),
        last_sale_ts=_ts(v.last_sale_date), listed_count=v.listed_count, value_is_average=bool(v.value_is_average),
    )


def json_value(v):
    if isinstance(v, types.JsonObject):
        return {item.key: json_value(item.value) for item in v.value}
    if isinstance(v, types.JsonArray):
        return [json_value(x) for x in v.value]
    if isinstance(v, (types.JsonNumber, types.JsonString, types.JsonBool)):
        return v.value
    return None


def price_order(l: Listing) -> tuple[bool, float]:
    return (l.price_ton is None, l.price_ton or 0.0)


class GiftApi:
    """Запросы к Telegram с паузой между ними, чтобы не получить ограничение."""

    def __init__(self, client: TelegramClient, pause_sec: float):
        self.client = client
        self.pause = pause_sec
        self._last = 0.0
        self._lock = asyncio.Lock()

    async def _call(self, request):
        async with self._lock:
            wait = self._last + self.pause - time.monotonic()
            if wait > 0:
                await asyncio.sleep(wait)
            try:
                for attempt in range(2):
                    try:
                        return await self.client(request)
                    except errors.FloodWaitError as e:
                        if e.seconds > MAX_FLOOD_WAIT or attempt:
                            raise RateLimited(e.seconds) from e
                        await asyncio.sleep(e.seconds + 1)
            finally:
                self._last = time.monotonic()

    async def collections(self) -> list[Collection]:
        res = await self._call(functions.payments.GetStarGiftsRequest(hash=0))
        out = []
        for g in getattr(res, "gifts", []):
            if isinstance(g, types.StarGift) and g.availability_resale:
                out.append(Collection(g.id, g.title or f"Подарок {g.id}", g.availability_resale, g.resell_min_stars))
        return out

    async def raw_resale(self, gift_id: int, limit: int = 50, model_id: int | None = None,
                         backdrop_id: int | None = None) -> list:
        attributes = []
        if model_id is not None:
            attributes.append(types.StarGiftAttributeIdModel(document_id=model_id))
        if backdrop_id is not None:
            attributes.append(types.StarGiftAttributeIdBackdrop(backdrop_id=backdrop_id))
        res = await self._call(functions.payments.GetResaleStarGiftsRequest(
            gift_id=gift_id, offset="", limit=limit, sort_by_price=True, attributes=attributes or None,
        ))
        return [g for g in res.gifts if isinstance(g, types.StarGiftUnique)]

    async def resale(self, gift_id: int, limit: int = 50, model_id: int | None = None,
                     backdrop_id: int | None = None) -> list[Listing]:
        raw = await self.raw_resale(gift_id, limit, model_id, backdrop_id)
        return sorted((listing_from_unique(g) for g in raw), key=price_order)

    async def value_info(self, slug: str) -> ValueInfo:
        res = await self._call(functions.payments.GetUniqueStarGiftValueInfoRequest(slug=slug))
        return value_from_tl(res)

    async def last_sale_ts(self, slug: str) -> int | None:
        try:
            return (await self.value_info(slug)).last_sale_ts
        except errors.RPCError:
            return None

    async def my_gifts(self) -> list[OwnedGift]:
        out, offset = [], ""
        while True:
            res = await self._call(functions.payments.GetSavedStarGiftsRequest(
                peer=types.InputPeerSelf(), offset=offset, limit=100,
            ))
            for saved in res.gifts:
                if isinstance(saved.gift, types.StarGiftUnique):
                    out.append(OwnedGift(listing_from_unique(saved.gift), _ts(saved.can_resell_at),
                                         _ts(saved.can_transfer_at)))
            if not res.next_offset or not res.gifts:
                return out
            offset = res.next_offset

    async def app_config(self) -> dict:
        res = await self._call(functions.help.GetAppConfigRequest(hash=0))
        config = json_value(getattr(res, "config", None))
        return config if isinstance(config, dict) else {}
