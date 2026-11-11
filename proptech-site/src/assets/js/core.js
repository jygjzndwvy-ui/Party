/* Ядро сайта: анимации появления, шапка, меню, тема, формы, избранное.
   Без зависимостей. Всё поведение включается атрибутами в разметке:
     data-reveal            плавное появление при прокрутке (up | fade | scale | left | right | clip)
     data-stagger           дети появляются по очереди
     data-split             заголовок выезжает по словам
     data-count="1200"      число «набегает» от нуля
     data-parallax="0.15"   параллакс при прокрутке
     data-magnetic          кнопка тянется к курсору
     data-cursor="Текст"    круглая метка у курсора
     data-tilt              карточка наклоняется за курсором
   Заявки: форма с атрибутом data-lead="тип" (см. раздел «Формы» ниже). */
(function () {
  'use strict';
  var d = document, root = d.documentElement, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var CFG = w.SITE || {};
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var NB = ' ';

  var App = (w.App = {
    reduce: reduce,
    fine: fine,
    clamp: clamp,
    money: function (n) { return Math.round(n).toLocaleString('ru-RU').replace(/\s/g, NB) + NB + '₽'; },
    num: function (n, dec) { return (+n).toLocaleString('ru-RU', { maximumFractionDigits: dec || 0, minimumFractionDigits: dec || 0 }).replace(/\s/g, NB); },
    priceShort: function (n) {
      if (n >= 1e6) return (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + NB + 'млн' + NB + '₽';
      if (n >= 1e3) return Math.round(n / 1e3) + NB + 'тыс.' + NB + '₽';
      return n + NB + '₽';
    },
    plural: function (n, one, few, many) {
      var a = Math.abs(n) % 100, b = a % 10;
      if (a > 10 && a < 20) return many;
      if (b > 1 && b < 5) return few;
      if (b === 1) return one;
      return many;
    },
    icon: function (name) { var t = d.getElementById('ico-' + name); return t ? t.innerHTML : ''; },
  });

  // ── Тема: день и ночь ────────────────────────────────────────────────────
  function setTheme(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', theme); } catch (e) { /* хранилище недоступно */ }
    d.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
    $$('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', theme === 'dark'); });
  }
  d.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (!d.startViewTransition || reduce) return setTheme(next);
    // ночь «разливается» кругом от кнопки
    var r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, w.innerWidth - x), Math.max(y, w.innerHeight - y));
    root.classList.add('theme-vt');
    var vt = d.startViewTransition(function () { setTheme(next); });
    vt.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 900, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    vt.finished.finally(function () { root.classList.remove('theme-vt'); });
  });

  // ── Заставка при первом заходе ───────────────────────────────────────────
  function preloader(done) {
    var skip = reduce || !root.classList.contains('pre-on');
    if (skip) { root.classList.remove('pre-on'); return done(); }
    var el = d.createElement('div');
    el.className = 'pre';
    el.setAttribute('aria-hidden', 'true');
    var mark = $('.logo__mark');
    el.innerHTML = '<div class="pre__in">' + (mark ? mark.outerHTML.replace('logo__mark', 'logo__mark pre__mark').replace(/ is-lit/g, '') : '') + '<div class="pre__name"><span>' + (d.body.getAttribute('data-brand') || '') + '</span></div></div>';
    d.body.appendChild(el);
    root.classList.remove('pre-on');
    setTimeout(function () {
      el.classList.add('is-done');
      done();
      setTimeout(function () { el.remove(); }, 1200);
    }, 1350);
  }

  // ── Появление при прокрутке ──────────────────────────────────────────────
  function splitWords(el) {
    var wi = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = d.createDocumentFragment();
          ch.textContent.split(/([ \n\t]+)/).forEach(function (part) {
            if (!part) return;
            if (/^[ \n\t]+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            var outer = d.createElement('span'), inner = d.createElement('span');
            outer.className = 'w'; inner.className = 'w__i';
            inner.textContent = part;
            inner.style.setProperty('--wi', wi++);
            outer.appendChild(inner); frag.appendChild(outer);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
      });
    })(el);
  }

  function initReveal() {
    $$('[data-stagger]').forEach(function (box) {
      var step = 0;
      Array.prototype.forEach.call(box.children, function (ch) { if (ch.hasAttribute('data-reveal')) ch.style.setProperty('--i', step++); });
    });
    $$('[data-split]').forEach(function (el) { if (!reduce) splitWords(el); });
    var items = $$('[data-reveal], [data-split], [data-inview]');
    if (reduce || !('IntersectionObserver' in w)) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        en.target.dispatchEvent(new CustomEvent('inview', { bubbles: false }));
        io.unobserve(en.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
    App.observe = function (el) { io.observe(el); };
  }

  // ── Счётчики ─────────────────────────────────────────────────────────────
  App.countTo = function (el, to, opts) {
    opts = opts || {};
    var from = opts.from !== undefined ? opts.from : parseFloat(el.getAttribute('data-now') || '0') || 0;
    var dec = opts.dec !== undefined ? opts.dec : +(el.getAttribute('data-dec') || 0);
    var dur = opts.dur || 1400;
    var fmt = opts.fmt || function (v) { return App.num(v, dec); };
    el.setAttribute('data-now', to);
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    var t0 = performance.now();
    cancelAnimationFrame(el._raf);
    (function tick(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) el._raf = requestAnimationFrame(tick);
    })(t0);
  };
  function initCounters() {
    $$('[data-count]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count'));
      el.textContent = App.num(0, +(el.getAttribute('data-dec') || 0));
      el.setAttribute('data-inview', '');
      el.addEventListener('inview', function () { App.countTo(el, to, { from: 0, dur: 1800 }); });
      if (reduce) el.textContent = App.num(to, +(el.getAttribute('data-dec') || 0));
    });
  }

  // ── Прокрутка: шапка, параллакс, прогресс ────────────────────────────────
  var scrollY = w.scrollY, lastY = scrollY, velocity = 0, ticking = false;
  App.scrollVelocity = function () { return velocity; };
  function initScroll() {
    var hdr = $('[data-hdr]');
    var par = reduce ? [] : $$('[data-parallax]').map(function (el) { return { el: el, k: parseFloat(el.getAttribute('data-parallax')) || 0.1 }; });
    var bar = $('.progress');
    function update() {
      ticking = false;
      scrollY = w.scrollY;
      var dy = scrollY - lastY;
      velocity = dy;
      if (hdr) {
        hdr.classList.toggle('is-solid', scrollY > 24);
        if (!hdr.classList.contains('is-menu')) {
          if (scrollY > 480 && dy > 4) hdr.classList.add('is-hidden');
          else if (dy < -4 || scrollY <= 480) hdr.classList.remove('is-hidden');
        }
      }
      var vh = w.innerHeight;
      for (var i = 0; i < par.length; i++) {
        var r = par[i].el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var off = (r.top + r.height / 2 - vh / 2) * par[i].k;
        par[i].el.style.transform = 'translate3d(0,' + (-off).toFixed(1) + 'px,0)';
      }
      if (bar) bar.style.setProperty('--p', clamp(scrollY / Math.max(1, d.body.scrollHeight - vh), 0, 1).toFixed(4));
      lastY = scrollY;
    }
    w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    w.addEventListener('resize', update);
    update();
  }

  // ── Мобильное меню ───────────────────────────────────────────────────────
  function initMenu() {
    var burger = $('.burger'), nav = $('.mnav'), hdr = $('[data-hdr]');
    if (!burger || !nav) return;
    function toggle(open) {
      nav.classList.toggle('is-open', open);
      hdr.classList.toggle('is-menu', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      d.body.style.overflow = open ? 'hidden' : '';
      if (open) nav.removeAttribute('inert'); else nav.setAttribute('inert', '');
    }
    burger.addEventListener('click', function () { toggle(!nav.classList.contains('is-open')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { toggle(false); burger.focus(); } });
    w.matchMedia('(min-width: 1021px)').addEventListener('change', function (m) { if (m.matches) toggle(false); });
  }

  // ── Курсор: магнит, метка, наклон ────────────────────────────────────────
  function initPointer() {
    if (!fine || reduce) return;
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.32;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    var cur = d.createElement('div');
    cur.className = 'cursor';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<div class="cursor__in"></div>';
    d.body.appendChild(cur);
    var label = cur.firstChild, tx = 0, ty = 0, x = 0, y = 0, on = false, raf = 0;
    function loop() {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      cur.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      raf = on || Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0;
    }
    d.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      var zone = e.target.closest ? e.target.closest('[data-cursor]') : null;
      var block = zone && e.target.closest('a:not([data-cursor]), button:not([data-cursor]), input, select, [data-nocursor]');
      if (block && zone.contains(block)) zone = null;
      if (zone) {
        if (!on) { on = true; x = tx; y = ty; }
        label.textContent = zone.getAttribute('data-cursor');
        cur.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(loop);
      } else if (on) { on = false; cur.classList.remove('is-on'); }
    }, { passive: true });
    d.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    d.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
    d.addEventListener('pointerleave', function () { on = false; cur.classList.remove('is-on'); });

    d.addEventListener('pointermove', function (e) {
      var el = e.target.closest ? e.target.closest('[data-tilt]') : null;
      if (!el) return;
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
      el.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
      if (!el._tilt) {
        el._tilt = true;
        el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
      }
    }, { passive: true });
  }

  // ── Бегущая строка: ускоряется вместе с прокруткой ───────────────────────
  function initMarquee() {
    $$('.marquee').forEach(function (m) {
      var track = $('.marquee__track', m), group = $('.marquee__group', m);
      if (!track || !group) return;
      var dir = m.getAttribute('data-dir') === 'right' ? 1 : -1;
      var gw = group.getBoundingClientRect().width || 1;
      var copies = Math.ceil(w.innerWidth / gw) + 1;
      for (var i = 0; i < copies; i++) { var c = group.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); }
      if (reduce) return;
      var x = 0, speed = +(m.getAttribute('data-speed') || 0.6), boost = 0, vis = true;
      new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(m);
      (function loop() {
        if (vis) {
          boost += (Math.min(Math.abs(velocity), 60) * 0.12 - boost) * 0.08;
          x += dir * (speed + boost);
          if (x <= -gw) x += gw;
          if (x > 0) x -= gw;
          track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0) skewX(' + clamp(velocity * -0.06, -6, 6).toFixed(2) + 'deg)';
          velocity *= 0.9;
        }
        requestAnimationFrame(loop);
      })();
      w.addEventListener('resize', function () { gw = group.getBoundingClientRect().width || 1; });
    });
  }

  // ── Аккордеон ────────────────────────────────────────────────────────────
  d.addEventListener('click', function (e) {
    var btn = e.target.closest('.acc__btn');
    if (!btn) return;
    var open = btn.getAttribute('aria-expanded') === 'true';
    var acc = btn.closest('.acc');
    if (acc && acc.hasAttribute('data-single')) $$('.acc__btn[aria-expanded="true"]', acc).forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    btn.setAttribute('aria-expanded', !open);
  });

  // ── Сегмент со скользящим индикатором ────────────────────────────────────
  function syncSeg(seg) {
    var thumb = $('.seg__thumb', seg);
    var active = $('.seg__btn.is-active', seg) || ($('input:checked', seg) || {}).parentNode;
    if (!thumb || !active) return;
    thumb.style.width = active.offsetWidth + 'px';
    thumb.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }
  App.syncSeg = syncSeg;
  function initSeg() {
    $$('.seg').forEach(function (seg) {
      if (!$('.seg__thumb', seg)) { var t = d.createElement('span'); t.className = 'seg__thumb'; seg.insertBefore(t, seg.firstChild); }
      var thumb = $('.seg__thumb', seg);
      thumb.style.transition = 'none';
      syncSeg(seg);
      requestAnimationFrame(function () { requestAnimationFrame(function () { thumb.style.transition = ''; }); });
      seg.addEventListener('change', function () { syncSeg(seg); });
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('button.seg__btn');
        if (!b) return;
        $$('.seg__btn', seg).forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', x === b); });
        syncSeg(seg);
        seg.dispatchEvent(new CustomEvent('segchange', { bubbles: true, detail: b.getAttribute('data-value') }));
      });
    });
    w.addEventListener('resize', function () { $$('.seg').forEach(syncSeg); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { $$('.seg').forEach(syncSeg); });
  }

  // ── Переключение содержимого: data-switch="группа" → data-show="группа:значение" ──
  d.addEventListener('segchange', function (e) {
    var seg = e.target, group = seg.getAttribute('data-switch');
    if (!group) return;
    $$('[data-show^="' + group + ':"]').forEach(function (el) {
      var on = el.getAttribute('data-show') === group + ':' + e.detail;
      el.hidden = !on;
      if (on) { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'step-in .6s var(--ease-out) both'; }
    });
  });

  // ── Модальные окна ───────────────────────────────────────────────────────
  var lastFocus = null;
  App.modal = {
    open: function (id) {
      var m = d.getElementById(id);
      if (!m) return;
      lastFocus = d.activeElement;
      m.classList.add('is-open');
      m.removeAttribute('inert');
      d.body.style.overflow = 'hidden';
      var f = $('[autofocus], input:not([type=hidden]), button:not(.modal__close)', m);
      setTimeout(function () { (f || m).focus({ preventScroll: true }); }, 60);
      m.dispatchEvent(new CustomEvent('modalopen'));
    },
    close: function (m) {
      m = typeof m === 'string' ? d.getElementById(m) : m || $('.modal.is-open');
      if (!m) return;
      m.classList.remove('is-open');
      m.setAttribute('inert', '');
      d.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    },
  };
  d.addEventListener('click', function (e) {
    var op = e.target.closest('[data-modal-open]');
    if (op) {
      e.preventDefault();
      var id = op.getAttribute('data-modal-open');
      App.modal.open(id);
      var topic = op.getAttribute('data-topic'), m = d.getElementById(id);
      if (m) { var inp = $('[name="topic"]', m); if (inp) inp.value = topic || ''; var tt = $('[data-modal-topic]', m); if (tt) tt.textContent = topic || tt.getAttribute('data-default') || ''; }
      return;
    }
    if (e.target.closest('[data-modal-close]') || e.target.classList.contains('modal__backdrop')) App.modal.close(e.target.closest('.modal'));
  });
  d.addEventListener('keydown', function (e) {
    var m = $('.modal.is-open');
    if (!m) return;
    if (e.key === 'Escape') return App.modal.close(m);
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', m).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && d.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && d.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  // ── Всплывающие сообщения ────────────────────────────────────────────────
  App.toast = function (text, iconName) {
    var box = $('.toasts');
    if (!box) { box = d.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); d.body.appendChild(box); }
    var t = d.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<span class="toast__ico">' + App.icon(iconName || 'check') + '</span><span></span>';
    t.lastChild.textContent = text;
    box.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 400); }, 2800);
  };

  // ── Избранное (хранится в браузере посетителя) ───────────────────────────
  var FAV_KEY = 'favorites';
  App.fav = {
    list: function () { try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { return []; } },
    has: function (id) { return App.fav.list().indexOf(String(id)) > -1; },
    toggle: function (id) {
      var l = App.fav.list(), i = l.indexOf(String(id));
      if (i > -1) l.splice(i, 1); else l.push(String(id));
      try { localStorage.setItem(FAV_KEY, JSON.stringify(l)); } catch (e) { /* хранилище недоступно */ }
      App.fav.sync();
      d.dispatchEvent(new CustomEvent('favchange', { detail: l }));
      return i === -1;
    },
    sync: function () {
      var l = App.fav.list();
      $$('[data-fav]').forEach(function (b) {
        var on = l.indexOf(b.getAttribute('data-fav')) > -1;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on);
      });
      $$('[data-fav-count]').forEach(function (el) { el.textContent = l.length; el.classList.toggle('is-on', l.length > 0); });
    },
  };
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var added = App.fav.toggle(b.getAttribute('data-fav'));
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = 'heart-pop .5s var(--ease-out)';
    App.toast(added ? 'Добавили в избранное' : 'Убрали из избранного', 'heart');
  });

  // ── Формы ────────────────────────────────────────────────────────────────
  // Разметка: <form data-lead="loan">. Поля читаются по атрибуту name.
  // Куда отправлять, задаётся в content/site.mjs → forms.endpoint.
  function maskPhone(v) {
    var x = v.replace(/\D/g, '');
    if (!x) return '';
    if (x[0] === '8') x = '7' + x.slice(1);
    if (x[0] !== '7') x = '7' + x;
    x = x.slice(0, 11);
    var out = '+7';
    if (x.length > 1) out += ' (' + x.slice(1, 4);
    if (x.length >= 4) out += ')';
    if (x.length > 4) out += ' ' + x.slice(4, 7);
    if (x.length > 7) out += '-' + x.slice(7, 9);
    if (x.length > 9) out += '-' + x.slice(9, 11);
    return out;
  }
  d.addEventListener('input', function (e) {
    var el = e.target;
    if (el.matches && el.matches('input[type="tel"]')) el.value = maskPhone(el.value);
    if (el.matches && el.matches('input[data-money]')) { var n = el.value.replace(/\D/g, ''); el.value = n ? (+n).toLocaleString('ru-RU') : ''; }
    var f = el.closest ? el.closest('.field, .check') : null;
    if (f) f.classList.remove('is-invalid');
  });

  // Лид-скоринг: простая и прозрачная оценка «горячести» заявки от 0 до 100.
  // Баллы уходят в CRM вместе с заявкой, чтобы менеджер первым брал самых готовых.
  // Правила можно менять под себя.
  function leadScore(type, f) {
    var s = 20;
    var byType = { showing: 25, buyout: 22, loan: 18, sell: 16, owner: 12, buy: 12, rent: 8, callback: 6 };
    s += byType[type] || 6;
    if (f.phone) s += 14;
    if (f.name) s += 4;
    if (f.email) s += 4;
    if (f.urgency === 'now') s += 20; else if (f.urgency === 'month') s += 10;
    if (f.docs === 'ready') s += 8;
    if (f.debts === 'no') s += 6;
    var sum = +String(f.sum || f.price || '').replace(/\D/g, '');
    if (sum >= 5e6) s += 8; else if (sum >= 1e6) s += 4;
    if (f.object_id) s += 6;
    return Math.min(100, s);
  }

  function utm() {
    var out = {};
    try {
      var saved = JSON.parse(sessionStorage.getItem('utm') || '{}');
      new URLSearchParams(location.search).forEach(function (v, k) { if (/^(utm_|yclid|gclid)/.test(k)) saved[k] = v; });
      sessionStorage.setItem('utm', JSON.stringify(saved));
      out = saved;
    } catch (e) { /* хранилище недоступно */ }
    return out;
  }
  utm();

  function validate(form) {
    var ok = true, first = null;
    $$('[required]', form).forEach(function (el) {
      if (el.offsetParent === null) return; // скрытые шаги не проверяем
      var good = el.type === 'checkbox' ? el.checked
        : el.type === 'radio' ? !!form.querySelector('[name="' + el.name + '"]:checked')
        : el.type === 'tel' ? el.value.replace(/\D/g, '').length === 11
        : el.value.trim().length > 1;
      var f = el.closest('.field, .check');
      if (f) f.classList.toggle('is-invalid', !good);
      el.setAttribute('aria-invalid', !good);
      if (!good) { ok = false; first = first || el; }
    });
    if (first) { first.focus(); var box = first.closest('.field, .check, .steps-form__opts'); if (box) { box.style.animation = 'none'; void box.offsetWidth; box.style.animation = 'shake .4s'; } }
    return ok;
  }
  App.validate = validate;

  d.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.matches || !form.matches('form[data-lead]')) return;
    e.preventDefault();
    if (!validate(form)) return;
    var type = form.getAttribute('data-lead');
    var fields = {};
    new FormData(form).forEach(function (v, k) { if (k !== 'consent') fields[k] = v; });
    var payload = { type: type, page: location.pathname.split('/').pop() || 'index.html', title: d.title, fields: fields, score: leadScore(type, fields), utm: utm(), sent_at: new Date().toISOString() };
    var btn = $('[type="submit"]', form);
    if (btn) btn.classList.add('is-loading');
    var endpoint = (CFG.forms || {}).endpoint;
    var send = endpoint
      ? fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
      : new Promise(function (res) { console.info('[демо] Заявка не отправлена: в content/site.mjs не задан forms.endpoint', payload); setTimeout(res, 900); });
    send.then(function () {
      if (btn) btn.classList.remove('is-loading');
      form.classList.add('is-done');
      form.dispatchEvent(new CustomEvent('leadsent', { bubbles: true, detail: payload }));
      var done = $('.lead-form__done', form);
      if (done) { done.setAttribute('tabindex', '-1'); done.focus({ preventScroll: true }); } else App.toast('Заявка принята. Скоро свяжемся');
    }).catch(function () {
      if (btn) btn.classList.remove('is-loading');
      App.toast('Не получилось отправить. Позвоните нам или попробуйте ещё раз', 'info');
    });
  });
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lead-again]');
    if (!b) return;
    var form = b.closest('form');
    form.reset(); form.classList.remove('is-done');
    $$('.seg', form).forEach(syncSeg);
    var st = form.closest('[data-steps]') || $('[data-steps]', form) || (form.hasAttribute('data-steps') ? form : null);
    if (st && st._go) st._go(0);
  });

  // Форма-опрос из нескольких шагов
  function initSteps() {
    $$('[data-steps]').forEach(function (box) {
      var steps = $$('.steps-form__step', box), bars = $$('.steps-form__bar i', box), cur = 0;
      function go(n) {
        cur = clamp(n, 0, steps.length - 1);
        steps.forEach(function (s, i) { s.classList.toggle('is-active', i === cur); });
        bars.forEach(function (b, i) { b.classList.toggle('is-on', i <= cur); });
        var num = $('[data-step-now]', box); if (num) num.textContent = cur + 1;
      }
      box._go = go;
      box.addEventListener('click', function (e) {
        if (e.target.closest('[data-step-next]')) { if (validate(steps[cur])) go(cur + 1); }
        if (e.target.closest('[data-step-prev]')) go(cur - 1);
      });
      box.addEventListener('change', function (e) {
        var st = e.target.closest('.steps-form__step');
        if (st && st.hasAttribute('data-auto') && e.target.type === 'radio') setTimeout(function () { go(cur + 1); }, 280);
      });
      go(0);
    });
  }

  // ── Карусель: тянется мышью, с инерцией ──────────────────────────────────
  function initCarousels() {
    $$('[data-carousel]').forEach(function (box) {
      var track = $('.carousel__track', box);
      if (!track) return;
      var down = false, sx = 0, sl = 0, moved = 0, v = 0, lx = 0, raf = 0;
      function step() { return ($('.carousel__track > *', box) || { offsetWidth: 320 }).offsetWidth + 20; }
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-carousel-prev], [data-carousel-next]');
        if (b) track.scrollBy({ left: (b.hasAttribute('data-carousel-next') ? 1 : -1) * step(), behavior: reduce ? 'auto' : 'smooth' });
      });
      function edges() {
        var p = $('[data-carousel-prev]', box), n = $('[data-carousel-next]', box);
        if (p) p.disabled = track.scrollLeft < 4;
        if (n) n.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4;
      }
      track.addEventListener('scroll', edges, { passive: true });
      w.addEventListener('resize', edges);
      setTimeout(edges, 100);
      if (!fine) return;
      track.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        down = true; moved = 0; sx = lx = e.clientX; sl = track.scrollLeft; v = 0;
        cancelAnimationFrame(raf);
        track.classList.add('is-drag');
      });
      w.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - sx;
        moved = Math.max(moved, Math.abs(dx));
        v = e.clientX - lx; lx = e.clientX;
        track.scrollLeft = sl - dx;
        track.style.setProperty('--skew', clamp(v * 0.12, -5, 5).toFixed(2) + 'deg');
        if (moved > 6) track.style.scrollSnapType = 'none';
      });
      w.addEventListener('pointerup', function () {
        if (!down) return;
        down = false;
        track.classList.remove('is-drag');
        (function glide() {
          v *= 0.93;
          track.scrollLeft -= v;
          track.style.setProperty('--skew', clamp(v * 0.12, -5, 5).toFixed(2) + 'deg');
          if (Math.abs(v) > 0.6) raf = requestAnimationFrame(glide);
          else { track.style.setProperty('--skew', '0deg'); track.style.scrollSnapType = ''; }
        })();
      });
      track.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
      track.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });
  }

  // ── Вкладки: [data-tabs] > [data-tab="x"] + [data-panel="x"] ─────────────
  d.addEventListener('click', function (e) {
    var tab = e.target.closest('[data-tab]');
    if (!tab) return;
    var box = tab.closest('[data-tabs]');
    if (!box) return;
    var key = tab.getAttribute('data-tab');
    $$('[data-tab]', box).forEach(function (t) { var on = t === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
    $$('[data-panel]', box).forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== key; });
    box.dispatchEvent(new CustomEvent('tabchange', { bubbles: true, detail: key }));
  });

  // ── Ползунки: заливка дорожки ────────────────────────────────────────────
  function paintRange(el) { el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min)) * 100 + '%'); }
  App.paintRange = paintRange;
  d.addEventListener('input', function (e) { if (e.target.type === 'range') paintRange(e.target); });

  // ── Запуск ───────────────────────────────────────────────────────────────
  function boot() {
    w.__ok = true;
    $$('input[type="range"]').forEach(paintRange);
    App.fav.sync();
    initScroll();
    initMenu();
    initSeg();
    initSteps();
    initCarousels();
    initCounters();
    initPointer();
    preloader(function () {
      root.classList.add('is-ready');
      initReveal();
      initMarquee();
      d.dispatchEvent(new CustomEvent('appready'));
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
