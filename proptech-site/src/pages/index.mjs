// Главная страница. Тексты лежат в content/home.mjs.
import { html, esc } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { home as T } from '../../content/home.mjs';
import { btn, arrow, sectionHead, leadForm, faq, marquee, sceneBg, tour, lockWidget, reportWidget, scoreWidget, ctaBand } from '../partials/blocks.mjs';

const pane = (it, i, on) => html`
<span class="pane__layer pane__layer--${on ? 'on' : 'off'}"${on ? ' aria-hidden="true"' : ''}>
  <span class="pane__top"><span class="mono">0${i + 1}</span><span class="pane__ico">${icon(it.icon, { draw: !on, size: 40 })}</span></span>
  <span class="pane__main">
    ${on ? `<span class="pane__title">${it.title}</span>` : `<h3 class="pane__title">${it.title}</h3>`}
    <span class="pane__text">${it.text}</span>
  </span>
  <span class="pane__foot">
    <span class="pane__tags">${it.tags.map((t) => `<span class="tag">${t}</span>`)}</span>
    <span class="pane__go">${icon('arrow-up-right', { size: 22 })}</span>
  </span>
</span>`;

export default ({ site, objects, card }) => {
  const sc = sceneBg({ near: true, tags: T.hero.tags, seed: 7 });
  const teaser = [...objects.filter((o) => o.isNew), ...objects.filter((o) => !o.isNew && o.tour)].slice(0, 9);

  const body = html`
<section class="hero on-dark" ${sc.attrs}>
  ${sc.html}
  <div class="container hero__in">
    <div class="hero__text">
      <p class="eyebrow" data-reveal>${T.hero.eyebrow}</p>
      <h1 class="hero__title" data-split>${T.hero.title}</h1>
      <p class="lead" data-reveal style="--i:4">${T.hero.lead}</p>
      <div class="hero__cta" data-reveal style="--i:5">
        ${btn(T.hero.primary, { href: 'catalog.html', cls: 'btn--lg', magnetic: true })}
        ${btn(T.hero.secondary, { cls: 'btn--lg btn--ghost', ico: false, attrs: 'data-modal-open="lead-modal" data-topic="Заявка с главной"' })}
      </div>
    </div>
  </div>
</section>

<div class="search-wrap container" data-reveal style="--i:6">
  <form class="search" action="catalog.html" method="get" data-search aria-label="Быстрый поиск по каталогу">
    <div class="seg" role="radiogroup" aria-label="Тип сделки">
      <label class="seg__btn"><input type="radio" name="deal" value="sale" checked>Купить</label>
      <label class="seg__btn"><input type="radio" name="deal" value="rent">Снять</label>
    </div>
    <label class="search__field"><span>Тип</span>
      <select class="select" name="type"><option value="">Любой</option><option value="flat">Квартира</option><option value="studio">Студия</option><option value="house">Дом</option><option value="commercial">Помещение</option></select>
    </label>
    <label class="search__field"><span>Комнат</span>
      <select class="select" name="rooms"><option value="">Любое число</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4 и больше</option></select>
    </label>
    <label class="search__field"><span>Бюджет до</span>
      <select class="select" name="priceMax" data-price-sale="8000000,12000000,16000000,25000000" data-price-rent="40000,60000,100000,150000"><option value="">Без ограничений</option></select>
    </label>
    <button class="btn search__go" type="submit"><span>Показать <b data-search-count>${objects.filter((o) => o.deal === 'sale').length}</b> <span data-search-word>объектов</span></span>${arrow()}</button>
  </form>
</div>

<div class="strip">${marquee(T.marquee)}</div>

<section class="section" id="services">
  <div class="container">
    ${sectionHead({ eyebrow: T.services.eyebrow, title: T.services.title, lead: T.services.lead })}
    <div class="panes" data-panes data-reveal="scale">
      ${T.services.items.map((it, i) => `<a class="pane${i === 0 ? ' is-lit' : ''}" href="${it.href}" data-cursor="Открыть">${pane(it, i, false)}${pane(it, i, true)}</a>`)}
    </div>
  </div>
</section>

<section class="section section--flush-top deal" id="deal">
  <div class="container">
    ${sectionHead({ eyebrow: T.deal.eyebrow, title: T.deal.title, lead: T.deal.lead })}
    <div class="deal__grid" data-deal>
      <div class="deal__sticky" aria-hidden="true">
        <div class="phone">
          <div class="phone__screen">
            <div class="phone__hdr"><span class="mono">Сделка 0417</span><span class="mono"><b data-deal-now>1</b> / ${T.deal.steps.length}</span></div>
            <div class="phone__stage">
              ${T.deal.steps.map((s, i) => `<div class="phone__slide${i === 0 ? ' is-active' : ''}"><span class="phone__ico">${icon(s.icon, { draw: true, size: 64 })}</span><b>${s.title}</b><span class="phone__status"><i></i>${s.status}</span></div>`)}
            </div>
            <div class="phone__list">
              ${T.deal.steps.map((s) => `<span class="phone__row"><i>${icon('check', { size: 12 })}</i>${s.title}</span>`)}
            </div>
          </div>
        </div>
      </div>
      <div class="deal__col">
        <div class="deal__line" aria-hidden="true"><i></i></div>
        <ol class="deal__steps">
          ${T.deal.steps.map(
            (s, i) => html`
          <li class="deal__step${i === 0 ? ' is-active' : ''}">
            <span class="deal__num mono">0${i + 1}</span>
            <div class="deal__body">
              <span class="deal__ico">${icon(s.icon, { size: 26 })}</span>
              <h3 class="h3">${s.title}</h3>
              <p>${s.text}</p>
              <span class="tag tag--ok">${icon('check', { size: 14 })}${s.status}</span>
            </div>
          </li>`,
          )}
        </ol>
      </div>
    </div>
  </div>
</section>

<section class="section band dark" id="tour">
  <div class="container tour-sec">
    <div class="tour-sec__text">
      <p class="eyebrow" data-reveal>${T.tour.eyebrow}</p>
      <h2 class="h2" data-split>${T.tour.title}</h2>
      <p class="lead" data-reveal>${T.tour.text}</p>
      <ul class="ticks" data-stagger>
        ${T.tour.points.map((p) => `<li data-reveal>${icon('check', { size: 18 })}<span>${p}</span></li>`)}
      </ul>
      ${site.demo ? `<p class="tour-sec__note" data-reveal>${icon('info', { size: 16 })}<span>${T.tour.note}</span></p>` : ''}
    </div>
    <div class="tour-sec__view" data-reveal="clip">${tour({ demo: site.demo })}</div>
  </div>
</section>

<section class="section" id="showing">
  <div class="container bento">
    <article class="bento__card bento__card--lock dark" data-reveal>
      <div class="bento__text">
        <p class="eyebrow">${T.showing.eyebrow}</p>
        <h2 class="h3">${T.showing.title}</h2>
        <p class="muted">${T.showing.text}</p>
        <a class="arrow-link" href="catalog.html?showing=1"><span>${T.showing.link}</span><span class="arrow-link__ico">${icon('arrow-right', { size: 18 })}</span></a>
      </div>
      ${lockWidget({ minutes: site.showing.codeMinutes })}
    </article>
    <article class="bento__card bento__card--check" id="check" data-reveal style="--i:1">
      <div class="bento__text">
        <p class="eyebrow">${T.check.eyebrow}</p>
        <h2 class="h3">${T.check.title}</h2>
        <p class="muted">${T.check.text}</p>
        <a class="arrow-link" href="kuplya-prodazha.html#check"><span>${T.check.link}</span><span class="arrow-link__ico">${icon('arrow-right', { size: 18 })}</span></a>
      </div>
      ${reportWidget({ demo: site.demo })}
    </article>
  </div>
</section>

<section class="section section--flush-top" id="objects">
  <div class="container">
    <div class="section-head">
      <div class="section-head__main">
        <p class="eyebrow" data-reveal>${T.catalog.eyebrow}</p>
        <h2 class="h2" data-split>${T.catalog.title}</h2>
      </div>
      <div class="section-head__side section-head__side--row" data-reveal>
        <a class="arrow-link" href="catalog.html"><span>${T.catalog.link}</span><span class="arrow-link__ico">${icon('arrow-right', { size: 18 })}</span></a>
      </div>
    </div>
  </div>
  <div class="carousel" data-carousel data-reveal>
    <div class="carousel__track" tabindex="0" aria-label="Подборка объектов">
      ${teaser.map(card)}
      <a class="carousel__more" href="catalog.html"><span class="h3">Ещё ${objects.length - teaser.length} в каталоге</span><span class="arrow-link__ico">${icon('arrow-right', { size: 22 })}</span></a>
    </div>
    <div class="container carousel__nav">
      <button class="icon-btn carousel__btn" type="button" data-carousel-prev aria-label="Назад">${icon('arrow-left')}</button>
      <button class="icon-btn carousel__btn" type="button" data-carousel-next aria-label="Вперёд">${icon('arrow-right')}</button>
    </div>
  </div>
</section>

<section class="section section--flush-top" id="rent">
  <div class="container rentband">
    <div class="rentband__text">
      <p class="eyebrow" data-reveal>${T.rent.eyebrow}</p>
      <h2 class="h2" data-split>${T.rent.title}</h2>
      <p class="lead" data-reveal>${T.rent.text}</p>
      <ol class="flow" data-stagger>
        ${T.rent.flow.map((f, i) => `<li data-reveal><span class="mono">0${i + 1}</span>${f}</li>`)}
      </ol>
      <div data-reveal>${btn(T.rent.link, { href: 'arenda.html', cls: 'btn--dark' })}</div>
    </div>
    <div class="payw" data-pay data-inview aria-hidden="true">
      <div class="payw__card payw__card--main">
        <div class="payw__top">
          <span class="payw__ico">${icon('refresh', { size: 20 })}</span>
          <div><b>Автоплатёж</b><span>Аренда, ${esc(objects.find((o) => o.deal === 'rent')?.address || '')}</span></div>
          <span class="payw__switch"><i></i></span>
        </div>
        <ul class="payw__rows">
          ${['Март', 'Апрель', 'Май'].map((m, i) => `<li style="--i:${i}"><span>${m}</span><b>${(objects.find((o) => o.deal === 'rent')?.price || 0).toLocaleString('ru-RU')} ₽</b><span class="payw__st">${icon('check', { size: 14 })}<em>${i === 2 ? 'Сегодня' : 'Списано'}</em></span></li>`)}
        </ul>
        <div class="payw__next"><span>Следующее списание</span><b>5 июня</b></div>
      </div>
      <div class="payw__card payw__card--note">${icon('umbrella', { size: 20 })}<div><b>Имущество застраховано</b><span>Полис действует весь срок аренды</span></div></div>
      <div class="payw__card payw__card--toast">${icon('bell', { size: 20 })}<div><b>Платёж получен</b><span>Деньги у собственника</span></div></div>
      ${site.demo ? '<span class="demo-note payw__demo">пример экрана</span>' : ''}
    </div>
  </div>
</section>

<section class="section band dark" id="scoring">
  <div class="container scoring">
    <div class="scoring__text">
      <p class="eyebrow" data-reveal>${T.scoring.eyebrow}</p>
      <h2 class="h2" data-split>${T.scoring.title}</h2>
      <p class="lead" data-reveal>${T.scoring.text}</p>
      <ul class="kinds" data-stagger>
        ${T.scoring.kinds.map((k, i) => `<li data-reveal><span class="mono">0${i + 1}</span><b>${k.title}</b><p>${k.text}</p></li>`)}
      </ul>
    </div>
    <div class="scoring__widget" data-reveal="scale">${scoreWidget({ demo: site.demo })}</div>
  </div>
</section>

<section class="section" id="faq">
  <div class="container faq-sec">
    <div class="faq-sec__head">
      <p class="eyebrow" data-reveal>${T.faq.eyebrow}</p>
      <h2 class="h2" data-split>${T.faq.title}</h2>
      <p class="muted" data-reveal>Не нашли ответ? Напишите нам, ответим в течение рабочего дня.</p>
      <div data-reveal>${btn('Задать вопрос', { cls: 'btn--dark', attrs: 'data-modal-open="lead-modal" data-topic="Вопрос"' })}</div>
    </div>
    ${faq(T.faq.items)}
  </div>
</section>

${ctaBand({
  eyebrow: T.cta.eyebrow,
  title: T.cta.title,
  text: T.cta.text,
  form: leadForm({
    type: 'callback',
    submit: T.cta.submit,
    extra: `<label class="field"><span class="field__label">Что вас интересует</span><select class="select" name="interest">${T.cta.options.map((o) => `<option>${o}</option>`).join('')}</select></label>`,
  }),
})}`;

  return {
    file: 'index.html',
    key: 'home',
    title: T.meta.title,
    description: T.meta.description,
    hdr: 'dark',
    body,
    scripts: ['data.js', 'card.js', 'scene.js', 'tour.js', 'widgets.js'],
  };
};
