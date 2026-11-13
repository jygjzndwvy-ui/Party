#!/usr/bin/env node
// Проверяет цены товаров из config.json и пишет в Telegram, когда цена упала.

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPrice } from './lib/price.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = resolve(process.env.CONFIG_FILE || resolve(here, 'config.json'));
const STATE_FILE = resolve(process.env.STATE_FILE || resolve(here, 'state.json'));
const DRY_RUN = process.env.DRY_RUN === '1';
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// После стольких неудачных проверок подряд бот один раз сообщает, что страница не читается.
const FAILURES_BEFORE_WARNING = 6;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const CURRENCY_SIGNS = { RUB: '₽', RUR: '₽', USD: '$', EUR: '€', KZT: '₸', BYN: 'Br' };

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw new Error(`Не удалось прочитать ${file}: ${err.message}`);
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`сайт ответил ${res.status}`);
  return res.text();
}

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    const { chromium } = createRequire(import.meta.url)('playwright');
    browserPromise = chromium.launch();
  }
  return browserPromise;
}

// Для сайтов, где цена дорисовывается скриптами: открываем страницу в настоящем браузере.
async function renderHtml(url, selector) {
  const browser = await getBrowser();
  const context = await browser.newContext({ userAgent: USER_AGENT, locale: 'ru-RU' });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    if (selector) await page.waitForSelector(selector, { timeout: 15_000 }).catch(() => {});
    else await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    return await page.content();
  } finally {
    await context.close();
  }
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatPrice(price, currency) {
  const digits = Number.isInteger(price) ? 0 : 2;
  const number = price
    .toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    .replace(/ | /g, ' ');
  return `${number} ${CURRENCY_SIGNS[currency] || currency || '₽'}`;
}

async function sendTelegram(text) {
  if (DRY_RUN) {
    console.log(`\n--- сообщение (DRY_RUN, не отправлено) ---\n${text}\n---`);
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram ответил ${res.status}: ${body.slice(0, 300)}`);
  }
}

async function checkProduct(product, config, state) {
  const { url } = product;
  const entry = state[url] ?? (state[url] = {});
  const dropPercent = Number(product.dropPercent ?? config.dropPercent ?? 5);
  const label = product.name || entry.title || url;

  let found;
  try {
    const html = product.render ? await renderHtml(url, product.selector) : await fetchHtml(url);
    found = extractPrice(html, { selector: product.selector });
    if (!found) throw new Error('цена на странице не найдена');
  } catch (err) {
    entry.failures = (entry.failures || 0) + 1;
    console.warn(`✗ ${label}: ${err.message} (подряд: ${entry.failures})`);
    if (entry.failures >= FAILURES_BEFORE_WARNING && !entry.failNotified) {
      await sendTelegram(
        `⚠️ <b>Не получается прочитать цену</b>\n${escapeHtml(label)}\n` +
          `Причина: ${escapeHtml(err.message)}\n${escapeHtml(url)}`,
      );
      entry.failNotified = true;
    }
    return;
  }

  const { price } = found;
  const currency = product.currency || found.currency || entry.currency || config.currency || 'RUB';
  const title = product.name || found.title || url;
  entry.failures = 0;
  entry.failNotified = false;
  entry.title = title;
  entry.currency = currency;
  entry.lastChecked = new Date().toISOString();

  if (entry.baseline === undefined) {
    await sendTelegram(
      `👀 <b>Начал следить за ценой</b>\n${escapeHtml(title)}\n` +
        `Сейчас: ${formatPrice(price, currency)}\n` +
        `Напишу, когда подешевеет на ${dropPercent}% или больше.\n${escapeHtml(url)}`,
    );
    Object.assign(entry, { baseline: price, last: price, min: price });
    console.log(`+ ${title}: ${formatPrice(price, currency)} (первая проверка)`);
    return;
  }

  const previousMin = entry.min;
  const drop = ((entry.baseline - price) / entry.baseline) * 100;

  if (drop >= dropPercent) {
    const lines = [
      `📉 <b>Цена упала на ${Math.round(drop)}%</b>`,
      escapeHtml(title),
      `Было: ${formatPrice(entry.baseline, currency)} → стало: <b>${formatPrice(price, currency)}</b>`,
      price < previousMin
        ? 'Это самая низкая цена за время наблюдения.'
        : `Минимум за время наблюдения: ${formatPrice(previousMin, currency)}`,
      escapeHtml(url),
    ];
    await sendTelegram(lines.join('\n'));
    entry.baseline = price;
    console.log(`↓ ${title}: ${formatPrice(price, currency)} (−${drop.toFixed(1)}%), сообщение отправлено`);
  } else {
    // Цена выросла — дальше считаем падение от новой цены; небольшое снижение копим до порога.
    if (price > entry.baseline) entry.baseline = price;
    console.log(`= ${title}: ${formatPrice(price, currency)}`);
  }

  entry.last = price;
  entry.min = Math.min(previousMin, price);
}

async function main() {
  const config = await readJson(CONFIG_FILE);
  const products = (config.products || []).filter((p) => p && p.url);
  if (products.length === 0) {
    console.log('В config.json нет товаров — добавьте ссылки в список "products".');
    return;
  }
  if (!DRY_RUN && (!TOKEN || !CHAT_ID)) {
    throw new Error('Не заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID (см. bot/README.md).');
  }

  const state = await readJson(STATE_FILE, {});
  const errors = [];
  try {
    for (const product of products) {
      try {
        await checkProduct(product, config, state);
      } catch (err) {
        errors.push(err);
        console.error(`✗ ${product.name || product.url}: ${err.message}`);
      }
    }
  } finally {
    if (browserPromise) await (await browserPromise).close().catch(() => {});
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
  }
  if (errors.length) throw new Error(`Ошибок при отправке сообщений: ${errors.length}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
