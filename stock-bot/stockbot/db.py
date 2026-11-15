"""Хранилище бота: один файл SQLite рядом с ботом."""
from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from .parser import Item

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,                -- mine | supplier
    name TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',   -- как поставщик помечен в названиях своей таблицы
    kind TEXT NOT NULL,                -- url | file
    url TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    config TEXT NOT NULL DEFAULT '{}',
    summary TEXT NOT NULL DEFAULT '',
    item_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    checked_at TEXT NOT NULL DEFAULT '',
    last_error TEXT NOT NULL DEFAULT '',
    error_count INTEGER NOT NULL DEFAULT 0,
    error_notified INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS snapshots (source_id INTEGER PRIMARY KEY, taken_at TEXT, items TEXT);
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    my_key TEXT NOT NULL UNIQUE,
    my_name TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    sup_key TEXT NOT NULL DEFAULT '',
    sup_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,              -- auto | manual | ask | none
    state TEXT NOT NULL DEFAULT '{}',
    candidates TEXT NOT NULL DEFAULT '[]',
    active INTEGER NOT NULL DEFAULT 1,
    asked INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class Source:
    id: int
    role: str
    name: str
    tags: list[str]
    kind: str
    url: str = ""
    file_name: str = ""
    title: str = ""
    config: dict = field(default_factory=dict)
    summary: str = ""
    item_count: int = 0
    created_at: str = ""
    checked_at: str = ""
    last_error: str = ""
    error_count: int = 0
    error_notified: int = 0


@dataclass
class Link:
    id: int
    my_key: str
    my_name: str
    source_id: int
    sup_key: str
    sup_name: str
    status: str
    state: dict
    candidates: list[str]
    active: int
    asked: int
    updated_at: str


class DB:
    def __init__(self, path: Path | str):
        self.path = str(path)
        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self.con = sqlite3.connect(self.path)
        self.con.row_factory = sqlite3.Row
        self.con.executescript(SCHEMA)
        self.con.commit()

    def close(self) -> None:
        self.con.close()

    # -- настройки ---------------------------------------------------------
    def get(self, key: str, default=None):
        row = self.con.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
        return json.loads(row["value"]) if row else default

    def set(self, key: str, value) -> None:
        self.con.execute("INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                         (key, json.dumps(value, ensure_ascii=False)))
        self.con.commit()

    # -- таблицы -----------------------------------------------------------
    @staticmethod
    def _source(row: sqlite3.Row) -> Source:
        d = dict(row)
        d["tags"] = json.loads(d["tags"])
        d["config"] = json.loads(d["config"])
        return Source(**d)

    def add_source(self, role: str, name: str, kind: str, url: str = "", file_name: str = "",
                   tags: list[str] | None = None, title: str = "") -> Source:
        cur = self.con.execute(
            "INSERT INTO sources(role, name, tags, kind, url, file_name, title, created_at) VALUES(?,?,?,?,?,?,?,?)",
            (role, name, json.dumps(tags or [], ensure_ascii=False), kind, url, file_name, title, now()))
        self.con.commit()
        return self.source(cur.lastrowid)

    def source(self, source_id: int) -> Source | None:
        row = self.con.execute("SELECT * FROM sources WHERE id=?", (source_id,)).fetchone()
        return self._source(row) if row else None

    def sources(self, role: str | None = None) -> list[Source]:
        sql = "SELECT * FROM sources" + (" WHERE role=?" if role else "") + " ORDER BY id"
        return [self._source(r) for r in self.con.execute(sql, (role,) if role else ())]

    def mine(self) -> Source | None:
        found = self.sources("mine")
        return found[0] if found else None

    def update_source(self, source_id: int, **fields) -> None:
        if not fields:
            return
        for key in ("tags", "config"):
            if key in fields:
                fields[key] = json.dumps(fields[key], ensure_ascii=False)
        sets = ", ".join(f"{k}=?" for k in fields)
        self.con.execute(f"UPDATE sources SET {sets} WHERE id=?", (*fields.values(), source_id))
        self.con.commit()

    def delete_source(self, source_id: int) -> None:
        self.con.execute("DELETE FROM sources WHERE id=?", (source_id,))
        self.con.execute("DELETE FROM snapshots WHERE source_id=?", (source_id,))
        self.con.execute("DELETE FROM links WHERE source_id=?", (source_id,))
        self.con.commit()

    # -- снимки таблиц -----------------------------------------------------
    def save_snapshot(self, source_id: int, items: list[Item]) -> None:
        self.con.execute(
            "INSERT INTO snapshots(source_id, taken_at, items) VALUES(?,?,?) "
            "ON CONFLICT(source_id) DO UPDATE SET taken_at=excluded.taken_at, items=excluded.items",
            (source_id, now(), json.dumps([i.to_dict() for i in items], ensure_ascii=False)))
        self.con.commit()

    def snapshot(self, source_id: int) -> list[Item]:
        row = self.con.execute("SELECT items FROM snapshots WHERE source_id=?", (source_id,)).fetchone()
        return [Item.from_dict(d) for d in json.loads(row["items"])] if row else []

    # -- привязки вещей ----------------------------------------------------
    @staticmethod
    def _link(row: sqlite3.Row) -> Link:
        d = dict(row)
        d["state"] = json.loads(d["state"])
        d["candidates"] = json.loads(d["candidates"])
        return Link(**d)

    def link(self, link_id: int) -> Link | None:
        row = self.con.execute("SELECT * FROM links WHERE id=?", (link_id,)).fetchone()
        return self._link(row) if row else None

    def link_by_key(self, my_key: str) -> Link | None:
        row = self.con.execute("SELECT * FROM links WHERE my_key=?", (my_key,)).fetchone()
        return self._link(row) if row else None

    def links(self, status: str | None = None, active_only: bool = False) -> list[Link]:
        sql, args = "SELECT * FROM links WHERE 1=1", []
        if status:
            sql += " AND status=?"
            args.append(status)
        if active_only:
            sql += " AND active=1"
        return [self._link(r) for r in self.con.execute(sql + " ORDER BY id", args)]

    def save_link(self, my_key: str, my_name: str, source_id: int, status: str, sup_key: str = "",
                  sup_name: str = "", state: dict | None = None, candidates: list[str] | None = None,
                  asked: int = 0, active: int = 1) -> Link:
        self.con.execute(
            "INSERT INTO links(my_key, my_name, source_id, sup_key, sup_name, status, state, candidates, active, asked, updated_at) "
            "VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(my_key) DO UPDATE SET my_name=excluded.my_name, "
            "source_id=excluded.source_id, sup_key=excluded.sup_key, sup_name=excluded.sup_name, status=excluded.status, "
            "state=excluded.state, candidates=excluded.candidates, active=excluded.active, asked=excluded.asked, "
            "updated_at=excluded.updated_at",
            (my_key, my_name, source_id, sup_key, sup_name, status, json.dumps(state or {}, ensure_ascii=False),
             json.dumps(candidates or [], ensure_ascii=False), active, asked, now()))
        self.con.commit()
        return self.link_by_key(my_key)

    def update_link(self, link_id: int, **fields) -> None:
        if not fields:
            return
        for key in ("state", "candidates"):
            if key in fields:
                fields[key] = json.dumps(fields[key], ensure_ascii=False)
        fields["updated_at"] = now()
        sets = ", ".join(f"{k}=?" for k in fields)
        self.con.execute(f"UPDATE links SET {sets} WHERE id=?", (*fields.values(), link_id))
        self.con.commit()

    def delete_link(self, link_id: int) -> None:
        self.con.execute("DELETE FROM links WHERE id=?", (link_id,))
        self.con.commit()
