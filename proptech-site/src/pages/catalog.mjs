// Каталог объектов с фильтрами. Объекты лежат в content/objects.mjs.
import { html, esc } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { leadForm, ctaBand } from '../partials/blocks.mjs';

const TYPES = [['flat', 'Квартира'], ['studio', 'Студия'], ['house', 'Дом'], ['commercial', 'Помещение']];
const ROOMS = [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4+']];
const SERVICES = [['tour', 'С 3D-туром', 'cube'], ['showing', 'Показ по коду', 'keypad'], ['checked', 'Проверен юристом', 'shield']];

export default ({ site, objects, districts, card }) => {
  const body = html`
<section class="cat-head">
  <div class="container">
    <ul class="crumbs" data-reveal><li><a href="index.html">Главная</a></li><li aria-current="page">Каталог</li></ul>
    <div class="cat-head__row">
      <h1 class="h1" data-split>Каталог объектов</h1>
      <div class="seg seg--lg" role="group" aria-label="Тип сделки" data-cat-deal data-reveal>
        <button class="seg__btn is-active" type="button" data-value="sale" aria-pressed="true">Купить</button>
        <button class="seg__btn" type="button" data-value="rent" aria-pressed="false">Снять</button>
      </div>
    </div>
  </div>
</section>

<section class="container cat" data-catalog>
  <aside class="filters" id="filters" aria-label="Фильтры">
    <form class="filters__form" data-filters>
      <div class="filters__head">
        <b>Фильтры</b>
        <button class="filters__reset" type="button" data-filters-reset>Сбросить</button>
        <button class="icon-btn filters__close" type="button" data-filters-close aria-label="Закрыть фильтры">${icon('close')}</button>
      </div>
      <fieldset class="filters__group">
        <legend>Тип</legend>
        <div class="filters__chips">${TYPES.map(([v, l]) => `<label class="chip"><input type="checkbox" name="type" value="${v}">${l}</label>`)}</div>
      </fieldset>
      <fieldset class="filters__group">
        <legend>Комнат</legend>
        <div class="filters__chips">${ROOMS.map(([v, l]) => `<label class="chip chip--sq"><input type="checkbox" name="rooms" value="${v}">${l}</label>`)}</div>
      </fieldset>
      <fieldset class="filters__group">
        <legend>Цена, ₽</legend>
        <div class="filters__pair">
          <input class="input" name="priceMin" inputmode="numeric" data-money placeholder="от" aria-label="Цена от">
          <input class="input" name="priceMax" inputmode="numeric" data-money placeholder="до" aria-label="Цена до">
        </div>
      </fieldset>
      <fieldset class="filters__group">
        <legend>Площадь, м²</legend>
        <div class="filters__pair">
          <input class="input" name="areaMin" inputmode="numeric" placeholder="от" aria-label="Площадь от">
          <input class="input" name="areaMax" inputmode="numeric" placeholder="до" aria-label="Площадь до">
        </div>
      </fieldset>
      <label class="filters__group">
        <span class="filters__legend">Район</span>
        <select class="select" name="district"><option value="">Любой</option>${districts.map((d) => `<option>${esc(d)}</option>`)}</select>
      </label>
      <fieldset class="filters__group">
        <legend>Сервисы</legend>
        <div class="filters__toggles">
          ${SERVICES.map(([v, l, ic]) => `<label class="toggle"><span class="toggle__label">${icon(ic, { size: 20 })}${l}</span><input type="checkbox" name="${v}" value="1"><span class="toggle__sw" aria-hidden="true"></span></label>`)}
        </div>
      </fieldset>
      <button class="btn btn--block filters__apply" type="button" data-filters-close><span>Показать <b data-cat-count-2>0</b></span></button>
    </form>
  </aside>

  <div class="cat__main">
    <div class="cat__bar">
      <p class="cat__count" aria-live="polite"><b data-cat-count>${objects.length}</b> <span data-cat-word>объектов</span></p>
      <div class="cat__tools">
        <button class="chip cat__filters-btn" type="button" data-filters-open>${icon('sliders', { size: 18 })}Фильтры<span class="cat__badge" data-cat-badge hidden>0</span></button>
        <label class="cat__sort"><span class="sr-only">Сортировка</span>
          <select class="select" name="sort" data-cat-sort>
            <option value="">Сначала новые</option>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
            <option value="area-desc">Сначала просторнее</option>
          </select>
        </label>
        <div class="seg view-toggle" role="group" aria-label="Вид списка" data-cat-view>
          <button class="seg__btn is-active" type="button" data-value="grid" aria-pressed="true" aria-label="Плиткой">${icon('grid', { size: 18 })}</button>
          <button class="seg__btn" type="button" data-value="list" aria-pressed="false" aria-label="Списком">${icon('list', { size: 18 })}</button>
        </div>
      </div>
    </div>
    <div class="cat__active" data-cat-active></div>
    <div class="cat__grid" data-cat-grid>${objects.map(card)}</div>
    <div class="cat__empty" data-cat-empty hidden>
      <span class="cat__empty-ico">${icon('search', { size: 32 })}</span>
      <h2 class="h3">Под такие условия объектов пока нет</h2>
      <p class="muted">Смягчите фильтры или оставьте заявку: подберём варианты вручную, в том числе из закрытой базы.</p>
      <div class="cat__empty-btns">
        <button class="btn btn--quiet" type="button" data-filters-reset><span>Сбросить фильтры</span></button>
        <button class="btn" type="button" data-modal-open="lead-modal" data-topic="Подбор объекта"><span>Подобрать для меня</span>${icon('arrow-right', { cls: 'btn__arrow', size: 20 })}</button>
      </div>
    </div>
    <div class="cat__more-wrap"><button class="btn btn--quiet" type="button" data-cat-more hidden><span>Показать ещё</span>${icon('arrow-down', { size: 20 })}</button></div>
  </div>
</section>
<div class="filters__backdrop" data-filters-close></div>

${ctaBand({
  eyebrow: 'Подбор',
  title: 'Не нашли подходящий объект?',
  text: 'Опишите, что ищете. Подберём варианты, пришлём 3D-туры и организуем показы по коду доступа.',
  form: leadForm({ type: 'buy', submit: 'Подобрать объект', extra: '<label class="field"><span class="field__label">Что ищете</span><textarea class="input" name="comment" placeholder="Например: двухкомнатная до 12 млн рядом с парком"></textarea></label>' }),
})}`;

  return {
    file: 'catalog.html',
    key: 'catalog',
    title: 'Каталог недвижимости: купить или снять',
    description: `Каталог объектов агентства «${site.brand.name}»: квартиры, студии, дома и помещения с 3D-турами, показами по коду доступа и юридической проверкой.`,
    hdr: 'solid',
    body,
    scripts: ['data.js', 'card.js', 'scene.js', 'catalog.js'],
  };
};
