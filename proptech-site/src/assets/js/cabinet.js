/* Личный кабинет (демо): вход по коду, вкладки, избранное, показы, подпись
   документов. Всё работает в браузере без сервера. Когда появится сервер,
   вход и данные нужно будет брать с него: места для этого помечены ниже. */
(function () {
  'use strict';
  var d = document, w = window;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { /* хранилище недоступно */ }
    return null;
  }

  function start() {
    var App = w.App, box = $('[data-cabinet]');
    if (!box) return;
    var tabsBox = $('[data-tabs]', box);

    // ── Вкладки и адрес страницы (#favorites, #showings…) ──────────────────
    function openTab(key, silent) {
      var tab = $('[data-tab="' + key + '"]', box);
      if (!tab) return;
      $$('[data-tab]', box).forEach(function (t) { var on = t === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
      $$('[data-panel]', box).forEach(function (p) {
        var on = p.getAttribute('data-panel') === key;
        p.hidden = !on;
        if (on && !App.reduce) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = 'step-in .55s var(--ease-out) both'; }
        if (on) $$('[data-inview]', p).forEach(function (el) { el.classList.add('is-in'); el.dispatchEvent(new CustomEvent('inview')); });
      });
      if (!silent) { try { history.replaceState(null, '', '#' + key); } catch (e) { /* file:// */ } }
      if (key === 'favorites') renderFav();
      if (key === 'showings') renderShowings();
    }
    tabsBox.addEventListener('tabchange', function (e) { openTab(e.detail); });
    d.addEventListener('click', function (e) {
      var go = e.target.closest('[data-go-tab]');
      if (go) { e.preventDefault(); openTab(go.getAttribute('data-go-tab')); w.scrollTo({ top: 0, behavior: App.reduce ? 'auto' : 'smooth' }); }
    });
    w.addEventListener('hashchange', function () { openTab(location.hash.slice(1), true); });

    // ── Избранное: берём из браузера и рисуем теми же карточками ───────────
    function renderFav() {
      var grid = $('[data-fav-grid]', box), empty = $('[data-fav-empty]', box);
      var ids = App.fav.list();
      var list = (w.OBJECTS || []).filter(function (o) { return ids.indexOf(o.id) > -1; });
      grid.innerHTML = list.map(function (o) { return w.Obj.card(o, { demo: (w.SITE || {}).demo }); }).join('');
      empty.hidden = list.length > 0;
      grid.hidden = !list.length;
      App.fav.sync();
    }
    d.addEventListener('favchange', function () { if (!$('[data-panel="favorites"]', box).hidden) renderFav(); });

    // ── Показы: записи, сделанные на страницах объектов ────────────────────
    function renderShowings() {
      var ul = $('[data-showings]', box), empty = $('[data-showings-empty]', box);
      var list = store('showings') || [];
      ul.innerHTML = '';
      list.forEach(function (s, n) {
        var li = d.createElement('li');
        li.className = 'rows__item';
        li.innerHTML = '<span class="rows__ico">' + App.icon('calendar') + '</span><div class="rows__main"><b></b><span></span></div><span class="tag tag--lit">Код придёт за 15 минут</span><button class="btn btn--sm btn--quiet" type="button"><span>Отменить</span></button>';
        $('b', li).textContent = (s.day || '') + ' в ' + (s.time || '');
        $('.rows__main span', li).textContent = s.object || '';
        $('button', li).addEventListener('click', function () {
          list.splice(n, 1); store('showings', list); renderShowings(); nextShowing();
          App.toast('Запись отменена');
        });
        ul.appendChild(li);
      });
      empty.hidden = list.length > 0;
      ul.hidden = !list.length;
    }
    function nextShowing() {
      var list = store('showings') || [];
      if (!list.length) return;
      var when = $('[data-show-when]', box), obj = $('[data-show-object]', box);
      if (when) when.textContent = list[0].day + ', ' + list[0].time;
      if (obj) obj.textContent = list[0].object;
    }

    // ── Код доступа: цифры «прокручиваются» при показе ─────────────────────
    $$('[data-codebox]', box).forEach(function (cb) {
      var digits = $$('.codebox__digits b', cb), btn = $('[data-code-show]', cb), shown = false, timer = 0;
      btn.addEventListener('click', function () {
        shown = !shown;
        clearTimeout(timer);
        digits.forEach(function (b, n) {
          var val = shown ? Math.floor(Math.random() * 10) : '•';
          if (App.reduce) { b.textContent = val; return; }
          b.style.transition = 'none'; b.style.transform = 'translateY(-100%)'; b.textContent = val;
          void b.offsetWidth;
          b.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1) ' + n * 70 + 'ms'; b.style.transform = 'none';
        });
        cb.classList.toggle('is-open', shown);
        $('span', btn).textContent = shown ? 'Скрыть код' : 'Показать код';
        if (shown) timer = setTimeout(function () { if (shown) btn.click(); }, 20000); // код сам прячется через 20 секунд
      });
    });

    // ── Подпись документа ──────────────────────────────────────────────────
    function docsLeft() { var el = $('[data-docs-wait]', box); if (el) el.textContent = $$('.doc:not(.is-signed)', box).length; }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sign]');
      if (!b) return;
      var row = b.closest('.doc');
      row.classList.add('is-signing');
      setTimeout(function () { row.classList.remove('is-signing'); row.classList.add('is-signed'); docsLeft(); App.toast('Документ подписан'); }, App.reduce ? 0 : 1500);
    });
    docsLeft();

    // ── Профиль и автоплатёж ───────────────────────────────────────────────
    var profile = $('[data-profile]', box);
    function fillUser() {
      var u = store('cabUser') || {};
      if (u.name) { $('[data-cab-name]', box).textContent = u.name; $('[data-cab-hello]', box).textContent = ', ' + u.name; }
      if (u.phone) $('[data-cab-phone]', box).textContent = u.phone;
      if (profile) ['name', 'phone', 'email'].forEach(function (k) { if (u[k]) profile.elements[k].value = u[k]; });
    }
    if (profile) profile.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = store('cabUser') || {};
      ['name', 'phone', 'email'].forEach(function (k) { u[k] = profile.elements[k].value.trim(); });
      store('cabUser', u); fillUser();
      App.toast('Профиль сохранён');
    });
    var auto = $('[data-autopay]', box);
    if (auto) auto.addEventListener('change', function () { App.toast(auto.checked ? 'Автоплатёж включён' : 'Автоплатёж выключен'); });

    // ── Вход (демо). Настоящий вход: отправка телефона и кода на сервер. ───
    var login = $('[data-login]'), form = $('[data-login-form]');
    function enter() {
      try { sessionStorage.setItem('cabAuth', '1'); } catch (e) { /* не страшно */ }
      d.body.classList.add('is-auth');
      fillUser(); nextShowing();
      openTab((location.hash.slice(1) && $('[data-tab="' + location.hash.slice(1) + '"]', box)) ? location.hash.slice(1) : 'overview', true);
    }
    var authed = false;
    try { authed = sessionStorage.getItem('cabAuth') === '1'; } catch (e) { /* не страшно */ }
    if (authed) enter();
    if (form) {
      var otp = $$('.otp__in', form);
      otp.forEach(function (inp, i) {
        inp.addEventListener('input', function () {
          inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
          if (inp.value && otp[i + 1]) otp[i + 1].focus();
        });
        inp.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !inp.value && otp[i - 1]) otp[i - 1].focus(); });
        inp.addEventListener('paste', function (e) {
          var t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, otp.length);
          if (!t) return;
          e.preventDefault();
          t.split('').forEach(function (c, n) { if (otp[n]) otp[n].value = c; });
          otp[Math.min(t.length, otp.length) - 1].focus();
        });
      });
      form.addEventListener('click', function (e) { if (e.target.closest('[data-step-next]')) setTimeout(function () { if (otp[0].offsetParent) otp[0].focus(); }, 80); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var code = otp.map(function (i) { return i.value; }).join('');
        if (code.length < otp.length) { var o = $('[data-otp]', form); o.style.animation = 'none'; void o.offsetWidth; o.style.animation = 'shake .4s'; otp[code.length].focus(); return; }
        var u = store('cabUser') || {};
        u.phone = form.elements.phone.value; store('cabUser', u);
        enter();
      });
      $('[data-login-skip]', form).addEventListener('click', enter);
    }
    d.addEventListener('click', function (e) {
      if (!e.target.closest('[data-cab-logout]')) return;
      try { sessionStorage.removeItem('cabAuth'); } catch (err) { /* не страшно */ }
      d.body.classList.remove('is-auth');
      if (form && form._go) form._go(0);
    });
  }

  if (w.App && d.readyState !== 'loading') start();
  else d.addEventListener('DOMContentLoaded', start);
})();
