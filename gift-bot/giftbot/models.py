"""Простые структуры данных, с которыми работает бот."""
from __future__ import annotations

from dataclasses import dataclass, field


class RateLimited(Exception):
    """Telegram попросил надолго прекратить запросы."""

    def __init__(self, seconds: int):
        super().__init__(f"Telegram попросил подождать {seconds} с")
        self.seconds = seconds


@dataclass(frozen=True)
class Trait:
    """Признак подарка: модель, фон или узор."""

    name: str
    attr_id: int | None = None   # id для фильтра на маркете
    permille: int | None = None  # редкость в промилле: 12 = 1.2%
    tier: str | None = None      # уровень редкости, если Telegram не дал промилле

    def rarity_text(self) -> str:
        if self.permille is not None:
            return f"{self.permille / 10:g}%"
        return self.tier or "редкость неизвестна"


@dataclass(frozen=True)
class Listing:
    """Уникальный подарок. Если он выставлен на продажу, у него есть цена."""

    slug: str
    gift_id: int
    collection: str
    num: int
    model: Trait | None = None
    backdrop: Trait | None = None
    pattern: Trait | None = None
    price_ton: float | None = None
    price_stars: int | None = None
    ton_only: bool = False

    @property
    def link(self) -> str:
        return f"https://t.me/nft/{self.slug}"

    @property
    def title(self) -> str:
        return f"{self.collection} #{self.num}"


@dataclass(frozen=True)
class Collection:
    gift_id: int
    title: str
    resale_count: int
    floor_stars: int | None = None


@dataclass
class Segment:
    """Похожие подарки на продаже: та же модель и/или тот же фон."""

    name: str
    model_id: int | None
    backdrop_id: int | None
    listings: list[Listing] = field(default_factory=list)


@dataclass(frozen=True)
class ValueInfo:
    """Оценка подарка от самого Telegram, в валюте currency (обычно USD)."""

    currency: str
    value: float | None = None
    floor_price: float | None = None
    average_price: float | None = None
    last_sale_price: float | None = None
    last_sale_ts: int | None = None
    listed_count: int | None = None
    value_is_average: bool = False


@dataclass(frozen=True)
class OwnedGift:
    listing: Listing
    can_resell_at: int | None = None
    can_transfer_at: int | None = None


@dataclass(frozen=True)
class Event:
    kind: str  # signal | open | reprice | close
    text: str
