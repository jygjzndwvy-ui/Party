/* Страница объекта: галерея, запись на показ, «поделиться». */
(function () {
  'use strict';
  var d = document, w = window;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  function start() {
    var App = w.App;

    // ── Галерея ────────────────────────────────────────────────────────────
    $$('[data-gallery]').forEach(function (g) {
      var slides = $$('.gallery__slide', g), thumbs = $$('.gallery__thumb', g), stage = $('.gallery__stage', g);
      var now = $('[data-gallery-now]', g), name = $('[data-gallery-name]', g), cur = 0;
      function go(n, dir) {
        n = (n + slides.length) % slides.length;
        if (n === cur) return;
        var from = slides[cur], to = slides[n];
        dir = dir || (n > cur ? 1 : -1);
        slides.forEach(function (s) { s.classList.remove('is-active', 'is-leaving'); });
        from.classList.add('is-leaving');
        to.style.setProperty('--dir', dir);
        from.style.setProperty('--dir', dir);
        to.classList.add('is-active');
        thumbs.forEach(function (t, i) { t.classList.toggle('is-active', i === n); });
        cur = n;
        now.textContent = n + 1;
        name.textContent = to.getAttribute('data-name');
        if (thumbs[n] && thumbs[n].scrollIntoView) thumbs[n].scrollIntoView({ block: 'nearest', inline: 'center', behavior: App.reduce ? 'auto' : 'smooth' });
      }
      g.addEventListener('click', function (e) {
        if (e.target.closest('[data-gallery-prev]')) go(cur - 1, -1);
        else if (e.target.closest('[data-gallery-next]')) go(cur + 1, 1);
        else { var t = e.target.closest('[data-gallery-go]'); if (t) go(+t.getAttribute('data-gallery-go')); }
      });
      stage.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { go(cur - 1, -1); e.preventDefault(); }
        if (e.key === 'ArrowRight') { go(cur + 1, 1); e.preventDefault(); }
      });
      var sx = null;
      stage.addEventListener('pointerdown', function (e) { sx = e.clientX; });
      stage.addEventListener('pointerup', function (e) {
        if (sx === null) return;
        var dx = e.clientX - sx; sx = null;
        if (Math.abs(dx) > 46) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      });
    });

    // ── Запись на показ: ближайшие дни и время ─────────────────────────────
    $$('[data-booking]').forEach(function (form) {
      var daysBox = $('[data-booking-days]', form), timesBox = $('[data-booking-times]', form);
      var wd = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'], mo = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      var today = new Date(), html = '';
      for (var i = 1; i <= 6; i++) {
        var day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        var label = (i === 1 ? 'Завтра, ' : wd[day.getDay()] + ', ') + day.getDate() + ' ' + mo[day.getMonth()];
        html += '<label class="chip"><input type="radio" name="day" value="' + label + '"' + (i === 1 ? ' checked' : '') + '>' + label + '</label>';
      }
      daysBox.innerHTML = html;
      timesBox.innerHTML = ['10:00', '12:00', '14:00', '16:00', '18:00', '19:30'].map(function (t, n) {
        return '<label class="chip"><input type="radio" name="time" value="' + t + '"' + (n === 3 ? ' checked' : '') + '>' + t + '</label>';
      }).join('');
      function slot() {
        var text = (form.elements.day.value || '') + ' в ' + (form.elements.time.value || '');
        $$('[data-booking-slot]', form).forEach(function (el) { el.textContent = text; });
      }
      form.addEventListener('change', slot);
      slot();
      // показ сохраняется в браузере, чтобы появиться в личном кабинете
      form.addEventListener('leadsent', function (e) {
        try {
          var list = JSON.parse(localStorage.getItem('showings') || '[]');
          list.unshift({ id: e.detail.fields.object_id, object: e.detail.fields.object, day: e.detail.fields.day, time: e.detail.fields.time, at: Date.now() });
          localStorage.setItem('showings', JSON.stringify(list.slice(0, 20)));
        } catch (err) { /* хранилище недоступно */ }
      });
    });

    // ── Поделиться ─────────────────────────────────────────────────────────
    d.addEventListener('click', function (e) {
      if (!e.target.closest('[data-share]')) return;
      var data = { title: d.title, url: location.href };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { App.toast('Ссылка скопирована'); }, function () { App.toast('Скопируйте ссылку из адресной строки', 'info'); });
    });

    // нижняя панель с ценой появляется, когда карточка с кнопками ушла из вида
    var bar = $('.obj-bar'), side = $('.buy-card');
    if (bar && side && 'IntersectionObserver' in w) {
      new IntersectionObserver(function (en) { bar.classList.toggle('is-on', !en[0].isIntersecting); }, { threshold: 0.2 }).observe(side);
    }
  }

  if (w.App && d.readyState !== 'loading') start();
  else d.addEventListener('DOMContentLoaded', start);
})();
