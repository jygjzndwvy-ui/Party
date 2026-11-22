"""Тексты сообщений и сводок."""
from __future__ import annotations

import json
from datetime import datetime

from .analysis import Evaluation, is_premium, number_tags, segment_ref
from .config import Config
from .models import Listing, OwnedGift, Segment, ValueInfo
from .rules import status_line


def ton(x: float | None) -> str:
    return "—" if x is None else f"{x:.2f} TON"


def signed(x: float) -> str:
    return f"{x:+.2f} TON"


def when(ts: float) -> str:
    return datetime.fromtimestamp(ts).strftime("%d.%m %H:%M")


def traits(l: Listing) -> str:
    parts = []
    for label, trait in (("модель", l.model), ("фон", l.backdrop), ("узор", l.pattern)):
        if trait:
            parts.append(f"{label} {trait.name} ({trait.rarity_text()})")
    return ", ".join(parts) or "признаки неизвестны"


def signal(ev: Evaluation) -> str:
    l = ev.listing
    on_hand = ev.expected_profit + l.price_ton
    lines = [
        f"🔎 Сигнал: {l.title}",
        f"Цена {ton(l.price_ton)}. Самый дешёвый похожий лот ({ev.segment.name}): {ton(ev.ref_price)}, "
        f"этот дешевле на {ev.discount:.0%}. Похожих лотов: {ev.others}.",
        f"Если выставить за {ton(ev.expected_sale)}, на руки придёт {ton(on_hand)}: "
        f"прибыль {signed(ev.expected_profit)}, {ev.reason}. Безубыток {ton(ev.breakeven)}.",
        traits(l),
    ]
    if ev.tags:
        lines.append("Особенности: " + ", ".join(ev.tags))
    lines.append(l.link)
    return "\n".join(lines)


def opened(pos) -> str:
    return (
        f"📝 Бумажная покупка: {pos.title} за {ton(pos.buy_price)}.\n"
        f"Выставили бы за {ton(pos.ask)}, сравниваем с сегментом «{pos.seg_name}».\n"
        f"Это тест: реальных денег бот не тратит.\nhttps://t.me/nft/{pos.slug}"
    )


def repriced(pos, old: float, be: float) -> str:
    return f"↘️ {pos.title}: снизили цену {ton(old)} → {ton(pos.ask)} (безубыток {ton(be)})."


def halted(reason: str) -> str:
    return (f"⛔️ Сработало правило остановки: {reason}.\n"
            "Новых покупок не будет, пока вы сами не напишете сюда /resume. "
            "Уже купленное бот продолжает продавать по правилам.")


def closed(pos) -> str:
    mark = "✅" if pos.pnl >= 0 else "❌"
    return (
        f"{mark} Бумажная продажа: {pos.title} за {ton(pos.close_price)} (куплено за {ton(pos.buy_price)}).\n"
        f"Итог после комиссии: {signed(pos.pnl)}. Причина: {pos.close_reason}."
    )


def summary(store, cfg: Config, now: int) -> str:
    done = store.positions("closed")
    holding = store.positions("open")
    realized = sum(p.pnl for p in done)
    wins = sum(1 for p in done if p.pnl >= 0)
    lines = [
        "📊 Бумажная торговля (тест, без реальных денег)",
        f"Бюджет {ton(cfg.bank_ton)}, свободно {ton(store.cash(cfg.bank_ton))}.",
        f"Закрыто сделок: {len(done)} (в плюс {wins}, в минус {len(done) - wins}), итог {signed(realized)}.",
    ]
    for p in holding:
        lines.append(f"• Держим {p.title}: куплено за {ton(p.buy_price)}, выставлено за {ton(p.ask)}, "
                     f"с {when(p.opened_at)}.")
    lines.append(f"Сигналов за сутки: {store.count_signals(now - 24 * 3600)}.")
    lines.append(status_line(store, cfg, now))
    raw = store.get("last_stats")
    if raw:
        s = json.loads(raw)
        lines.append(f"Последний проход {when(s['finished'])}: коллекций {s['collections']}, лотов {s['listings']}, "
                     f"проверено кандидатов {s['candidates']}, ошибок {s['errors']}.")
    return "\n".join(lines)


def value_text(v: ValueInfo) -> str:
    def money(x: float) -> str:
        return f"{x:,.2f} {v.currency}".replace(",", " ")

    parts = []
    if v.value is not None:
        parts.append(f"оценка {money(v.value)}" + (" (средняя цена)" if v.value_is_average else ""))
    if v.floor_price is not None:
        parts.append(f"минимальная цена {money(v.floor_price)}")
    if v.average_price is not None:
        parts.append(f"средняя {money(v.average_price)}")
    if v.last_sale_price is not None:
        sale = f"последняя продажа {money(v.last_sale_price)}"
        if v.last_sale_ts:
            sale += f" ({when(v.last_sale_ts)})"
        parts.append(sale)
    if v.listed_count is not None:
        parts.append(f"на продаже {v.listed_count} шт.")
    return ("Данные Telegram: " + ", ".join(parts) + ".") if parts else "Telegram не дал оценку."


def my_gift(owned: OwnedGift, segments: list[Segment], value: ValueInfo | None, cfg: Config, now: int) -> str:
    l = owned.listing
    lines = [f"🎁 {l.title}", traits(l)]
    tags = number_tags(l.num) + ([f"фон {l.backdrop.name}"] if is_premium(l, cfg) else [])
    if tags:
        lines.append("Особенности: " + ", ".join(tags))
    if l.price_ton is not None:
        lines.append(f"Сейчас выставлен за {ton(l.price_ton)}.")
    if owned.can_resell_at and owned.can_resell_at > now:
        lines.append(f"Продать можно будет с {when(owned.can_resell_at)}.")
    elif owned.can_resell_at:
        lines.append("Продавать уже можно.")
    lines.append("Похожие лоты на продаже:")
    best: tuple[float, str] | None = None
    for seg in segments:
        prices = sorted(x.price_ton for x in seg.listings if x.slug != l.slug and x.price_ton is not None)
        if prices:
            head = ", ".join(f"{p:.2f}" for p in prices[:3])
            lines.append(f"• {seg.name}: самые дешёвые {head} TON (в выборке {len(prices)})")
        else:
            lines.append(f"• {seg.name}: сейчас никто не продаёт за TON")
        ref = segment_ref(l, seg.listings, cfg.min_other_listings)
        if ref and (best is None or ref[0] > best[0]):
            best = (ref[0], seg.name)
    if value:
        lines.append(value_text(value))
    if best:
        ask = best[0] * (1 - cfg.undercut)
        lines.append(
            f"Если выставить за {ton(ask)} (на {cfg.undercut:.0%} дешевле самого дешёвого похожего, «{best[1]}»), "
            f"на руки ≈ {ton(ask * cfg.seller_share_ton)} при доле продавца {cfg.seller_share_ton:.0%}."
        )
    else:
        lines.append("Похожих лотов слишком мало, чтобы предложить цену.")
    lines.append(l.link)
    return "\n".join(lines)
