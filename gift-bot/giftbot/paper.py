"""Бумажная торговля: бот «покупает» и «продаёт» понарошку, деньги не тратятся.

Правила продажи нарочно строгие, чтобы тест не врал в плюс:
лот считается проданным, только если он был самым дешёвым в сегменте,
а Telegram подтверждает продажу соседнего лота, который стоил не меньше.
"""
from __future__ import annotations

import math
from typing import Awaitable, Callable

from . import report
from .analysis import Evaluation
from .config import Config
from .models import Event, Listing
from .store import Position, Store

DAY = 24 * 3600
SALE_SLACK = 300  # секунд: запас на расхождение часов

LastSale = Callable[[str], Awaitable[int | None]]


def snapshot(listings: list[Listing], exclude: str) -> dict[str, float]:
    return {l.slug: l.price_ton for l in listings if l.slug != exclude and l.price_ton is not None}


def open_position(store: Store, ev: Evaluation, now: int) -> Position:
    l = ev.listing
    seg = ev.segment
    pos = Position(
        slug=l.slug, gift_id=l.gift_id, title=l.title, seg_name=seg.name, seg_model_id=seg.model_id,
        seg_backdrop_id=seg.backdrop_id, buy_price=l.price_ton, ask=round(ev.expected_sale, 2),
        opened_at=now, last_reprice_at=now, last_check_at=now, snapshot=snapshot(seg.listings, l.slug),
    )
    return store.add_position(pos)


def breakeven_ask(pos: Position, cfg: Config) -> float:
    return math.ceil(pos.buy_price / cfg.seller_share_ton * 100) / 100


def close_position(pos: Position, price: float, now: int, reason: str, cfg: Config) -> None:
    pos.status = "closed"
    pos.close_price = round(price, 2)
    pos.closed_at = now
    pos.close_reason = reason
    pos.pnl = round(pos.close_price * cfg.seller_share_ton - pos.buy_price, 4)


async def manage_position(pos: Position, listings: list[Listing], last_sale_ts: LastSale,
                          cfg: Config, now: int) -> list[Event]:
    current = snapshot(listings, pos.slug)
    previous = pos.snapshot
    floor = min(current.values(), default=None)

    # 1. Продажа: мы были самыми дешёвыми, а более дорогой соседний лот реально купили.
    cheapest_before = min(previous.values(), default=None)
    if cheapest_before is not None and pos.ask <= cheapest_before + 1e-9:
        gone = sorted((price, slug) for slug, price in previous.items()
                      if slug not in current and price >= pos.ask - 1e-9)
        for price, slug in gone:
            sold_at = await last_sale_ts(slug)
            if sold_at is not None and sold_at >= pos.last_check_at - SALE_SLACK:
                close_position(pos, pos.ask, now, f"купили соседний лот за {price:.2f} TON, а наш стоил меньше", cfg)
                return [Event("close", report.closed(pos))]

    # 2. Слишком долго не продаётся: продаём чуть дешевле рынка, даже в минус.
    if now - pos.opened_at >= cfg.max_hold_days * DAY:
        price = floor * (1 - cfg.undercut) if floor is not None else pos.ask
        close_position(pos, price, now, f"не продался за {cfg.max_hold_days:g} дн., продали по рынку", cfg)
        return [Event("close", report.closed(pos))]

    events = []
    # 3. Раз в сутки снижаем цену лесенкой, но не ниже безубытка.
    if now - pos.last_reprice_at >= DAY:
        new_ask = pos.ask * (1 - cfg.daily_price_step)
        if floor is not None:
            new_ask = min(new_ask, floor * (1 - cfg.undercut))
        be = breakeven_ask(pos, cfg)
        new_ask = max(round(new_ask, 2), be)
        if new_ask < pos.ask - 0.005:
            old = pos.ask
            pos.ask = new_ask
            events.append(Event("reprice", report.repriced(pos, old, be)))
        pos.last_reprice_at = now

    pos.snapshot = current
    pos.last_check_at = now
    return events
