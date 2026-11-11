// Блоки, из которых собираются страницы. Каждый блок: функция → HTML.
import { html, esc } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { wallParts, planSvg, PLANS, paletteColors } from '../lib/art.mjs';

export const arrow = (size = 20) => icon('arrow-right', { cls: 'btn__arrow', size });

export function btn(label, { href, cls = '', attrs = '', ico = true, magnetic = false } = {}) {
  const inner = `<span>${label}</span>${ico ? arrow() : ''}`;
  const m = magnetic ? ' data-magnetic' : '';
  return href ? `<a class="btn ${cls}" href="${href}"${m} ${attrs}>${inner}</a>` : `<button class="btn ${cls}" type="button"${m} ${attrs}>${inner}</button>`;
}

export function sectionHead({ eyebrow, title, lead, side = '', tag = 'h2', id = '' }) {
  return html`
<div class="section-head">
  <div class="section-head__main">
    ${eyebrow ? `<p class="eyebrow" data-reveal>${eyebrow}</p>` : ''}
    <${tag} class="h2"${id ? ` id="${id}"` : ''} data-split>${title}</${tag}>
  </div>
  ${lead || side ? `<div class="section-head__side" data-reveal>${lead ? `<p class="lead">${lead}</p>` : ''}${side}</div>` : ''}
</div>`;
}

// ── Форма заявки ────────────────────────────────────────────────────────────
// type: тип заявки, уходит в CRM и участвует в лид-скоринге
// extra: дополнительные поля (HTML), topic: скрытое поле «тема»
export function leadForm({ type = 'callback', submit = 'Отправить заявку', extra = '', topic = false, hidden = {}, doneTitle = 'Заявка принята', doneText = 'Перезвоним в рабочее время и подскажем следующий шаг.' } = {}) {
  return html`
<form class="lead-form" data-lead="${type}" novalidate>
  ${topic ? '<input type="hidden" name="topic" value="">' : ''}
  ${Object.entries(hidden).map(([k, v]) => `<input type="hidden" name="${k}" value="${esc(v)}">`)}
  ${extra}
  <div class="lead-form__row">
    <label class="field">
      <span class="field__label">Как к вам обращаться</span>
      <input class="input" name="name" autocomplete="name" placeholder="Например, Анна" required>
      <span class="field__error">Напишите имя</span>
    </label>
    <label class="field">
      <span class="field__label">Телефон</span>
      <input class="input" type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" required>
      <span class="field__error">Проверьте номер: нужно 11 цифр</span>
    </label>
  </div>
  <label class="check">
    <input type="checkbox" name="consent" required>
    <span>Согласен на обработку персональных данных по <a class="link" href="policy.html">политике конфиденциальности</a></span>
  </label>
  <button class="btn btn--block" type="submit"><span>${submit}</span>${arrow()}</button>
  <div class="lead-form__done" role="status">
    <span class="lead-form__done-ico">${icon('check', { size: 36 }).replace('<path', '<path pathLength="1"')}</span>
    <h3>${doneTitle}</h3>
    <p>${doneText}</p>
    <button class="btn btn--quiet btn--sm" type="button" data-lead-again><span>Отправить ещё одну</span></button>
  </div>
</form>`;
}

// ── Вопросы и ответы ────────────────────────────────────────────────────────
export function faq(items, { id = 'faq' } = {}) {
  return html`
<div class="acc" data-single>
  ${items.map(
    (it, i) => html`
  <div class="acc__item" data-reveal style="--i:${Math.min(i, 5)}">
    <h3 style="font:inherit;letter-spacing:inherit"><button class="acc__btn" type="button" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="${id}-${i}" id="${id}-b${i}"><span>${it.q}</span><span class="acc__ico" aria-hidden="true"></span></button>
    <div class="acc__panel" id="${id}-${i}" role="region" aria-labelledby="${id}-b${i}"><div><p>${it.a}</p></div></div></h3>
  </div>`,
  )}
</div>`;
}

// ── Бегущая строка ──────────────────────────────────────────────────────────
export function marquee(items, { speed = 0.6, dir = 'left', cls = '' } = {}) {
  return html`
<div class="marquee ${cls}" data-speed="${speed}" data-dir="${dir}" aria-hidden="true">
  <div class="marquee__track"><div class="marquee__group">${items.map((t) => `<span class="marquee__item">${t}</span><span class="marquee__sep"></span>`)}</div></div>
</div>`;
}

// ── Сцена с небом (для шапок страниц и нижнего блока) ───────────────────────
export function sceneBg({ near = false, tags = [], t = null, seed = 7 } = {}) {
  return {
    attrs: `data-scene data-seed="${seed}"${t !== null ? ` data-t="${t}"` : ''}${tags.length ? ` data-tags='${esc(JSON.stringify(tags))}'` : ''}`,
    html: html`
<div class="scene" aria-hidden="true">
  <canvas class="scene__sky"></canvas>
  ${near
    ? `<div class="scene__near">
    <div class="facade facade--b"><div class="facade__grid" data-cols="3" data-rows="6"></div></div>
    <div class="facade facade--a"><span class="facade__antenna"></span><div class="facade__grid" data-cols="4" data-rows="9" data-main></div></div>
  </div>`
    : ''}
  <div class="scene__shade"></div>
</div>`,
  };
}

// ── Демо 3D-тура ────────────────────────────────────────────────────────────
// Если у объекта есть ссылка на настоящий тур (Matterport и подобные),
// вместо демо вставляется iframe.
// Комната собрана из плоскостей в CSS 3D. Стены нарезаны на вертикальные
// полосы, пол и потолок на плитки: скрипт показывает только те части,
// что находятся перед камерой, поэтому картинка не «ломается» ни в одном браузере.
const TOUR_ROOMS = [
  { k: 'living', name: 'Гостиная', pal: 'blue', walls: ['living', 'studio', 'hall', 'gallery'], spots: [{ face: 's', x: 50.5, y: 62, go: 'kitchen', label: 'На кухню' }, { face: 'w', x: 22, y: 64, go: 'bedroom', label: 'В спальню' }] },
  { k: 'kitchen', name: 'Кухня', pal: 'sand', walls: ['kitchen', 'gallery', 'hall', 'studio'], spots: [{ face: 's', x: 50.5, y: 62, go: 'living', label: 'В гостиную' }] },
  { k: 'bedroom', name: 'Спальня', pal: 'sage', walls: ['bedroom', 'hall', 'gallery', 'studio'], spots: [{ face: 'e', x: 50.5, y: 62, go: 'living', label: 'В гостиную' }] },
];
const TOUR_FACES = [['n', 0], ['e', -90], ['s', 180], ['w', 90]];
const TOUR_N = 6; // на сколько частей режем каждую стену и сторону пола

export function tour({ url = '', plan = 'two', cls = '', demo = true } = {}) {
  if (url) {
    return `<div class="tour tour--embed ${cls}"><iframe src="${esc(url)}" title="3D-тур по объекту" loading="lazy" allow="fullscreen; xr-spatial-tracking" allowfullscreen></iframe></div>`;
  }
  const pl = PLANS[plan] || PLANS.two;
  const centers = Object.fromEntries(pl.rooms.map((r) => [r.k, [r.x + r.w / 2, r.y + r.h / 2]]));
  const mapSvg = planSvg(plan, { cls: 'plan tour__plan', labels: false }).replace(
    '</svg>',
    `<g class="tour__me"><path d="M0 0L-26 -46A52 52 0 0 1 26 -46Z"/><circle r="6"/></g></svg>`,
  );
  const idx = Array.from({ length: TOUR_N }, (_, i) => i);
  const sw = 500 / TOUR_N;
  const symbols = TOUR_ROOMS.map((room, ri) =>
    TOUR_FACES.map(([f], fi) => `<symbol id="tw-${room.k}-${f}" viewBox="0 0 500 300" preserveAspectRatio="none">${wallParts(room.walls[fi], room.pal, ri * 10 + fi, fi === 3)}</symbol>`).join(''),
  ).join('');
  return html`
<div class="tour ${cls}" data-tour data-n="${TOUR_N}" data-centers='${JSON.stringify(centers)}'>
  <svg class="tour__defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="tour-ao" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#080E1A" stop-opacity=".3"/><stop offset=".14" stop-color="#080E1A" stop-opacity="0"/><stop offset=".86" stop-color="#080E1A" stop-opacity="0"/><stop offset="1" stop-color="#080E1A" stop-opacity=".3"/></linearGradient>
    <linearGradient id="tour-ao-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080E1A" stop-opacity=".18"/><stop offset="1" stop-color="#080E1A" stop-opacity="0"/></linearGradient>
    ${symbols}
  </defs></svg>
  <div class="tour__view" tabindex="0" role="application" aria-roledescription="3D-тур" aria-label="Демо 3D-тура. Потяните мышью или нажимайте стрелки, чтобы осмотреться" data-cursor="Тяните">
    <div class="tour__cube">
      ${TOUR_ROOMS.map((room, ri) => {
        const p = paletteColors(room.pal);
        return html`
      <div class="tour__room${ri === 0 ? ' is-active' : ''}" data-room="${room.k}" style="--floor:${p.floor};--floor2:${p.floor2};--ceil:${p.wall}">
        ${TOUR_FACES.map(([f, ry]) => idx.map((i) => `<svg class="tour__strip" data-ry="${ry}" data-i="${i}" style="--ry:${ry}deg;--i:${i}" viewBox="${+(i * sw).toFixed(3)} 0 ${+sw.toFixed(3)} 300" preserveAspectRatio="none" aria-hidden="true"><use href="#tw-${room.k}-${f}" width="500" height="300"/></svg>`).join(''))}
        ${idx.map((j) => idx.map((i) => {
          // затемнение к стенам: чем дальше плитка от центра комнаты, тем темнее
          const d = Math.hypot(i - (TOUR_N - 1) / 2, j - (TOUR_N - 1) / 2) / Math.hypot((TOUR_N - 1) / 2, (TOUR_N - 1) / 2);
          const a = (0.3 * d * d).toFixed(2);
          return `<i class="tour__tile tour__tile--floor${(i + j) % 2 ? ' is-alt' : ''}" data-i="${i}" data-j="${j}" style="--i:${i};--j:${j};--a:${a}"></i><i class="tour__tile tour__tile--ceil" data-i="${i}" data-j="${j}" style="--i:${i};--j:${j};--a:${a}"></i>`;
        }).join(''))}
        ${room.spots.map((s) => {
          const ry = TOUR_FACES.find(([f]) => f === s.face)[1];
          return `<button class="tour__spot" type="button" data-go="${s.go}" data-ry="${ry}" data-u="${(s.x / 100 - 0.5).toFixed(3)}" data-v="${(s.y / 100 - 0.5).toFixed(3)}" style="--ry:${ry}deg;--u:${(s.x / 100 - 0.5).toFixed(3)};--v:${(s.y / 100 - 0.5).toFixed(3)}" data-nocursor><span class="tour__spot-dot"></span><span class="tour__spot-label">${s.label}</span></button>`;
        })}
      </div>`;
      })}
    </div>
    <div class="tour__flash"></div>
  </div>
  <div class="tour__top">
    <span class="tag tag--glass">${icon('cube', { size: 14 })} 3D-тур</span>
    ${demo ? '<span class="tag tag--glass">демо</span>' : ''}
  </div>
  <div class="tour__map" aria-hidden="true">${mapSvg}</div>
  <div class="tour__bar" data-nocursor>
    <div class="tour__rooms" role="group" aria-label="Комнаты">
      ${TOUR_ROOMS.map((r, i) => `<button class="tour__room-btn${i === 0 ? ' is-active' : ''}" type="button" data-go="${r.k}" aria-pressed="${i === 0}">${r.name}</button>`)}
    </div>
    <div class="tour__hint">${icon('orbit', { size: 18 })}<span>Тяните, чтобы осмотреться</span></div>
  </div>
</div>`;
}

// ── Показ по коду доступа: замок ────────────────────────────────────────────
export function lockWidget({ minutes = 30 } = {}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  return html`
<div class="lockw" data-lock data-inview aria-hidden="true">
  <div class="lockw__door">
    <div class="lockw__light"></div>
    <div class="lockw__panel"></div>
    <div class="lockw__device">
      <div class="lockw__screen"><span data-lock-screen>······</span></div>
      <div class="lockw__keys">${keys.map((k) => `<span data-k="${k}">${k}</span>`)}</div>
      <span class="lockw__led"></span>
    </div>
    <div class="lockw__handle"></div>
  </div>
  <div class="lockw__msg">
    <div class="lockw__msg-top"><span class="lockw__app">${icon('keypad', { size: 16 })}</span><span>Код для показа</span><span class="lockw__time mono" data-lock-time>${minutes}:00</span></div>
    <div class="lockw__code" data-lock-code>${[0, 1, 2, 3, 4, 5].map(() => '<span><b>0</b></span>')}</div>
    <div class="lockw__bar"><i></i></div>
    <p>Одноразовый. Действует ${minutes} минут</p>
  </div>
</div>`;
}

// ── Отчёт о проверке объекта ────────────────────────────────────────────────
export const REPORT_ROWS = [
  { t: 'Собственники и переходы прав', s: 'Чисто', k: 'ok' },
  { t: 'Обременения, аресты, залоги', s: 'Не найдено', k: 'ok' },
  { t: 'Суды и банкротство продавца', s: 'Не найдено', k: 'ok' },
  { t: 'Прописанные и права детей', s: 'Проверено', k: 'ok' },
  { t: 'Перепланировки', s: 'Есть замечание', k: 'warn' },
  { t: 'Долги за коммунальные услуги', s: 'Нет долгов', k: 'ok' },
];
export function reportWidget({ demo = true, address = 'ул. Садовая, 12, кв. 48' } = {}) {
  return html`
<div class="report" data-report data-inview>
  <div class="report__scan" aria-hidden="true"></div>
  <div class="report__head">
    <span class="report__ico">${icon('shield', { size: 22 })}</span>
    <div><b>Отчёт о проверке</b><span class="mono">${address}</span></div>
    ${demo ? '<span class="demo-note">пример</span>' : ''}
  </div>
  <ul class="report__rows">
    ${REPORT_ROWS.map((r, i) => `<li style="--i:${i}"><span>${r.t}</span><b class="report__st report__st--${r.k}">${r.k === 'ok' ? icon('check', { size: 14 }) : icon('info', { size: 14 })}${r.s}</b></li>`)}
  </ul>
  <div class="report__foot">
    <div class="report__risk"><span>Риск сделки</span><b>Низкий</b></div>
    <div class="report__meter"><i></i></div>
  </div>
</div>`;
}

// ── Скоринг: шкала надёжности ───────────────────────────────────────────────
export const SCORE_SETS = {
  borrower: { label: 'Заёмщик', value: 82, verdict: 'Высокая надёжность', factors: [['Платёжная дисциплина', 90], ['Долговая нагрузка', 74], ['Стабильность дохода', 85], ['Антифрод-проверка', 96]] },
  tenant: { label: 'Арендатор', value: 76, verdict: 'Надёжный жилец', factors: [['История аренды', 80], ['Подтверждённый доход', 72], ['Проверка документов', 94], ['Судебные дела', 88]] },
  owner: { label: 'Собственник', value: 91, verdict: 'Проверенный собственник', factors: [['Право собственности', 100], ['Чистота объекта', 92], ['Отзывы жильцов', 78], ['Антифрод-проверка', 95]] },
};
export function scoreWidget({ demo = true, sets = SCORE_SETS, initial = 'borrower' } = {}) {
  const keys = Object.keys(sets);
  return html`
<div class="score" data-score='${esc(JSON.stringify(sets))}' data-inview>
  <div class="score__top">
    ${keys.length > 1
      ? `<div class="seg" role="group" aria-label="Кого оцениваем">${keys.map((k) => `<button class="seg__btn${k === initial ? ' is-active' : ''}" type="button" data-value="${k}" aria-pressed="${k === initial}">${sets[k].label}</button>`).join('')}</div>`
      : `<span class="eyebrow">${sets[initial].label}</span>`}
    ${demo ? '<span class="demo-note">демо-данные</span>' : ''}
  </div>
  <div class="score__gauge">
    <svg viewBox="0 0 240 140" aria-hidden="true">
      <defs><linearGradient id="score-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F08A3C"/><stop offset=".55" stop-color="#FFC145"/><stop offset="1" stop-color="#FFE9B8"/></linearGradient></defs>
      <path class="score__arc-bg" d="M20 126A100 100 0 0 1 220 126" pathLength="100"/>
      <path class="score__arc" d="M20 126A100 100 0 0 1 220 126" pathLength="100" stroke="url(#score-g)"/>
      <g class="score__ticks">${Array.from({ length: 21 }, (_, i) => {
        const a = Math.PI - (Math.PI / 20) * i;
        const r1 = 84;
        const r2 = i % 5 === 0 ? 76 : 80;
        return `<line x1="${(120 + Math.cos(a) * r1).toFixed(1)}" y1="${(126 - Math.sin(a) * r1).toFixed(1)}" x2="${(120 + Math.cos(a) * r2).toFixed(1)}" y2="${(126 - Math.sin(a) * r2).toFixed(1)}"/>`;
      }).join('')}</g>
    </svg>
    <div class="score__num"><b data-score-num>0</b><span>из 100</span></div>
    <p class="score__verdict" data-score-verdict>${sets[initial].verdict}</p>
  </div>
  <ul class="score__factors">
    ${sets[initial].factors.map(([n, v], i) => `<li style="--i:${i}"><span data-score-name>${n}</span><b class="mono" data-score-val>${v}</b><div class="score__bar"><i style="--v:${v}%"></i></div></li>`)}
  </ul>
</div>`;
}

// ── Нумерованные шаги ───────────────────────────────────────────────────────
export function steps(items, { cls = '' } = {}) {
  return html`
<ol class="steps ${cls}" data-stagger>
  ${items.map(
    (s, i) => html`
  <li class="steps__item" data-reveal>
    <div class="steps__top"><span class="steps__num mono">${String(i + 1).padStart(2, '0')}</span><span class="steps__ico">${icon(s.icon || 'check', { draw: true, size: 28 })}</span></div>
    <h3 class="h4">${s.title}</h3>
    <p>${s.text}</p>
    ${s.tag ? `<span class="tag tag--line">${s.tag}</span>` : ''}
  </li>`,
  )}
</ol>`;
}

// ── Карточки преимуществ ────────────────────────────────────────────────────
export function benefits(items, { cols = 3 } = {}) {
  return html`
<ul class="benefits benefits--${cols}" data-stagger>
  ${items.map(
    (b) => html`
  <li class="benefit" data-reveal>
    <span class="benefit__ico">${icon(b.icon, { draw: true, size: 28 })}</span>
    <h3 class="h4">${b.title}</h3>
    <p>${b.text}</p>
  </li>`,
  )}
</ul>`;
}

// ── Нижний блок с заявкой ───────────────────────────────────────────────────
export function ctaBand({ eyebrow = 'Заявка', title, text, form, id = 'zayavka', seed = 21 }) {
  const sc = sceneBg({ t: 0.72, seed });
  return html`
<section class="cta section" id="${id}">
  <div class="container">
    <div class="cta__box on-dark" ${sc.attrs}>
      ${sc.html}
      <div class="cta__text">
        <p class="eyebrow" data-reveal>${eyebrow}</p>
        <h2 class="h2" data-split>${title}</h2>
        <p class="lead" data-reveal>${text}</p>
      </div>
      <div class="cta__form card" data-reveal="scale">${form}</div>
    </div>
  </div>
</section>`;
}
