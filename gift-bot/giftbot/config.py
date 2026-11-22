"""Настройки бота: читаются из config.toml рядом с bot.py."""
from __future__ import annotations

import tomllib
from dataclasses import dataclass, field, fields
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRIVATE = ROOT / "private"  # ключи и сессия Telegram: никому не отправлять
DATA = ROOT / "data"        # журнал бумажной торговли и лог


@dataclass
class Config:
    # [bank]
    bank_ton: float = 8.0
    max_open_positions: int = 1
    max_buy_ton: float = 8.0
    # [fees]
    seller_share_ton: float = 0.90
    # [rules]
    min_margin: float = 0.15
    undercut: float = 0.03
    min_other_listings: int = 2
    daily_price_step: float = 0.05
    max_hold_days: float = 7.0
    premium_backdrops: list[str] = field(default_factory=lambda: ["Black", "Onyx Black"])
    # [scan]
    interval_minutes: float = 20.0
    request_pause_sec: float = 1.5
    cheapest_per_collection: int = 10
    collections: list[str] = field(default_factory=list)
    # [report]
    daily_summary_hour: int = 21


def load_config(path: Path | None = None) -> Config:
    path = path or ROOT / "config.toml"
    cfg = Config()
    if path.exists():
        with open(path, "rb") as f:
            raw = tomllib.load(f)
        known = {f.name for f in fields(Config)}
        for section in raw.values():
            if not isinstance(section, dict):
                continue
            for key, value in section.items():
                if key not in known:
                    raise ValueError(f"config.toml: неизвестная настройка «{key}»")
                setattr(cfg, key, value)
    validate(cfg)
    return cfg


def validate(cfg: Config) -> None:
    problems = []
    if cfg.bank_ton <= 0 or cfg.max_buy_ton <= 0:
        problems.append("bank_ton и max_buy_ton должны быть больше нуля")
    if cfg.max_open_positions < 1:
        problems.append("max_open_positions должен быть не меньше 1")
    if not 0 < cfg.seller_share_ton <= 1:
        problems.append("seller_share_ton должен быть от 0 до 1, например 0.90")
    if cfg.min_margin < 0:
        problems.append("min_margin не может быть отрицательным")
    if not 0 <= cfg.undercut < 0.5:
        problems.append("undercut должен быть от 0 до 0.5, например 0.03")
    if cfg.min_other_listings < 1:
        problems.append("min_other_listings должен быть не меньше 1")
    if not 0 <= cfg.daily_price_step < 0.5:
        problems.append("daily_price_step должен быть от 0 до 0.5, например 0.05")
    if cfg.max_hold_days <= 0:
        problems.append("max_hold_days должен быть больше нуля")
    if cfg.interval_minutes < 5:
        problems.append("interval_minutes не меньше 5 минут")
    if cfg.request_pause_sec < 1:
        problems.append("request_pause_sec не меньше 1 секунды, иначе Telegram может ограничить аккаунт")
    if cfg.cheapest_per_collection < 1:
        problems.append("cheapest_per_collection должен быть не меньше 1")
    if not 0 <= cfg.daily_summary_hour <= 23:
        problems.append("daily_summary_hour должен быть от 0 до 23")
    if problems:
        raise ValueError("Ошибки в config.toml:\n- " + "\n- ".join(problems))
