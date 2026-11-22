"""Один проход: проверить бумажные сделки и поискать новые на рынке."""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass
from statistics import median

from . import report
from .analysis import Evaluation, evaluate, is_premium
from .config import Config
from .models import Collection, Event, Listing, RateLimited, Segment
from .paper import DAY, manage_position, open_position
from .rules import buy_blocker, check_stop_loss
from .store import Store

PAGE_LIMIT = 50                 # сколько самых дешёвых лотов брать из коллекции
SEGMENT_LIMIT = 50              # сколько лотов брать из сегмента
CATALOG_TTL = 6 * 3600          # список коллекций обновляем раз в 6 часов
REOPEN_AFTER = 7 * DAY          # один и тот же лот не «покупаем» повторно неделю
MAX_SIGNALS_PER_CYCLE = 5       # больше сигналов за проход не присылаем


class Market:
    """Загружает сегменты (похожие подарки на продаже) и запоминает их на один проход."""

    def __init__(self, api, cfg: Config):
        self.api = api
        self.cfg = cfg
        self._cache: dict[tuple, list[Listing]] = {}

    def reset(self) -> None:
        self._cache = {}

    async def segment(self, gift_id: int, name: str, model_id: int | None = None,
                      backdrop_id: int | None = None) -> Segment:
        key = (gift_id, model_id, backdrop_id)
        if key not in self._cache:
            self._cache[key] = await self.api.resale(gift_id, limit=SEGMENT_LIMIT, model_id=model_id,
                                                     backdrop_id=backdrop_id)
        return Segment(name, model_id, backdrop_id, self._cache[key])

    async def segments_for(self, l: Listing) -> list[Segment]:
        model = l.model if l.model and l.model.attr_id is not None else None
        backdrop = l.backdrop if is_premium(l, self.cfg) and l.backdrop.attr_id is not None else None
        segments = []
        if model:
            segments.append(await self.segment(l.gift_id, f"модель {model.name}", model_id=model.attr_id))
        if backdrop:
            segments.append(await self.segment(l.gift_id, f"фон {backdrop.name}", backdrop_id=backdrop.attr_id))
            if model:
                segments.append(await self.segment(l.gift_id, f"модель {model.name} + фон {backdrop.name}",
                                                   model.attr_id, backdrop.attr_id))
        return segments


@dataclass
class ScanStats:
    started: float = 0.0
    finished: float = 0.0
    collections: int = 0
    skipped_by_floor: int = 0
    listings: int = 0
    no_ton_price: int = 0
    candidates: int = 0
    signals: int = 0
    blocked_by_rules: int = 0
    errors: int = 0


class Scanner:
    def __init__(self, api, store: Store, cfg: Config, clock=time.time, log=print):
        self.api = api
        self.store = store
        self.cfg = cfg
        self.clock = clock
        self.log = log
        self.market = Market(api, cfg)
        self._catalog: list[Collection] = []
        self._catalog_at = 0.0
        self.stats = ScanStats()

    async def cycle(self) -> list[Event]:
        self.market.reset()
        self.stats = ScanStats(started=self.clock())
        events = await self._manage_positions()
        events += await self._scan_market()
        self.stats.finished = self.clock()
        self.store.set("last_stats", json.dumps(asdict(self.stats)))
        return events

    async def _manage_positions(self) -> list[Event]:
        events: list[Event] = []
        now = int(self.clock())
        for pos in self.store.positions("open"):
            try:
                seg = await self.market.segment(pos.gift_id, pos.seg_name, pos.seg_model_id, pos.seg_backdrop_id)
                events += await manage_position(pos, seg.listings, self.api.last_sale_ts, self.cfg, now)
                self.store.save_position(pos)
            except RateLimited:
                raise
            except Exception as e:  # одна сломанная сделка не должна останавливать бота
                self.stats.errors += 1
                self.log(f"Не удалось проверить {pos.title}: {e!r}")
        return events

    async def _collections(self) -> list[Collection]:
        now = self.clock()
        if not self._catalog or now - self._catalog_at > CATALOG_TTL:
            self._catalog = await self.api.collections()
            self._catalog_at = now
        cols = self._catalog
        if self.cfg.collections:
            wanted = {c.strip().lower() for c in self.cfg.collections}
            cols = [c for c in cols if c.title.lower() in wanted]
        return cols

    async def _scan_market(self) -> list[Event]:
        cfg = self.cfg
        stars_per_ton = self.store.get_float("stars_per_ton")
        rates: list[float] = []
        evaluations: list[Evaluation] = []
        for col in await self._collections():
            # Коллекции, где даже самый дешёвый лот заметно дороже лимита, не листаем.
            if stars_per_ton and col.floor_stars and col.floor_stars / stars_per_ton > cfg.max_buy_ton * 1.15:
                self.stats.skipped_by_floor += 1
                continue
            try:
                listings = await self.api.resale(col.gift_id, limit=PAGE_LIMIT)
            except RateLimited:
                raise
            except Exception as e:
                self.stats.errors += 1
                self.log(f"Не удалось загрузить «{col.title}»: {e!r}")
                continue
            self.stats.collections += 1
            self.stats.listings += len(listings)
            for l in listings:
                if l.price_ton is None:
                    self.stats.no_ton_price += 1
                elif l.price_stars and l.price_ton > 0:
                    rates.append(l.price_stars / l.price_ton)

            cheap = [l for l in listings if l.price_ton is not None and 0 < l.price_ton <= cfg.max_buy_ton]
            seen: set[tuple] = set()
            for l in cheap[:cfg.cheapest_per_collection]:
                # Из каждой модели смотрим только самый дешёвый лот: остальные заведомо хуже.
                key = (l.model.attr_id if l.model else None, l.backdrop.name if is_premium(l, cfg) else None)
                if key in seen:
                    continue
                seen.add(key)
                try:
                    segments = await self.market.segments_for(l)
                except RateLimited:
                    raise
                except Exception as e:
                    self.stats.errors += 1
                    self.log(f"Не удалось загрузить похожие лоты для {l.title}: {e!r}")
                    continue
                self.stats.candidates += 1
                evaluations.append(evaluate(l, segments, cfg))
        if rates:
            self.store.set("stars_per_ton", round(median(rates), 4))
        return self._act(evaluations)

    def _act(self, evaluations: list[Evaluation]) -> list[Event]:
        cfg = self.cfg
        now = int(self.clock())
        events: list[Event] = []
        halt = check_stop_loss(self.store, cfg)  # правило: при большом убытке покупки останавливаются
        if halt:
            events.append(Event("halt", report.halted(halt)))
        good = sorted((e for e in evaluations if e.passes), key=lambda e: e.expected_profit, reverse=True)
        self.stats.signals = len(good)
        holding = self.store.positions("open")
        sent = 0
        for ev in good:
            l = ev.listing
            if sent < MAX_SIGNALS_PER_CYCLE and not self.store.signal_seen(l.slug, l.price_ton, now - REOPEN_AFTER):
                self.store.add_signal(ev, now)
                events.append(Event("signal", report.signal(ev)))
                sent += 1
            if len(holding) >= cfg.max_open_positions or ev.segment is None:
                continue
            if self.store.traded_recently(l.slug, now - REOPEN_AFTER):
                continue
            if self.store.cash(cfg.bank_ton) + 1e-9 < l.price_ton:
                continue
            blocker = buy_blocker(self.store, cfg, l.collection, now)
            if blocker:
                if not self.stats.blocked_by_rules:
                    self.log(f"Покупка пропущена по правилам: {blocker}")
                self.stats.blocked_by_rules += 1
                continue
            pos = open_position(self.store, ev, now)
            holding.append(pos)
            events.append(Event("open", report.opened(pos)))
        return events
