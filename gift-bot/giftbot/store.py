"""Журнал бумажной торговли: SQLite-файл data/paper.db."""
from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,
    slug TEXT NOT NULL,
    title TEXT,
    segment TEXT,
    price REAL,
    ref_price REAL,
    expected_sale REAL,
    expected_profit REAL
);
CREATE INDEX IF NOT EXISTS signals_slug ON signals (slug, ts);
CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL,
    gift_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    seg_name TEXT NOT NULL,
    seg_model_id INTEGER,
    seg_backdrop_id INTEGER,
    buy_price REAL NOT NULL,
    ask REAL NOT NULL,
    opened_at INTEGER NOT NULL,
    last_reprice_at INTEGER NOT NULL,
    last_check_at INTEGER NOT NULL,
    snapshot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    close_price REAL,
    closed_at INTEGER,
    close_reason TEXT,
    pnl REAL
);
"""

COLUMNS = (
    "slug", "gift_id", "title", "seg_name", "seg_model_id", "seg_backdrop_id", "buy_price", "ask",
    "opened_at", "last_reprice_at", "last_check_at", "snapshot", "status", "close_price", "closed_at",
    "close_reason", "pnl",
)


@dataclass
class Position:
    """Бумажная сделка: подарок, который бот «купил» и «выставил» понарошку."""

    slug: str
    gift_id: int
    title: str
    seg_name: str
    seg_model_id: int | None
    seg_backdrop_id: int | None
    buy_price: float
    ask: float
    opened_at: int
    last_reprice_at: int
    last_check_at: int
    snapshot: dict[str, float] = field(default_factory=dict)  # цены конкурентов на прошлой проверке
    status: str = "open"
    close_price: float | None = None
    closed_at: int | None = None
    close_reason: str | None = None
    pnl: float | None = None
    id: int | None = None


class Store:
    def __init__(self, path: str | Path):
        if str(path) != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(path))
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)

    def close(self) -> None:
        self.db.close()

    # --- служебные значения ---
    def get(self, key: str, default: str | None = None) -> str | None:
        row = self.db.execute("SELECT value FROM kv WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else default

    def get_float(self, key: str) -> float | None:
        value = self.get(key)
        try:
            return float(value) if value is not None else None
        except ValueError:
            return None

    def set(self, key: str, value) -> None:
        self.db.execute(
            "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, str(value)),
        )
        self.db.commit()

    def delete(self, key: str) -> None:
        self.db.execute("DELETE FROM kv WHERE key = ?", (key,))
        self.db.commit()

    # --- сигналы ---
    def signal_seen(self, slug: str, price: float, since: int) -> bool:
        row = self.db.execute(
            "SELECT 1 FROM signals WHERE slug = ? AND abs(price - ?) < 0.005 AND ts >= ?", (slug, price, since)
        ).fetchone()
        return row is not None

    def add_signal(self, ev, ts: int) -> None:
        l = ev.listing
        self.db.execute(
            "INSERT INTO signals (ts, slug, title, segment, price, ref_price, expected_sale, expected_profit) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (int(ts), l.slug, l.title, ev.segment.name if ev.segment else None, l.price_ton, ev.ref_price,
             ev.expected_sale, ev.expected_profit),
        )
        self.db.commit()

    def count_signals(self, since: int) -> int:
        return self.db.execute("SELECT COUNT(*) FROM signals WHERE ts >= ?", (since,)).fetchone()[0]

    # --- бумажные сделки ---
    def add_position(self, pos: Position) -> Position:
        cur = self.db.execute(
            f"INSERT INTO positions ({', '.join(COLUMNS)}) VALUES ({', '.join('?' * len(COLUMNS))})",
            [self._dump(pos, c) for c in COLUMNS],
        )
        self.db.commit()
        pos.id = cur.lastrowid
        return pos

    def save_position(self, pos: Position) -> None:
        sets = ", ".join(f"{c} = ?" for c in COLUMNS)
        self.db.execute(f"UPDATE positions SET {sets} WHERE id = ?", [self._dump(pos, c) for c in COLUMNS] + [pos.id])
        self.db.commit()

    def positions(self, status: str | None = None) -> list[Position]:
        if status:
            rows = self.db.execute("SELECT * FROM positions WHERE status = ? ORDER BY id", (status,)).fetchall()
        else:
            rows = self.db.execute("SELECT * FROM positions ORDER BY id").fetchall()
        return [self._load(r) for r in rows]

    def traded_recently(self, slug: str, since: int) -> bool:
        row = self.db.execute(
            "SELECT 1 FROM positions WHERE slug = ? AND (status = 'open' OR closed_at >= ?)", (slug, since)
        ).fetchone()
        return row is not None

    # --- для правил (giftbot/rules.py) ---
    def realized_pnl(self) -> float:
        return self.db.execute(
            "SELECT COALESCE(SUM(pnl), 0) FROM positions WHERE status = 'closed'").fetchone()[0]

    def count_opened_since(self, since: float) -> int:
        return self.db.execute("SELECT COUNT(*) FROM positions WHERE opened_at >= ?", (since,)).fetchone()[0]

    def last_loss_at(self) -> int | None:
        return self.db.execute(
            "SELECT MAX(closed_at) FROM positions WHERE status = 'closed' AND pnl < 0").fetchone()[0]

    def collection_loss_since(self, collection: str, since: float) -> bool:
        if not collection:
            return False
        rows = self.db.execute(
            "SELECT title FROM positions WHERE status = 'closed' AND pnl < 0 AND closed_at >= ?", (since,)
        ).fetchall()
        return any(r["title"].rsplit(" #", 1)[0] == collection for r in rows)

    def cash(self, bank: float) -> float:
        """Свободные бумажные деньги: бюджет + итог закрытых сделок − деньги в открытых."""
        row = self.db.execute(
            "SELECT COALESCE(SUM(CASE WHEN status = 'closed' THEN pnl END), 0) AS realized, "
            "COALESCE(SUM(CASE WHEN status = 'open' THEN buy_price END), 0) AS locked FROM positions"
        ).fetchone()
        return bank + row["realized"] - row["locked"]

    @staticmethod
    def _dump(pos: Position, column: str):
        value = getattr(pos, column)
        return json.dumps(value) if column == "snapshot" else value

    @staticmethod
    def _load(row: sqlite3.Row) -> Position:
        data = {c: row[c] for c in COLUMNS}
        data["snapshot"] = json.loads(data["snapshot"])
        return Position(id=row["id"], **data)
