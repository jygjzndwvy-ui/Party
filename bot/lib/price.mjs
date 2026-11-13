import * as cheerio from 'cheerio';

/**
 * Превращает строку вида "12 990 ₽", "1 299,50 руб." или "1,299.50" в число.
 * Возвращает null, если числа в строке нет.
 */
export function parsePrice(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? input : null;

  const text = String(input).trim();
  // Машинный формат (JSON-LD, meta): точка всегда отделяет копейки.
  if (/^\d+(\.\d+)?$/.test(text)) {
    const n = Number(text);
    return n > 0 ? n : null;
  }

  const match = text.match(/\d[\d\s   .,']*/);
  if (!match) return null;
  let num = match[0].replace(/[\s   ']/g, '').replace(/[.,]+$/, '');

  const lastComma = num.lastIndexOf(',');
  const lastDot = num.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    // Оба разделителя: последний — дробная часть, другой — тысячи.
    const decimal = lastComma > lastDot ? ',' : '.';
    const thousands = decimal === ',' ? '.' : ',';
    num = num.split(thousands).join('').replace(decimal, '.');
  } else if (lastComma !== -1 || lastDot !== -1) {
    const sep = lastComma !== -1 ? ',' : '.';
    const parts = num.split(sep);
    const isDecimal = parts.length === 2 && parts[1].length >= 1 && parts[1].length <= 2;
    num = isDecimal ? parts.join('.') : parts.join('');
  }

  const n = Number(num);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function collectJsonLdNodes(value, out) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdNodes(item, out);
    return;
  }
  out.push(value);
  if (value['@graph']) collectJsonLdNodes(value['@graph'], out);
}

function hasType(node, type) {
  const t = node['@type'];
  return Array.isArray(t) ? t.includes(type) : t === type;
}

function priceFromOffers(offers) {
  const list = Array.isArray(offers) ? offers : [offers];
  let best = null;
  for (const offer of list) {
    if (!offer || typeof offer !== 'object') continue;
    const spec = Array.isArray(offer.priceSpecification) ? offer.priceSpecification[0] : offer.priceSpecification;
    const price = parsePrice(offer.price ?? offer.lowPrice ?? spec?.price);
    if (price === null) continue;
    if (best === null || price < best.price) {
      best = { price, currency: offer.priceCurrency ?? spec?.priceCurrency ?? null };
    }
  }
  return best;
}

function fromJsonLd($) {
  const nodes = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      collectJsonLdNodes(JSON.parse($(el).contents().text()), nodes);
    } catch {
      // Битый JSON-LD встречается часто — просто пропускаем блок.
    }
  });
  for (const node of nodes) {
    if (!hasType(node, 'Product') || !node.offers) continue;
    const found = priceFromOffers(node.offers);
    if (found) return { ...found, title: typeof node.name === 'string' ? node.name : null };
  }
  return null;
}

function fromMeta($) {
  const candidates = [
    ['meta[property="product:price:amount"]', 'meta[property="product:price:currency"]'],
    ['meta[property="og:price:amount"]', 'meta[property="og:price:currency"]'],
    ['meta[itemprop="price"]', 'meta[itemprop="priceCurrency"]'],
  ];
  for (const [priceSel, currencySel] of candidates) {
    const price = parsePrice($(priceSel).first().attr('content'));
    if (price !== null) return { price, currency: $(currencySel).first().attr('content') || null };
  }
  const el = $('[itemprop="price"]').first();
  if (el.length) {
    const price = parsePrice(el.attr('content') ?? el.text());
    if (price !== null) {
      return { price, currency: $('[itemprop="priceCurrency"]').first().attr('content') || null };
    }
  }
  return null;
}

/**
 * Достаёт цену из HTML страницы товара.
 * Если задан selector — берёт цену из этого элемента, иначе ищет
 * стандартную разметку магазина (JSON-LD, meta-теги, microdata).
 * Возвращает { price, currency, title, source } или null.
 */
export function extractPrice(html, { selector } = {}) {
  const $ = cheerio.load(html);
  const pageTitle =
    $('meta[property="og:title"]').attr('content')?.trim() || $('title').first().text().trim() || null;

  if (selector) {
    const el = $(selector).first();
    if (!el.length) return null;
    const price = parsePrice(el.attr('content') ?? el.attr('data-price') ?? el.text());
    return price === null ? null : { price, currency: null, title: pageTitle, source: 'selector' };
  }

  const jsonLd = fromJsonLd($);
  if (jsonLd) return { ...jsonLd, title: jsonLd.title || pageTitle, source: 'json-ld' };

  const meta = fromMeta($);
  if (meta) return { ...meta, title: pageTitle, source: 'meta' };

  return null;
}
