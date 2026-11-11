/* Сцена «свет в окнах»: небо на закате, силуэты города и дома с окнами.
   Подключается на любой блок с атрибутом data-scene.
   data-t="0.6"   фиксированное время суток (0 закат, 1 ночь); без него время
                  зависит от прокрутки: чем ниже листаем, тем глубже ночь. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STOPS = [0, 0.38, 0.62, 0.78, 0.9, 1];
  var DUSK = ['#0B1830', '#1F3B63', '#4E6590', '#A98CA0', '#F0A77E', '#FFD29C'].map(rgb);
  var NIGHT = ['#050A14', '#0A1424', '#101E36', '#172A47', '#20385A', '#2A4569'].map(rgb);
  var L1 = [rgb('#5A6C92'), rgb('#101D33')]; // дальний ряд домов: закат, ночь
  var L2 = [rgb('#33466B'), rgb('#0A1526')]; // ближний ряд

  function rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : a) + ')'; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

  function Scene(root) {
    var canvas = root.querySelector('.scene__sky');
    var near = root.querySelector('.scene__near');
    var ctx = canvas ? canvas.getContext('2d') : null;
    var fixedT = root.hasAttribute('data-t') ? parseFloat(root.getAttribute('data-t')) : null;
    var W = 0, H = 0, dpr = 1;
    var stars = [], clouds = [], rowA = [], rowB = [];
    var t = fixedT === null ? 0 : fixedT, tTarget = t;
    var px = 0, pxTarget = 0;
    var visible = true, raf = 0, last = 0, time = 0;
    var wins = [], base = 0, baseTarget = 0.36;
    var seed = parseInt(root.getAttribute('data-seed') || '7', 10);

    function layout() {
      var r = root.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      if (!ctx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      var rand = rng(seed);
      stars = [];
      var count = Math.round((W * H) / 9000);
      for (var i = 0; i < count; i++) stars.push({ x: rand() * W, y: Math.pow(rand(), 1.6) * H * 0.7, r: 0.5 + rand() * 1.1, p: rand() * 6.28, s: 0.6 + rand() * 1.6 });
      clouds = [];
      for (var c = 0; c < 5; c++) clouds.push({ x: rand() * W, y: H * (0.42 + rand() * 0.3), w: W * (0.18 + rand() * 0.22), h: 8 + rand() * 12, v: 3 + rand() * 5 });
      rowA = skyline(rand, H * 0.16, H * 0.34, 34, 78, 0.5);
      rowB = skyline(rand, H * 0.07, H * 0.21, 46, 110, 0.42);
    }

    function skyline(rand, hMin, hMax, wMin, wMax, litShare) {
      var out = [], x = -30;
      var k = clamp(W / 1200, 0.55, 1.2);
      while (x < W + 40) {
        var w = (wMin + rand() * (wMax - wMin)) * k;
        var h = hMin + Math.pow(rand(), 1.5) * (hMax - hMin);
        var b = { x: x, w: w, h: h, roof: rand(), lights: [] };
        var cw = 7 * k + 2, ch = 9 * k + 2;
        var cols = Math.floor((w - 8) / cw), rows = Math.floor((h - 10) / ch);
        for (var cx = 0; cx < cols; cx++) for (var cy = 0; cy < rows; cy++) {
          if (rand() < litShare) b.lights.push({ x: 5 + cx * cw, y: 8 + cy * ch, th: rand(), warm: rand() });
        }
        b.cw = Math.max(2, cw - 4.5); b.ch = Math.max(2.5, ch - 5.5);
        out.push(b);
        x += w + (rand() < 0.25 ? 6 + rand() * 18 : 0);
      }
      return out;
    }

    function drawRow(row, col, yBase, shift, lightAmt, now) {
      ctx.fillStyle = css(col);
      for (var i = 0; i < row.length; i++) {
        var b = row[i], x = b.x + shift, y = yBase - b.h;
        if (x > W || x + b.w < 0) continue;
        ctx.fillRect(x, y, b.w, b.h + 4);
        if (b.roof > 0.72) ctx.fillRect(x + b.w * 0.2, y - 7, b.w * 0.3, 7);
        else if (b.roof < 0.18) ctx.fillRect(x + b.w * 0.5 - 1, y - 16, 2, 16);
      }
      for (var j = 0; j < row.length; j++) {
        var bb = row[j], bx = bb.x + shift, by = yBase - bb.h;
        if (bx > W || bx + bb.w < 0) continue;
        for (var l = 0; l < bb.lights.length; l++) {
          var li = bb.lights[l];
          if (li.th > lightAmt) continue;
          var a = 0.55 + 0.4 * Math.sin(now * 0.0006 * (0.5 + li.warm) + li.th * 40);
          ctx.fillStyle = li.warm > 0.8 ? 'rgba(190,220,255,' + a * 0.8 + ')' : li.warm > 0.4 ? 'rgba(255,200,90,' + a + ')' : 'rgba(255,170,95,' + a + ')';
          ctx.fillRect(bx + li.x, by + li.y, bb.cw, bb.ch);
        }
      }
    }

    function draw(now) {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var g = ctx.createLinearGradient(0, 0, 0, H);
      for (var i = 0; i < STOPS.length; i++) g.addColorStop(STOPS[i], css(mix(DUSK[i], NIGHT[i], t)));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // зарево у горизонта
      var sun = ctx.createRadialGradient(W * 0.7, H * 1.02, 0, W * 0.7, H * 1.02, Math.max(W, H) * 0.62);
      sun.addColorStop(0, 'rgba(255,214,150,' + 0.6 * (1 - t) + ')');
      sun.addColorStop(0.45, 'rgba(248,160,120,' + 0.22 * (1 - t) + ')');
      sun.addColorStop(1, 'rgba(248,160,120,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, W, H);

      // звёзды
      var sv = 0.22 + 0.78 * smooth(0.1, 0.85, t);
      for (var s = 0; s < stars.length; s++) {
        var st = stars[s];
        var fade = 1 - st.y / (H * 0.72);
        var tw = reduce ? 0.8 : 0.6 + 0.4 * Math.sin(now * 0.001 * st.s + st.p);
        ctx.fillStyle = 'rgba(255,255,255,' + clamp(sv * fade * tw, 0, 1) + ')';
        ctx.beginPath();
        ctx.arc(st.x + px * 4, st.y, st.r, 0, 6.2832);
        ctx.fill();
      }

      // перистые облака, подсвеченные снизу
      for (var c = 0; c < clouds.length; c++) {
        var cl = clouds[c];
        var cx = ((cl.x + (reduce ? 0 : now * 0.001 * cl.v) + px * 10) % (W + cl.w * 2)) - cl.w;
        var cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        cg.addColorStop(0, 'rgba(255,196,160,' + (0.26 * (1 - t) + 0.035) + ')');
        cg.addColorStop(1, 'rgba(255,196,160,0)');
        ctx.save();
        ctx.translate(cx, cl.y - t * 20);
        ctx.scale(cl.w, cl.h);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }

      // два ряда домов с параллаксом
      var lightAmt = 0.25 + t * 0.75;
      drawRow(rowA, mix(L1[0], L1[1], t), H + t * 26, px * 8, lightAmt * base / 0.36, now);
      drawRow(rowB, mix(L2[0], L2[1], t), H + t * 44, px * 16, lightAmt * base / 0.36, now);
    }

    // ── Окна переднего дома ──────────────────────────────────────────────
    function buildWindows() {
      if (!near) return;
      var rand = rng(seed + 11);
      var kinds = ['', '', '', 'win--warm', 'win--soft', 'win--curtain', 'win--curtain', 'win--blind', 'win--plant', 'win--tv'];
      near.querySelectorAll('.facade__grid').forEach(function (grid) {
        var cols = +grid.getAttribute('data-cols') || 4;
        var rows = +grid.getAttribute('data-rows') || 8;
        grid.style.setProperty('--cols', cols);
        var frag = document.createDocumentFragment();
        for (var i = 0; i < cols * rows; i++) {
          var el = document.createElement('span');
          el.className = 'win ' + kinds[Math.floor(rand() * kinds.length)];
          el.appendChild(document.createElement('i'));
          frag.appendChild(el);
          wins.push({ el: el, th: rand(), flip: false, hold: 0, on: false, row: Math.floor(i / cols), main: grid.hasAttribute('data-main') });
        }
        grid.appendChild(frag);
      });
      near.addEventListener('pointerover', function (e) {
        var el = e.target.closest ? e.target.closest('.win') : null;
        if (!el) return;
        for (var i = 0; i < wins.length; i++) if (wins[i].el === el) { wins[i].hold = performance.now() + 5000; break; }
        syncWindows(performance.now());
      });
    }

    function syncWindows(now) {
      var level = base + t * 0.5;
      for (var i = 0; i < wins.length; i++) {
        var w = wins[i];
        var on = (w.th < level) !== w.flip;
        if (w.hold > now) on = true;
        if (on !== w.on) { w.on = on; w.el.classList.toggle('is-on', on); }
      }
    }

    // подписи у окон: появляются по очереди
    var tagEl = null, tagIdx = 0, tagTimer = 0;
    function initTags() {
      if (!near || reduce) return;
      var list;
      try { list = JSON.parse(root.getAttribute('data-tags') || '[]'); } catch (e) { list = []; }
      if (!list.length) return;
      tagEl = document.createElement('div');
      tagEl.className = 'scene-tag';
      tagEl.innerHTML = '<span class="scene-tag__dot"></span><span class="scene-tag__txt"></span>';
      near.appendChild(tagEl);
      function show() {
        var pool = wins.filter(function (w) { return w.main && w.row >= 1 && w.row <= 4; });
        if (!pool.length || !visible) { tagTimer = setTimeout(show, 1500); return; }
        var w = pool[Math.floor(Math.random() * pool.length)];
        w.hold = performance.now() + 4200;
        syncWindows(performance.now());
        var nr = near.getBoundingClientRect(), wr = w.el.getBoundingClientRect();
        tagEl.style.left = (wr.left - nr.left) + 'px';
        tagEl.style.top = (wr.top - nr.top + wr.height / 2) + 'px';
        tagEl.querySelector('.scene-tag__txt').textContent = list[tagIdx % list.length];
        tagIdx++;
        tagEl.classList.add('is-on');
        tagTimer = setTimeout(function () {
          tagEl.classList.remove('is-on');
          tagTimer = setTimeout(show, 900);
        }, 3000);
      }
      tagTimer = setTimeout(show, 2600);
    }

    function measureT() {
      if (fixedT !== null) return;
      var r = root.getBoundingClientRect();
      var dark = document.documentElement.getAttribute('data-theme') === 'dark' ? 0.34 : 0;
      var raw = clamp(-r.top / Math.max(1, r.height * 0.85), 0, 1);
      tTarget = dark + raw * (1 - dark);
    }

    var lifeAt = 0;
    function frame(now) {
      raf = 0;
      if (!visible) return;
      var dt = Math.min(64, now - last || 16);
      last = now;
      time += dt;
      measureT();
      t += (tTarget - t) * 0.08;
      px += (pxTarget - px) * 0.06;
      base += (baseTarget - base) * 0.018;
      root.style.setProperty('--t', t.toFixed(4));
      root.style.setProperty('--px', px.toFixed(4));
      if (now > lifeAt && wins.length) {
        lifeAt = now + 700 + Math.random() * 1100;
        var w = wins[Math.floor(Math.random() * wins.length)];
        w.flip = !w.flip;
      }
      syncWindows(now);
      draw(time);
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    layout();
    buildWindows();
    if (reduce) { base = baseTarget; measureT(); t = tTarget; syncWindows(0); draw(0); }
    else { kick(); initTags(); }

    if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); draw(time); if (!reduce) kick(); }).observe(root);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { last = 0; kick(); } }, { rootMargin: '80px' }).observe(root);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = 0; kick(); } });
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; pxTarget = (e.clientX / window.innerWidth - 0.5) * 2; }, { passive: true });
    document.addEventListener('themechange', function () { measureT(); if (reduce) { t = tTarget; draw(0); syncWindows(0); } });
  }

  function boot() { document.querySelectorAll('[data-scene]').forEach(function (el) { new Scene(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
