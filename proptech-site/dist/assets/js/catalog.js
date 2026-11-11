/* Каталог: фильтры, сортировка, плавная перестановка карточек (FLIP),
   адрес страницы хранит выбранные фильтры, так что ссылкой можно делиться. */
(function () {
  'use strict';
  var d = document, w = window;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  function start() {
    var App = w.App, box = $('[data-catalog]');
    if (!box || !w.OBJECTS) return;
    var grid = $('[data-cat-grid]', box), form = $('[data-filters]', box), empty = $('[data-cat-empty]', box), more = $('[data-cat-more]', box);
    var countEl = $('[data-cat-count]', box), count2 = $('[data-cat-count-2]', box), wordEl = $('[data-cat-word]', box), activeBox = $('[data-cat-active]', box), badge = $('[data-cat-badge]', box);
    var dealSeg = $('[data-cat-deal]'), sortSel = $('[data-cat-sort]', box), viewSeg = $('[data-cat-view]', box);
    var PAGE = 9, shown = PAGE, first = true;
    var cards = {};
    $$('.obj', grid).forEach(function (el) { cards[el.getAttribute('data-id')] = el; });
    var state = { deal: 'sale', sort: '', view: 'grid' };
    var num = function (v) { var n = String(v || '').replace(/[^\d.]/g, ''); return n ? +n : 0; };

    // ── адрес страницы → состояние ─────────────────────────────────────────
    function readUrl() {
      var q = new URLSearchParams(location.search);
      if (q.get('deal') === 'rent') state.deal = 'rent';
      state.sort = q.get('sort') || '';
      ['type', 'rooms'].forEach(function (k) {
        var vals = (q.get(k) || '').split(',').filter(Boolean);
        $$('[name="' + k + '"]', form).forEach(function (i) { i.checked = vals.indexOf(i.value) > -1; });
      });
      ['priceMin', 'priceMax', 'areaMin', 'areaMax'].forEach(function (k) {
        var v = q.get(k);
        if (v) form.elements[k].value = /price/.test(k) ? (+v).toLocaleString('ru-RU') : v;
      });
      if (q.get('district')) form.elements.district.value = q.get('district');
      ['tour', 'showing', 'checked'].forEach(function (k) { form.elements[k].checked = q.get(k) === '1'; });
    }
    function filters() {
      var f = { type: [], rooms: [] };
      $$('[name="type"]:checked', form).forEach(function (i) { f.type.push(i.value); });
      $$('[name="rooms"]:checked', form).forEach(function (i) { f.rooms.push(i.value); });
      ['priceMin', 'priceMax', 'areaMin', 'areaMax'].forEach(function (k) { f[k] = num(form.elements[k].value); });
      f.district = form.elements.district.value;
      ['tour', 'showing', 'checked'].forEach(function (k) { f[k] = form.elements[k].checked; });
      return f;
    }
    function writeUrl(f) {
      var q = new URLSearchParams();
      if (state.deal !== 'sale') q.set('deal', state.deal);
      if (f.type.length) q.set('type', f.type.join(','));
      if (f.rooms.length) q.set('rooms', f.rooms.join(','));
      ['priceMin', 'priceMax', 'areaMin', 'areaMax'].forEach(function (k) { if (f[k]) q.set(k, f[k]); });
      if (f.district) q.set('district', f.district);
      ['tour', 'showing', 'checked'].forEach(function (k) { if (f[k]) q.set(k, '1'); });
      if (state.sort) q.set('sort', state.sort);
      var s = q.toString();
      try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) { /* file:// */ }
    }

    function match(o, f) {
      if (o.deal !== state.deal) return false;
      if (f.type.length && f.type.indexOf(o.type) < 0) return false;
      if (f.rooms.length) {
        var ok = f.rooms.some(function (r) { return r === '4' ? o.rooms >= 4 : o.rooms === +r; });
        if (!ok) return false;
      }
      if (f.priceMin && o.price < f.priceMin) return false;
      if (f.priceMax && o.price > f.priceMax) return false;
      if (f.areaMin && o.area < f.areaMin) return false;
      if (f.areaMax && o.area > f.areaMax) return false;
      if (f.district && o.district !== f.district) return false;
      if (f.tour && !o.tour) return false;
      if (f.showing && !o.showing) return false;
      if (f.checked && !o.checked) return false;
      return true;
    }
    var SORT = {
      '': function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); },
      'price-asc': function (a, b) { return a.price - b.price; },
      'price-desc': function (a, b) { return b.price - a.price; },
      'area-desc': function (a, b) { return b.area - a.area; },
    };

    // ── метки выбранных фильтров ───────────────────────────────────────────
    function chips(f) {
      var list = [];
      var names = { flat: 'Квартира', studio: 'Студия', house: 'Дом', commercial: 'Помещение' };
      f.type.forEach(function (t) { list.push({ label: names[t], drop: function () { $('[name="type"][value="' + t + '"]', form).checked = false; } }); });
      f.rooms.forEach(function (r) { list.push({ label: (r === '4' ? '4+' : r) + ' комн.', drop: function () { $('[name="rooms"][value="' + r + '"]', form).checked = false; } }); });
      if (f.priceMin || f.priceMax) list.push({ label: 'Цена ' + (f.priceMin ? 'от ' + App.priceShort(f.priceMin) + ' ' : '') + (f.priceMax ? 'до ' + App.priceShort(f.priceMax) : ''), drop: function () { form.elements.priceMin.value = ''; form.elements.priceMax.value = ''; } });
      if (f.areaMin || f.areaMax) list.push({ label: 'Площадь ' + (f.areaMin ? 'от ' + f.areaMin + ' ' : '') + (f.areaMax ? 'до ' + f.areaMax : '') + ' м²', drop: function () { form.elements.areaMin.value = ''; form.elements.areaMax.value = ''; } });
      if (f.district) list.push({ label: f.district, drop: function () { form.elements.district.value = ''; } });
      [['tour', '3D-тур'], ['showing', 'Показ по коду'], ['checked', 'Проверен']].forEach(function (p) { if (f[p[0]]) list.push({ label: p[1], drop: function () { form.elements[p[0]].checked = false; } }); });
      activeBox.innerHTML = '';
      list.forEach(function (c) {
        var b = d.createElement('button');
        b.type = 'button'; b.className = 'chip chip--x';
        b.innerHTML = '<span></span>' + App.icon('close');
        b.firstChild.textContent = c.label;
        b.setAttribute('aria-label', 'Убрать фильтр: ' + c.label);
        b.addEventListener('click', function () { c.drop(); update(); });
        activeBox.appendChild(b);
      });
      if (badge) { badge.textContent = list.length; badge.hidden = !list.length; }
    }

    // ── отрисовка с плавной перестановкой ──────────────────────────────────
    function update(keepPage) {
      if (!keepPage) shown = PAGE;
      var f = filters();
      var list = w.OBJECTS.filter(function (o) { return match(o, f); }).sort(SORT[state.sort] || SORT['']);
      var visible = list.slice(0, shown);
      var before = {};
      var animate = !first && !App.reduce;
      if (animate) Object.keys(cards).forEach(function (id) { if (!cards[id].hidden) before[id] = cards[id].getBoundingClientRect(); });
      Object.keys(cards).forEach(function (id) { cards[id].hidden = true; });
      visible.forEach(function (o) { var el = cards[o.id]; if (el) { el.hidden = false; grid.appendChild(el); } });
      if (animate) {
        visible.forEach(function (o, n) {
          var el = cards[o.id];
          if (!el) return;
          var a = before[o.id], b = el.getBoundingClientRect();
          if (a) {
            var dx = a.left - b.left, dy = a.top - b.top;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' });
          } else {
            el.animate([{ opacity: 0, transform: 'translateY(26px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: Math.min(n, 8) * 45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
          }
        });
      }
      empty.hidden = list.length > 0;
      more.hidden = list.length <= shown;
      App.countTo(countEl, list.length, { dur: 450 });
      if (count2) count2.textContent = list.length;
      wordEl.textContent = App.plural(list.length, 'объект', 'объекта', 'объектов');
      chips(f);
      writeUrl(f);
      App.fav.sync();
      first = false;
    }

    form.addEventListener('change', function () { update(); });
    var typing = 0;
    form.addEventListener('input', function (e) { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') return; clearTimeout(typing); typing = setTimeout(update, 350); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-filters-reset]')) { form.reset(); update(); }
      if (e.target.closest('[data-filters-open]')) { d.body.classList.add('filters-open'); d.body.style.overflow = 'hidden'; }
      if (e.target.closest('[data-filters-close]')) { d.body.classList.remove('filters-open'); d.body.style.overflow = ''; }
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.body.classList.contains('filters-open')) { d.body.classList.remove('filters-open'); d.body.style.overflow = ''; } });
    more.addEventListener('click', function () { shown += PAGE; update(true); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; update(); });
    if (dealSeg) dealSeg.addEventListener('segchange', function (e) { state.deal = e.detail; form.elements.priceMin.value = ''; form.elements.priceMax.value = ''; update(); });
    if (viewSeg) viewSeg.addEventListener('segchange', function (e) {
      var go = function () { grid.classList.toggle('is-list', e.detail === 'list'); };
      if (d.startViewTransition && !App.reduce) { d.documentElement.classList.add('theme-vt'); d.startViewTransition(go).finished.finally(function () { d.documentElement.classList.remove('theme-vt'); }); } else go();
      try { localStorage.setItem('catView', e.detail); } catch (err) { /* не страшно */ }
    });

    readUrl();
    sortSel.value = state.sort;
    if (dealSeg && state.deal === 'rent') {
      $$('.seg__btn', dealSeg).forEach(function (b) { var on = b.getAttribute('data-value') === 'rent'; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
      App.syncSeg(dealSeg);
    }
    try {
      if (localStorage.getItem('catView') === 'list') {
        grid.classList.add('is-list');
        $$('.seg__btn', viewSeg).forEach(function (b) { var on = b.getAttribute('data-value') === 'list'; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
        App.syncSeg(viewSeg);
      }
    } catch (err) { /* не страшно */ }
    update();
  }

  if (w.App && d.readyState !== 'loading') start();
  else d.addEventListener('DOMContentLoaded', start);
})();
