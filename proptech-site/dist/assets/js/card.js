/* Карточка объекта. Один и тот же код рисует карточки и при сборке сайта,
   и в браузере (каталог, избранное), поэтому вид всегда одинаковый. */
(function (g) {
  'use strict';
  var NB = ' ';
  function num(n, dec) {
    return (+n).toLocaleString('ru-RU', { maximumFractionDigits: dec || 0 }).replace(/\s/g, NB);
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function ico(name) {
    if (Obj.icons && Obj.icons[name]) return Obj.icons[name];
    var t = typeof document !== 'undefined' ? document.getElementById('ico-' + name) : null;
    return t ? t.innerHTML : '';
  }
  var Obj = {
    icons: null,
    typeName: function (o) {
      if (o.type === 'flat') return o.rooms + '-комн. квартира';
      if (o.type === 'studio') return 'Студия';
      if (o.type === 'house') return 'Дом';
      return 'Помещение';
    },
    area: function (o) { return num(o.area, 1) + NB + 'м²'; },
    title: function (o) { return Obj.typeName(o) + ', ' + Obj.area(o); },
    price: function (o) { return num(o.price) + NB + '₽' + (o.deal === 'rent' ? '/мес' : ''); },
    perMeter: function (o) { return o.deal === 'sale' ? num(Math.round(o.price / o.area)) + NB + '₽/м²' : 'Залог' + NB + num(o.price) + NB + '₽'; },
    floor: function (o) { return o.type === 'house' ? o.floors + NB + 'этажа' : o.floor + NB + 'из' + NB + o.floors + NB + 'эт.'; },
    url: function (o) { return 'object-' + o.id + '.html'; },
    card: function (o, opt) {
      opt = opt || {};
      var url = Obj.url(o);
      var media = o.photos && o.photos.length ? '<img src="' + esc(o.photos[0]) + '" alt="" loading="lazy">' : o.cover || '';
      var badges = '';
      if (o.isNew) badges += '<span class="tag tag--lit">Новое</span>';
      if (o.tour) badges += '<span class="tag tag--glass">' + ico('cube') + '3D-тур</span>';
      if (o.showing) badges += '<span class="tag tag--glass">' + ico('keypad') + 'Показ по коду</span>';
      return (
        '<article class="obj" data-id="' + o.id + '"' + (opt.tilt === false ? '' : ' data-tilt') + '>' +
        '<a class="obj__media" href="' + url + '" data-cursor="Смотреть" aria-label="' + esc(Obj.title(o) + ', ' + o.address) + '">' + media +
        '<span class="obj__badges">' + badges + '</span></a>' +
        '<button class="obj__fav" type="button" data-fav="' + o.id + '" aria-label="В избранное" aria-pressed="false">' + ico('heart') + '</button>' +
        '<div class="obj__body">' +
        '<div class="obj__price"><b>' + Obj.price(o) + '</b><span>' + Obj.perMeter(o) + '</span></div>' +
        '<h3 class="obj__title"><a href="' + url + '">' + Obj.title(o) + '</a></h3>' +
        '<p class="obj__addr">' + ico('pin') + '<span>' + esc(o.district + ', ' + o.address) + '</span></p>' +
        '<ul class="obj__meta"><li>' + Obj.floor(o) + '</li>' + (o.checked ? '<li class="obj__ok">' + ico('check') + 'Проверен</li>' : '') + (opt.demo ? '<li class="obj__demo">демо</li>' : '') + '</ul>' +
        '</div></article>'
      );
    },
  };
  g.Obj = Obj;
})(typeof window !== 'undefined' ? window : globalThis);
