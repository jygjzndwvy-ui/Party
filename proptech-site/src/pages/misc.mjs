// Служебные страницы: политика конфиденциальности (заготовка) и 404.
import { html, esc } from '../lib/html.mjs';
import { btn, sceneBg } from '../partials/blocks.mjs';

export default ({ site }) => {
  const l = site.legal;
  const c = site.contacts;
  const policy = html`
<section class="plain">
  <div class="container"><div class="plain__in">
    <ul class="crumbs"><li><a href="index.html">Главная</a></li><li aria-current="page">Политика конфиденциальности</li></ul>
    <h1 class="h1">Политика конфиденциальности</h1>
    <p class="todo">Это заготовка, а не готовый документ. Перед запуском сайта замените текст политикой, которую подготовит юрист с учётом закона «О персональных данных» (152-ФЗ): какие данные вы собираете, зачем, кому передаёте (CRM, банки-партнёры, страховые компании) и как долго храните.</p>
    <h2>Кто обрабатывает данные</h2>
    <p>${esc(l.company)}, ИНН ${esc(l.inn)}, ОГРН ${esc(l.ogrn)}. Адрес: ${esc(l.address)}.</p>
    <h2>Какие данные мы получаем</h2>
    <ul>
      <li>Имя и номер телефона, которые вы оставляете в формах на сайте.</li>
      <li>Сведения из анкет: параметры объекта, желаемая сумма и срок, удобное время показа.</li>
      <li>Технические данные о посещении сайта: источник перехода и рекламные метки.</li>
    </ul>
    <h2>Зачем</h2>
    <ul>
      <li>Чтобы связаться с вами и ответить на заявку.</li>
      <li>Чтобы подобрать объект, организовать показ или подготовить сделку.</li>
      <li>Чтобы передать заявку кредитору или страховой компании, если вы об этом попросили.</li>
    </ul>
    <h2>Как отозвать согласие</h2>
    <p>Напишите на <a class="link" href="mailto:${c.email}">${esc(c.email)}</a> или позвоните по номеру <a class="link" href="tel:${c.phoneHref}">${esc(c.phone)}</a>. Мы удалим ваши данные в срок, установленный законом.</p>
  </div></div>
</section>`;

  const sc = sceneBg({ near: true, t: 0.8, seed: 404 });
  const nf = html`
<section class="nf on-dark" ${sc.attrs}>
  ${sc.html}
  <div class="nf__in">
    <p class="nf__num" aria-hidden="true">404</p>
    <h1 class="h2">В этом окне свет не горит</h1>
    <p class="lead">Страницы с таким адресом нет. Возможно, объект уже продан или ссылка устарела.</p>
    <div class="hero__cta">${btn('На главную', { href: 'index.html', cls: 'btn--lg', magnetic: true })}${btn('В каталог', { href: 'catalog.html', cls: 'btn--lg btn--ghost', ico: false })}</div>
  </div>
</section>`;

  return [
    { file: 'policy.html', key: 'policy', title: 'Политика конфиденциальности', description: 'Политика обработки персональных данных.', hdr: 'solid', body: policy, scripts: [] },
    { file: '404.html', key: '404', title: 'Страница не найдена', description: 'Страницы с таким адресом нет.', hdr: 'dark', noFooter: true, body: nf, scripts: ['scene.js'] },
  ];
};
