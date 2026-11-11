// Личный кабинет: демо-версия интерфейса. Настоящие данные (вход, сделки,
// платежи, документы) появятся после подключения CRM и сервера: что именно
// нужно подключить, описано в README.
import { html, esc } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { logoMark } from '../lib/art.mjs';
import { home } from '../../content/home.mjs';

const TABS = [
  ['overview', 'Обзор', 'home'],
  ['favorites', 'Избранное', 'heart'],
  ['showings', 'Показы', 'keypad'],
  ['deal', 'Сделка', 'pen'],
  ['payments', 'Платежи', 'card'],
  ['docs', 'Документы', 'doc'],
  ['profile', 'Профиль', 'user'],
];

const DOCS = [
  { name: 'Договор аренды', meta: 'PDF, 4 страницы', state: 'wait' },
  { name: 'Акт приёма-передачи', meta: 'PDF, 2 страницы', state: 'wait' },
  { name: 'Отчёт о проверке объекта', meta: 'PDF, 6 страниц', state: 'done' },
  { name: 'Полис страхования имущества', meta: 'PDF, 3 страницы', state: 'done' },
];

export default ({ site, objects, Obj }) => {
  const rentObj = objects.find((o) => o.deal === 'rent') || objects[0];
  const saleObj = objects.find((o) => o.deal === 'sale') || objects[0];
  const steps = home.deal.steps;
  const current = 3; // на каком шаге «демо-сделка»
  const months = [['Март', 'done'], ['Апрель', 'done'], ['Май', 'done'], ['Июнь', 'next']];

  const body = html`
<section class="cab" data-cabinet>
  <div class="container cab__grid" data-tabs>
    <aside class="cab__side">
      <div class="cab__user">
        <span class="cab__ava">${icon('user', { size: 26 })}</span>
        <div><b data-cab-name>Гость</b><span data-cab-phone>Демо-кабинет</span></div>
      </div>
      <nav class="cab__nav" aria-label="Разделы кабинета">
        ${TABS.map(([k, label, ic], i) => `<button class="cab__tab${i === 0 ? ' is-active' : ''}" type="button" data-tab="${k}" aria-selected="${i === 0}">${icon(ic, { size: 20 })}<span>${label}</span>${k === 'favorites' ? '<span class="cab__num" data-fav-count>0</span>' : ''}</button>`)}
      </nav>
      <button class="cab__logout" type="button" data-cab-logout>${icon('logout', { size: 18 })}<span>Выйти</span></button>
    </aside>

    <div class="cab__main">
      ${site.demo ? `<p class="cab__demo">${icon('info', { size: 18 })}<span>Это демо-кабинет. Сделка, платежи и документы показаны для примера, избранное и записи на показ настоящие: они хранятся в вашем браузере.</span></p>` : ''}

      <div class="cab__panel" data-panel="overview">
        <h1 class="h2 cab__title">Добрый день<span data-cab-hello></span></h1>
        <div class="dash">
          <article class="dash__card dash__card--show dark">
            <header><span class="eyebrow">Ближайший показ</span><span class="tag tag--lit" data-show-when>Завтра, 16:00</span></header>
            <h2 class="h4" data-show-object>${Obj.title(saleObj)}, ${esc(saleObj.address)}</h2>
            <div class="codebox" data-codebox>
              <div class="codebox__digits" aria-live="polite">${[0, 1, 2, 3, 4, 5].map(() => '<span><b>•</b></span>')}</div>
              <button class="btn btn--sm" type="button" data-code-show>${icon('eye', { size: 18 })}<span>Показать код</span></button>
            </div>
            <p class="small muted">Код одноразовый и действует ${site.showing.codeMinutes} минут с начала показа.</p>
          </article>

          <article class="dash__card dash__card--deal">
            <header><span class="eyebrow">Сделка</span><a class="link small" href="#deal" data-go-tab="deal">Подробнее</a></header>
            <div class="ring" style="--v:${Math.round(((current + 0.5) / steps.length) * 100)}" data-inview>
              <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="ring__bg"/><circle cx="60" cy="60" r="52" class="ring__val" pathLength="100"/></svg>
              <div class="ring__num"><b data-count="${Math.round(((current + 0.5) / steps.length) * 100)}">0</b><span>%</span></div>
            </div>
            <div><b class="h4">Шаг ${current + 1} из ${steps.length}: ${steps[current].title}</b><p class="small muted">${steps[current].status}. Дальше: ${steps[current + 1].title.toLowerCase()}.</p></div>
          </article>

          <article class="dash__card">
            <header><span class="eyebrow">Платежи</span><span class="tag tag--ok">${icon('check', { size: 14 })}Автоплатёж</span></header>
            <div class="dash__big"><b>${rentObj.price.toLocaleString('ru-RU')} ₽</b><span>спишется 5 июня</span></div>
            <p class="small muted">Аренда, ${esc(rentObj.address)}</p>
          </article>

          <article class="dash__card">
            <header><span class="eyebrow">Документы</span><a class="link small" href="#docs" data-go-tab="docs">Открыть</a></header>
            <div class="dash__big"><b data-docs-wait>2</b><span>ждут подписи</span></div>
            <p class="small muted">Подписываются электронной подписью прямо в кабинете.</p>
          </article>
        </div>
      </div>

      <div class="cab__panel" data-panel="favorites" hidden>
        <h1 class="h2 cab__title">Избранное</h1>
        <div class="cat__grid" data-fav-grid></div>
        <div class="cat__empty" data-fav-empty hidden>
          <span class="cat__empty-ico">${icon('heart', { size: 32 })}</span>
          <h2 class="h3">Здесь появятся объекты, которые вы отметили</h2>
          <p class="muted">Нажмите на сердечко в карточке объекта, и он сохранится в этом списке.</p>
          <a class="btn" href="catalog.html"><span>Перейти в каталог</span>${icon('arrow-right', { cls: 'btn__arrow', size: 20 })}</a>
        </div>
      </div>

      <div class="cab__panel" data-panel="showings" hidden>
        <h1 class="h2 cab__title">Показы</h1>
        <ul class="rows" data-showings></ul>
        <div class="cat__empty" data-showings-empty hidden>
          <span class="cat__empty-ico">${icon('keypad', { size: 32 })}</span>
          <h2 class="h3">Записей на показ пока нет</h2>
          <p class="muted">Выберите объект с меткой «Показ по коду» и забронируйте удобное время.</p>
          <a class="btn" href="catalog.html?showing=1"><span>Выбрать объект</span>${icon('arrow-right', { cls: 'btn__arrow', size: 20 })}</a>
        </div>
      </div>

      <div class="cab__panel" data-panel="deal" hidden>
        <h1 class="h2 cab__title">Сделка</h1>
        <p class="muted cab__sub">${Obj.title(saleObj)}, ${esc(saleObj.address)}</p>
        <ol class="track" data-inview>
          ${steps.map(
            (s, i) => html`
          <li class="track__step${i < current ? ' is-done' : i === current ? ' is-now' : ''}" style="--i:${i}">
            <span class="track__dot">${i < current ? icon('check', { size: 16 }) : icon(s.icon, { size: 18 })}</span>
            <div class="track__body">
              <b>${s.title}</b>
              <span>${i < current ? s.status : i === current ? 'В работе: ' + s.status.toLowerCase() : 'Впереди'}</span>
            </div>
            ${i === current ? `<button class="btn btn--sm" type="button" data-modal-open="lead-modal" data-topic="Вопрос по сделке"><span>Спросить менеджера</span></button>` : ''}
          </li>`,
          )}
        </ol>
      </div>

      <div class="cab__panel" data-panel="payments" hidden>
        <h1 class="h2 cab__title">Платежи</h1>
        <div class="pay-head">
          <div><span class="eyebrow">Автоплатёж</span><p class="muted small">Списываем аренду с карты •••• 0000 пятого числа</p></div>
          <label class="toggle"><span class="sr-only">Автоплатёж</span><input type="checkbox" checked data-autopay><span class="toggle__sw" aria-hidden="true"></span></label>
        </div>
        <ul class="rows">
          ${months.map(([m, st]) => `<li class="rows__item"><span class="rows__ico">${icon(st === 'done' ? 'check' : 'clock', { size: 18 })}</span><div class="rows__main"><b>${m}</b><span>Аренда, ${esc(rentObj.address)}</span></div><b class="rows__sum">${rentObj.price.toLocaleString('ru-RU')} ₽</b><span class="tag ${st === 'done' ? 'tag--ok' : 'tag--line'}">${st === 'done' ? 'Оплачено' : 'Спишется 5 июня'}</span></li>`)}
        </ul>
      </div>

      <div class="cab__panel" data-panel="docs" hidden>
        <h1 class="h2 cab__title">Документы</h1>
        <ul class="rows" data-docs>
          ${DOCS.map(
            (doc) => html`
          <li class="rows__item doc${doc.state === 'done' ? ' is-signed' : ''}">
            <span class="rows__ico">${icon('doc', { size: 18 })}</span>
            <div class="rows__main"><b>${doc.name}</b><span>${doc.meta}</span></div>
            <svg class="doc__sign" viewBox="0 0 120 40" aria-hidden="true"><path pathLength="1" d="M4 30c8-18 14-24 17-20s-9 22-3 21 12-22 17-20-4 18 2 17 9-15 14-14 0 12 6 11 10-9 16-9 8 6 14 5 12-4 26-8"/></svg>
            <span class="tag tag--ok doc__done">${icon('check', { size: 14 })}Подписан</span>
            <button class="btn btn--sm doc__btn" type="button" data-sign>${icon('pen', { size: 18 })}<span>Подписать</span></button>
          </li>`,
          )}
        </ul>
      </div>

      <div class="cab__panel" data-panel="profile" hidden>
        <h1 class="h2 cab__title">Профиль</h1>
        <form class="lead-form cab__form" data-profile novalidate>
          <div class="lead-form__row">
            <label class="field"><span class="field__label">Имя</span><input class="input" name="name" autocomplete="name" placeholder="Как к вам обращаться"></label>
            <label class="field"><span class="field__label">Телефон</span><input class="input" type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__"></label>
          </div>
          <label class="field"><span class="field__label">Почта для документов</span><input class="input" type="email" name="email" autocomplete="email" placeholder="name@example.ru"></label>
          <div class="filters__toggles">
            <label class="toggle"><span class="toggle__label">${icon('bell', { size: 20 })}Напоминать о показах</span><input type="checkbox" name="n1" checked><span class="toggle__sw" aria-hidden="true"></span></label>
            <label class="toggle"><span class="toggle__label">${icon('card', { size: 20 })}Сообщать о платежах</span><input type="checkbox" name="n2" checked><span class="toggle__sw" aria-hidden="true"></span></label>
            <label class="toggle"><span class="toggle__label">${icon('sparkle', { size: 20 })}Присылать новые объекты по моим фильтрам</span><input type="checkbox" name="n3"><span class="toggle__sw" aria-hidden="true"></span></label>
          </div>
          <button class="btn" type="submit"><span>Сохранить</span></button>
        </form>
      </div>
    </div>
  </div>
</section>

<div class="login" data-login>
  <div class="login__box">
    <a class="logo login__logo" href="index.html" aria-label="${esc(site.brand.name)}: на главную">${logoMark({ size: 40 })}<span>${esc(site.brand.name)}</span></a>
    <form class="lead-form" data-login-form data-steps novalidate>
      <div class="steps-form__step">
        <h1 class="h3">Вход в кабинет</h1>
        <p class="muted">Введите номер телефона, пришлём код в SMS.</p>
        <label class="field"><span class="field__label">Телефон</span><input class="input" type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" required><span class="field__error">Проверьте номер: нужно 11 цифр</span></label>
        <button class="btn btn--block" type="button" data-step-next><span>Получить код</span>${icon('arrow-right', { cls: 'btn__arrow', size: 20 })}</button>
        <button class="login__skip" type="button" data-login-skip>Посмотреть демо без входа</button>
      </div>
      <div class="steps-form__step">
        <h1 class="h3">Код из SMS</h1>
        <p class="muted">${site.demo ? 'В демо подойдёт любой код из четырёх цифр.' : 'Отправили код на ваш номер.'}</p>
        <div class="otp" data-otp>${[0, 1, 2, 3].map((i) => `<input class="input otp__in" inputmode="numeric" maxlength="1" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" aria-label="Цифра ${i + 1}">`)}</div>
        <div class="steps-form__nav">
          <button class="btn btn--quiet" type="button" data-step-prev aria-label="Назад">${icon('arrow-left', { size: 20 })}</button>
          <button class="btn btn--block" type="submit"><span>Войти</span></button>
        </div>
      </div>
    </form>
  </div>
</div>`;

  return {
    file: 'cabinet.html',
    key: 'cabinet',
    title: 'Личный кабинет',
    description: 'Личный кабинет клиента: избранные объекты, записи на показы по коду доступа, ход сделки, платежи и документы.',
    hdr: 'solid',
    bodyClass: 'page-cabinet',
    body,
    scripts: ['data.js', 'card.js', 'cabinet.js'],
  };
};
