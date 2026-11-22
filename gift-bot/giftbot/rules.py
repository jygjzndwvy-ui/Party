"""Правила, чтобы не заигрываться. Бот проверяет их перед каждой покупкой и нарушить их не может.

Все лимиты настраиваются в config.toml, раздел [limits]. Ослаблять их стоит только
после честного бумажного теста, ужесточать можно всегда.
"""
from __future__ import annotations

from .config import Config
from .store import Store

HOUR = 3600
DAY = 24 * HOUR


def collection_of(title: str) -> str:
    """«Plush Pepe #123» → «Plush Pepe»."""
    return title.rsplit(" #", 1)[0]


def loss_since_resume(store: Store) -> float:
    """Итог закрытых сделок после последнего /resume (или с самого начала)."""
    return store.realized_pnl() - (store.get_float("loss_baseline") or 0.0)


def check_stop_loss(store: Store, cfg: Config) -> str | None:
    """Если убыток дошёл до лимита, останавливаем покупки до команды /resume. Возвращает причину."""
    if store.get("halted"):
        return None
    loss = loss_since_resume(store)
    limit = -cfg.stop_loss_total * cfg.bank_ton
    if loss <= limit + 1e-9:
        reason = (f"убыток {loss:+.2f} TON дошёл до лимита {limit:.2f} TON "
                  f"({cfg.stop_loss_total:.0%} бюджета)")
        store.set("halted", reason)
        return reason
    return None


def resume(store: Store) -> None:
    """Возобновить покупки (только по команде человека). Лимит убытка считается заново с этого момента."""
    store.delete("halted")
    store.set("loss_baseline", store.realized_pnl())


def buy_blocker(store: Store, cfg: Config, collection: str, now: int) -> str | None:
    """Почему сейчас нельзя покупать, или None, если правила разрешают."""
    halted = store.get("halted")
    if halted:
        return f"покупки остановлены: {halted}. Возобновить: /resume"
    if store.count_opened_since(now - DAY) >= cfg.max_buys_per_day:
        return f"лимит {cfg.max_buys_per_day} покупка(и) в сутки"
    last_loss = store.last_loss_at()
    if last_loss is not None and now - last_loss < cfg.cooldown_after_loss_hours * HOUR:
        return f"пауза {cfg.cooldown_after_loss_hours:g} ч после убыточной сделки"
    if store.collection_loss_since(collection, now - cfg.collection_cooldown_days * DAY):
        return f"в «{collection}» был убыток: коллекция на паузе {cfg.collection_cooldown_days:g} дн."
    return None


def status_line(store: Store, cfg: Config, now: int) -> str:
    halted = store.get("halted")
    if halted:
        return f"⛔️ Покупки остановлены: {halted}. Возобновить: /resume"
    blocker = buy_blocker(store, cfg, "", now)
    if blocker:
        return f"⏸ Покупки сейчас на паузе: {blocker}."
    return "✅ Правила разрешают покупки."
