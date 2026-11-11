/* Демо 3D-тура: комната собрана из плоскостей в CSS 3D, камера стоит
   в центре. Тянем мышью или пальцем, стрелки на клавиатуре тоже работают.
   Стены нарезаны на полосы, пол и потолок на плитки. Скрипт показывает
   только части перед камерой: то, что уходит за спину, браузеру рисовать
   не нужно (а некоторые браузеры такие плоскости рисуют с ошибками).
   Когда у объекта появится настоящий тур, вместо демо подставится iframe
   (поле tourUrl в content/objects.mjs). */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RAD = Math.PI / 180;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function Tour(root) {
    var view = root.querySelector('.tour__view');
    var cube = root.querySelector('.tour__cube');
    if (!view || !cube) return;
    var N = +root.getAttribute('data-n') || 6;
    var HK = 0.6; // высота стены относительно её ширины
    var rooms = Array.prototype.slice.call(root.querySelectorAll('.tour__room'));
    var btns = Array.prototype.slice.call(root.querySelectorAll('.tour__room-btn'));
    var me = root.querySelector('.tour__me');
    var centers = {};
    try { centers = JSON.parse(root.getAttribute('data-centers') || '{}'); } catch (e) { /* без мини-плана */ }
    var current = rooms[0].getAttribute('data-room');
    var yaw = -24, pitch = 0, v = 0, drag = false, lx = 0, ly = 0, moved = 0;
    var touched = false, idleAt = 0, visible = false, raf = 0, busy = false;
    var persp = 400, viewH = 400;

    // Геометрия: для каждой части комнаты запоминаем её углы в координатах
    // комнаты (сторона куба = 1). Потом по ним решаем, видна ли часть.
    function wallPoint(ry, u, y) {
      var a = ry * RAD, c = Math.cos(a), s = Math.sin(a);
      return [u * c - 0.5 * s, y, -u * s - 0.5 * c];
    }
    var parts = {};
    rooms.forEach(function (room) {
      var list = [];
      room.querySelectorAll('.tour__strip').forEach(function (el) {
        var ry = +el.getAttribute('data-ry'), i = +el.getAttribute('data-i');
        var u0 = (i - N / 2) / N, u1 = (i + 1 - N / 2) / N, h = HK / 2;
        list.push({ el: el, on: true, pts: [wallPoint(ry, u0, -h), wallPoint(ry, u1, -h), wallPoint(ry, u0, h), wallPoint(ry, u1, h)] });
      });
      room.querySelectorAll('.tour__tile').forEach(function (el) {
        var i = +el.getAttribute('data-i'), j = +el.getAttribute('data-j');
        var u0 = (i - N / 2) / N, u1 = (i + 1 - N / 2) / N, v0 = (j - N / 2) / N, v1 = (j + 1 - N / 2) / N;
        var floor = el.classList.contains('tour__tile--floor');
        var y = floor ? HK / 2 : -HK / 2, k = floor ? 1 : -1;
        list.push({ el: el, on: true, pts: [[u0, y, v0 * k], [u1, y, v0 * k], [u0, y, v1 * k], [u1, y, v1 * k]] });
      });
      room.querySelectorAll('.tour__spot').forEach(function (el) {
        var ry = +el.getAttribute('data-ry'), u = +el.getAttribute('data-u'), vv = +el.getAttribute('data-v');
        list.push({ el: el, on: true, pts: [wallPoint(ry, u, vv * HK)] });
      });
      parts[room.getAttribute('data-room')] = list;
    });

    function cull() {
      var list = parts[current];
      if (!list) return;
      var sy = Math.sin(yaw * RAD), cy = Math.cos(yaw * RAD), sp = Math.sin(pitch * RAD), cp = Math.cos(pitch * RAD);
      for (var n = 0; n < list.length; n++) {
        var p = list[n], front = true;
        for (var k = 0; k < p.pts.length; k++) {
          var q = p.pts[k];
          var z1 = -q[0] * sy + q[2] * cy; // поворот вокруг вертикали
          var z2 = q[1] * sp + z1 * cp;    // наклон камеры
          if (z2 > -0.04) { front = false; break; }
        }
        if (front !== p.on) { p.on = front; p.el.style.display = front ? '' : 'none'; }
      }
    }

    function size() {
      var w = view.clientWidth || 600, h = view.clientHeight || 400;
      var P = Math.max(220, w * 0.5, h * 0.56);
      persp = P; viewH = h;
      root.style.setProperty('--persp', P.toFixed(1) + 'px');
      root.style.setProperty('--s', (P * 2).toFixed(1) + 'px');
      root.style.setProperty('--h', (P * 2 * HK).toFixed(1) + 'px');
    }
    function apply() {
      cube.style.setProperty('--yaw', yaw.toFixed(2) + 'deg');
      cube.style.setProperty('--pitch', pitch.toFixed(2) + 'deg');
      // линия горизонта для запасного фона: сверху цвет потолка, снизу пола
      view.style.setProperty('--hz', (50 + (Math.tan(pitch * RAD) * persp / viewH) * 100).toFixed(1) + '%');
      cull();
      if (me) {
        var c = centers[current] || [0, 0];
        me.setAttribute('transform', 'translate(' + c[0] + ' ' + c[1] + ') rotate(' + yaw.toFixed(1) + ')');
      }
    }
    function markRoom() {
      btns.forEach(function (b) { var on = b.getAttribute('data-go') === current; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
      root.querySelectorAll('.plan__room').forEach(function (r) { r.classList.toggle('is-active', r.getAttribute('data-room') === current); });
      var active = root.querySelector('.tour__room.is-active');
      if (active) {
        var cs = getComputedStyle(active);
        view.style.setProperty('--c-floor', cs.getPropertyValue('--floor'));
        view.style.setProperty('--c-ceil', cs.getPropertyValue('--ceil'));
      }
    }
    function go(key) {
      if (key === current || busy) return;
      busy = true;
      touch();
      root.classList.add('is-moving');
      setTimeout(function () {
        rooms.forEach(function (r) { r.classList.toggle('is-active', r.getAttribute('data-room') === key); });
        current = key;
        yaw = -24; pitch = 0; v = 0;
        markRoom(); apply();
        root.classList.remove('is-moving');
        busy = false;
      }, reduce ? 0 : 340);
    }
    function touch() { touched = true; idleAt = performance.now(); root.classList.add('is-touched'); }

    function loop(now) {
      raf = 0;
      if (!visible) return;
      if (!drag) {
        if (Math.abs(v) > 0.01) { yaw += v; v *= 0.93; }
        else if (!reduce && (!touched || now - idleAt > 6000)) yaw += 0.045;
      }
      apply();
      raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    view.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.tour__spot')) return;
      drag = true; moved = 0; lx = e.clientX; ly = e.clientY; v = 0;
      view.classList.add('is-grab');
      try { view.setPointerCapture(e.pointerId); } catch (err) { /* не страшно */ }
      touch();
    });
    view.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      v = -dx * 0.2;
      yaw += v;
      pitch = clamp(pitch + dy * 0.1, -16, 16);
      idleAt = performance.now();
    });
    function up() { drag = false; view.classList.remove('is-grab'); }
    view.addEventListener('pointerup', up);
    view.addEventListener('pointercancel', up);
    view.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') yaw -= 12; else if (k === 'ArrowRight') yaw += 12;
      else if (k === 'ArrowUp') pitch = clamp(pitch + 5, -16, 16); else if (k === 'ArrowDown') pitch = clamp(pitch - 5, -16, 16);
      else return;
      e.preventDefault(); touch(); apply();
    });
    root.addEventListener('pointerdown', function (e) { if (!e.target.closest('.tour__view') || e.target.closest('.tour__spot')) moved = 0; }, true);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (!b || moved > 8) return;
      go(b.getAttribute('data-go'));
    });

    size(); markRoom(); apply();
    if ('ResizeObserver' in window) new ResizeObserver(function () { size(); apply(); }).observe(view);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }, { rootMargin: '100px' }).observe(root);
    else { visible = true; kick(); }
  }

  function boot() { document.querySelectorAll('[data-tour]').forEach(function (el) { new Tour(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
