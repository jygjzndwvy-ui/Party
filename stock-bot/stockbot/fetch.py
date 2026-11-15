"""Загрузка таблиц: Google Таблицы, Яндекс Диск, прямая ссылка на файл, файл с диска."""
from __future__ import annotations

import asyncio
import re
import ssl
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import aiohttp

from . import gsheets
from .workbook import Sheet, TableError, load_sheets

MAX_DOWNLOAD = 40 * 1024 * 1024
BIG_SHEET = 900
USER_AGENT = "Mozilla/5.0 (compatible; table-reader/1.0)"
TIMEOUT = aiohttp.ClientTimeout(total=120, connect=20)
_URL = re.compile(r"https?://[^\s<>\"]+", re.I)
CLOSED = ("Не могу открыть таблицу: доступ по ссылке закрыт. Откройте её «для всех, у кого есть ссылка» "
          "(Настройки доступа → Все, у кого есть ссылка → Читатель).")


def find_url(text: str) -> str | None:
    m = _URL.search(text or "")
    return m.group(0).rstrip(").,;") if m else None


def ssl_context() -> ssl.SSLContext:
    """Доверяем и сертификатам системы, и встроенному набору.

    Антивирусы (например, Касперский) проверяют защищённые соединения через собственный
    сертификат, который есть только в системном хранилище, — без этого бот не смог бы
    подключиться ни к Telegram, ни к Google."""
    ctx = ssl.create_default_context()
    try:
        import certifi
        ctx.load_verify_locations(certifi.where())
    except Exception:
        pass
    return ctx


def new_session() -> aiohttp.ClientSession:
    return aiohttp.ClientSession(timeout=TIMEOUT, headers={"User-Agent": USER_AGENT},
                                 connector=aiohttp.TCPConnector(ssl=ssl_context()))


async def _get(session: aiohttp.ClientSession, url: str, limit: int = MAX_DOWNLOAD) -> tuple[bytes, str, str]:
    """→ (тело, content-type, конечный адрес). Бросает TableError с понятным текстом."""
    try:
        async with session.get(url, allow_redirects=True) as resp:
            final = str(resp.url)
            if "accounts.google.com" in final or resp.status in (401, 403):
                raise TableError(CLOSED)
            if resp.status == 404:
                raise TableError("Таблица не найдена: ссылка неверная или таблицу удалили.")
            if resp.status == 429:
                raise TableError("Сайт просит подождать (слишком частые запросы). Попробую позже.")
            if resp.status >= 400:
                raise TableError(f"Сайт ответил ошибкой {resp.status}.")
            chunks, size = [], 0
            async for chunk in resp.content.iter_chunked(1 << 16):
                size += len(chunk)
                if size > limit:
                    raise TableError(
                        f"Файл больше {limit // (1024 * 1024)} МБ — скорее всего, в нём много фотографий. "
                        "Пришлите ссылку на Google Таблицу или файл без картинок.")
                chunks.append(chunk)
            return b"".join(chunks), resp.headers.get("Content-Type", ""), final
    except TableError:
        raise
    except asyncio.TimeoutError:
        raise TableError("Сайт не ответил вовремя.") from None
    except aiohttp.ClientError as exc:
        raise TableError(f"Не получилось подключиться: {exc.__class__.__name__}.") from None


async def load_google(session: aiohttp.ClientSession, doc: str) -> tuple[str, list[Sheet]]:
    """Google Таблица → (название документа, листы)."""
    base = f"https://docs.google.com/spreadsheets/d/{doc}"
    body, _ctype, _final = await _get(session, f"{base}/htmlview")
    title, entries = gsheets.parse_index(body.decode("utf-8", "replace"))
    sem = asyncio.Semaphore(4)

    async def one(name: str, gid: str) -> Sheet | None:
        async with sem:
            page, _c, _f = await _get(session, f"{base}/htmlview/sheet?headers=true&gid={gid}")
            sheet = gsheets.parse_sheet_html(page.decode("utf-8", "replace"), name)
            if sheet.rows and len(sheet.rows) < BIG_SHEET:
                return sheet
            # Пустая страница или очень длинный лист (веб-версия может показать его не целиком) —
            # сверяемся с выгрузкой CSV и берём то, где строк больше.
            data, _c, _f = await _get(session, f"{base}/export?format=csv&gid={gid}")
            got = load_sheets(data, name + ".csv") if data.strip() else []
            if got and len(got[0].rows) > len(sheet.rows) + 5:
                got[0].name = name
                return got[0]
            return sheet if sheet.rows else None

    if entries:
        sheets = [s for s in await asyncio.gather(*(one(n, g) for n, g in entries)) if s]
    else:
        # Не удалось прочитать список листов — берём хотя бы первый лист как CSV.
        data, _c, _f = await _get(session, f"{base}/export?format=csv")
        sheets = load_sheets(data, (title or "Лист1") + ".csv")
    if not sheets:
        raise TableError("В таблице нет данных.")
    return title, sheets


def _direct_url(url: str) -> str:
    """Ссылки «для просмотра» → ссылки на скачивание файла."""
    u = urlparse(url)
    host = u.netloc.lower()
    m = re.search(r"drive\.google\.com/file/d/([\w-]+)", url)
    if m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}"
    if "drive.google.com" in host and "id" in parse_qs(u.query):
        return f"https://drive.google.com/uc?export=download&id={parse_qs(u.query)['id'][0]}"
    m = re.search(r"docs\.google\.com/spreadsheets/d/e/([\w-]+)", url)
    if m:
        return f"https://docs.google.com/spreadsheets/d/e/{m.group(1)}/pub?output=xlsx"
    if "dropbox.com" in host:
        q = parse_qs(u.query)
        q["dl"] = ["1"]
        return urlunparse(u._replace(query=urlencode(q, doseq=True)))
    return url


async def _yandex(session: aiohttp.ClientSession, url: str) -> tuple[str, list[Sheet]]:
    api = "https://cloud-api.yandex.net/v1/disk/public/resources"
    try:
        async with session.get(api, params={"public_key": url, "limit": "200"}) as resp:
            if resp.status != 200:
                raise TableError("Не могу открыть ссылку Яндекс Диска: проверьте, что доступ по ссылке открыт.")
            meta = await resp.json()
        path = None
        name = meta.get("name", "")
        if meta.get("type") == "dir":
            files = [f for f in meta.get("_embedded", {}).get("items", [])
                     if f.get("type") == "file" and f.get("name", "").lower().endswith((".xlsx", ".xls", ".csv"))]
            if not files:
                raise TableError("В папке Яндекс Диска нет таблиц (.xlsx, .xls, .csv).")
            newest = max(files, key=lambda f: f.get("modified", ""))
            path, name = newest.get("path"), newest.get("name", "")
        params = {"public_key": url}
        if path:
            params["path"] = path
        async with session.get(api + "/download", params=params) as resp:
            if resp.status != 200:
                raise TableError("Яндекс Диск не дал скачать файл.")
            href = (await resp.json()).get("href")
    except aiohttp.ClientError as exc:
        raise TableError(f"Не получилось подключиться к Яндекс Диску: {exc.__class__.__name__}.") from None
    data, _c, _f = await _get(session, href)
    return re.sub(r"\.(xlsx|xls|csv)$", "", name, flags=re.I), await asyncio.to_thread(load_sheets, data, name)


async def load_url(session: aiohttp.ClientSession, url: str) -> tuple[str, list[Sheet]]:
    """Любая поддерживаемая ссылка → (название, листы)."""
    doc = gsheets.doc_id(url)
    if doc:
        return await load_google(session, doc)
    host = urlparse(url).netloc.lower()
    if "disk.yandex" in host or "yadi.sk" in host:
        return await _yandex(session, url)
    data, ctype, final = await _get(session, _direct_url(url))
    name = Path(urlparse(final).path).name
    if "text/html" in ctype and data[:1] != b"P":
        raise TableError(
            "По ссылке открывается обычный сайт, а не таблица. Бот читает Google Таблицы, Excel-файлы "
            "(.xlsx, .xls), CSV и Яндекс Диск.")
    return re.sub(r"\.(xlsx|xls|csv)$", "", name, flags=re.I), await asyncio.to_thread(load_sheets, data, name)


async def load_file(path: Path, name: str = "") -> list[Sheet]:
    data = await asyncio.to_thread(path.read_bytes)
    return await asyncio.to_thread(load_sheets, data, name or path.name)
