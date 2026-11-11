// Страница объекта. Создаётся по одной на каждый объект из content/objects.mjs.
import { html, esc, plural } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { roomArt, planSvg, PLANS, mapArt } from '../lib/art.mjs';
import { tour, reportWidget, leadForm, arrow } from '../partials/blocks.mjs';

const SCENE_NAMES = { living: 'Гостиная', bedroom: 'Спальня', kitchen: 'Кухня', studio: 'Комната', hall: 'Прихожая', house: 'Фасад', shop: 'Вход', gallery: 'Комната' };

// Площади комнат на схеме: делим общую площадь пропорционально плану.
function roomAreas(o) {
  const pl = PLANS[o.plan] || PLANS.two;
  const total = pl.rooms.reduce((s, r) => s + r.w * r.h, 0);
  return Object.fromEntries(pl.rooms.map((r) => [r.k, +((o.area * r.w * r.h) / total).toFixed(1)]));
}

function page(o, { site, objects, card, Obj }) {
  const title = Obj.title(o);
  const rent = o.deal === 'rent';
  const slides = o.photos?.length
    ? o.photos.map((src, i) => ({ html: `<img src="${esc(src)}" alt="${esc(title)}: фото ${i + 1}" loading="${i ? 'lazy' : 'eager'}">`, name: `Фото ${i + 1}` }))
    : (o.scenes || ['living']).map((sc, i) => ({ html: roomArt(sc, { palette: o.palette, seed: `${o.id}${i ? i : ''}`, flip: i % 2 === 1, label: `${title}: ${SCENE_NAMES[sc] || 'комната'}, иллюстрация` }), name: SCENE_NAMES[sc] || 'Комната' }));
  slides.push({ html: `<div class="gallery__plan">${planSvg(o.plan, { areas: roomAreas(o) })}</div>`, name: 'Планировка', plan: true });

  const facts = [
    ['Общая площадь', `${String(o.area).replace('.', ',')} м²`],
    o.kitchen ? ['Кухня', `${String(o.kitchen).replace('.', ',')} м²`] : null,
    o.type === 'house' ? ['Этажей', o.floors] : ['Этаж', `${o.floor} из ${o.floors}`],
    o.rooms ? ['Комнат', o.rooms] : null,
    ['Год постройки', o.year],
  ].filter(Boolean);

  const similar = objects.filter((x) => x.id !== o.id && x.deal === o.deal).sort((a, b) => Math.abs(a.price - o.price) - Math.abs(b.price - o.price)).slice(0, 6);

  const body = html`
<section class="obj-head">
  <div class="container">
    <ul class="crumbs" data-reveal><li><a href="index.html">Главная</a></li><li><a href="catalog.html${rent ? '?deal=rent' : ''}">${rent ? 'Аренда' : 'Продажа'}</a></li><li aria-current="page">${title}</li></ul>
    <div class="obj-head__row">
      <div class="obj-head__main">
        <div class="obj-head__tags" data-reveal>
          ${o.isNew ? '<span class="tag tag--lit">Новое</span>' : ''}
          ${o.tour ? `<span class="tag">${icon('cube', { size: 14 })}3D-тур</span>` : ''}
          ${o.showing ? `<span class="tag">${icon('keypad', { size: 14 })}Показ по коду</span>` : ''}
          ${o.checked ? `<span class="tag tag--ok">${icon('check', { size: 14 })}Проверен юристом</span>` : ''}
          ${site.demo ? '<span class="demo-note">демо-объект</span>' : ''}
        </div>
        <h1 class="h1 obj-head__title" data-split>${title}</h1>
        <p class="obj-head__addr" data-reveal>${icon('pin', { size: 20 })}<span>${esc(o.district)} район, ${esc(o.address)}</span></p>
      </div>
      <div class="obj-head__actions" data-reveal>
        <button class="chip obj-head__fav" type="button" data-fav="${o.id}" aria-pressed="false">${icon('heart', { size: 18 })}<span>В избранное</span></button>
        <button class="chip" type="button" data-share>${icon('send', { size: 18 })}<span>Поделиться</span></button>
      </div>
    </div>
  </div>
</section>

<section class="container obj-layout">
  <div class="obj-main">
    <div class="gallery" data-gallery data-reveal="clip">
      <div class="gallery__stage" tabindex="0" aria-roledescription="галерея" aria-label="Галерея объекта: листайте стрелками">
        ${slides.map((s, i) => `<div class="gallery__slide${i === 0 ? ' is-active' : ''}${s.plan ? ' gallery__slide--plan' : ''}" data-name="${s.name}">${s.html}</div>`)}
        <div class="gallery__ui">
          <span class="tag tag--glass gallery__count"><b data-gallery-now>1</b> / ${slides.length} · <span data-gallery-name>${slides[0].name}</span></span>
          ${o.tour ? `<a class="tag tag--lit gallery__tour" href="#tour">${icon('cube', { size: 14 })}Открыть 3D-тур</a>` : ''}
        </div>
        <button class="icon-btn gallery__nav gallery__nav--prev" type="button" data-gallery-prev aria-label="Предыдущий кадр">${icon('arrow-left')}</button>
        <button class="icon-btn gallery__nav gallery__nav--next" type="button" data-gallery-next aria-label="Следующий кадр">${icon('arrow-right')}</button>
      </div>
      <div class="gallery__thumbs" role="group" aria-label="Кадры">
        ${slides.map((s, i) => `<button class="gallery__thumb${i === 0 ? ' is-active' : ''}${s.plan ? ' gallery__thumb--plan' : ''}" type="button" data-gallery-go="${i}" aria-label="${s.name}">${s.plan ? icon('area', { size: 22 }) : s.html.replace(/role="img" aria-label="[^"]*"/, 'aria-hidden="true"').replace(/alt="[^"]*"/, 'alt=""')}</button>`)}
      </div>
    </div>

    <dl class="facts" data-stagger>
      ${facts.map(([k, v]) => `<div class="facts__item" data-reveal><dt class="mono">${k}</dt><dd>${v}</dd></div>`)}
    </dl>

    <section class="obj-block" data-reveal>
      <h2 class="h3">Об объекте</h2>
      <p class="obj-block__text">${esc(o.text)}</p>
      <ul class="features">${(o.features || []).map((f) => `<li>${icon('check', { size: 16 })}${esc(f)}</li>`)}</ul>
    </section>

    ${o.tour
      ? html`<section class="obj-block" id="tour" data-reveal>
      <div class="obj-block__head"><h2 class="h3">3D-тур</h2><p class="muted">Осмотритесь в квартире, не выходя из дома</p></div>
      ${tour({ url: o.tourUrl || '', plan: o.plan === 'three' || o.plan === 'one' || o.plan === 'studio' ? 'two' : o.plan, demo: site.demo })}
    </section>`
      : ''}

    ${o.showing
      ? html`<section class="obj-block showing" id="showing" data-reveal>
      <div class="obj-block__head"><h2 class="h3">Онлайн-показ по коду доступа</h2><p class="muted">Приходите в удобное время, агент не нужен</p></div>
      <ol class="showing__steps">
        <li><span class="showing__ico">${icon('calendar', { size: 22 })}</span><b>Выберите время</b><span>Свободные слоты на ближайшие дни</span></li>
        <li><span class="showing__ico">${icon('keypad', { size: 22 })}</span><b>Получите код</b><span>Одноразовый, действует ${site.showing.codeMinutes} минут</span></li>
        <li><span class="showing__ico">${icon('unlock', { size: 22 })}</span><b>Откройте дверь</b><span>Смотрите спокойно, без спешки</span></li>
      </ol>
      <button class="btn" type="button" data-modal-open="showing-modal"><span>Записаться на показ</span>${arrow()}</button>
    </section>`
      : ''}

    ${o.checked
      ? html`<section class="obj-block" id="check" data-reveal>
      <div class="obj-block__head"><h2 class="h3">Юридическая проверка</h2><p class="muted">Объект проверен, полный отчёт пришлём по запросу</p></div>
      ${reportWidget({ demo: site.demo, address: `${o.address}` })}
    </section>`
      : ''}

    <section class="obj-block" data-reveal>
      <div class="obj-block__head"><h2 class="h3">Расположение</h2><p class="muted">${esc(o.district)} район, ${esc(o.address)}</p></div>
      <div class="map-wrap">${mapArt(o.id)}${site.demo ? '<span class="demo-note map-wrap__note">схема для примера: подключите карту</span>' : ''}</div>
    </section>
  </div>

  <aside class="obj-side">
    <div class="buy-card" data-reveal="scale">
      <div class="buy-card__price">
        <b>${Obj.price(o)}</b>
        <span class="mono">${Obj.perMeter(o)}</span>
      </div>
      <div class="buy-card__btns">
        ${o.showing ? `<button class="btn btn--block" type="button" data-modal-open="showing-modal" data-magnetic><span>Записаться на показ</span>${arrow()}</button>` : `<button class="btn btn--block" type="button" data-modal-open="lead-modal" data-topic="Показ объекта ${o.id}" data-magnetic><span>Договориться о показе</span>${arrow()}</button>`}
        ${o.tour ? `<a class="btn btn--block btn--quiet" href="#tour">${icon('cube', { size: 20 })}<span>Смотреть 3D-тур</span></a>` : ''}
        <button class="btn btn--block btn--ghost" type="button" data-modal-open="lead-modal" data-topic="Вопрос по объекту ${o.id}"><span>Задать вопрос</span></button>
      </div>
      <ul class="buy-card__list">
        <li>${icon('shield', { size: 18 })}${o.checked ? 'Юридически проверен' : 'Проверим перед сделкой'}</li>
        <li>${icon('pen', { size: 18 })}${rent ? 'Договор аренды онлайн' : 'Электронная регистрация сделки'}</li>
        <li>${icon(rent ? 'refresh' : 'wallet', { size: 18 })}${rent ? 'Автоплатежи и страховка' : 'Безопасные расчёты'}</li>
      </ul>
      <div class="buy-card__mgr">
        <span class="buy-card__ava">${icon('user', { size: 22 })}</span>
        <div><b>Ваш менеджер</b><a href="tel:${site.contacts.phoneHref}">${esc(site.contacts.phone)}</a></div>
        <span class="mono buy-card__id">ID ${o.id}</span>
      </div>
    </div>
  </aside>
</section>

${similar.length
  ? html`<section class="section section--tight">
  <div class="container"><div class="section-head"><div class="section-head__main"><p class="eyebrow" data-reveal>Похожие</p><h2 class="h2" data-split>Ещё ${similar.length} ${plural(similar.length, 'вариант', 'варианта', 'вариантов')} рядом по цене</h2></div></div></div>
  <div class="carousel" data-carousel data-reveal>
    <div class="carousel__track" tabindex="0" aria-label="Похожие объекты">${similar.map(card)}</div>
    <div class="container carousel__nav">
      <button class="icon-btn carousel__btn" type="button" data-carousel-prev aria-label="Назад">${icon('arrow-left')}</button>
      <button class="icon-btn carousel__btn" type="button" data-carousel-next aria-label="Вперёд">${icon('arrow-right')}</button>
    </div>
  </div>
</section>`
  : ''}

<div class="obj-bar">
  <div class="obj-bar__price"><b>${Obj.price(o)}</b><span>${title}</span></div>
  <button class="btn btn--sm" type="button" data-modal-open="${o.showing ? 'showing-modal' : 'lead-modal'}" data-topic="Показ объекта ${o.id}"><span>${o.showing ? 'Записаться' : 'Показ'}</span></button>
</div>

<div class="modal" id="showing-modal" role="dialog" aria-modal="true" aria-labelledby="showing-title" inert>
  <div class="modal__backdrop"></div>
  <div class="modal__box">
    <button class="icon-btn modal__close" type="button" data-modal-close aria-label="Закрыть">${icon('close')}</button>
    <p class="eyebrow">Онлайн-показ</p>
    <h2 class="modal__title" id="showing-title" style="margin-top:12px">Когда вам удобно посмотреть?</h2>
    <p class="muted" style="margin-bottom:20px">${title}, ${esc(o.address)}</p>
    <form class="lead-form" data-lead="showing" data-steps data-booking novalidate>
      <input type="hidden" name="object_id" value="${o.id}">
      <input type="hidden" name="object" value="${esc(`${title}, ${o.address}`)}">
      <div class="steps-form__bar"><i></i><i></i></div>
      <div class="steps-form__step">
        <fieldset class="field"><legend class="field__label">День</legend><div class="steps-form__opts" data-booking-days></div></fieldset>
        <fieldset class="field"><legend class="field__label" style="margin-top:8px">Время</legend><div class="steps-form__opts" data-booking-times></div></fieldset>
        <div class="steps-form__nav"><button class="btn btn--block" type="button" data-step-next><span>Дальше</span>${arrow()}</button></div>
      </div>
      <div class="steps-form__step">
        <p class="booking__slot">${icon('calendar', { size: 18 })}<span data-booking-slot></span></p>
        <div class="lead-form__row">
          <label class="field"><span class="field__label">Как к вам обращаться</span><input class="input" name="name" autocomplete="name" placeholder="Например, Анна" required><span class="field__error">Напишите имя</span></label>
          <label class="field"><span class="field__label">Телефон для кода</span><input class="input" type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" required><span class="field__error">Проверьте номер: нужно 11 цифр</span></label>
        </div>
        <label class="check"><input type="checkbox" name="consent" required><span>Согласен на обработку персональных данных по <a class="link" href="policy.html">политике конфиденциальности</a></span></label>
        <div class="steps-form__nav">
          <button class="btn btn--quiet" type="button" data-step-prev aria-label="Назад">${icon('arrow-left', { size: 20 })}</button>
          <button class="btn btn--block" type="submit"><span>Записаться</span>${arrow()}</button>
        </div>
      </div>
      <div class="lead-form__done" role="status">
        <span class="lead-form__done-ico">${icon('check', { size: 36 }).replace('<path', '<path pathLength="1"')}</span>
        <h3>Вы записаны</h3>
        <p><span data-booking-slot></span>. Код от замка придёт в SMS за 15 минут до показа.</p>
        <a class="btn btn--quiet btn--sm" href="cabinet.html#showings"><span>Мои показы</span></a>
      </div>
    </form>
  </div>
</div>`;

  return {
    file: Obj.url(o),
    key: 'catalog',
    title: `${title}, ${o.address}: ${rent ? 'аренда' : 'продажа'}`,
    description: `${title} ${rent ? 'в аренду' : 'на продажу'}: ${o.district} район, ${o.address}. ${Obj.price(o)}. ${o.tour ? '3D-тур, ' : ''}${o.showing ? 'показ по коду доступа, ' : ''}онлайн-сделка.`.replace(/ /g, ' '),
    hdr: 'solid',
    bodyClass: 'page-object',
    body,
    scripts: ['data.js', 'card.js', 'tour.js', 'object.js'],
  };
}

export default (ctx) => ctx.objects.map((o) => page(o, ctx));
