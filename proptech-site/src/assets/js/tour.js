/* Демо 3D-тура: комната собрана из шести плоскостей в CSS 3D, камера стоит
   в центре. Тянем мышью или пальцем, стрелки на клавиатуре тоже работают.
   Когда у объекта появится настоящий тур, вместо демо подставится iframe
   (поле tourUrl в content/objects.mjs). */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function Tour(root) {
    var view = root.querySelector('.tour__view');
    var cube = root.querySelector('.tour__cube');
    if (!view || !cube) return;
    var rooms = Array.prototype.slice.call(root.querySelectorAll('.tour__room'));
    var btns = Array.prototype.slice.call(root.querySelectorAll('.tour__room-btn'));
    var me = root.querySelector('.tour__me');
    var centers = {};
    try { centers = JSON.parse(root.getAttribute('data-centers') || '{}'); } catch (e) { /* без мини-плана */ }
    var current = rooms[0].getAttribute('data-room');
    var yaw = -24, pitch = 0, v = 0, drag = false, lx = 0, ly = 0, moved = 0;
    var touched = false, idleAt = 0, visible = false, raf = 0, busy = false;

    function size() {
      var w = view.clientWidth || 600;
      var P = Math.max(240, w * 0.56);
      root.style.setProperty('--persp', P.toFixed(1) + 'px');
      root.style.setProperty('--s', (P * 2).toFixed(1) + 'px');
      root.style.setProperty('--h', (P * 1.2).toFixed(1) + 'px');
    }
    function apply() {
      cube.style.setProperty('--yaw', yaw.toFixed(2) + 'deg');
      cube.style.setProperty('--pitch', pitch.toFixed(2) + 'deg');
      if (me) {
        var c = centers[current] || [0, 0];
        me.setAttribute('transform', 'translate(' + c[0] + ' ' + c[1] + ') rotate(' + yaw.toFixed(1) + ')');
      }
    }
    function markRoom() {
      btns.forEach(function (b) { var on = b.getAttribute('data-go') === current; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
      root.querySelectorAll('.plan__room').forEach(function (r) { r.classList.toggle('is-active', r.getAttribute('data-room') === current); });
    }
    function go(key) {
      if (key === current || busy) return;
      busy = true;
      touch();
      root.classList.add('is-moving');
      setTimeout(function () {
        rooms.forEach(function (r) { r.classList.toggle('is-active', r.getAttribute('data-room') === key); });
        current = key;
        yaw = -20; pitch = 0; v = 0;
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
      else if (k === 'ArrowUp') pitch = clamp(pitch - 5, -16, 16); else if (k === 'ArrowDown') pitch = clamp(pitch + 5, -16, 16);
      else return;
      e.preventDefault(); touch(); apply();
    });
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
