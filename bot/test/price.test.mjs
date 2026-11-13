import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractPrice, parsePrice } from '../lib/price.mjs';

test('parsePrice понимает разные форматы', () => {
  assert.equal(parsePrice('12 990 ₽'), 12990);
  assert.equal(parsePrice('12 990 ₽'), 12990);
  assert.equal(parsePrice('Цена: 1 299,50 руб.'), 1299.5);
  assert.equal(parsePrice('1,299.50'), 1299.5);
  assert.equal(parsePrice('1.299,50'), 1299.5);
  assert.equal(parsePrice('12.990 руб.'), 12990);
  assert.equal(parsePrice('1,299'), 1299);
  assert.equal(parsePrice('12990.00'), 12990);
  assert.equal(parsePrice('990 р.'), 990);
  assert.equal(parsePrice(4500), 4500);
  assert.equal(parsePrice('нет в наличии'), null);
  assert.equal(parsePrice('0'), null);
  assert.equal(parsePrice(undefined), null);
});

test('extractPrice читает JSON-LD', () => {
  const html = `<html><head><title>Магазин</title>
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[
      {"@type":"BreadcrumbList"},
      {"@type":"Product","name":"Чайник","offers":{"@type":"Offer","price":"3490.00","priceCurrency":"RUB"}}
    ]}</script></head><body></body></html>`;
  assert.deepEqual(extractPrice(html), { price: 3490, currency: 'RUB', title: 'Чайник', source: 'json-ld' });
});

test('extractPrice берёт минимальную цену из нескольких предложений', () => {
  const html = `<script type="application/ld+json">{"@type":"Product","name":"Кеды",
    "offers":[{"price":5200,"priceCurrency":"RUB"},{"price":4800,"priceCurrency":"RUB"}]}</script>`;
  assert.equal(extractPrice(html).price, 4800);
});

test('extractPrice читает AggregateOffer и пропускает битый JSON-LD', () => {
  const html = `<script type="application/ld+json">{ это не json </script>
    <script type="application/ld+json">{"@type":["Product"],"name":"Лампа",
    "offers":{"@type":"AggregateOffer","lowPrice":"799","priceCurrency":"RUB"}}</script>`;
  assert.equal(extractPrice(html).price, 799);
});

test('extractPrice читает meta-теги и microdata', () => {
  const meta = `<head><meta property="og:title" content="Рюкзак">
    <meta property="product:price:amount" content="2590">
    <meta property="product:price:currency" content="RUB"></head>`;
  assert.deepEqual(extractPrice(meta), { price: 2590, currency: 'RUB', title: 'Рюкзак', source: 'meta' });

  const microdata = `<title>Плед</title><span itemprop="price">1 990 ₽</span>`;
  assert.equal(extractPrice(microdata).price, 1990);
});

test('extractPrice использует selector, если он задан', () => {
  const html = `<title>Стол</title><div class="old">15 000 ₽</div><div class="price-now">11 990 ₽</div>`;
  assert.deepEqual(extractPrice(html, { selector: '.price-now' }), {
    price: 11990,
    currency: null,
    title: 'Стол',
    source: 'selector',
  });
  assert.equal(extractPrice(html, { selector: '.missing' }), null);
});

test('extractPrice возвращает null, если цены нет', () => {
  assert.equal(extractPrice('<html><body>Товар закончился</body></html>'), null);
});
