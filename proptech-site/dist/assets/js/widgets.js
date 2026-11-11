/* Живые виджеты: быстрый поиск, створки сервисов, сделка в телефоне,
   кодовый замок, шкала скоринга, калькуляторы займа и выкупа. */
(function () {
  'use strict';
  var d = document, w = window;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  function start() {
    var App = w.App, CFG = w.SITE || {};
    var clamp = App.clamp;

    // ── Быстрый поиск на первом экране ─────────────────────────────────────
    var form = $('[data-search]');
    if (form && w.OBJECTS) {
      var price = form.elements.priceMax, out = $('[data-search-count]', form), word = $('[data-search-word]', form);
      var fillPrices = function () {
        var list = (price.getAttribute('data-price-' + form.elements.deal.value) || '').split(',');
        price.innerHTML = '<option value="">Без ограничений</option>' + list.map(function (v) { return '<option value="' + v + '">' + App.priceShort(+v) + '</option>'; }).join('');
      };
      var count = function () {
        var f = new FormData(form), rooms = f.get('rooms');
        var n = w.OBJECTS.filter(function (o) {
          return o.deal === f.get('deal') && (!f.get('type') || o.type === f.get('type')) && (!rooms || (rooms === '4' ? o.rooms >= 4 : o.rooms === +rooms)) && (!f.get('priceMax') || o.price <= +f.get('priceMax'));
        }).length;
        App.countTo(out, n, { dur: 500 });
        word.textContent = App.plural(n, 'объект', 'объекта', 'объектов');
      };
      form.addEventListener('change', function (e) { if (e.target.name === 'deal') fillPrices(); count(); });
      fillPrices();
      out.setAttribute('data-now', out.textContent);
    }

    // ── Четыре сервиса: створка «загорается» от точки, куда вошёл курсор ───
    $$('[data-panes]').forEach(function (box) {
      var panes = $$('.pane', box);
      var light = function (p, x, y) {
        panes.forEach(function (q) { if (q !== p) q.classList.remove('is-lit'); });
        p.style.setProperty('--x', x + '%');
        p.style.setProperty('--y', y + '%');
        p.classList.add('is-lit');
      };
      panes.forEach(function (p) {
        p.addEventListener('pointerenter', function (e) {
          if (e.pointerType === 'touch') return;
          var r = p.getBoundingClientRect();
          light(p, ((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
        });
        p.addEventListener('focus', function () { light(p, 50, 100); });
      });
      if (!App.fine && 'IntersectionObserver' in w) {
        var io = new IntersectionObserver(function (en) {
          en.forEach(function (x) { if (x.isIntersecting) light(x.target, 50, 100); });
        }, { rootMargin: '-45% 0px -45% 0px' });
        panes.forEach(function (p) { io.observe(p); });
      }
    });

    // ── Сделка онлайн: активный шаг управляет экраном телефона ─────────────
    $$('[data-deal]').forEach(function (box) {
      var steps = $$('.deal__step', box), slides = $$('.phone__slide', box), rows = $$('.phone__row', box);
      var now = $('[data-deal-now]', box), line = $('.deal__line i', box), col = $('.deal__col', box);
      var active = -1, ticking = false;
      function update() {
        ticking = false;
        var mid = w.innerHeight * 0.52, best = 0, bestD = 1e9;
        steps.forEach(function (s, i) {
          var r = s.getBoundingClientRect(), dist = Math.abs(r.top + r.height / 2 - mid);
          if (dist < bestD) { bestD = dist; best = i; }
        });
        var cr = col.getBoundingClientRect();
        line.style.setProperty('--p', clamp((mid - cr.top) / cr.height, 0, 1).toFixed(4));
        if (best === active) return;
        active = best;
        steps.forEach(function (s, i) { s.classList.toggle('is-active', i === best); s.classList.toggle('is-past', i < best); });
        slides.forEach(function (s, i) { s.classList.toggle('is-active', i === best); });
        rows.forEach(function (r, i) { r.classList.toggle('is-done', i < best); r.classList.toggle('is-now', i === best); });
        if (now) now.textContent = best + 1;
      }
      w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      w.addEventListener('resize', update);
      update();
    });

    // ── Кодовый замок: код приходит в приложение, набирается, дверь открыта ─
    $$('[data-lock]').forEach(function (el) {
      var digitsEl = $$('[data-lock-code] b', el), screen = $('[data-lock-screen]', el), time = $('[data-lock-time]', el), bar = $('.lockw__bar i', el);
      var keys = {};
      $$('.lockw__keys span', el).forEach(function (k) { keys[k.getAttribute('data-k')] = k; });
      var minutes = (CFG.showing || {}).codeMinutes || 30;
      var visible = false, running = false, left = 0, tick = 0;
      function setTime() {
        var m = Math.floor(left / 60), s = left % 60;
        time.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        bar.style.setProperty('--left', (left / (minutes * 60)).toFixed(4));
      }
      function cycle() {
        if (!visible) { running = false; return; }
        running = true;
        el.classList.remove('is-open');
        var code = [];
        for (var i = 0; i < 6; i++) code.push(Math.floor(Math.random() * 10));
        digitsEl.forEach(function (b, n) {
          b.style.transition = 'none'; b.style.transform = 'translateY(100%)'; b.textContent = code[n];
          void b.offsetWidth;
          b.style.transition = ''; b.style.transitionDelay = n * 80 + 'ms'; b.style.transform = 'none';
        });
        screen.textContent = '······';
        left = minutes * 60; setTime();
        clearInterval(tick);
        tick = setInterval(function () { left = Math.max(0, left - 1); setTime(); }, 1000);
        var typed = '', n = 0;
        setTimeout(function type() {
          if (n < 6) {
            var k = keys[code[n]];
            if (k) { k.classList.add('is-hit'); setTimeout(function () { k.classList.remove('is-hit'); }, 220); }
            typed += code[n]; n++;
            screen.textContent = typed + '······'.slice(typed.length);
            setTimeout(type, 300);
          } else {
            setTimeout(function () { el.classList.add('is-open'); screen.textContent = 'ОТКРЫТО'; }, 380);
            setTimeout(cycle, 4600);
          }
        }, 1700);
      }
      if (App.reduce) { digitsEl.forEach(function (b, n) { b.textContent = [4, 8, 2, 7, 1, 5][n]; }); el.classList.add('is-open', 'is-in'); return; }
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !running) cycle();
        if (!visible) clearInterval(tick);
      }, { threshold: 0.35 }).observe(el);
    });

    // ── Скоринг: шкала и факторы ───────────────────────────────────────────
    $$('[data-score]').forEach(function (el) {
      var sets = JSON.parse(el.getAttribute('data-score'));
      var arc = $('.score__arc', el), num = $('[data-score-num]', el), verdict = $('[data-score-verdict]', el);
      var names = $$('[data-score-name]', el), vals = $$('[data-score-val]', el), bars = $$('.score__bar i', el);
      var activeBtn = $('.seg__btn.is-active', el);
      var key = activeBtn ? activeBtn.getAttribute('data-value') : Object.keys(sets)[0];
      function show(k) {
        var s = sets[k];
        if (!s) return;
        arc.style.setProperty('--v', s.value);
        App.countTo(num, s.value, { dur: 1500 });
        verdict.textContent = s.verdict;
        s.factors.forEach(function (f, i) {
          if (!names[i]) return;
          names[i].textContent = f[0];
          App.countTo(vals[i], f[1], { dur: 900 });
          bars[i].style.setProperty('--v', f[1] + '%');
        });
      }
      el.addEventListener('segchange', function (e) { key = e.detail; show(key); });
      el.addEventListener('inview', function () { show(key); });
      if (el.classList.contains('is-in')) show(key);
    });

    // ── Калькулятор займа под залог ────────────────────────────────────────
    $$('[data-loan-calc]').forEach(function (el) {
      var L = CFG.loan || {};
      var value = $('[name="value"]', el), sum = $('[name="sum"]', el), term = $('[name="term"]', el);
      var oValue = $('[data-out="value"]', el), oSum = $('[data-out="sum"]', el), oTerm = $('[data-out="term"]', el);
      var oPay = $('[data-out="pay"]', el), oLtv = $('[data-out="ltv"]', el), ltvBar = $('.calc__ltv i', el), oMax = $('[data-out="max"]', el);
      function termText(m) {
        var y = Math.floor(m / 12), r = m % 12, out = [];
        if (y) out.push(y + ' ' + App.plural(y, 'год', 'года', 'лет'));
        if (r) out.push(r + ' мес.');
        return out.join(' ');
      }
      function calc() {
        var V = +value.value, max = Math.floor((V * (L.ltv || 60)) / 100 / 50000) * 50000;
        sum.max = Math.max(+sum.min, Math.min(max, L.maxSum || max));
        if (+sum.value > +sum.max) sum.value = sum.max;
        var S = +sum.value, n = +term.value, r = (L.rate || 0) / 100 / 12;
        var pay = r ? (S * r) / (1 - Math.pow(1 + r, -n)) : S / n;
        oValue.textContent = App.priceShort(V);
        oSum.textContent = App.priceShort(S);
        oTerm.textContent = termText(n);
        App.countTo(oPay, pay, { dur: 500, fmt: function (x) { return App.money(x); } });
        var ltv = (S / V) * 100;
        oLtv.textContent = Math.round(ltv) + ' %';
        ltvBar.style.setProperty('--v', clamp(ltv / (L.ltv || 60), 0, 1).toFixed(3));
        if (oMax) oMax.textContent = App.priceShort(+sum.max);
        [value, sum, term].forEach(App.paintRange);
        $$('[data-loan-sum]').forEach(function (h) { h.value = S; });
        $$('[data-loan-term]').forEach(function (h) { h.value = n; });
        $$('[data-loan-value]').forEach(function (h) { h.value = V; });
      }
      el.addEventListener('input', calc);
      calc();
    });

    // ── Оценка срочного выкупа ─────────────────────────────────────────────
    $$('[data-buyout-calc]').forEach(function (el) {
      var B = CFG.buyout || {};
      var value = $('[name="value"]', el), oValue = $('[data-out="value"]', el), oFrom = $('[data-out="from"]', el), oTo = $('[data-out="to"]', el), oAdv = $('[data-out="advance"]', el);
      function calc() {
        var V = +value.value;
        var from = (V * (B.percentFrom || 80)) / 100, to = (V * (B.percentTo || 90)) / 100;
        oValue.textContent = App.priceShort(V);
        App.countTo(oFrom, from, { dur: 500, fmt: function (x) { return App.priceShort(Math.round(x / 10000) * 10000); } });
        App.countTo(oTo, to, { dur: 500, fmt: function (x) { return App.priceShort(Math.round(x / 10000) * 10000); } });
        if (oAdv) App.countTo(oAdv, (from * (B.advancePercent || 5)) / 100, { dur: 500, fmt: function (x) { return App.priceShort(Math.round(x / 10000) * 10000); } });
        App.paintRange(value);
        $$('[data-buyout-value]').forEach(function (h) { h.value = V; });
      }
      el.addEventListener('input', calc);
      calc();
    });
  }

  if (w.App && d.readyState !== 'loading') start();
  else d.addEventListener('DOMContentLoaded', start);
})();
