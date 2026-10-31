// Картинки для объявления на Авито: 8 слайдов 1600×1200 (4:3) с мокапами страниц.
import { C, SYMBOLS, palm, pineapple, hibiscus, parrot, chest, monstera, frond, sun, lei } from './art.mjs';
import { doc, typo } from './lib.mjs';

// g(n) / k(n) — путь к миниатюре страницы гида / набора
const g = (n) => `thumbs/guide-${String(n).padStart(2, '0')}.png`;
const k = (n) => `thumbs/kit-${String(n).padStart(2, '0')}.png`;

const CSS = `
body { background: #ccc; }
.slide { width: 1600px; height: 1200px; position: relative; overflow: hidden; margin: 0 0 20px; font-size: 26px; }
.bg-ocean { background: linear-gradient(160deg, #08505C 0%, #0B6E7F 45%, #2EC4B6 100%); color: #fff; }
.bg-sand { background: linear-gradient(180deg, #FFF8EC 0%, #FFEFD2 100%); color: var(--ink); }
.bg-aqua { background: linear-gradient(180deg, #EAF8F6 0%, #CFF0EB 100%); color: var(--ink); }
.leaf { position: absolute; pointer-events: none; }
.pg { position: absolute; background: #fff; box-shadow: 0 18px 40px rgba(8,40,48,.28), 0 2px 6px rgba(8,40,48,.18); border-radius: 6px; overflow: hidden; }
.pg img { display: block; width: 100%; height: 100%; object-fit: cover; }
.h { font-family: 'Unbounded'; font-weight: 900; text-transform: uppercase; line-height: 1.02; letter-spacing: -.005em; }
.kick { font-family: 'Unbounded'; font-weight: 700; font-size: 22px; letter-spacing: .2em; text-transform: uppercase; }
.scr { font-family: 'Pacifico'; }
.chip { display: inline-block; border-radius: 999px; padding: 14px 28px; font-weight: 900; font-size: 26px; }
.num { position: absolute; right: 40px; bottom: 34px; font-family: 'Unbounded'; font-weight: 800; font-size: 20px; opacity: .55; }
.list { list-style: none; padding: 0; margin: 0; }
.list li { position: relative; padding-left: 44px; margin: 0 0 16px; font-size: 27px; font-weight: 700; line-height: 1.25; }
.list li::before { content: ''; position: absolute; left: 0; top: 6px; width: 26px; height: 26px; border-radius: 50%; background: var(--coral); box-shadow: inset 0 0 0 7px #fff; border: 2px solid var(--coral); }
.badge-round { position: absolute; width: 230px; height: 230px; border-radius: 50%; background: var(--pine); color: var(--ocean-deep); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; transform: rotate(-10deg); box-shadow: 0 10px 30px rgba(0,0,0,.2); }
.badge-round b { font-family: 'Unbounded'; font-size: 62px; line-height: 1; }
.badge-round span { font-weight: 900; font-size: 22px; line-height: 1.15; }
`;

const leafs = (variant = 0) => variant === 0 ? `
  <div class="leaf" style="width:420px;height:420px;left:-120px;top:-120px;transform:rotate(140deg)">${monstera(C.leafDark, C.leaf)}</div>
  <div class="leaf" style="width:380px;height:380px;right:-120px;bottom:-130px;transform:rotate(-30deg)">${monstera(C.leaf, C.leafLight)}</div>
  <div class="leaf" style="width:340px;height:340px;right:140px;bottom:-190px;transform:rotate(-80deg)">${frond()}</div>` : `
  <div class="leaf" style="width:380px;height:380px;right:-110px;top:-120px;transform:rotate(210deg)">${monstera(C.leaf, C.leafLight)}</div>
  <div class="leaf" style="width:320px;height:320px;left:-110px;bottom:-120px;transform:rotate(20deg)">${frond(C.leafLight, C.leaf)}</div>`;

const page = (src, x, y, w, rot = 0, z = 1) => `<div class="pg" style="left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * 1.4142)}px;transform:rotate(${rot}deg);z-index:${z}"><img src="${src}"></div>`;

export function buildAvito({ guidePages, kitPages, totalPages }) {
  const slides = [];

  // 1. Обложка объявления
  slides.push(`<section class="slide bg-ocean">
    ${leafs(0)}
    <div style="position:absolute;left:110px;top:150px;width:720px;z-index:2">
      <div class="kick" style="opacity:.85">Hawaiian birthday adventure</div>
      <div class="h" style="font-size:118px;margin:26px 0 14px">TROPICAL<br>QUEST™</div>
      <div class="scr" style="font-size:52px;color:var(--pine)">Aloha, Island Explorers!</div>
      <div style="font-size:36px;font-weight:800;margin-top:28px;line-height:1.3">Готовый детский день рождения<br>в гавайском стиле — сценарий,<br>квест, игры, меню и декор</div>
      <div style="display:flex;gap:14px;margin-top:40px;flex-wrap:wrap">
        <span class="chip" style="background:#fff;color:var(--ocean)">6–10 лет</span>
        <span class="chip" style="background:#fff;color:var(--ocean)">2,5–3 часа</span>
        <span class="chip" style="background:#fff;color:var(--ocean)">дома или во дворе</span>
      </div>
    </div>
    ${page(k(12), 1040, 170, 400, 9, 1)}
    ${page(k(29), 930, 270, 400, -4, 2)}
    ${page(g(1), 820, 360, 420, -12, 3)}
    <div class="badge-round" style="left:1290px;top:780px;z-index:5"><b>${totalPages}</b><span>страниц<br>PDF для печати</span></div>
  </section>`);

  // 2. Что внутри
  const gThumbs = [3, 6, 7, 11, 16, 20, 26, 32].map((n) => guidePages[n] ? n : null).filter(Boolean);
  slides.push(`<section class="slide bg-sand">
    ${leafs(1)}
    <div style="position:absolute;left:100px;top:90px;right:100px;z-index:2">
      <div class="kick" style="color:var(--coral-dark)">Что вы получаете</div>
      <div class="h" style="font-size:72px;color:var(--ocean);margin-top:16px">2 файла · ${totalPages} страниц</div>
    </div>
    <div style="position:absolute;left:100px;top:300px;width:670px;z-index:2">
      <div style="background:#fff;border-radius:28px;padding:36px 40px;box-shadow:0 10px 30px rgba(0,0,0,.08)">
        <div class="h" style="font-size:34px;color:var(--ocean)">Гид организатора</div>
        <div class="scr" style="color:var(--leaf);font-size:28px;margin:4px 0 20px">${guidePages.count} страниц · 20 разделов</div>
        <ul class="list">
          <li>Легенда, персонажи и тайминг на 3 часа</li>
          <li>Сценарий ведущего — все реплики</li>
          <li>9 игр и квест с сундуком</li>
          <li>HOME и GARDEN — дом или двор</li>
          <li>Меню, 6 рецептов, список покупок</li>
          <li>Декор, музыка, чек-лист подготовки</li>
        </ul>
      </div>
    </div>
    <div style="position:absolute;left:830px;top:300px;width:670px;z-index:2">
      <div style="background:#fff;border-radius:28px;padding:36px 40px;box-shadow:0 10px 30px rgba(0,0,0,.08)">
        <div class="h" style="font-size:34px;color:var(--coral-dark)">Printable Kit</div>
        <div class="scr" style="color:var(--leaf);font-size:28px;margin:4px 0 20px">${kitPages.count} страниц для печати</div>
        <ul class="list">
          <li>Приглашения, постер, баннер ALOHA</li>
          <li>Карта сокровищ и жетоны-символы</li>
          <li>Карточки игр, таблички станций</li>
          <li>Бейджи, корона вождя, фотобутафория</li>
          <li>Таблички еды, топперы, этикетки</li>
          <li>Дипломы, 12 номинаций, бирки Mahalo</li>
        </ul>
      </div>
    </div>
    <div style="position:absolute;left:100px;top:850px;width:1400px;display:flex;justify-content:space-between;z-index:2">
      ${[g(1), g(guidePages.sec[4]), g(guidePages.sec[6]), g(guidePages.sec[10]), k(kitPages.byTitle['Приглашения']), k(kitPages.byTitle['Карта сокровищ']), k(kitPages.byTitle['Карточки Tropical Warm-up']), k(kitPages.byTitle['Диплом Island Explorer'])]
        .map((src, i) => `<div style="width:150px;height:212px;background:#fff;border-radius:5px;overflow:hidden;box-shadow:0 10px 24px rgba(8,40,48,.22);transform:rotate(${i % 2 ? 2 : -2}deg)"><img src="${src}" style="width:100%;height:100%;display:block"></div>`).join('')}
    </div>
  </section>`);

  // 3. Сценарий и игры
  slides.push(`<section class="slide bg-aqua">
    ${leafs(1)}
    <div style="position:absolute;left:110px;top:150px;width:600px;z-index:2">
      <div class="kick" style="color:var(--coral-dark)">Не нужно ничего придумывать</div>
      <div class="h" style="font-size:66px;color:var(--ocean);margin:20px 0 30px">Сценарий<br>и игры</div>
      <ul class="list">
        <li>Реплики ведущего на каждый момент праздника</li>
        <li>Тайминг поминутно — от встречи до прощания</li>
        <li>9 игр: правила, реквизит, советы</li>
        <li>Никто не проигрывает — играет вся команда</li>
      </ul>
    </div>
    ${page(g(guidePages.sec[4]), 760, 150, 380, -6, 1)}
    ${page(g(guidePages.sec[5]), 1000, 230, 400, 5, 2)}
    ${page(g(guidePages.sec[6] + 1), 860, 470, 400, -2, 3)}
  </section>`);

  // 4. Квест
  slides.push(`<section class="slide bg-ocean">
    ${leafs(1)}
    <div style="position:absolute;left:110px;top:110px;width:640px;z-index:2">
      <div class="kick" style="opacity:.85">The lost treasure</div>
      <div class="h" style="font-size:66px;margin:20px 0 26px">Квест<br>с сундуком</div>
      <div style="display:flex;gap:16px;margin-bottom:30px">${SYMBOLS.map((s) => `<div style="width:96px;height:96px;border-radius:50%;background:#fff;padding:16px">${s.art()}</div>`).join('')}</div>
      <div style="font-size:30px;font-weight:700;line-height:1.4">5 станций → 5 жетонов-символов →<br>на обороте складывается волшебное<br>слово <b style="color:var(--pine)">A-L-O-H-A</b> → вождь открывает<br>сундук с сокровищами!</div>
    </div>
    ${page(k(kitPages.byTitle['Карта сокровищ']), 800, 120, 420, -5, 1)}
    ${page(k(kitPages.byTitle['Жетоны символов']), 1090, 330, 380, 6, 2)}
    ${page(k(kitPages.byTitle['Таблички станций']), 850, 600, 330, -9, 3)}
  </section>`);

  // 5. Декор
  slides.push(`<section class="slide bg-sand">
    ${leafs(0)}
    ${page(k(kitPages.byTitle['Постер Welcome']), 120, 140, 380, -6, 1)}
    ${page(k(kitPages.byTitle['Баннер ALOHA']), 380, 260, 360, 4, 2)}
    ${page(g(guidePages.sec[13]), 210, 520, 330, -2, 3)}
    <div style="position:absolute;left:860px;top:150px;width:620px;z-index:2">
      <div class="kick" style="color:var(--coral-dark)">Остров у вас дома</div>
      <div class="h" style="font-size:66px;color:var(--ocean);margin:20px 0 30px">Декор<br>и фотозона</div>
      <ul class="list">
        <li>Пошаговая фотозона и гирлянда из шаров с формулой цветов</li>
        <li>Планы зон для квартиры и для двора</li>
        <li>Баннер ALOHA, постер Welcome, таблички</li>
        <li>Фотобутафория: очки, усы, цветы, облачка</li>
        <li>Как сэкономить на декоре</li>
      </ul>
    </div>
  </section>`);

  // 6. Меню
  slides.push(`<section class="slide bg-aqua">
    ${leafs(1)}
    <div style="position:absolute;left:110px;top:140px;width:620px;z-index:2">
      <div class="kick" style="color:var(--coral-dark)">На 10 детей</div>
      <div class="h" style="font-size:58px;color:var(--ocean);margin:20px 0 30px">Тропическое<br>меню</div>
      <ul class="list">
        <li>6 блюд и напиток с пошаговыми рецептами</li>
        <li>Список покупок с количеством — бери и иди в магазин</li>
        <li>Как оформить food bar</li>
        <li>Таблички-домики, топперы, флажки для трубочек</li>
      </ul>
    </div>
    ${page(g(guidePages.sec[10]), 820, 150, 370, -5, 1)}
    ${page(g(guidePages.sec[11]), 1070, 220, 380, 5, 2)}
    ${page(g(guidePages.sec[12]), 910, 500, 350, -1, 3)}
  </section>`);

  // 7. Дипломы и подарки
  slides.push(`<section class="slide bg-ocean">
    ${leafs(0)}
    ${page(k(kitPages.byTitle['Диплом Island Explorer']), 120, 150, 380, -6, 1)}
    ${page(k(kitPages.byTitle['Диплом Chief of the Island']), 400, 220, 380, 5, 2)}
    ${page(k(kitPages.byTitle['Номинации Special Awards']), 230, 560, 330, -3, 3)}
    <div style="position:absolute;left:880px;top:170px;width:600px;z-index:2">
      <div class="kick" style="opacity:.85">Каждый — победитель</div>
      <div class="h" style="font-size:62px;margin:20px 0 30px">Дипломы<br>и подарки</div>
      <ul class="list">
        <li>Диплом Island Explorer — каждому гостю</li>
        <li>Особый диплом вождя для именинника</li>
        <li>12 номинаций — у каждого ребёнка своя</li>
        <li>Бирки Mahalo для подарков гостям</li>
      </ul>
    </div>
  </section>`);

  // 8. Как это работает
  const step = (n, t, d) => `<div style="background:#fff;border-radius:30px;padding:40px 34px;box-shadow:0 10px 30px rgba(0,0,0,.08)">
    <div style="font-family:Unbounded;font-weight:900;font-size:76px;color:var(--coral);line-height:1">${n}</div>
    <div class="h" style="font-size:30px;color:var(--ocean);margin:18px 0 10px">${t}</div><div style="font-size:25px;font-weight:600;line-height:1.35">${d}</div></div>`;
  slides.push(`<section class="slide bg-sand">
    ${leafs(1)}
    <div style="position:absolute;left:100px;top:110px;right:100px;z-index:2">
      <div class="kick" style="color:var(--coral-dark)">Как это работает</div>
      <div class="h" style="font-size:66px;color:var(--ocean);margin:20px 0 50px">Праздник за один вечер подготовки</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:26px">
        ${step(1, 'Покупаете', 'Набор приходит в виде двух PDF-файлов')}
        ${step(2, 'Читаете гид', 'Всё по шагам: что купить, что сказать, во что играть')}
        ${step(3, 'Печатаете', 'На домашнем принтере или в копицентре, формат А4')}
        ${step(4, 'Празднуете', 'Дети в восторге, вы — спокойны и тоже веселитесь')}
      </div>
      <div style="display:flex;align-items:center;gap:30px;margin-top:60px;background:var(--ocean);color:#fff;border-radius:30px;padding:30px 40px">
        <div style="width:120px;height:120px;flex:none">${parrot()}</div>
        <div style="font-size:30px;font-weight:700;line-height:1.35">Можно подготовить версию с <b style="color:var(--pine)">именем и возрастом именинника</b> на приглашениях, постере, дипломах и бирках — напишите в сообщения.</div>
      </div>
    </div>
  </section>`);

  return doc('TROPICAL QUEST — Авито', CSS, typo(slides.join('\n')));
}
