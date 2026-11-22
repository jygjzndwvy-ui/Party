"""Правила оценки лота из статьи. Здесь нет обращений к Telegram, только расчёты."""
from __future__ import annotations

from dataclasses import dataclass, field

from .config import Config
from .models import Listing, Segment


def breakeven(price: float, seller_share: float) -> float:
    """Цена продажи, при которой после комиссии вернутся потраченные деньги."""
    return price / seller_share


def number_tags(num: int) -> list[str]:
    """Чем номер может быть ценен: короткий, 7777, 3636, 1221, 1000, 1234."""
    s = str(num)
    tags = []
    if len(s) <= 3:
        tags.append("короткий номер")
    if len(s) >= 3 and len(set(s)) == 1:
        tags.append("одинаковые цифры")
    half = len(s) // 2
    if len(s) >= 4 and len(s) % 2 == 0 and s[:half] == s[half:] and len(set(s)) > 1:
        tags.append("повтор")
    if len(s) >= 3 and s == s[::-1] and len(set(s)) > 1:
        tags.append("зеркальный")
    if len(s) >= 3 and set(s[1:]) == {"0"}:
        tags.append("круглый")
    if len(s) >= 3:
        steps = {int(b) - int(a) for a, b in zip(s, s[1:])}
        if steps in ({1}, {-1}):
            tags.append("лесенка")
    return tags


def is_premium(listing: Listing, cfg: Config) -> bool:
    """Фон, за который стабильно доплачивают (по статье: Black и Onyx Black)."""
    return listing.backdrop is not None and listing.backdrop.name in cfg.premium_backdrops


def segment_ref(listing: Listing, listings: list[Listing], min_others: int) -> tuple[float, int] | None:
    """Самая низкая цена среди ДРУГИХ похожих лотов и их количество."""
    others = sorted(l.price_ton for l in listings if l.slug != listing.slug and l.price_ton is not None)
    if len(others) < min_others:
        return None
    return others[0], len(others)


@dataclass
class Evaluation:
    listing: Listing
    passes: bool = False
    reason: str = ""
    segment: Segment | None = None
    ref_price: float | None = None
    others: int = 0
    expected_sale: float | None = None
    breakeven: float | None = None
    required_sale: float | None = None
    expected_profit: float | None = None
    tags: list[str] = field(default_factory=list)

    @property
    def discount(self) -> float | None:
        if self.ref_price and self.listing.price_ton is not None:
            return 1 - self.listing.price_ton / self.ref_price
        return None


def evaluate(listing: Listing, segments: list[Segment], cfg: Config) -> Evaluation:
    """Стоит ли покупать лот, чтобы перепродать.

    Ориентир: самый дешёвый другой лот в сегменте. Если сегментов несколько
    (модель, фон Black, модель + фон), берём самый высокий из ориентиров, как в статье.
    Покупаем, только если продажа чуть дешевле ориентира даёт безубыток + min_margin.
    """
    ev = Evaluation(listing, tags=number_tags(listing.num))
    if is_premium(listing, cfg):
        ev.tags.append(f"фон {listing.backdrop.name}")
    price = listing.price_ton
    if price is None or price <= 0:
        ev.reason = "нет цены в TON"
        return ev
    ev.breakeven = breakeven(price, cfg.seller_share_ton)
    ev.required_sale = ev.breakeven * (1 + cfg.min_margin)

    best: tuple[float, int, Segment] | None = None
    for segment in segments:
        ref = segment_ref(listing, segment.listings, cfg.min_other_listings)
        if ref and (best is None or ref[0] > best[0]):
            best = (ref[0], ref[1], segment)
    if best is None:
        ev.reason = "мало похожих лотов для сравнения"
        return ev

    ev.ref_price, ev.others, ev.segment = best
    ev.expected_sale = ev.ref_price * (1 - cfg.undercut)
    ev.expected_profit = ev.expected_sale * cfg.seller_share_ton - price
    margin = ev.expected_sale / ev.breakeven - 1
    if price > cfg.max_buy_ton:
        ev.reason = f"дороже лимита {cfg.max_buy_ton:g} TON"
    elif ev.expected_sale < ev.required_sale:
        ev.reason = f"запас над безубытком {margin:.0%}, нужно не меньше {cfg.min_margin:.0%}"
    else:
        ev.passes = True
        ev.reason = f"запас над безубытком {margin:.0%}"
    return ev
