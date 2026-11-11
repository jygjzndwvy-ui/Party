// Четыре раздела сайта. Тексты лежат в content/services.mjs,
// условия для калькуляторов в content/site.mjs.
import { html, esc, priceShort } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { services as S } from '../../content/services.mjs';
import { btn, arrow, sectionHead, leadForm, faq, sceneBg, steps, benefits, reportWidget, scoreWidget, ctaBand, SCORE_SETS } from '../partials/blocks.mjs';

const pick = (keys) => Object.fromEntries(keys.map((k) => [k, SCORE_SETS[k]]));

// ── Шапка страницы ──────────────────────────────────────────────────────────
function hero(T, widget, seed) {
  const sc = sceneBg({ t: 0.35, seed });
  return html`
<section class="page-hero on-dark" ${sc.attrs}>
  ${sc.html}
  <div class="container page-hero__in">
    <div class="page-hero__text">
      <ul class="crumbs" data-reveal><li><a href="index.html">Главная</a></li><li aria-current="page">${T.hero.eyebrow}</li></ul>
      <h1 class="h1" data-split>${T.hero.title}</h1>
      <p class="lead" data-reveal style="--i:3">${T.hero.lead}</p>
      <ul class="page-hero__points" data-reveal style="--i:4">${T.hero.points.map((p) => `<li>${icon('check', { size: 18 })}${p}</li>`)}</ul>
    </div>
    <div class="page-hero__widget" data-reveal="scale" style="--i:3">${widget}</div>
  </div>
</section>`;
}

// ── Карточка «кто вы»: покупаю/продаю, снимаю/сдаю ──────────────────────────
function sidesCard(T, group) {
  return html`
<div class="hero-card">
  <div class="seg seg--lg hero-card__seg" role="group" aria-label="Кто вы" data-switch="${group}">
    ${T.sides.map((s, i) => `<button class="seg__btn${i === 0 ? ' is-active' : ''}" type="button" data-value="${s.key}" aria-pressed="${i === 0}">${s.label}</button>`)}
  </div>
  ${T.sides.map(
    (s, i) => html`
  <div class="hero-card__side" data-show="${group}:${s.key}"${i ? ' hidden' : ''}>
    <h2 class="h4">${s.title}</h2>
    <ol class="hero-card__steps">${s.steps.map((st, n) => `<li><span class="mono">0${n + 1}</span>${st}</li>`)}</ol>
    ${s.cta.href ? btn(s.cta.label, { href: s.cta.href, cls: 'btn--block', magnetic: true }) : btn(s.cta.label, { cls: 'btn--block', magnetic: true, attrs: `data-modal-open="lead-modal" data-topic="${esc(s.cta.topic)}"` })}
  </div>`,
  )}
</div>`;
}

// ── Калькулятор займа ───────────────────────────────────────────────────────
function loanCalc(T, site) {
  const L = site.loan;
  const value = 9000000;
  const sum = 3000000;
  return html`
<div class="hero-card calc" data-loan-calc>
  <div class="calc__head"><h2 class="h4">${T.calc.title}</h2>${site.demo ? '<span class="demo-note">условия для примера</span>' : ''}</div>
  <label class="range">
    <span class="range__top"><span class="range__label">Стоимость недвижимости</span><b class="range__value" data-out="value">${priceShort(value)}</b></span>
    <input type="range" name="value" min="1000000" max="50000000" step="100000" value="${value}" aria-label="Стоимость недвижимости">
  </label>
  <label class="range">
    <span class="range__top"><span class="range__label">Сумма займа</span><b class="range__value" data-out="sum">${priceShort(sum)}</b></span>
    <input type="range" name="sum" min="${L.minSum}" max="${Math.floor((value * L.ltv) / 100)}" step="50000" value="${sum}" aria-label="Сумма займа">
    <span class="range__scale"><span>от ${priceShort(L.minSum)}</span><span>до <span data-out="max">${priceShort((value * L.ltv) / 100)}</span></span></span>
  </label>
  <label class="range">
    <span class="range__top"><span class="range__label">Срок</span><b class="range__value" data-out="term">3 года</b></span>
    <input type="range" name="term" min="${L.minTerm}" max="${L.maxTerm}" step="6" value="36" aria-label="Срок займа в месяцах">
  </label>
  <div class="calc__result">
    <div><span>Платёж в месяц, примерно</span><b data-out="pay" aria-live="polite">0 ₽</b></div>
    <div class="calc__ltv-box"><span>Доля от стоимости: <b data-out="ltv">0 %</b> из ${L.ltv} %</span><div class="calc__ltv"><i></i></div></div>
  </div>
  ${btn(T.calc.cta, { href: '#zayavka', cls: 'btn--block', magnetic: true })}
  <p class="calc__note">${T.calc.note}</p>
</div>`;
}

// ── Оценка срочного выкупа ──────────────────────────────────────────────────
function buyoutCalc(T, site) {
  const value = 8000000;
  return html`
<div class="hero-card calc" data-buyout-calc>
  <div class="calc__head"><h2 class="h4">${T.calc.title}</h2>${site.demo ? '<span class="demo-note">условия для примера</span>' : ''}</div>
  <label class="range">
    <span class="range__top"><span class="range__label">Рыночная стоимость объекта</span><b class="range__value" data-out="value">${priceShort(value)}</b></span>
    <input type="range" name="value" min="1000000" max="40000000" step="100000" value="${value}" aria-label="Рыночная стоимость объекта">
    <span class="range__scale"><span>1 млн ₽</span><span>40 млн ₽</span></span>
  </label>
  <div class="calc__result calc__result--range">
    <div><span>Выкупим примерно за</span><b aria-live="polite"><span data-out="from">0</span> <i>до</i> <span data-out="to">0</span></b></div>
    <ul class="calc__facts">
      <li>${icon('wallet', { size: 18 })}<span>Аванс в день обращения: <b data-out="advance">0</b></span></li>
      <li>${icon('timer', { size: 18 })}<span>Сделка: от ${site.buyout.daysFrom} до ${site.buyout.daysTo} дней</span></li>
    </ul>
  </div>
  ${btn(T.calc.cta, { href: '#zayavka', cls: 'btn--block', magnetic: true })}
  <p class="calc__note">${T.calc.note}</p>
</div>`;
}

// ── Форма-опрос: пара вопросов, затем контакты ──────────────────────────────
function quizForm(T, hidden = '') {
  const total = T.cta.quiz.length + 1;
  return html`
<form class="lead-form" data-lead="${T.cta.type}" data-steps novalidate>
  ${hidden}
  <div class="steps-form__bar">${Array.from({ length: total }, () => '<i></i>')}</div>
  ${T.cta.quiz.map(
    (q, i) => html`
  <fieldset class="steps-form__step" data-auto>
    <legend class="steps-form__q">${q.q}</legend>
    <div class="steps-form__opts steps-form__opts--col">${q.options.map(([v, l], n) => `<label class="chip chip--opt"><input type="radio" name="${q.name}" value="${v}"${n === 0 ? ' required' : ''}>${l}</label>`)}</div>
    <div class="steps-form__nav">${i ? `<button class="btn btn--quiet" type="button" data-step-prev aria-label="Назад">${icon('arrow-left', { size: 20 })}</button>` : ''}<span class="mono steps-form__count">Шаг ${i + 1} из ${total}</span></div>
  </fieldset>`,
  )}
  <div class="steps-form__step">
    <p class="steps-form__q">Куда прислать результат?</p>
    <div class="lead-form__row">
      <label class="field"><span class="field__label">Как к вам обращаться</span><input class="input" name="name" autocomplete="name" placeholder="Например, Анна" required><span class="field__error">Напишите имя</span></label>
      <label class="field"><span class="field__label">Телефон</span><input class="input" type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" required><span class="field__error">Проверьте номер: нужно 11 цифр</span></label>
    </div>
    <label class="check"><input type="checkbox" name="consent" required><span>Согласен на обработку персональных данных по <a class="link" href="policy.html">политике конфиденциальности</a></span></label>
    <div class="steps-form__nav">
      <button class="btn btn--quiet" type="button" data-step-prev aria-label="Назад">${icon('arrow-left', { size: 20 })}</button>
      <button class="btn btn--block" type="submit"><span>${T.cta.submit}</span>${arrow()}</button>
    </div>
  </div>
  <div class="lead-form__done" role="status">
    <span class="lead-form__done-ico">${icon('check', { size: 36 }).replace('<path', '<path pathLength="1"')}</span>
    <h3>Заявка принята</h3>
    <p>Перезвоним в рабочее время и расскажем о результате.</p>
    <button class="btn btn--quiet btn--sm" type="button" data-lead-again><span>Заполнить заново</span></button>
  </div>
</form>`;
}

function simpleForm(T) {
  return leadForm({
    type: T.cta.type,
    submit: 'Отправить заявку',
    extra: `<label class="field"><span class="field__label">Что вас интересует</span><select class="select" name="interest">${T.cta.options.map((o) => `<option>${o}</option>`).join('')}</select></label>`,
  });
}

// ── Общие секции ────────────────────────────────────────────────────────────
const benefitsSec = (T) => html`
<section class="section">
  <div class="container">
    ${sectionHead({ eyebrow: T.benefits.eyebrow, title: T.benefits.title })}
    ${benefits(T.benefits.items)}
  </div>
</section>`;

const stepsSec = (T) => html`
<section class="section section--flush-top">
  <div class="container">
    ${sectionHead({ eyebrow: T.steps.eyebrow, title: T.steps.title })}
    ${steps(T.steps.items)}
  </div>
</section>`;

const scoringSec = (T, site, keys, initial) => html`
<section class="section band dark" id="scoring">
  <div class="container scoring">
    <div class="scoring__text">
      <p class="eyebrow" data-reveal>${T.scoring.eyebrow}</p>
      <h2 class="h2" data-split>${T.scoring.title}</h2>
      <p class="lead" data-reveal>${T.scoring.text}</p>
      <ul class="kinds" data-stagger>${T.scoring.kinds.map((k, i) => `<li data-reveal><span class="mono">0${i + 1}</span><b>${k.title}</b><p>${k.text}</p></li>`)}</ul>
    </div>
    <div class="scoring__widget" data-reveal="scale">${scoreWidget({ demo: site.demo, sets: pick(keys), initial })}</div>
  </div>
</section>`;

const teaserSec = (T, objects, card) => {
  const list = objects.filter((o) => o.deal === T.teaser.deal).slice(0, 8);
  return html`
<section class="section">
  <div class="container">
    <div class="section-head">
      <div class="section-head__main"><p class="eyebrow" data-reveal>${T.teaser.eyebrow}</p><h2 class="h2" data-split>${T.teaser.title}</h2></div>
      <div class="section-head__side section-head__side--row" data-reveal><a class="arrow-link" href="catalog.html${T.teaser.deal === 'rent' ? '?deal=rent' : ''}"><span>Весь каталог</span><span class="arrow-link__ico">${icon('arrow-right', { size: 18 })}</span></a></div>
    </div>
  </div>
  <div class="carousel" data-carousel data-reveal>
    <div class="carousel__track" tabindex="0" aria-label="Подборка объектов">${list.map(card)}</div>
    <div class="container carousel__nav">
      <button class="icon-btn carousel__btn" type="button" data-carousel-prev aria-label="Назад">${icon('arrow-left')}</button>
      <button class="icon-btn carousel__btn" type="button" data-carousel-next aria-label="Вперёд">${icon('arrow-right')}</button>
    </div>
  </div>
</section>`;
};

const faqSec = (T) => html`
<section class="section section--flush-top" id="faq">
  <div class="container faq-sec">
    <div class="faq-sec__head">
      <p class="eyebrow" data-reveal>Вопросы</p>
      <h2 class="h2" data-split>Частые вопросы</h2>
      <div data-reveal>${btn('Задать свой вопрос', { cls: 'btn--dark', attrs: 'data-modal-open="lead-modal" data-topic="Вопрос"' })}</div>
    </div>
    ${faq(T.faq)}
  </div>
</section>`;

export default ({ site, objects, card }) => {
  const pages = [];
  const make = (key, T, body, extraScripts = []) =>
    pages.push({ file: T.file, key, title: T.meta.title, description: T.meta.description, hdr: 'dark', progress: true, body, scripts: ['data.js', 'card.js', 'scene.js', 'widgets.js', ...extraScripts] });

  // ── Купля-продажа ─────────────────────────────────────────────────────────
  {
    const T = S.buy;
    make('buy', T, html`
${hero(T, sidesCard(T, 'side'), 31)}
${benefitsSec(T)}
${stepsSec(T)}
<section class="section band dark" id="check">
  <div class="container split">
    <div class="split__text">
      <p class="eyebrow" data-reveal>${T.check.eyebrow}</p>
      <h2 class="h2" data-split>${T.check.title}</h2>
      <p class="lead" data-reveal>${T.check.text}</p>
      <dl class="deflist" data-stagger>${T.check.items.map(([k, v]) => `<div data-reveal><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
      <div class="callout" data-reveal>${icon('umbrella', { size: 24 })}<div><b>${T.check.insurance.title}</b><p>${T.check.insurance.text}</p></div></div>
    </div>
    <div class="split__widget" data-reveal="scale">${reportWidget({ demo: site.demo })}</div>
  </div>
</section>
${teaserSec(T, objects, card)}
${faqSec(T)}
${ctaBand({ title: T.cta.title, text: T.cta.text, form: simpleForm(T), seed: 32 })}`);
  }

  // ── Аренда ────────────────────────────────────────────────────────────────
  {
    const T = S.rent;
    make('rent', T, html`
${hero(T, sidesCard(T, 'side'), 41)}
${benefitsSec(T)}
${stepsSec(T)}
${scoringSec(T, site, ['tenant', 'owner'], 'tenant')}
${teaserSec(T, objects, card)}
${faqSec(T)}
${ctaBand({ title: T.cta.title, text: T.cta.text, form: simpleForm(T), seed: 42 })}`);
  }

  // ── Займ под залог ────────────────────────────────────────────────────────
  {
    const T = S.loan;
    make('loan', T, html`
${hero(T, loanCalc(T, site), 51)}
<div class="container"><div class="callout callout--legal" data-reveal>${icon('info', { size: 24 })}<div><b>Мы брокер, а не кредитор</b><p>${esc(site.legal.loanDisclaimer)}</p></div></div></div>
${benefitsSec(T)}
${stepsSec(T)}
${scoringSec(T, site, ['borrower'], 'borrower')}
${faqSec(T).replace('section--flush-top', '')}
${ctaBand({
  title: T.cta.title,
  text: T.cta.text,
  form: quizForm(T, '<input type="hidden" name="sum" data-loan-sum><input type="hidden" name="term_months" data-loan-term><input type="hidden" name="property_value" data-loan-value>'),
  seed: 52,
})}`);
  }

  // ── Срочный выкуп ─────────────────────────────────────────────────────────
  {
    const T = S.buyout;
    make('buyout', T, html`
${hero(T, buyoutCalc(T, site), 61)}
${benefitsSec(T)}
${stepsSec(T)}
<section class="section band dark">
  <div class="container">
    ${sectionHead({ eyebrow: T.compare.eyebrow, title: T.compare.title, lead: T.compare.text })}
    <div class="compare" role="table" aria-label="${T.compare.title}" data-reveal>
      <div class="compare__row compare__row--head" role="row">
        <span role="columnheader"></span>
        <span role="columnheader">${T.compare.cols[0]}</span>
        <span role="columnheader" class="compare__lit">${icon('bolt', { size: 18 })}${T.compare.cols[1]}</span>
      </div>
      ${T.compare.rows.map(([k, a, b], i) => `<div class="compare__row" role="row" style="--i:${i}"><span role="rowheader" class="mono">${k}</span><span role="cell">${a}</span><span role="cell" class="compare__lit">${b}</span></div>`)}
    </div>
  </div>
</section>
${faqSec(T).replace('section--flush-top', '')}
${ctaBand({ title: T.cta.title, text: T.cta.text, form: quizForm(T, '<input type="hidden" name="price" data-buyout-value>'), seed: 62 })}`);
  }

  return pages;
};
