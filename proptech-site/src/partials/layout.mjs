// Общая обвязка страницы: <head>, шапка, мобильное меню, подвал, окно заявки.
import { html, esc } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { logoMark } from '../lib/art.mjs';
import { leadForm } from './blocks.mjs';

// иконки, которые нужны скриптам (вставляются скрытыми шаблонами)
const JS_ICONS = ['check', 'heart', 'info', 'arrow-right', 'arrow-up-right', 'pin', 'area', 'stairs', 'cube', 'keypad', 'close', 'lock', 'unlock', 'calendar', 'doc', 'card', 'eye', 'home', 'bell'];

export function logo(site) {
  return html`<a class="logo" href="index.html" aria-label="${esc(site.brand.name)}: на главную">${logoMark()}<span>${esc(site.brand.name)}</span></a>`;
}

function header(site, page) {
  const mode = page.hdr || 'dark';
  return html`
<header class="hdr" data-hdr="${mode}">
  <div class="container hdr__in">
    ${logo(site)}
    <nav class="hdr__nav" aria-label="Основное меню">
      ${site.nav.map((n) => `<a class="hdr__link" href="${n.href}"${page.key === n.key ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`)}
    </nav>
    <div class="hdr__tools">
      <a class="hdr__phone" href="tel:${site.contacts.phoneHref}">${esc(site.contacts.phone)}</a>
      <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Переключить тему: день или ночь" aria-pressed="false">
        ${icon('sun', { cls: 'i--sun', size: 22 })}${icon('moon', { cls: 'i--moon', size: 22 })}
      </button>
      <a class="icon-btn" href="cabinet.html#favorites" aria-label="Избранное">
        ${icon('heart', { size: 22 })}<span class="icon-btn__badge" data-fav-count>0</span>
      </a>
      <a class="btn btn--sm hdr__cab" href="cabinet.html">${icon('user', { size: 18 })}<span>Кабинет</span></a>
      <button class="icon-btn burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mnav">
        ${icon('menu', { cls: 'i--menu' })}${icon('close', { cls: 'i--close' })}
      </button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav" inert>
  <nav class="mnav__list" aria-label="Мобильное меню">
    ${[...site.nav, { href: 'cabinet.html', label: 'Личный кабинет' }].map(
      (n, i) => `<a class="mnav__link" href="${n.href}" style="--i:${i}"><span class="mono">0${i + 1}</span>${esc(n.label)}</a>`,
    )}
  </nav>
  <div class="mnav__foot">
    <a href="tel:${site.contacts.phoneHref}">${esc(site.contacts.phone)}</a>
    <span>${esc(site.contacts.hours)}</span>
  </div>
</div>`;
}

function footer(site) {
  const c = site.contacts;
  const l = site.legal;
  return html`
<footer class="ftr dark">
  <div class="container">
    <div class="ftr__top">
      <div class="ftr__about">
        ${logo(site)}
        <p>${esc(site.brand.tagline)}. Покупка, продажа, аренда, срочный выкуп и подбор займа под залог: онлайн, без визитов в офис.</p>
        <button class="btn" type="button" data-modal-open="lead-modal" data-topic="Консультация">${`<span>Оставить заявку</span>`}${icon('arrow-right', { cls: 'btn__arrow', size: 20 })}</button>
      </div>
      <nav class="ftr__col" aria-label="Направления">
        <h3>Направления</h3>
        ${site.nav.filter((n) => n.key !== 'catalog').map((n) => `<a href="${n.href}">${esc(n.label)}</a>`)}
      </nav>
      <nav class="ftr__col" aria-label="Сервисы">
        <h3>Сервисы</h3>
        <a href="catalog.html">Каталог объектов</a>
        <a href="index.html#tour">3D-туры</a>
        <a href="index.html#showing">Показ по коду доступа</a>
        <a href="kuplya-prodazha.html#check">Проверка недвижимости</a>
        <a href="cabinet.html">Личный кабинет</a>
      </nav>
      <div class="ftr__col">
        <h3>Связаться</h3>
        <a class="ftr__phone" href="tel:${c.phoneHref}">${esc(c.phone)}</a>
        <a href="mailto:${c.email}">${esc(c.email)}</a>
        <a href="${c.telegram}">Telegram</a>
        <a href="${c.whatsapp}">WhatsApp</a>
        <span class="small muted">${esc(c.hours)}</span>
      </div>
    </div>
  </div>
  <div class="ftr__word" aria-hidden="true">${esc(site.brand.name)}</div>
  <div class="container">
    <div class="ftr__legal">
      <div class="ftr__legal-row">
        <span>© ${new Date().getFullYear()} ${esc(l.company)}</span>
        <span>ИНН ${esc(l.inn)}</span>
        <span>ОГРН ${esc(l.ogrn)}</span>
        <span>${esc(l.address)}</span>
        <a href="policy.html">Политика конфиденциальности</a>
      </div>
      <p>${esc(l.loanDisclaimer)}</p>
      <p>Информация на сайте носит справочный характер и не является публичной офертой.${site.demo ? ' Сайт работает в режиме шаблона: объекты, цены и условия показаны для примера.' : ''}</p>
    </div>
  </div>
</footer>`;
}

function leadModal(site) {
  return html`
<div class="modal" id="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title" inert>
  <div class="modal__backdrop"></div>
  <div class="modal__box">
    <button class="icon-btn modal__close" type="button" data-modal-close aria-label="Закрыть">${icon('close')}</button>
    <p class="eyebrow" data-modal-topic data-default="Заявка">Заявка</p>
    <h2 class="modal__title" id="lead-modal-title" style="margin-top:12px">Оставьте контакты, перезвоним</h2>
    <p class="muted" style="margin-bottom:20px">Ответим на вопросы и подскажем следующий шаг. В офис ехать не нужно.</p>
    ${leadForm({ type: 'callback', submit: 'Жду звонка', topic: true })}
  </div>
</div>`;
}

export function layout({ site, page, body }) {
  const title = page.title ? `${page.title} | ${site.brand.name}` : `${site.brand.name}: ${site.brand.tagline.toLowerCase()}`;
  const clientCfg = { demo: site.demo, forms: site.forms, loan: site.loan, buyout: site.buyout, showing: site.showing, brand: site.brand.name };
  return html`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description || '')}">
<meta name="theme-color" content="#0C1626">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.description || '')}">
<meta property="og:locale" content="ru_RU">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/geologica-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/geologica-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<script>
(function(d){var e=d.documentElement;e.classList.add('js');
try{if(localStorage.getItem('theme')==='dark')e.setAttribute('data-theme','dark');
if(!sessionStorage.getItem('pre')&&!/[?&]nopre/.test(location.search)&&!matchMedia('(prefers-reduced-motion: reduce)').matches){sessionStorage.setItem('pre','1');e.classList.add('pre-on')}}catch(_){}
setTimeout(function(){if(!window.__ok){e.classList.remove('js');e.classList.remove('pre-on')}},4000)})(document);
</script>
<style>html.pre-on body::before{content:"";position:fixed;inset:0;z-index:499;background:#0C1626}</style>
<link rel="stylesheet" href="assets/css/app.css">
</head>
<body class="${page.bodyClass || ''}" data-brand="${esc(site.brand.name)}" data-page="${page.key || ''}">
<a class="skip" href="#main">К содержимому</a>
${page.progress ? '<div class="progress" aria-hidden="true"></div>' : ''}
${header(site, page)}
<main id="main">
${body}
</main>
${page.noFooter ? '' : footer(site)}
${leadModal(site)}
${JS_ICONS.map((n) => `<template id="ico-${n}">${icon(n, { size: 20 })}</template>`)}
<script>window.SITE=${JSON.stringify(clientCfg)};</script>
${(page.data || []).map((src) => `<script src="${src}"></script>`)}
<script src="assets/js/core.js" defer></script>
${(page.scripts || []).map((s) => `<script src="assets/js/${s}" defer></script>`)}
</body>
</html>`;
}
