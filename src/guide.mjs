// TROPICAL QUEST — «Гид организатора» (A4, книжная).
import { C, SYMBOLS, palm, wave, pineapple, hibiscus, coconut, parrot, chest, monstera, frond, sun, crab, turtle, monkey, volcano, shark, flamingo, surfboard, lei, shell } from './art.mjs';
import { config, doc, typo } from './lib.mjs';
import { treasureMap, homePlan, gardenPlan, tokenFront } from './parts.mjs';
import { kitIndex } from './kit.mjs';

const CSS = `
.g { padding: 14mm 16mm 0; display: flex; flex-direction: column; }
.g-deco { position: absolute; width: 58mm; height: 58mm; right: -16mm; top: -18mm; opacity: .14; transform: rotate(205deg); pointer-events: none; }
.g-head { display: flex; justify-content: space-between; align-items: center; font-size: 7pt; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); font-weight: 800; position: relative; }
.g-head .tm { color: var(--ocean); }
.g-title { margin: 6mm 0 5mm; display: flex; align-items: flex-end; gap: 4mm; position: relative; }
.g-title .num { font-family: 'Unbounded'; font-weight: 800; font-size: 36pt; color: var(--coral); line-height: .82; }
.g-title h1 { font-family: 'Unbounded'; font-weight: 800; font-size: 20pt; text-transform: uppercase; margin: 0; line-height: 1.04; color: var(--ocean); }
.g-title .sub { font-family: 'Pacifico'; color: var(--leaf); font-size: 12.5pt; display: block; text-transform: none; font-weight: 400; margin-bottom: .6mm; letter-spacing: 0; }
.g-body { flex: 1; overflow: hidden; position: relative; }
.g-foot { height: 13mm; flex: none; display: flex; align-items: center; justify-content: space-between; font-size: 7pt; color: var(--muted); border-top: 1px solid var(--line); letter-spacing: .08em; text-transform: uppercase; font-weight: 700; }
.g-foot .pn { font-family: 'Unbounded'; font-weight: 700; color: var(--ocean); font-size: 9pt; letter-spacing: 0; }

h2 { font-family: 'Unbounded'; font-weight: 700; font-size: 11pt; color: var(--ocean); margin: 3.5mm 0 2mm; text-transform: uppercase; letter-spacing: .01em; line-height: 1.15; }
h2:first-child { margin-top: 0; }
h3 { font-size: 10.5pt; font-weight: 900; margin: 2.5mm 0 1.2mm; color: var(--ink); }
h3:first-child { margin-top: 0; }
.lead { font-size: 11.5pt; line-height: 1.5; }
.small { font-size: 9pt; }
.muted { color: var(--muted); }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.cols3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
.box { background: var(--aqua-soft); border-radius: 4mm; padding: 3.6mm 4.6mm; margin: 0 0 3.2mm; }
.box > :last-child { margin-bottom: 0; }
.box.coral { background: var(--coral-soft); } .box.pine { background: var(--pine-soft); } .box.leaf { background: var(--leaf-soft); }
.box.line { background: #fff; border: 1.3px solid var(--line); }
.say { border-left: 1.4mm solid var(--coral); background: #FFF6F8; padding: 2.8mm 4.2mm; border-radius: 0 3mm 3mm 0; margin: 0 0 2.8mm; }
.say .who { font-size: 7pt; letter-spacing: .16em; text-transform: uppercase; color: var(--coral-dark); font-weight: 900; display: block; margin-bottom: .6mm; }
.say p { margin: 0 0 1.2mm; } .say p:last-child { margin: 0; }
.do { font-size: 9.2pt; color: var(--muted); margin: -.6mm 0 2.6mm; padding-left: 5.6mm; position: relative; }
.do::before { content: '→'; position: absolute; left: 0; color: var(--leaf); font-weight: 900; }
.tip { display: grid; grid-template-columns: 13mm 1fr; gap: 3mm; align-items: start; background: var(--pine-soft); border-radius: 4mm; padding: 3mm 4mm; margin: 0 0 3mm; }
.tip .ico { width: 13mm; height: 13mm; }
.tip .t { display: block; font-size: 7pt; letter-spacing: .14em; text-transform: uppercase; color: var(--pine-dark); font-weight: 900; margin-bottom: .4mm; }
.tip p { margin: 0; font-size: 9.6pt; }
.check { list-style: none; padding: 0; }
.check li { position: relative; padding-left: 6.4mm; margin-bottom: 1.3mm; }
.check li::before { content: ''; position: absolute; left: 0; top: .22em; width: 3.4mm; height: 3.4mm; border: 1.4px solid var(--ocean); border-radius: 1mm; background: #fff; }
.tbl { width: 100%; border-collapse: collapse; font-size: 9.4pt; }
.tbl th { text-align: left; font-size: 6.8pt; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); padding: 1.6mm 2mm; border-bottom: 1.6px solid var(--ocean); font-weight: 900; }
.tbl td { padding: 1.9mm 2mm; border-bottom: 1px solid var(--line); vertical-align: top; }
.tbl td.t { font-family: 'Unbounded'; font-weight: 700; color: var(--ocean); white-space: nowrap; font-size: 8.4pt; }
.tbl.compact td { padding: .7mm 2mm; font-size: 8.6pt; }
.tbl tr.hl td { background: var(--pine-soft); }
.tbl tr.food td { background: var(--leaf-soft); }
.pill { display: inline-block; padding: .5mm 2.4mm; border-radius: 10mm; font-size: 7pt; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; background: var(--aqua-soft); color: var(--ocean); white-space: nowrap; }
.pill.coral { background: var(--coral-soft); color: var(--coral-dark); } .pill.pine { background: var(--pine-soft); color: var(--pine-dark); } .pill.leaf { background: var(--leaf-soft); color: var(--leaf-dark); }
.meta { display: flex; gap: 1.6mm; flex-wrap: wrap; margin: 0 0 2.6mm; }
.sym { display: inline-flex; align-items: center; gap: 1.4mm; font-weight: 900; }
.sym i { display: inline-block; width: 5.2mm; height: 5.2mm; }

/* обложка */
.cover { background: linear-gradient(180deg, #08505C 0%, #0B6E7F 38%, #19A3A6 72%, #2EC4B6 100%); color: #fff; }
.cover .leafs > div { position: absolute; }
.cover .inner { position: absolute; left: 0; right: 0; top: 46mm; text-align: center; }
.cover .tm-line { font-size: 8pt; letter-spacing: .4em; font-weight: 800; opacity: .85; }
.cover h1 { font-family: 'Unbounded'; font-weight: 900; font-size: 50pt; line-height: .92; margin: 5mm 0 2mm; letter-spacing: -.01em; text-shadow: 0 1.2mm 0 rgba(0,0,0,.18); }
.cover h1 sup { font-size: 14pt; vertical-align: top; position: relative; top: 2mm; }
.cover .script { font-size: 24pt; color: var(--pine); margin-top: 1mm; }
.cover .what { font-size: 12.5pt; font-weight: 700; margin-top: 4mm; opacity: .95; }
.cover .chips { display: flex; justify-content: center; gap: 2.5mm; margin-top: 6mm; }
.cover .chips span { border: 1.4px solid rgba(255,255,255,.7); border-radius: 10mm; padding: 1.6mm 4mm; font-weight: 800; font-size: 9.5pt; }
.cover .editions { position: absolute; left: 0; right: 0; bottom: 18mm; text-align: center; color: var(--ocean-deep); }
.cover .editions b { font-family: 'Unbounded'; font-size: 11pt; letter-spacing: .04em; }
.cover .editions div { font-size: 9pt; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; margin-top: 1.4mm; }
.cover .hero { position: absolute; left: 0; right: 0; bottom: 34mm; height: 86mm; }
.cover .hero > div { position: absolute; }
.cover .doclabel { position: absolute; top: 14mm; left: 16mm; right: 16mm; display: flex; justify-content: space-between; font-size: 7.5pt; letter-spacing: .2em; font-weight: 800; text-transform: uppercase; opacity: .9; }

/* оглавление */
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-bottom: 5mm; }
.step { background: var(--aqua-soft); border-radius: 4mm; padding: 4mm; }
.step .n { font-family: 'Unbounded'; font-weight: 800; font-size: 20pt; color: var(--coral); line-height: 1; }
.step b { display: block; margin: 1.6mm 0 .8mm; font-size: 10.5pt; }
.step p { font-size: 9pt; margin: 0; }
.toc { columns: 2; column-gap: 8mm; }
.toc a { display: flex; align-items: baseline; gap: 2mm; padding: 1.5mm 0; border-bottom: 1px dotted #BFD3D8; color: var(--ink); text-decoration: none; break-inside: avoid; font-size: 10pt; }
.toc .tn { font-family: 'Unbounded'; font-weight: 800; color: var(--coral); font-size: 8.4pt; width: 6.5mm; }
.toc .tt { flex: 1; font-weight: 700; }
.toc .tp { font-family: 'Unbounded'; font-weight: 700; color: var(--ocean); font-size: 8.4pt; }

/* символы */
.symbols { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3mm; margin: 2mm 0 4mm; }
.symbols .s { text-align: center; border-radius: 4mm; padding: 3mm 1mm 2.4mm; background: #fff; border: 1.4px solid var(--line); }
.symbols .s .a { width: 19mm; height: 19mm; margin: 0 auto 1.4mm; }
.symbols .s b { font-family: 'Unbounded'; font-size: 7.6pt; display: block; }
.symbols .s span { font-size: 8.4pt; color: var(--muted); }

/* персонажи */
.chars { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.char { border: 1.4px solid var(--line); border-radius: 5mm; padding: 4mm; display: grid; grid-template-columns: 26mm 1fr; gap: 4mm; }
.char .a { width: 26mm; height: 26mm; background: var(--aqua-soft); border-radius: 50%; padding: 3mm; }
.char .role { font-size: 6.8pt; letter-spacing: .16em; text-transform: uppercase; color: var(--coral-dark); font-weight: 900; }
.char h3 { font-family: 'Unbounded'; font-size: 10pt; margin: .6mm 0 1.4mm; color: var(--ocean); }
.char p { font-size: 9.2pt; margin: 0 0 1.4mm; }

/* игры */
.game { border: 1.4px solid var(--line); border-radius: 5mm; padding: 4.2mm 5mm 3mm; margin-bottom: 4mm; position: relative; }
.game-head { display: grid; grid-template-columns: 17mm 1fr auto; gap: 3.6mm; align-items: center; margin-bottom: 2.6mm; }
.game-ico { width: 17mm; height: 17mm; background: var(--aqua-soft); border-radius: 50%; padding: 2.4mm; }
.game-no { font-size: 6.8pt; letter-spacing: .16em; text-transform: uppercase; color: var(--coral-dark); font-weight: 900; }
.game h2 { margin: .4mm 0 .2mm; font-size: 13pt; }
.game .ru { font-family: 'Pacifico'; color: var(--leaf); font-size: 10pt; }
.game .tok { text-align: center; font-size: 6.4pt; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.game .tok .tk { width: 17mm; height: 17mm; margin: 0 auto 1mm; }
.game .cols { gap: 5mm; }
.game ol, .game ul { padding-left: 4.6mm; }
.game li { font-size: 9.6pt; margin-bottom: .8mm; }

/* жетон */
.token { border-radius: 50%; background: #fff; border: 1.2mm solid var(--c); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; }
.token-art { width: 46%; height: 46%; }
.token-name { font-family: 'Unbounded'; font-weight: 800; font-size: 8pt; color: var(--c); margin-top: 1mm; }
.token-ru { font-size: 6pt; font-weight: 800; color: var(--muted); }
.mini-token .token { border-width: .7mm; }
.mini-token .token-name { font-size: 3.4pt; margin-top: .4mm; } .mini-token .token-ru { display: none; }

/* карта и планы */
.mapwrap { width: 76mm; height: 107.5mm; border-radius: 4mm; overflow: hidden; box-shadow: 0 0 0 1.4px var(--line); }
.plan { width: 100%; height: auto; }
.zone { display: grid; grid-template-columns: 30mm 1fr; gap: 3mm; padding: 2.2mm 0; border-bottom: 1px solid var(--line); font-size: 9.6pt; }
.zone b.z { font-family: 'Unbounded'; font-size: 8.4pt; color: var(--ocean); }

/* меню / рецепты */
.menu { display: grid; grid-template-columns: 1fr 1fr; gap: 3.6mm; }
.dish { border: 1.4px solid var(--line); border-radius: 4mm; padding: 3.4mm 4mm; display: grid; grid-template-columns: 14mm 1fr; gap: 3mm; align-items: start; }
.dish .a { width: 14mm; height: 14mm; }
.dish b.n { font-family: 'Unbounded'; font-size: 8.8pt; color: var(--ocean); display: block; }
.dish .ru { font-family: 'Pacifico'; font-size: 9.5pt; color: var(--leaf); display: block; margin-bottom: .6mm; }
.dish p { font-size: 9pt; margin: 0; }
.recipe { border: 1.4px solid var(--line); border-radius: 5mm; padding: 4mm 5mm; margin-bottom: 4mm; }
.recipe-head { display: flex; align-items: center; gap: 3mm; margin-bottom: 2.4mm; }
.recipe-head .a { width: 13mm; height: 13mm; flex: none; }
.recipe-head h2 { margin: 0; font-size: 12pt; }
.recipe-head .ru { font-family: 'Pacifico'; color: var(--leaf); font-size: 9.6pt; }
.recipe .cols { grid-template-columns: 62mm 1fr; gap: 5mm; }
.recipe ul { list-style: none; padding: 0; }
.recipe ul li { font-size: 9.2pt; padding: .7mm 0; border-bottom: 1px dotted #C9DADF; margin: 0; }
.recipe ol li { font-size: 9.4pt; }

/* покупки */
.shop { columns: 2; column-gap: 7mm; }
.shop .grp { break-inside: avoid; margin-bottom: 3.4mm; }
.shop h3 { font-family: 'Unbounded'; font-size: 8.6pt; color: var(--coral-dark); text-transform: uppercase; letter-spacing: .06em; margin: 0 0 1.4mm; }
.shop .check li { font-size: 9.4pt; margin-bottom: .9mm; }
.shop .check li em { font-style: normal; color: var(--muted); }

/* музыка */
.track { display: grid; grid-template-columns: 8mm 1fr; gap: 2mm; padding: 1.8mm 0; border-bottom: 1px solid var(--line); }
.track .no { font-family: 'Unbounded'; font-weight: 700; color: var(--coral); font-size: 8.4pt; padding-top: .6mm; }
.track b { display: block; font-size: 10.4pt; }
.track span { font-size: 8.8pt; color: var(--muted); }

/* задняя обложка */
.back { background: linear-gradient(180deg, #2EC4B6 0%, #0B6E7F 60%, #08505C 100%); color: #fff; }
.back .inner { position: absolute; left: 0; right: 0; top: 98mm; text-align: center; }
.back h2 { font-family: 'Unbounded'; font-size: 22pt; color: #fff; margin: 0 0 4mm; line-height: 1.15; }
.back .script { color: var(--pine); font-size: 18pt; }
`;

// ───────── вспомогательные блоки ─────────
const ico = (art) => `<i>${art}</i>`;
const say = (...ps) => `<div class="say"><span class="who">Ведущий</span>${ps.map((p) => `<p>${p}</p>`).join('')}</div>`;
const act = (t) => `<p class="do">${t}</p>`;
const tip = (t, title = 'Совет от Пико') => `<div class="tip"><div class="ico">${parrot()}</div><div><span class="t">${title}</span><p>${t}</p></div></div>`;
const check = (items) => `<ul class="check">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const pills = (...p) => `<div class="meta">${p.map(([t, c = '']) => `<span class="pill ${c}">${t}</span>`).join('')}</div>`;
const symIcon = (k) => SYMBOLS.find((s) => s.key === k);
const miniToken = (k) => { const s = symIcon(k); return `<div class="mini-token">${tokenFront(s, 17)}</div>`; };

// ───────── разделы ─────────
// Каждая страница: { sec: номер раздела | null, title, sub, body } — или { raw: html }.
const sections = [];
const S = (no, title, sub, pages) => sections.push({ no, title, sub, pages });

// 1. Концепция
S(1, 'Концепция праздника', 'Aloha!', [`
  <p class="lead">Добро пожаловать на тропический остров! Сегодня именинник и его друзья становятся командой <b>Island Explorers</b> — исследователей острова. Их задача — найти потерянный сундук и собрать пять символов острова.</p>
  <div class="symbols">${SYMBOLS.map((s) => `<div class="s"><div class="a">${s.art()}</div><b style="color:${s.color}">${s.en}</b><span>${s.ru}</span></div>`).join('')}</div>
  <p>Только собрав все пять символов, команда сможет открыть сокровища. Каждое испытание — это шаг по карте, каждый символ — жетон, который команда кладёт на карту. В финале жетоны переворачивают, и на обороте складывается волшебное слово <b>A-L-O-H-A</b> — код от сундука.</p>
  <div class="cols">
    <div class="box coral">
      <h2>Главный принцип</h2>
      <p class="lead" style="margin:0"><b>Никто не проигрывает.</b><br>Дети проходят приключение вместе — как одна команда. Нет выбывания, нет «последних мест», есть общий результат и общий праздник.</p>
    </div>
    <div class="box pine">
      <h2>Chief of the Island</h2>
      <p style="margin:0">Главный герой праздника — <b>именинник</b>. Сегодня он (она) получает титул <b>CHIEF OF THE ISLAND</b> — вождь острова. Только вождь может открыть сундук, но без команды ему не справиться.</p>
    </div>
  </div>
  <h2>Формат</h2>
  <div class="cols3">
    <div class="box line"><b>Возраст</b><br>6–10 лет<br><span class="small muted">оптимально 6–12 гостей</span></div>
    <div class="box line"><b>Длительность</b><br>2,5–3 часа<br><span class="small muted">с обедом и тортом</span></div>
    <div class="box line"><b>Где</b><br>дома или во дворе<br><span class="small muted">HOME / GARDEN EDITION</span></div>
  </div>
  <h2>Как устроен праздник</h2>
  <table class="tbl">
    <tr><th>Акт</th><th>Что происходит</th><th>Итог</th></tr>
    <tr><td class="t">I. Прибытие</td><td>Встреча гостей, леи, бейджи исследователей, фотозона, легенда и карта</td><td>Команда собрана</td></tr>
    <tr><td class="t">II. Квест</td><td>Пять станций и весёлые игры между ними, тропический обед</td><td>5 символов на карте</td></tr>
    <tr><td class="t">III. Сокровище</td><td>Код ALOHA, сундук, торт, дипломы и подарки Mahalo</td><td>Счастливые гости</td></tr>
  </table>
`]);

// 2. Легенда
S(2, 'Легенда', 'Story time', [`
  <p class="lead">Легенду ведущий рассказывает на открытии. Её можно прочитать по книге или «найти» в виде письма от попугая Пико (письмо есть в Printable Kit).</p>
  <div class="box" style="padding:6mm 7mm">
    <h2>Тайна острова Алоха</h2>
    <p>Далеко-далеко в тёплом океане есть остров, где круглый год светит солнце, растут ананасы, а волны поют песни. Жители острова каждый год устраивают большой праздник в честь своего вождя.</p>
    <p>К празднику Хранитель острова готовил главный сундук с сокровищами. Чтобы никто чужой не открыл его, Хранитель запер сундук волшебным словом и спрятал это слово в пяти символах острова: <b>пальме, волне, ананасе, цветке и кокосе</b>.</p>
    <p>Но ночью над островом пронёсся озорной тропический ветер. Он перепутал все тропинки, разбросал символы по острову — и сундук исчез из виду!</p>
    <p>Утром верный помощник Хранителя, попугай <b>Пико</b>, принёс карту. «Карта откроется только настоящей команде, — сказал он. — Тем, кто умеет быть смелым, ловким, весёлым и помогать друг другу».</p>
    <p style="margin:0">Сегодня на острове особенный день — день рождения нашего вождя. И только команда <b>Island Explorers</b> может вернуть сокровища!</p>
  </div>
  <div class="cols">
    <div>
      <h2>Как подать легенду</h2>
      ${check([
        'Письмо Пико (Printable Kit) сверните свитком и перевяжите шпагатом.',
        'Спрячьте свиток рядом с картой или «найдите» его вместе с детьми.',
        'Читайте медленно, с паузами — и с интонацией загадки.',
        'Покажите карту: пять пустых кругов ждут символов.',
      ])}
    </div>
    <div>
      <h2>Волшебное слово</h2>
      <p>На обороте каждого жетона — буква. По порядку карты получается:</p>
      <div style="display:flex;gap:1.6mm;margin:2mm 0 3mm">${SYMBOLS.map((s) => `<div style="flex:1;text-align:center;border-radius:2.6mm;background:${s.color};color:#fff;font-family:Unbounded;font-weight:800;font-size:16pt;padding:2mm 0">${s.letter}</div>`).join('')}</div>
      <p class="small">Дети собирают слово сами — и в финале вместе кричат его, чтобы сундук «открылся».</p>
    </div>
  </div>
`]);

// 3. Персонажи
S(3, 'Персонажи', 'Who is who', [`
  <p class="lead">В празднике четыре роли. Ведущим может быть мама, папа, старший брат или сестра — специальных навыков не нужно: всё, что говорить, написано в сценарии.</p>
  <div class="chars">
    <div class="char"><div class="a">${hibiscus(C.pine, C.pineDark)}</div><div>
      <span class="role">именинник</span><h3>Chief of the Island</h3>
      <p>Вождь острова. Получает титул на открытии, носит корону вождя (Printable Kit) и особую лею.</p>
      <p>Особые права: начинает каждое испытание, выбирает танец в финальном раунде, открывает сундук.</p>
    </div></div>
    <div class="char"><div class="a">${lei()}</div><div>
      <span class="role">гости</span><h3>Island Explorers</h3>
      <p>Исследователи острова. На входе получают лею и бейдж, придумывают островное имя и выбирают суперсилу.</p>
      <p>Вместе проходят станции и собирают символы.</p>
    </div></div>
    <div class="char"><div class="a">${parrot()}</div><div>
      <span class="role">помощник</span><h3>Попугай Пико</h3>
      <p>Хитрый и весёлый помощник Хранителя. От его имени ведущий даёт команды в игре «Piko says», «читает» письмо и подсказки.</p>
      <p>Можно взять игрушечного попугая или распечатанного Пико на палочке.</p>
    </div></div>
    <div class="char"><div class="a">${palm()}</div><div>
      <span class="role">ведущий</span><h3>Хранитель острова</h3>
      <p>Взрослый, который ведёт праздник: рассказывает легенду, объясняет правила, вручает жетоны и дипломы.</p>
      <p>Образ: гавайская рубашка или яркая футболка, лея, соломенная шляпа.</p>
    </div></div>
  </div>
  <h2 style="margin-top:5mm">Дресс-код для гостей</h2>
  <div class="cols">
    <div>${check(['яркая одежда: гавайская рубашка, сарафан с цветами, футболка с фруктами', 'для девочек — цветок в волосы, для мальчиков — панама или кепка', 'удобная обувь: будут танцы и подвижные игры'])}</div>
    <div>${tip('Напишите дресс-код в приглашении. А на случай, если кто-то придёт без образа, держите у входа корзину с леями и цветами для волос — каждый станет жителем острова за 5 секунд.')}</div>
  </div>
  <h2>Помощник ведущего</h2>
  <p>Очень желательно, чтобы с ведущим был второй взрослый: он включает и останавливает музыку (в играх «Tropical Wave» и «Freeze» это важно), держит ленту в «Limbo», фотографирует и следит за безопасностью.</p>
`]);

// 4. Тайминг
S(4, 'Тайминг', 'Schedule', [`
  <p class="lead">Полная программа рассчитана на 3 часа. Время ориентировочное: следите за настроением детей, а не за секундами.</p>
  <table class="tbl">
    <tr><th style="width:24mm">Время</th><th>Блок</th><th style="width:34mm">Итог</th></tr>
    <tr><td class="t">0:00–0:15</td><td><b>Встреча гостей.</b> Леи, бейджи Island Explorer, генератор островных имён, фотозона, фрукты</td><td>—</td></tr>
    <tr><td class="t">0:15–0:25</td><td><b>Открытие.</b> Легенда, письмо Пико, карта, титул Chief of the Island</td><td>—</td></tr>
    <tr><td class="t">0:25–0:35</td><td><b>Испытание 1.</b> Tropical Warm-up — разминка</td><td>—</td></tr>
    <tr class="hl"><td class="t">0:35–0:45</td><td><b>Станция 1 · PALM.</b> Поиск трёх пальмовых листьев</td><td><span class="sym">${ico(palm())} PALM</span></td></tr>
    <tr><td class="t">0:45–0:55</td><td><b>Испытание 2.</b> Piko Says</td><td>—</td></tr>
    <tr class="hl"><td class="t">0:55–1:10</td><td><b>Станция 3 · PINEAPPLE.</b> Pineapple Bowling</td><td><span class="sym">${ico(pineapple())} PINEAPPLE</span></td></tr>
    <tr><td class="t">1:10–1:20</td><td><b>Испытание 4.</b> Limbo</td><td>—</td></tr>
    <tr class="food"><td class="t">1:20–1:45</td><td><b>Тропический обед.</b> Food bar, пунш, отдых</td><td>—</td></tr>
    <tr><td class="t">1:45–1:55</td><td><b>Испытание 9.</b> Tropical Memory — спокойная игра после еды</td><td>—</td></tr>
    <tr class="hl"><td class="t">1:55–2:05</td><td><b>Станция 5 · COCONUT.</b> Coconut Toss</td><td><span class="sym">${ico(coconut())} COCONUT</span></td></tr>
    <tr class="hl"><td class="t">2:05–2:15</td><td><b>Станция 2 · WAVE.</b> Tropical Wave</td><td><span class="sym">${ico(wave())} WAVE</span></td></tr>
    <tr><td class="t">2:15–2:20</td><td><b>Испытание 7.</b> Tropical Freeze</td><td>—</td></tr>
    <tr class="hl"><td class="t">2:20–2:30</td><td><b>Станция 4 · FLOWER.</b> Aloha Dance Battle</td><td><span class="sym">${ico(hibiscus())} FLOWER</span></td></tr>
    <tr><td class="t">2:30–2:40</td><td><b>Финал.</b> Жетоны на карту → код ALOHA → сундук</td><td><span class="sym">${ico(chest())} TREASURE</span></td></tr>
    <tr class="food"><td class="t">2:40–2:50</td><td><b>Торт.</b> Свечи, песня, желание вождя</td><td>—</td></tr>
    <tr><td class="t">2:50–3:00</td><td><b>Дипломы и Mahalo.</b> Номинации, подарки, прощание</td><td>—</td></tr>
  </table>
  <div class="cols" style="margin-top:4mm">
    <div class="box pine"><h3>Короткая версия · 2,5 часа</h3><p class="small" style="margin:0">Уберите «Piko Says», «Tropical Memory» и «Tropical Freeze». Все пять символов и финал остаются на месте.</p></div>
    <div class="box"><h3>Порядок станций</h3><p class="small" style="margin:0">Жетоны можно добывать в любом порядке — на карте их всё равно выкладывают по номерам 1–5, и слово ALOHA сложится правильно.</p></div>
  </div>
`]);

// 5. Сценарий ведущего (3 страницы)
S(5, 'Сценарий ведущего', 'Host script', [`
  <p class="small muted" style="margin-bottom:3mm">Реплики можно читать с листа или пересказывать своими словами. Серые строки со стрелкой — что делать в этот момент.</p>
  <h2>Встреча гостей · 0:00</h2>
  ${say('Aloha! Добро пожаловать на остров! Это лея — гавайское ожерелье. Кто её надевает, становится настоящим жителем острова.')}
  ${act('Наденьте лею, выдайте бейдж Island Explorer. Подведите к генератору островных имён и в фотозону.')}
  <h2>Открытие · 0:15</h2>
  ${say('Aloha, маленькие путешественники!', 'Сегодня мы оказались на настоящем тропическом острове. Но произошло невероятное. Исчез главный островной сундук с сокровищами!', 'Хранитель острова оставил карту, но она открывается только настоящей команде. Нам понадобятся смелость, ловкость, фантазия и умение помогать друг другу.', 'Вы готовы? Тогда громко скажем: ALOHA!')}
  ${act('Дети кричат «ALOHA!». Помощник «находит» свиток — читайте письмо Пико (легенда, раздел 2). Разверните карту.')}
  ${say('Посмотрите: на карте пять пустых кругов. Это места для пяти символов острова — пальмы, волны, ананаса, цветка и кокоса. За каждое пройденное испытание остров будет дарить нам символ.')}
  <h2>Титул вождя</h2>
  ${say('У каждой команды должен быть вождь. А сегодня у острова особенный день — день рождения! Поэтому титул CHIEF OF THE ISLAND получает… (имя именинника)!', 'Вождь острова — единственный, кто сможет открыть сундук. Но без команды он не справится. Команда, поможем нашему вождю? ALOHA!')}
  ${act('Наденьте на именинника корону вождя. Аплодисменты, фото.')}
  ${tip('Перед праздником один раз прочитайте сценарий вслух — этого достаточно, чтобы вести уверенно. Шпаргалку ведущего из Printable Kit держите в кармане.')}
`, `
  <h2>Разминка · 0:25</h2>
  ${say('Настоящие исследователи никогда не отправляются в путь без разминки! Смотрите на карточки и повторяйте за мной.')}
  ${act('Игра «Tropical Warm-up», раздел 6.')}
  <h2>Станция PALM · 0:35</h2>
  ${say('Ой, Пико что-то шепчет мне на ухо… Ветер разбросал по острову три пальмовых листа! Найдём все три — и получим первый символ.')}
  ${act('Дети ищут листья. После третьего листа — вручите жетон PALM, вождь кладёт его на карту.')}
  ${say('Символ PALM — наш! Первый круг на карте занят. Остров нам доверяет!')}
  <h2>Piko Says · 0:45</h2>
  ${say('Попугай Пико — главный хитрец острова. Он даёт команды, но выполнять нужно только те, где звучат волшебные слова PIKO SAYS!')}
  <h2>Станция PINEAPPLE · 0:55</h2>
  ${say('Впереди ананасовая роща. Ананасы выстроились в ряд и не пропускают путешественников. Сбейте их — и символ PINEAPPLE ваш!')}
  ${act('Pineapple Bowling. Когда каждый сделал свои попытки — жетон PINEAPPLE на карту.')}
  <h2>Limbo · 1:10</h2>
  ${say('Дорогу преграждает низкая пальмовая ветка. Пройти можно только по-гавайски — прогнувшись назад! А в самом конце ветку охраняет вулкан…')}
`, `
  <h2>Обед · 1:20</h2>
  ${say('Даже самым смелым исследователям нужны силы! Остров приглашает вас к тропическому столу. Пико просит: сначала моем руки!')}
  <h2>Tropical Memory · 1:45</h2>
  ${say('Пико обожает прятать вещи. Посмотрите внимательно на этот стол — у вас 30 секунд. Запомнили? Закрываем!')}
  <h2>Станция COCONUT · 1:55</h2>
  ${say('На острове созрели кокосы! Их нужно собрать в корзины. Чем дальше корзина, тем больше очков. Вместе нам нужно набрать… (назовите цель команды)!')}
  ${act('Coconut Toss. Цель команды — по 2 очка на ребёнка. Цель достигнута — жетон COCONUT.')}
  <h2>Станция WAVE · 2:05</h2>
  ${say('Начинается прилив! Пока играет музыка — гуляем по пляжу. Как только я скажу WAVE — все спасаются на островах! Помните: на острове всегда найдётся место для друга.')}
  ${act('В финале вся команда помещается на одном острове — жетон WAVE.')}
  <h2>Tropical Freeze · 2:15</h2>
  ${say('Музыка этого острова волшебная: когда она замолкает, все превращаются в статуи. Слушайте, в кого!')}
  <h2>Станция FLOWER · 2:20</h2>
  ${say('Последний символ — цветок. Он распускается только для тех, кто умеет танцевать от души! Пять раундов — пять танцев!')}
  ${act('Aloha Dance Battle. В финале все встают в круг, берутся за руки и «распускаются» — получается общий цветок.')}
  ${say('Смотрите — у нас получился огромный тропический цветок! Символ FLOWER — наш!')}
`, `
  <h2>Финал · 2:30</h2>
  ${say('У нас есть все пять символов! Но открыть сундук может только Chief of the Island!', 'Давайте перевернём жетоны по порядку карты… Что тут написано? A… L… O… H… A! Это волшебное слово острова!')}
  ${act('Вождь подходит к сундуку и говорит волшебное слово. Команда хором кричит: ALOHA! Помощник открывает сундук (или вождь вводит код на замке).')}
  ${say('Сундук открыт! Сокровища острова — для всей команды. Вождь, раздай, пожалуйста, сокровища своим исследователям!')}
  <h2>Торт · 2:40</h2>
  ${say('Каждый год в этот день на острове загорается маленький вулкан желаний. Вождь, загадывай желание — и задувай!')}
  ${act('Свечи, песня «С днём рождения» (можно добавить «Hau’oli lā hānau!» — «С днём рождения» по-гавайски).')}
  <h2>Дипломы и прощание · 2:50</h2>
  ${say('Сегодня каждый из вас прошёл TROPICAL QUEST и стал официальным исследователем острова. Остров вручает вам дипломы!')}
  ${act('Вручайте дипломы по одному: имя, номинация, аплодисменты, общее «ALOHA!». Последним — диплом вождя.')}
  ${say('На Гавайях говорят «Mahalo» — это значит «спасибо». Mahalo, что были с нами! Возьмите с собой кусочек острова — и возвращайтесь!')}
  ${act('Раздайте пакетики Mahalo с бирками. Общее фото в фотозоне.')}
  ${tip('Не бойтесь отходить от текста. Если дети увлеклись игрой — продлите её, если устали — переходите к следующему блоку или к еде. Праздник — для них, а не для сценария.')}
`]);

// 6. Игры и конкурсы
const game = ({ no, en, ru, art, time, props, how, host, tipText, token, note, home, garden }) => `
  <article class="game">
    <div class="game-head">
      <div class="game-ico">${art}</div>
      <div><span class="game-no">Испытание №${no}</span><h2>${en}</h2><span class="ru">${ru}</span></div>
      ${token ? `<div class="tok"><div class="tk">${miniToken(token)}</div>символ</div>` : ''}
    </div>
    ${pills(['⏱ ' + time], ...props.map((p) => [p, 'leaf']))}
    <div class="cols">
      <div><h3>Как играть</h3>${how}</div>
      <div>${host ? say(host) : ''}${note ? `<p class="small">${note}</p>` : ''}${tipText ? `<div class="box pine" style="padding:2.6mm 3.6mm;margin-bottom:2.4mm"><p class="small" style="margin:0"><b>Совет.</b> ${tipText}</p></div>` : ''}${home ? `<div class="small" style="display:grid;grid-template-columns:auto 1fr;gap:1mm 2.4mm"><span class="pill">дома</span><span>${home}</span><span class="pill leaf">во дворе</span><span>${garden}</span></div>` : ''}</div>
    </div>
  </article>`;

const G = [
  { no: 1, en: 'Tropical Warm-up', ru: 'Тропическая разминка', art: monkey(), time: '7–10 мин', props: ['карточки движений', 'музыка'],
    how: `<p class="small">Ведущий показывает карточку и называет движение — дети повторяют.</p><ul>
      <li><b>PALM</b> — качаемся как пальмы</li><li><b>WAVE</b> — изображаем волну руками</li><li><b>CRAB</b> — идём боком, как краб</li>
      <li><b>TURTLE</b> — двигаемся очень медленно</li><li><b>PARROT</b> — машем руками-крыльями</li><li><b>MONKEY</b> — прыгаем как обезьянки</li>
      <li><b>VOLCANO</b> — приседаем и резко «извергаемся» вверх</li></ul>`,
    host: 'Сначала медленно… а теперь быстрее! И последний раз — с закрытыми глазами… шучу, с открытыми!',
    home: 'Движения на месте, «краб» — вдоль дивана.', garden: '«Краб» и «обезьянка» — с перемещением по газону.',
    tipText: 'Начните в медленном темпе, потом ускоряйтесь и смешивайте карточки. Последний раунд пусть проведёт вождь острова.' },
  { no: 2, en: 'Piko Says', ru: 'Пико говорит', art: parrot(), time: '7–10 мин', props: ['попугай или карточка Пико'],
    how: `<p class="small">Если ведущий говорит «PIKO SAYS — прыгнуть!», дети выполняют команду. Если звучит просто «Прыгнуть!» — выполнять нельзя.</p>
      <p class="small"><b>Команды:</b> стать пальмой · показать волну · превратиться в краба · спрятаться от акулы · стать серфером · полететь как попугай · показать ананас.</p>`,
    host: 'PIKO SAYS — стать пальмой! PIKO SAYS — показать волну! …Спрятаться от акулы! Ага, кто спрятался? Пико этого не говорил!',
    home: 'Подходит даже для коридора.', garden: 'Встаньте в круг — так ведущего видят все.',
    tipText: 'Никто не выбывает: кто ошибся — делает «волну» руками и остаётся в игре. Детям 9–10 лет давайте команды быстрее.' },
  { no: 3, en: 'Pineapple Bowling', ru: 'Ананасовый боулинг', art: pineapple(), time: '10–15 мин', props: ['6 кеглей-ананасов', 'мяч'], token: 'pineapple',
    how: `<ol><li>Расставьте 6 кеглей треугольником (3-2-1). Оформите их как ананасы: наклейки или обёртки из Printable Kit.</li>
      <li>Линия броска — 2 м дома, 3 м во дворе.</li><li>Каждый ребёнок делает 2 попытки, ведущий поднимает упавшие кегли.</li>
      <li>Когда все сделали попытки — команда получает символ.</li></ol>`,
    host: 'Ананасы выстроились в ряд и не пропускают путешественников! Цельтесь в самую середину — и вперёд!', home: 'Дорожка 2 м вдоль стены, мяч — мягкий.', garden: '3 м по плитке или плотному газону.',
    tipText: 'Нет кеглей — подойдут 6 пластиковых бутылок 0,5 л с горстью песка или крупы внутри.' },
  { no: 4, en: 'Limbo', ru: 'Лимбо', art: volcano(), time: '10 мин', props: ['мягкая лента 2–3 м', 'музыка'],
    how: `<ol><li>Двое взрослых держат ленту натянутой — начните на уровне плеч детей.</li><li>Дети по очереди проходят под лентой, прогибаясь назад.</li>
      <li>После каждого раунда лента опускается на 10 см. <b>Никто не выбывает</b> — можно проходить как угодно.</li>
      <li>Финал <b>THE VOLCANO</b>: лента совсем низко, дети проползают под ней, изображая лаву.</li></ol>`,
    host: 'Ветка опускается всё ниже… Внимание — проснулся вулкан! Превращаемся в лаву и проползаем!', home: 'На ковре; на ламинате — без носков.', garden: 'На траве; финал «лава» — ползком по пледу.',
    tipText: 'Ленту только держат в руках, никогда не привязывают. Играйте на ковре или траве, без скользких носков.' },
  { no: 5, en: 'Coconut Toss', ru: 'Бросок кокоса', art: coconut(), time: '10 мин', props: ['3 корзины', 'мягкие мячи'], token: 'coconut',
    how: `<ol><li>Поставьте три корзины: <b>NEAR</b> — 1 балл, <b>MIDDLE</b> — 2 балла, <b>ISLAND</b> — 3 балла (таблички в Printable Kit).</li>
      <li>Расстояния: 1,5 / 2,5 / 3,5 м (дома можно ближе).</li><li>Каждый ребёнок бросает 3 «кокоса», команда считает очки вместе.</li>
      <li>Цель команды — по 2 балла на каждого ребёнка. Цель достигнута — символ получен.</li></ol>`,
    host: 'Кокосы созрели! NEAR — один балл, MIDDLE — два, а до самого ISLAND долетит только настоящий исследователь!', home: 'Корзины на 1 / 1,8 / 2,5 м.', garden: 'Корзины на 1,5 / 2,5 / 3,5 м.',
    tipText: 'Только мягкие мячи: поролоновые, тканевые, свёрнутые носки или коричневые помпоны.' },
  { no: 6, en: 'Tropical Wave', ru: 'Тропическая волна', art: wave(), time: '10 мин', props: ['голубые коврики', 'музыка'], token: 'wave',
    how: `<ol><li>Разложите «острова» — голубые коврики, полотенца или листы картона. Островов на 1–2 меньше, чем детей.</li>
      <li>Музыка играет — дети гуляют по «пляжу». Музыка останавливается, ведущий кричит «WAVE!» — все на островах.</li>
      <li>Каждый раунд убирайте один остров. Никто не выбывает — нужно потесниться и помочь другу.</li>
      <li>Финал: вся команда помещается на одном острове.</li></ol>`,
    host: 'Прилив! WAVE! Все на острова! Остров стал меньше — но на острове всегда найдётся место для друга!', home: 'Полотенца на ковре.', garden: 'Обручи или пледы на траве.',
    tipText: 'Коврики должны не скользить: кладите на ковёр или подложите антискользящую сетку. Во дворе — обручи на траве.' },
  { no: 7, en: 'Tropical Freeze', ru: 'Тропическая заморозка', art: flamingo(), time: '5–7 мин', props: ['карточки поз', 'музыка'],
    how: `<ol><li>Музыка играет — дети танцуют.</li><li>Музыка останавливается — ведущий называет образ: <b>PALM, SHARK, FLAMINGO, SURFER, PARROT</b>.</li>
      <li>Дети замирают в соответствующей позе. Ведущий «проверяет» статуи и смешит их, не касаясь.</li></ol>`,
    host: 'Замри! Фламинго! Какой красивый фламинго… а у этого фламинго даже глаза не моргают!',
    home: 'Музыку ставит на паузу помощник.', garden: 'Колонка в тени, громкость повыше.',
    tipText: 'Вместо выбывания отмечайте «самую смешную статую», «самую устойчивую», «самую тропическую».' },
  { no: 8, en: 'Aloha Dance Battle', ru: 'Танцевальный баттл', art: hibiscus(), time: '10 мин', props: ['музыка', 'плейлист DANCE'], token: 'flower',
    how: `<ol><li><b>Раунд 1</b> — Palm Dance: танец пальм на ветру.</li><li><b>Раунд 2</b> — Wave Dance: танец волн.</li>
      <li><b>Раунд 3</b> — Monkey Dance: танец обезьянок.</li><li><b>Раунд 4</b> — Parrot Dance: танец попугаев.</li>
      <li><b>Раунд 5</b> — Free Dance: свободный танец. В финале танцуют все, затем встают в круг, держась за руки, и «распускаются» — общий цветок.</li></ol>`,
    host: 'Раунд первый — Palm Dance! Покажите, как пальмы танцуют на ветру!', home: 'Мебель сдвинуть заранее.', garden: 'Танцпол — ровный газон без шлангов.',
    tipText: 'Каждый раунд — 40–60 секунд. Ведущий танцует первым: если взрослый не стесняется, дети тоже не будут.' },
  { no: 9, en: 'Tropical Memory', ru: 'Тропическая память', art: shell(), time: '10 мин', props: ['10 предметов', 'парео или полотенце'],
    how: `<ol><li>На столе 10 предметов: ананас, ракушка, очки, цветок, мяч, лист, ложка, стакан, попугай, кокос.</li>
      <li>Дети смотрят 30 секунд. Ведущий накрывает предметы парео.</li><li>Ведущий незаметно убирает один предмет и открывает стол.</li>
      <li>Команда вместе определяет, что исчезло. 3–4 раунда.</li></ol>`,
    host: 'Закрываем глаза… Пико что-то утащил! Что исчезло со стола?', home: 'На журнальном столике.', garden: 'На пледе в CHILL ZONE.',
    tipText: 'Усложнение для 8–10 лет: уберите два предмета или поменяйте два предмета местами.' },
];
S(6, 'Игры и конкурсы', 'Island games', [
  `<p class="small muted" style="margin-bottom:3mm">Девять игр праздника. Четыре из них — станции квеста: за них команда получает символ (жетон). Пятый символ, PALM, — за поиск пальмовых листьев (раздел 7).</p>${game(G[0])}${game(G[1])}`,
  `${game(G[2])}${game(G[3])}`,
  `${game(G[4])}${game(G[5])}`,
  `${game(G[6])}${game(G[7])}`,
  `${game(G[8])}
   <h2>Если остаётся время</h2>
   <div class="cols">
     <div class="box leaf"><h3>Hula-обруч</h3><p class="small" style="margin:0">Кто дольше прокрутит обруч под гавайскую музыку. Считайте общее время команды, а не личные рекорды.</p></div>
     <div class="box leaf"><h3>Цветок пожеланий</h3><p class="small" style="margin:0">Каждый гость пишет пожелание вождю на лепестке (Printable Kit), лепестки собирают в большой цветок — подарок на память.</p></div>
   </div>
   ${tip('Держите на всякий случай одну спокойную игру (Memory или Цветок пожеланий) — она выручает, если дети перевозбудились или кто-то пришёл позже.')}`,
]);

// 7. Treasure Quest
S(7, 'Treasure Quest', 'The Lost Treasure', [`
  <div class="cols" style="grid-template-columns:76mm 1fr">
    <div class="mapwrap">${treasureMap()}</div>
    <div>
      <p class="lead">Квест — это стержень праздника. Команда проходит пять станций и собирает пять символов. Карта висит на стене, и после каждой станции вождь кладёт жетон в нужный круг.</p>
      <table class="tbl">
        <tr><th>Станция</th><th>Задание</th></tr>
        <tr><td><span class="sym">${ico(palm())} PALM</span></td><td>Найти три спрятанных пальмовых листа</td></tr>
        <tr><td><span class="sym">${ico(wave())} WAVE</span></td><td>Перейти «океан» по островам — Tropical Wave</td></tr>
        <tr><td><span class="sym">${ico(pineapple())} PINEAPPLE</span></td><td>Сбить ананасы — Pineapple Bowling</td></tr>
        <tr><td><span class="sym">${ico(hibiscus())} FLOWER</span></td><td>Станцевать и создать общий тропический цветок — Aloha Dance Battle</td></tr>
        <tr><td><span class="sym">${ico(coconut())} COCONUT</span></td><td>Собрать кокосы — Coconut Toss</td></tr>
        <tr><td><span class="sym">${ico(chest())} TREASURE</span></td><td>Собрать код из пяти символов и открыть сундук</td></tr>
      </table>
    </div>
  </div>
  <h2 style="margin-top:4mm">Станция PALM: поиск листьев</h2>
  <div class="cols">
    <div>${check([
      'Распечатайте три пальмовых листа (Printable Kit) — на каждом номер 1, 2, 3.',
      'Спрячьте лист №1 так, чтобы его было легко найти. На обороте напишите подсказку, где лежит лист №2, а на №2 — где лист №3.',
      'Дети находят все три листа → жетон PALM.',
    ])}</div>
    <div>
      <p class="small"><b>Подсказки-примеры:</b> «Там, где живёт холод» (холодильник) · «Где отдыхают книги» (полка) · «Под самым мягким островом» (подушка дивана) · «Там, где прячутся туфли» (прихожая).</p>
      <p class="small"><b>Во дворе:</b> «Под деревом без кокосов» · «У того, кто поливает сад» (лейка) · «Где прячется солнце» (тень беседки).</p>
    </div>
  </div>
`, `
  <h2>Код сундука: слово ALOHA</h2>
  <div class="cols">
    <div>
      <p>Жетоны состоят из двух сторон: лицевая — символ, оборот — буква. Когда все пять жетонов лежат на карте, команда переворачивает их по номерам — и читает слово:</p>
      <div style="display:flex;gap:1.6mm;margin:2mm 0 3mm">${SYMBOLS.map((s, i) => `<div style="flex:1;text-align:center"><div style="border-radius:50%;aspect-ratio:1;background:${s.color};color:#fff;font-family:Unbounded;font-weight:800;font-size:15pt;display:flex;align-items:center;justify-content:center">${s.letter}</div><span class="small" style="font-weight:800">${i + 1}. ${s.en}</span></div>`).join('')}</div>
      <p>Вождь острова произносит волшебное слово у сундука, команда кричит «ALOHA!» — и помощник открывает сундук.</p>
    </div>
    <div class="box pine">
      <h3>Если на сундуке кодовый замок</h3>
      <p class="small">На обороте каждого жетона есть пустой кружок «цифра кода». Впишите туда цифры кода вашего замка по порядку станций. Для замка на 3 или 4 цифры заполните первые жетоны, на остальных нарисуйте звёздочку.</p>
      <p class="small" style="margin:0">Тогда после слова ALOHA вождь сам вводит код — дети в восторге!</p>
    </div>
  </div>
  <h2>Сундук</h2>
  <div class="cols">
    <div>
      <h3>Из чего сделать</h3>
      ${check(['готовый картонный или деревянный сундук (маркетплейсы, магазины для праздника)', 'обувная коробка, оклеенная крафт-бумагой, с наклейкой TREASURE из Printable Kit', 'корзина под парео, перевязанная верёвкой', 'для двора — пластиковый ящик с крышкой, украшенный листьями'])}
    </div>
    <div>
      <h3>Что положить внутрь</h3>
      ${check(['сувениры по числу детей + 1–2 запасных, всем одинаковые', 'наклейки и браслеты', 'сладости (с учётом аллергий)', 'маленькие игрушки: фигурки, мыльные пузыри, мини-фрисби', 'диплом вождя острова — сверху, в свитке'])}
    </div>
  </div>
  <h2>Где хранится сундук до финала</h2>
  <p>Сундук стоит на виду, но закрытый: так дети весь праздник предвкушают финал. Дома — на полке или рядом с фотозоной, во дворе — в тени, рядом с CHILL ZONE.</p>
  <h2>Запасной вариант без печати</h2>
  <p class="small">Если принтер подвёл в последний момент — нарисуйте карту маркером на ватмане, а символы — на пяти бумажных тарелках, буквы A-L-O-H-A — на обороте. Магия от этого не пострадает.</p>
`]);

// 8. HOME EDITION
S(8, 'HOME EDITION', 'Для квартиры', [`
  <p class="lead">Праздник в квартире — это три понятные зоны. Даже в небольшой квартире хватит одной комнаты 15–18 м² для игр и кухни или второй комнаты для стола.</p>
  <div class="box line" style="padding:3mm 18mm">${homePlan()}</div>
  <div class="zone"><b class="z">PHOTO ZONE</b><div>Голубой фон (ткань или фотофон), пальмовые листья, цветы, ананасы, надпись ALOHA. Ставьте у стены с окном сбоку — так лица хорошо освещены.</div></div>
  <div class="zone"><b class="z">PARTY ZONE</b><div>Свободное безопасное пространство для игр — минимум 3×3 м. Уберите хрупкие предметы, журнальный столик, провода. Сдвиньте диван к стене.</div></div>
  <div class="zone"><b class="z">FOOD BAR</b><div>Один праздничный стол с едой «шведским столом» — дети подходят сами. Таблички-домики из Printable Kit подскажут, где что.</div></div>
  <h2 style="margin-top:4mm">Правила квартиры</h2>
  <div class="cols">
    <div>${check(['только мягкий реквизит: мягкие мячи, тканевые «кокосы»', 'исключить водные игры', 'коврики для «Tropical Wave» — на ковёр, не на ламинат', 'громкость музыки — комфортная, предупредите соседей'])}</div>
    <div>${check(['закройте двери в комнаты, где нет праздника', 'приготовьте место для обуви и курток гостей', 'поставьте мусорный пакет у food bar', 'проверьте, что лента для Limbo и гирлянды не мешают проходу'])}</div>
  </div>
  ${tip('Квест в квартире особенно хорош, если пальмовые листья спрятать в разных комнатах: дети чувствуют себя настоящими исследователями, даже если остров — это двушка.')}
`]);

// 9. GARDEN EDITION
S(9, 'GARDEN EDITION', 'Для двора и дачи', [`
  <p class="lead">Во дворе можно развернуться: пять зон, больше движения, вечерний свет гирлянд. Главное — продумать тень, воду и безопасность.</p>
  <div class="box line" style="padding:3mm 18mm">${gardenPlan()}</div>
  <div class="cols">
    <div>
      <div class="zone"><b class="z">1 · ENTRANCE</b><div>Вход: постер ALOHA, корзина с леями, баннер на калитке.</div></div>
      <div class="zone"><b class="z">2 · PHOTO</b><div>Фотозона спиной к солнцу, чтобы дети не щурились.</div></div>
      <div class="zone"><b class="z">3 · FOOD BAR</b><div>В тени, у дома: ближе к холодильнику и раковине.</div></div>
      <div class="zone"><b class="z">4 · GAME ZONE</b><div>Ровный газон без камней, шлангов и ям.</div></div>
      <div class="zone"><b class="z">5 · CHILL ZONE</b><div>Пледы и подушки — для отдыха и спокойных игр.</div></div>
    </div>
    <div>
      <h3>Дополнительно для двора</h3>
      ${check(['пальмы в кадках или искусственные', 'LED-гирлянды на деревьях и беседке', 'пледы и подушки', 'садовые фонари вдоль дорожки', 'серф-доска как фотореквизит'])}
      <div class="box coral" style="margin-top:2mm">
        <h3>Безопасность во дворе</h3>
        <p class="small" style="margin:0">Гриль — только за ограждением и только взрослые. Тент или зонт для тени, вода в доступе, солнцезащитный крем и средство от насекомых. Шары и лёгкий декор закрепите грузиками от ветра.</p>
      </div>
    </div>
  </div>
  <div class="cols" style="margin-top:2mm">
    <div class="box pine"><h3>План Б на дождь</h3><p class="small" style="margin:0">Всё в наборе работает и в помещении: переходите на HOME EDITION — веранда или гостиная вместо газона.</p></div>
    <div class="box leaf"><h3>Можно добавить</h3><p class="small" style="margin:0">Мыльные пузыри, бадминтон, летнюю «Tropical Wave» с обручами вместо ковриков. Водные игры — только в тёплую погоду и с полотенцами.</p></div>
  </div>
`]);

// 10. Тропическое меню
S(10, 'Тропическое меню', 'Tropical menu', [`
  <p class="lead">Меню рассчитано на 10 детей. Всё подаётся «шведским столом»: маленькие порции, которые удобно брать руками.</p>
  <div class="menu">
    <div class="dish"><div class="a">${pineapple()}</div><div><b class="n">FRUIT ISLAND</b><span class="ru">Фруктовый остров</span><p>Ананас, арбуз, дыня, клубника, виноград, киви, манго, мандарины — выложенные островом.</p></div></div>
    <div class="dish"><div class="a">${palm()}</div><div><b class="n">ALOHA CHICKEN</b><span class="ru">Курочка Алоха</span><p>Кусочки курицы с ананасом и перцем в медово-соевом маринаде.</p></div></div>
    <div class="dish"><div class="a">${sun()}</div><div><b class="n">MINI HAWAIIAN PIZZA</b><span class="ru">Мини-пицца</span><p>Маленькие пиццы с ветчиной или индейкой, моцареллой и ананасом.</p></div></div>
    <div class="dish"><div class="a">${coconut()}</div><div><b class="n">COCONUT CUPCAKES</b><span class="ru">Кокосовые капкейки</span><p>Ванильно-кокосовые капкейки с нежным кремом и топперами.</p></div></div>
    <div class="dish"><div class="a">${shark()}</div><div><b class="n">OCEAN JELLY</b><span class="ru">Желе «Океан»</span><p>Голубое желе в стаканчиках с «песком» из печенья и мармеладными рыбками.</p></div></div>
    <div class="dish"><div class="a">${hibiscus(C.orange, C.pineDark)}</div><div><b class="n">TROPICAL PUNCH</b><span class="ru">Тропический пунш</span><p>Ананасовый, апельсиновый и яблочный сок с газированной водой. Без алкоголя.</p></div></div>
  </div>
  <h2 style="margin-top:4mm">Как оформить food bar</h2>
  <div class="cols">
    <div>${check(['скатерть голубая или с листьями, по краю — «юбка» из травы или бахромы', 'в центре — ананас, из которого «растут» цветы', 'таблички-домики у каждого блюда (Printable Kit)', 'топперы в капкейки, флажки на трубочки', 'пунш — в диспенсере с краником, лёд — отдельно'])}</div>
    <div>${check(['салфетки, тарелки и стаканы — на краю стола, чтобы не тянуться через еду', 'горячие блюда — на дальней стороне от детей', 'кувшин воды — обязательно, не все пьют сок', 'отдельное место для торта', 'влажные салфетки и мусорный пакет рядом'])}</div>
  </div>
  <div class="box coral">
    <h3>Аллергии — важно!</h3>
    <p class="small" style="margin:0">Ананас, киви, клубника, манго, цитрусовые, кокос, мёд, соя, глютен и молочные продукты — частые аллергены. Спросите родителей гостей об ограничениях заранее (строка в приглашении) и отметьте на табличках, в каких блюдах они есть.</p>
  </div>
`]);

// 11. Рецепты
const recipe = ({ en, ru, art, yieldTxt, ing, steps, note }) => `
  <div class="recipe">
    <div class="recipe-head"><div class="a">${art}</div><div><h2>${en}</h2><span class="ru">${ru}</span></div><div style="margin-left:auto"><span class="pill pine">${yieldTxt}</span></div></div>
    <div class="cols"><div><h3>Ингредиенты</h3><ul>${ing.map((i) => `<li>${i}</li>`).join('')}</ul></div>
    <div><h3>Приготовление</h3><ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol>${note ? `<p class="small muted" style="margin:0">${note}</p>` : ''}</div></div>
  </div>`;
S(11, 'Рецепты', 'Island kitchen', [
  recipe({ en: 'Fruit Island', ru: 'Фруктовый остров', art: pineapple(), yieldTxt: 'на 10 детей',
    ing: ['ананас — 1–2 шт.', 'арбуз — 1 небольшой', 'дыня — 1 шт.', 'клубника — 500–700 г', 'виноград — 500–700 г', 'киви — 4 шт.', 'манго — 2 шт.', 'мандарины — 6 шт.', 'бананы — 2 шт. (для пальмы)'],
    steps: ['Вымойте и обсушите фрукты. Арбуз и дыню нарежьте кубиками, киви — кружками, манго — брусочками.', 'На большое блюдо выложите «остров»: в центре половинка арбуза срезом вниз — это гора.', 'Пальма: банан — ствол, кружки киви — листья, дольки мандарина — песок у подножия.', 'Вокруг выложите «пляж» из ананаса и дыни, «рифы» из клубники и винограда.', 'Подавайте с короткими шпажками или вилочками для канапе.'],
    note: 'Нарезайте за 1–2 часа до праздника и храните в холодильнике под плёнкой. Виноград для младших гостей разрезайте пополам.' }) +
  recipe({ en: 'Aloha Chicken', ru: 'Курочка Алоха', art: palm(), yieldTxt: 'на 10 детей',
    ing: ['куриное филе — 1,5 кг', 'ананас — 1 шт. (или 1 банка консервированного)', 'сладкий перец — 4 шт.', 'соевый соус — 150 мл (лучше с пониженным содержанием соли)', 'мёд — 2–3 ст. л.', 'чеснок — 2–3 зубчика', 'имбирь — 1 ч. л. тёртого', 'растительное масло — 2 ст. л.'],
    steps: ['Смешайте соевый соус, мёд, тёртые чеснок и имбирь, масло.', 'Нарежьте филе кубиками 3 см, залейте маринадом и уберите в холодильник минимум на 30 минут (можно на ночь).', 'Нарежьте ананас и перец кусочками такого же размера.', '<b>Дома — духовка:</b> выложите курицу, ананас и перец на противень с пергаментом, 200 °C, 20–25 минут, один раз перемешайте.', '<b>Во дворе — гриль:</b> нанижите на шпажки через один, жарьте 10–12 минут, переворачивая. Только при безопасных условиях и под контролем взрослого.'],
    note: 'Курица готова, когда сок прозрачный, а внутри нет розового. Детям подавайте кусочки без шпажек или шпажки с тупым концом.' }),
  recipe({ en: 'Mini Hawaiian Pizza', ru: 'Мини-гавайская пицца', art: sun(), yieldTxt: '15–20 шт.',
    ing: ['мини-основы для пиццы — 15–20 шт. (или слоёное тесто)', 'моцарелла — 500 г', 'ветчина или индейка — 500 г', 'ананас — 1 банка или ½ свежего', 'томатный соус — 200–250 г', 'сушёный базилик — по желанию'],
    steps: ['Разогрейте духовку до 200 °C.', 'Если основ нет — вырежьте из раскатанного теста кружки 8–10 см стаканом.', 'Смажьте основы соусом, посыпьте половиной сыра.', 'Выложите кубики ветчины и ананаса (консервированный — хорошо отожмите), сверху — оставшийся сыр.', 'Выпекайте 10–12 минут до золотистого сыра. Остудите 5 минут перед подачей.'],
    note: 'Идея-развлечение: «пицца-бар» — дети сами собирают свою пиццу, взрослый ставит в духовку.' }) +
  recipe({ en: 'Coconut Cupcakes', ru: 'Кокосовые капкейки', art: coconut(), yieldTxt: '12–14 шт.',
    ing: ['мука — 180 г', 'разрыхлитель — 1,5 ч. л.', 'сливочное масло мягкое — 120 г', 'сахар — 150 г', 'яйца — 2 шт.', 'кокосовое молоко (или обычное) — 120 мл', 'кокосовая стружка — 50 г + для декора', '<b>Крем:</b> творожный сыр — 300 г, сахарная пудра — 70 г, сливки 33% — 150 мл'],
    steps: ['Взбейте масло с сахаром до пышности, по одному добавьте яйца.', 'Всыпьте муку с разрыхлителем и стружкой, влейте молоко, перемешайте до однородности.', 'Разложите по формочкам на ⅔, выпекайте при 180 °C 20–22 минуты (до сухой шпажки).', 'Крем: взбейте холодные сливки, добавьте творожный сыр и пудру, взбейте до плотности.', 'Остывшие капкейки украсьте кремом, стружкой и топперами из Printable Kit.'],
    note: 'Капкейки можно испечь накануне, а кремом украсить в день праздника.' }),
  recipe({ en: 'Ocean Jelly', ru: 'Желе «Океан»', art: shark(), yieldTxt: '10 стаканчиков',
    ing: ['светлое желе (лимонное, ананасовое) — 2–3 пачки на 1 л или желатин — 20 г на 1 л сока', 'светлый сок (яблочный, белый виноград) — 1 л', 'голубой пищевой краситель — несколько капель', 'песочное печенье — 150 г («песок»)', 'мармеладные рыбки или акулы — 1 упаковка', 'прозрачные стаканчики 150–200 мл', 'зонтики для коктейлей'],
    steps: ['Приготовьте желе по инструкции на упаковке, добавьте краситель до цвета лагуны.', 'Разлейте по стаканчикам на ¾, опустите по 1–2 мармеладные рыбки.', 'Уберите в холодильник на 3–4 часа (лучше на ночь).', 'Перед подачей посыпьте один край измельчённым печеньем — получится пляж.', 'Воткните зонтик — и океан готов.'] }) +
  recipe({ en: 'Tropical Punch', ru: 'Тропический пунш', art: hibiscus(C.orange, C.pineDark), yieldTxt: '≈ 9–10 л',
    ing: ['ананасовый сок — 3 л', 'апельсиновый сок — 2 л', 'яблочный сок — 1–2 л', 'газированная вода — 2–3 л', 'апельсины — 2 шт.', 'лайм — 2 шт.', 'ананас — несколько долек', 'лёд'],
    steps: ['Заранее охладите все соки и воду.', 'В диспенсере или большой чаше смешайте соки.', 'Газированную воду добавляйте прямо перед подачей — так пунш дольше шипит.', 'Добавьте кружочки апельсина, лайма и дольки ананаса.', 'Лёд подавайте отдельно в ведёрке — чтобы пунш не разбавлялся.'],
    note: 'Без алкоголя. Объёма хватит на 10 детей и взрослых. Рядом поставьте кувшин простой воды.' }),
]);

// 12. Shopping list
S(12, 'Shopping List', 'Список покупок', [`
  <p class="small muted" style="margin-bottom:3mm">Отмечайте купленное галочкой. Количество рассчитано на 10 детей.</p>
  <div class="shop">
    <div class="grp"><h3>Декор</h3>${check(['30–50 воздушных шаров <em>(голубые, жёлтые, розовые, зелёные)</em>', '3–5 гирлянд', '2 гирлянды из листьев', 'леи — по числу гостей + 2', 'баннер ALOHA <em>(есть в Printable Kit)</em>', 'голубая ткань для фотозоны 2–3 м', 'искусственные цветы', 'искусственные пальмовые листья', 'декоративные ананасы', 'декоративные кокосы', 'ракушки', 'лента и насос для шаров', 'двусторонний скотч, малярный скотч'])}</div>
    <div class="grp"><h3>Реквизит</h3>${check(['6 пластиковых кеглей', '6–10 мягких мячей', '3 корзины', 'limbo-лента 2–3 м', 'голубые коврики — по числу детей', 'карточки квеста <em>(Printable Kit)</em>', 'конверты', 'сундук', 'кодовый замок <em>(по желанию)</em>', 'наклейки', 'игрушечный попугай <em>(по желанию)</em>', 'парео или полотенце + 10 предметов для Memory'])}</div>
    <div class="grp"><h3>Сервировка</h3>${check(['тарелки', 'стаканы', 'вилки', 'ложки', 'салфетки', 'трубочки', 'скатерть', 'контейнеры', 'бумажные полотенца', 'мусорные пакеты', 'шпажки и зонтики для коктейлей', 'диспенсер для напитков', 'формочки для капкейков', 'прозрачные стаканчики для желе'])}</div>
    <div class="grp"><h3>Для печати и сборки</h3>${check(['бумага А4 80 г/м² — 1 пачка', 'плотная бумага А4 160–200 г/м² — 30–40 листов', 'ножницы, канцелярский нож', 'клей-карандаш', 'дырокол', 'шпагат или лента 3 м для баннера', 'зубочистки для топперов', 'деревянные палочки для фотобутафории', 'маркер для имён'])}</div>
  </div>
`, `
  <div class="shop">
    <div class="grp"><h3>Фрукты</h3>${check(['ананас — 3–4 шт.', 'арбуз — 1 небольшой', 'дыня — 1 шт.', 'клубника — 500–700 г', 'виноград — 500–700 г', 'киви — 4 шт.', 'манго — 2 шт.', 'мандарины — 6 шт.', 'бананы — 2 шт.', 'апельсины — 2 шт.', 'лайм — 2 шт.'])}</div>
    <div class="grp"><h3>Мясо, молочное, яйца</h3>${check(['куриное филе — 1,5 кг', 'ветчина или индейка — 500 г', 'моцарелла — 500 г', 'сливочное масло — 120 г', 'творожный сыр — 300 г', 'сливки 33% — 150 мл', 'яйца — 2 шт.'])}</div>
    <div class="grp"><h3>Овощи и специи</h3>${check(['сладкий перец — 4 шт.', 'чеснок — 1 головка', 'имбирь — небольшой корень'])}</div>
    <div class="grp"><h3>Бакалея</h3>${check(['соевый соус — 150 мл', 'мёд', 'растительное масло', 'томатный соус — 250 г', 'мини-основы для пиццы — 15–20 шт.', 'мука — 180 г', 'сахар — 150 г', 'сахарная пудра — 70 г', 'разрыхлитель', 'кокосовая стружка — 100 г', 'кокосовое молоко — 120 мл', 'желе или желатин', 'голубой пищевой краситель', 'песочное печенье — 150 г', 'мармеладные рыбки', 'ананас консервированный — 1 банка'])}</div>
    <div class="grp"><h3>Напитки</h3>${check(['ананасовый сок — 3 л', 'апельсиновый сок — 2 л', 'яблочный сок — 1–2 л', 'газированная вода — 2–3 л', 'питьевая вода', 'лёд'])}</div>
    <div class="grp"><h3>Торт и подарки</h3>${check(['торт — заказать за 7 дней', 'свечи', 'сувениры в сундук — по числу детей + 2', 'пакетики Mahalo — по числу гостей', 'сладости в подарки'])}</div>
  </div>
`]);

// 13. Декор
S(13, 'Декор', 'Island style', [`
  <p class="lead">Тропический стиль держится на трёх вещах: <b>зелень листьев</b>, <b>яркие цветы и фрукты</b>, <b>голубой цвет океана</b>. Всё остальное — детали.</p>
  <h2>Палитра праздника</h2>
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:2mm;margin-bottom:4mm">
    ${[['Океан', C.ocean], ['Лагуна', C.lagoon], ['Гибискус', C.coral], ['Ананас', C.pine], ['Листья', C.leaf], ['Песок', C.sand]].map(([n, c]) => `<div><div style="height:13mm;border-radius:3mm;background:${c}"></div><div class="small" style="font-weight:800;margin-top:1mm">${n}</div></div>`).join('')}
  </div>
  <div class="cols">
    <div>
      <h2>Фотозона</h2>
      <ol>
        <li>Основа: голубая ткань или фотофон 2×2 м, закреплённый на стене или стойке.</li>
        <li>По краям — пальмовые и монстеровые листья, сверху — гирлянда из листьев.</li>
        <li>Баннер ALOHA из Printable Kit по центру.</li>
        <li>Внизу — декоративные ананасы, кокосы, ракушки, серф-доска (во дворе).</li>
        <li>Рядом — корзинка с фотобутафорией: очки, усы, цветы, таблички.</li>
      </ol>
      <h2>Вход</h2>
      ${check(['постер «Welcome» на двери или калитке', 'корзина с леями и табличкой «Возьми свою лею»', 'генератор островных имён и бейджи — на столике у входа'])}
    </div>
    <div>
      <h2>Гирлянда из шаров</h2>
      <p class="small">Формула для 40 шаров (около 2,5 м гирлянды):</p>
      <table class="tbl" style="margin-bottom:2.6mm">
        <tr><td>голубые / бирюзовые</td><td><b>14</b></td></tr>
        <tr><td>жёлтые</td><td><b>10</b></td></tr>
        <tr><td>розовые / коралловые</td><td><b>8</b></td></tr>
        <tr><td>зелёные</td><td><b>8</b></td></tr>
      </table>
      <ol>
        <li>Надуйте шары разного размера: 25, 30 и 12 см.</li>
        <li>Свяжите шары парами, пары — в «четвёрки».</li>
        <li>Нанизывайте четвёрки на ленту для гирлянд, чередуя цвета.</li>
        <li>Маленькие шары вставьте в пустоты, добавьте листья.</li>
      </ol>
      <div class="box coral"><p class="small" style="margin:0"><b>Пальма из шаров:</b> ствол — 8–10 коричневых шаров-колбасок, крона — 6 зелёных «листьев». Ставится в ведро с песком.</p></div>
    </div>
  </div>
`, `
  <h2>Food bar</h2>
  <div class="cols">
    <div>${check(['«юбка» из травы или бахромы вдоль края стола', 'дорожка из пальмовых листьев по центру', 'ананас-ваза: срежьте верх, выньте мякоть, поставьте цветы', 'фрукты на разных уровнях: подставки, перевёрнутые миски', 'таблички-домики у каждого блюда'])}</div>
    <div>${check(['стопки тарелок и салфеток — в начале стола', 'стаканы с трубочками-флажками', 'пунш в диспенсере, украшенном леей', 'капкейки на ярусной подставке с топперами', 'маленькая гирлянда LED — по краю стола'])}</div>
  </div>
  <h2>Праздничный стол и стулья</h2>
  <p>Если дети едят за общим столом — положите у каждой тарелки цветок гибискуса или бейдж с именем (из набора Island Explorer). Стулья можно украсить леями или листьями на спинке.</p>
  <h2>Детали, которые делают «вау»</h2>
  <div class="cols3">
    <div class="box leaf"><h3>Звук</h3><p class="small" style="margin:0">Музыка встречает гостей уже на лестничной клетке или у калитки.</p></div>
    <div class="box pine"><h3>Свет</h3><p class="small" style="margin:0">Тёплые LED-гирлянды и фонарики — особенно к вечеру и в финале.</p></div>
    <div class="box coral"><h3>Запах</h3><p class="small" style="margin:0">Свежий ананас и цитрусы на столе — остров чувствуется сразу.</p></div>
  </div>
  <h2>Бюджет: на чём сэкономить</h2>
  <div class="cols">
    <div>${check(['листья из зелёной бумаги вместо искусственных — шаблон: монстера на фотозоне', 'вместо фотофона — голубая простыня или пододеяльник', 'леи можно сделать из гофробумаги и трубочек'])}</div>
    <div>${check(['коврики «острова» — из голубого картона или полотенец', 'кегли — пластиковые бутылки с наклейками-ананасами', 'сундук — обувная коробка с наклейкой TREASURE'])}</div>
  </div>
  ${tip('Ставьте фотозону туда, где вы и так будете много находиться: тогда в кадр попадают естественные моменты, а не только постановочные фото.')}
  <div class="box line" style="display:grid;grid-template-columns:repeat(6,1fr);gap:3mm;align-items:center;padding:4mm">
    ${[monstera(), frond(), hibiscus(), pineapple(), lei(), shell()].map((a) => `<div style="height:20mm">${a}</div>`).join('')}
  </div>
`]);

// 14. Музыка
S(14, 'Музыкальный гид', 'Music guide', [`
  <p class="lead">Музыка — половина атмосферы. Соберите три плейлиста заранее и скачайте их в офлайн, чтобы не зависеть от интернета.</p>
  <div class="cols">
    <div>
      <h2>Welcome · встреча гостей</h2>
      <div class="track"><span class="no">01</span><div><b>Hawaiian Roller Coaster Ride</b><span>Mark Keali’i Ho’omalu, Kamehameha Schools Children’s Chorus</span></div></div>
      <div class="track"><span class="no">02</span><div><b>Lava</b><span>Kuana Torres Kahele, Napua Greig, James Ford Murphy</span></div></div>
      <div class="track"><span class="no">03</span><div><b>He Mele No Lilo</b><span>Mark Keali’i Ho’omalu, Kamehameha Schools Children’s Chorus</span></div></div>
      <h2 style="margin-top:5mm">Quest · станции и игры</h2>
      <div class="track"><span class="no">04</span><div><b>We Know The Way</b><span>Opetaia Foa’i, Lin-Manuel Miranda</span></div></div>
      <div class="track"><span class="no">05</span><div><b>Where You Are</b><span>Auli’i Cravalho и исполнители саундтрека</span></div></div>
      <div class="track"><span class="no">06</span><div><b>Logo Te Pate</b><span>Olivia Foa’i, Opetaia Foa’i, Talaga Steve Sale</span></div></div>
      <h2 style="margin-top:5mm">Dance · баттл и финал</h2>
      <div class="track"><span class="no">07</span><div><b>You’re Welcome</b><span>Dwayne Johnson</span></div></div>
      <div class="track"><span class="no">08</span><div><b>How Far I’ll Go</b><span>Auli’i Cravalho</span></div></div>
    </div>
    <div>
      <h2>Как пользоваться</h2>
      ${check(['Welcome-плейлист включите за 10 минут до прихода первого гостя.', 'Для «Tropical Wave» и «Freeze» нужен человек, который ставит музыку на паузу — помощник ведущего.', 'Во время обеда — тише: укулеле-инструменталы, звуки океана.', 'Торт — песня «С днём рождения» вживую, без фонограммы.', 'Финал с сундуком — самая энергичная песня из плейлиста DANCE.'])}
      <div class="box pine">
        <h3>Добавьте фон</h3>
        <p class="small" style="margin:0">Для пауз и обеда найдите в музыкальном сервисе подборки по запросам «hawaiian ukulele», «tropical beach ambience», «ukulele kids».</p>
      </div>
      <div class="box line">
        <h3>Техника</h3>
        <p class="small" style="margin:0">Колонка заряжена, телефон в режиме «не беспокоить», громкость проверена в комнате заранее. Во дворе — колонка в тени.</p>
      </div>
      ${tip('Сделайте отдельный короткий трек-«гонг» (барабаны или звук ракушки) — им удобно объявлять начало каждой станции.')}
    </div>
  </div>
  <p class="small muted" style="margin-top:2mm">Песни перечислены как рекомендации, сами аудиофайлы в набор не входят. Для публичного воспроизведения музыки организатор самостоятельно проверяет требования лицензирования.</p>
`]);

// 15. Printable Kit
const printRow = (n, what, copies, paper) => `<tr><td>${n}</td><td><b>${what}</b></td><td>${copies}</td><td>${paper}</td></tr>`;
S(15, 'Printable Kit', 'Что распечатать', [`
  <p class="lead">Все материалы для печати — в отдельном файле <b>«Printable Kit»</b>. Печатайте на домашнем принтере в формате А4.</p>
  <div class="cols3" style="margin-bottom:3mm">
    <div class="box"><h3>Масштаб</h3><p class="small" style="margin:0">«Фактический размер» / 100%. Не «по размеру страницы» — иначе жетоны не лягут в круги карты.</p></div>
    <div class="box"><h3>Бумага</h3><p class="small" style="margin:0"><b>Плотная</b> 160–200 г/м² — карточки, жетоны, таблички. <b>Обычная</b> 80 г/м² — остальное.</p></div>
    <div class="box"><h3>Цвет</h3><p class="small" style="margin:0">Фон страниц белый — набор экономно расходует чернила. Можно печатать в копицентре.</p></div>
  </div>
  <table class="tbl compact">
    <tr><th>Стр.</th><th>Что</th><th>Сколько</th><th>Бумага</th></tr>
    ${kitIndex().map((g) => printRow(g.first === g.last ? g.first : g.first + '–' + g.last, g.title, g.copies, g.paper.replace(' бумага', ''))).join('')}
  </table>
  ${tip('Карту и постер Welcome эффектно напечатать на А3 в копицентре («по размеру бумаги А3»). Для карты А3 жетоны печатайте с увеличением 141%.')}
`]);

// 16. Дипломы
S(16, 'Дипломы', 'Awards', [`
  <p class="lead">Дипломы — то, что дети уносят домой и показывают родителям. В наборе три вида наград.</p>
  <div class="cols3">
    <div class="box"><h3>Island Explorer</h3><p class="small" style="margin:0">Главный диплом — получает каждый гость за прохождение TROPICAL QUEST.</p></div>
    <div class="box pine"><h3>Chief of the Island</h3><p class="small" style="margin:0">Особый диплом вождя острова — только для именинника.</p></div>
    <div class="box coral"><h3>Special Awards</h3><p class="small" style="margin:0">Номинации — у каждого ребёнка своя.</p></div>
  </div>
  <h2>Номинации</h2>
  <table class="tbl">
    <tr><th>Номинация</th><th>Кому</th></tr>
    <tr><td><b>Best Island Dancer</b> · Лучший танцор острова</td><td>самому зажигательному в Dance Battle</td></tr>
    <tr><td><b>Limbo Master</b> · Мастер лимбо</td><td>самому гибкому</td></tr>
    <tr><td><b>Coconut Champion</b> · Кокосовый чемпион</td><td>самому меткому</td></tr>
    <tr><td><b>Tropical Team Player</b> · Душа команды</td><td>тому, кто больше всех помогал</td></tr>
    <tr><td><b>Pineapple Pro</b> · Ананасовый профи</td><td>мастеру боулинга</td></tr>
    <tr><td><b>Wave Rider</b> · Покоритель волн</td><td>самому ловкому в Tropical Wave</td></tr>
    <tr><td><b>Freeze Statue</b> · Лучшая статуя</td><td>самой смешной статуе в Freeze</td></tr>
    <tr><td><b>Eagle Eye</b> · Зоркий глаз</td><td>герою Tropical Memory</td></tr>
    <tr><td><b>Island Sunshine</b> · Солнце острова</td><td>самой яркой улыбке</td></tr>
    <tr><td><b>Brave Explorer</b> · Смелый исследователь</td><td>самому смелому</td></tr>
    <tr><td><b>Своя номинация</b> · 2 пустых бланка</td><td>впишите сами</td></tr>
  </table>
  <h2>Как провести награждение</h2>
  <div class="cols">
    <div>${check(['Впишите имена маркером заранее, накануне праздника.', 'Распределите номинации так, чтобы каждый ребёнок получил одну.', 'Вручайте по одному: имя → номинация → аплодисменты → «ALOHA!».', 'Диплом вождя — последним, под самые громкие аплодисменты.'])}</div>
    <div>${tip('Во время праздника незаметно записывайте в телефон, кто чем отличился, — тогда номинации прозвучат искренне и точно, а не «по списку».')}</div>
  </div>
`]);

// 17. Подарки гостям
S(17, 'Подарки гостям', 'Mahalo gifts', [`
  <p class="lead">Mahalo — по-гавайски «спасибо». Пакетик-подарок с биркой Mahalo гость получает на прощание, а сокровища из сундука — в финале квеста.</p>
  <h2>Что положить в пакетик Mahalo</h2>
  <div class="cols3">
    <div class="box leaf"><h3>Базовый</h3>${check(['наклейки', 'браслет', 'сладость', 'бирка Mahalo'])}</div>
    <div class="box pine"><h3>Расширенный</h3>${check(['всё из базового', 'лея (та, что была на празднике)', 'мыльные пузыри', 'мини-игрушка'])}</div>
    <div class="box coral"><h3>Вау</h3>${check(['всё из расширенного', 'детские солнечные очки', 'мини-фрисби или мячик', 'раскраска из набора + мелки'])}</div>
  </div>
  <h2>Сокровища в сундуке</h2>
  <p>Сундук — общий приз команды. Внутри: сувениры, наклейки, браслеты, сладости, маленькие игрушки. Вождь раздаёт сокровища — это его особая роль и прекрасный момент для фото.</p>
  <div class="cols">
    <div>
      <h2>Упаковка</h2>
      ${check(['крафт-пакеты или прозрачные пакетики с лентой', 'бирка Mahalo на шпагате (Printable Kit)', 'на бирке — имя гостя и подпись именинника', 'пакеты подписаны и стоят у выхода'])}
    </div>
    <div>
      <h2>Правила хороших подарков</h2>
      ${check(['одинаковые подарки всем — без обид', 'без мелких деталей и острых краёв', 'сладости — с учётом аллергий', 'запас 1–2 пакетика на всякий случай'])}
    </div>
  </div>
  ${tip('Попросите именинника лично вручить каждому пакетик и сказать «Mahalo, что пришёл!». Это учит благодарности и делает прощание тёплым.')}
`]);

// 18. Подготовка организатора
S(18, 'Подготовка организатора', 'Countdown', [`
  <p class="lead">Чек-лист подготовки по дням. Повесьте эту страницу на холодильник и отмечайте сделанное.</p>
  <div class="cols">
    <div>
      <div class="box line"><h2>За 14 дней</h2>${check(['выбрать дату, время и формат: HOME или GARDEN', 'составить список гостей', 'распечатать и раздать приглашения', 'спросить родителей об аллергиях'])}</div>
      <div class="box line"><h2>За 7 дней</h2>${check(['купить декор', 'заказать торт', 'подготовить музыку', 'распечатать материалы', 'собрать подарки', 'найти реквизит: кегли, мячи, корзины, коврики'])}</div>
      <div class="box line"><h2>За 3 дня</h2>${check(['вырезать карточки, жетоны, таблички', 'собрать баннер и корону вождя', 'подписать дипломы и бирки Mahalo', 'распределить роли: ведущий, помощник, фотограф'])}</div>
    </div>
    <div>
      <div class="box line"><h2>За 1 день</h2>${check(['купить свежие продукты', 'подготовить реквизит', 'собрать сундук', 'проверить музыку', 'подготовить карту', 'испечь капкейки, сделать желе, замариновать курицу', 'зарядить колонку и телефон'])}</div>
      <div class="box line"><h2>За 2 часа</h2>${check(['установить фотозону', 'оформить food bar', 'спрятать предметы квеста (пальмовые листья)', 'разложить реквизит', 'проверить безопасность помещения'])}</div>
      <div class="box pine"><h2>За 15 минут</h2>${check(['включить Welcome-плейлист', 'корзина с леями у входа', 'шпаргалка ведущего в кармане', 'улыбнуться: ALOHA!'])}</div>
    </div>
  </div>
`]);

// 19. Безопасность
S(19, 'Безопасность', 'Safety first', [`
  <p class="lead">Праздник удался, если все вернулись домой счастливыми и целыми. Пройдитесь по списку накануне.</p>
  <div class="cols">
    <div>
      <h2>Пространство</h2>
      ${check(['свободная зона игр без острых углов, стекла и проводов', 'коврики не скользят, пол сухой', 'лента для лимбо — только в руках взрослых', 'окна и балкон закрыты, бытовая химия убрана', 'гриль, мангал, бассейн — под присмотром взрослых и за ограждением'])}
      <h2>Еда и напитки</h2>
      ${check(['аллергии гостей известны заранее', 'на табличках отмечены аллергены', 'виноград и мелкие кусочки — разрезаны для младших', 'шпажки — с тупым концом или без них', 'вода доступна всегда'])}
    </div>
    <div>
      <h2>Шары и реквизит</h2>
      ${check(['лопнувшие шары сразу убирать — кусочки латекса опасны для детей', 'мячи — только мягкие', 'мелкие детали и магниты — не в подарки', 'кодовый замок и сундук — без острых краёв'])}
      <h2>Люди</h2>
      ${check(['телефоны родителей всех гостей — в одном списке', 'аптечка: пластыри, антисептик, охлаждающий пакет', 'один взрослый всегда смотрит на детей, а не в телефон', 'во дворе — тень, головные уборы, солнцезащитный крем', 'договоритесь с родителями, кто и во сколько забирает ребёнка'])}
    </div>
  </div>
  <div class="box coral">
    <h3>Важно</h3>
    <p class="small" style="margin:0">Организатор самостоятельно отвечает за безопасность пространства, реквизита, еды, напитков и соответствие активностей возрасту детей. Необходимо заранее учитывать пищевые аллергии и индивидуальные ограничения участников.</p>
  </div>
`]);

// 20. Лицензия
S(20, 'Лицензия', 'Terms of use', [`
  <div class="box line" style="padding:6mm 7mm">
    <h2>Условия использования</h2>
    <p><b>© ${config.brand}, ${config.year}. Все права защищены.</b></p>
    <p>Материалы предназначены для использования в соответствии с приобретённой лицензией.</p>
    <p>Покупатель может распечатывать материалы в неограниченном количестве для проведения <b>своего личного праздника</b> (праздников своей семьи).</p>
    <p style="margin:0">Запрещены копирование, перепродажа, публичная публикация, распространение файлов и передача материалов третьим лицам, если иное прямо не предусмотрено лицензией.</p>
  </div>
  <div class="cols">
    <div class="box leaf"><h3>Можно</h3>${check(['печатать дома или в копицентре', 'вписывать имена и даты от руки', 'делиться фотографиями праздника в соцсетях'])}</div>
    <div class="box coral"><h3>Нельзя</h3>${check(['пересылать файлы друзьям и в чаты', 'продавать или выкладывать в открытый доступ', 'использовать для коммерческих праздников без отдельной лицензии'])}</div>
  </div>
  <div class="box">
    <h3>Музыка</h3>
    <p class="small" style="margin:0">Для публичного воспроизведения музыки организатор самостоятельно проверяет требования лицензирования в своей юрисдикции. Аудиофайлы в набор не входят.</p>
  </div>
  <div class="box pine">
    <h3>Нужна помощь или персонализация?</h3>
    <p class="small" style="margin:0">Напишите продавцу — поможем с печатью, а также можем подготовить версию набора с именем и возрастом именинника.</p>
  </div>
`]);

// ───────── сборка страниц ─────────
function coverPage() {
  return `<section class="page cover">
    <div class="leafs">
      <div style="width:92mm;height:92mm;left:-26mm;top:-24mm;transform:rotate(140deg)">${monstera(C.leafDark, C.leaf)}</div>
      <div style="width:78mm;height:78mm;left:22mm;top:-36mm;transform:rotate(100deg)">${frond(C.leaf, C.leafDark)}</div>
      <div style="width:86mm;height:86mm;right:-28mm;top:-20mm;transform:rotate(220deg)">${monstera(C.leaf, C.leafLight)}</div>
      <div style="width:30mm;height:30mm;right:34mm;top:22mm">${sun()}</div>
    </div>
    <div class="inner">
      <div class="tm-line">HAWAIIAN BIRTHDAY ADVENTURE</div>
      <h1>TROPICAL<br>QUEST<sup>™</sup></h1>
      <div class="script">Aloha, Island Explorers!</div>
      <div class="what">Полный digital-набор для детского дня рождения</div>
      <div class="chips"><span>6–10 лет</span><span>2,5–3 часа</span><span>дома или во дворе</span></div>
      <div style="margin-top:7mm"><span style="display:inline-block;background:var(--pine);color:var(--ocean-deep);border-radius:10mm;padding:2mm 6mm;font-family:Unbounded;font-weight:800;font-size:10pt;letter-spacing:.06em">ГИД ОРГАНИЗАТОРА · ФАЙЛ 1 ИЗ 2</span></div>
    </div>
    <svg viewBox="0 0 210 80" preserveAspectRatio="none" style="position:absolute;left:0;bottom:0;width:210mm;height:80mm">
      <path d="M0 26 C40 12 70 34 110 24 C150 14 180 30 210 20 L210 80 L0 80Z" fill="${C.sand}"/>
      <path d="M0 26 C40 12 70 34 110 24 C150 14 180 30 210 20" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 4"/>
    </svg>
    <div class="hero">
      <div style="width:56mm;height:56mm;left:14mm;bottom:6mm">${palm()}</div>
      <div style="width:44mm;height:44mm;left:63mm;bottom:2mm">${chest()}</div>
      <div style="width:52mm;height:52mm;left:100mm;bottom:22mm">${parrot()}</div>
      <div style="width:34mm;height:34mm;left:150mm;bottom:4mm">${pineapple()}</div>
      <div style="width:26mm;height:26mm;left:176mm;bottom:20mm">${hibiscus()}</div>
      <div style="width:22mm;height:22mm;left:112mm;bottom:-2mm">${coconut()}</div>
    </div>
    <div class="editions"><b>HOME EDITION + GARDEN EDITION</b><div>сценарий · игры · квест · меню · декор · printable kit</div></div>
  </section>`;
}

function tocPage(tocItems) {
  return `<section class="page g">
    <div class="g-deco">${monstera()}</div>
    <header class="g-head"><span><span class="tm">TROPICAL QUEST™</span> · Гид организатора</span><span>Aloha!</span></header>
    <div class="g-title"><h1><span class="sub">Start here</span>Как пользоваться набором</h1></div>
    <div class="g-body">
      <div class="steps">
        <div class="step"><div class="n">1</div><b>Прочитайте гид</b><p>Начните с разделов 1–4 и чек-листа подготовки (раздел 18) — 20 минут, и вся картина праздника у вас в голове.</p></div>
        <div class="step"><div class="n">2</div><b>Распечатайте Printable Kit</b><p>Второй файл набора: приглашения, карта, жетоны, карточки, таблички, дипломы. Что и сколько печатать — раздел 15.</p></div>
        <div class="step"><div class="n">3</div><b>Проведите праздник</b><p>Сценарий с репликами — раздел 5, шпаргалка ведущего — в Printable Kit. Остаётся только веселиться!</p></div>
      </div>
      <h2>Содержание</h2>
      <nav class="toc">${tocItems.map((t) => `<a><span class="tn">${String(t.no).padStart(2, '0')}</span><span class="tt">${t.title}</span><span class="tp">${t.page}</span></a>`).join('')}</nav>
      <div class="box pine" style="margin-top:5mm;display:grid;grid-template-columns:22mm 1fr;gap:4mm;align-items:center">
        <div style="width:22mm;height:22mm">${parrot()}</div>
        <div><b>Знакомьтесь, это Пико!</b><p class="small" style="margin:0">Попугай-помощник будет встречаться на страницах гида с советами, которые сэкономят вам время и нервы. А на празднике — давать детям хитрые команды.</p></div>
      </div>
    </div>
    <footer class="g-foot"><span>tropical quest · the party is the adventure</span><span class="pn">2</span></footer>
  </section>`;
}

function backPage() {
  return `<section class="page back">
    <div style="position:absolute;width:96mm;height:96mm;left:-30mm;bottom:-26mm;transform:rotate(-40deg)">${monstera(C.leafDark, C.leaf)}</div>
    <div style="position:absolute;width:90mm;height:90mm;right:-30mm;top:-24mm;transform:rotate(200deg)">${monstera(C.leaf, C.leafLight)}</div>
    <div style="position:absolute;width:70mm;height:70mm;right:4mm;bottom:-10mm;transform:rotate(-70deg)">${frond(C.leafLight, C.leaf)}</div>
    <div class="inner">
      <div style="width:40mm;height:40mm;margin:0 auto 6mm">${parrot()}</div>
      <h2>THE PARTY<br>IS THE ADVENTURE.</h2>
      <div class="script">Turn your home into an island.</div>
      <p style="margin-top:12mm;font-family:Unbounded;font-weight:800;letter-spacing:.1em">TROPICAL QUEST™</p>
      <p style="font-size:9pt;opacity:.85">© ${config.brand}, ${config.year}</p>
    </div>
  </section>`;
}

export const GUIDE_TOC = [];
export function buildGuide() {
  // нумерация: 1 — обложка, 2 — содержание, дальше разделы
  let pageNo = 3;
  const toc = [];
  const pagesHtml = [];
  for (const sec of sections) {
    toc.push({ no: sec.no, title: sec.title, page: pageNo });
    GUIDE_TOC.push({ no: sec.no, title: sec.title, page: pageNo, count: sec.pages.length });
    sec.pages.forEach((body, i) => {
      pagesHtml.push(`<section class="page g" data-sec="${sec.no}">
        <div class="g-deco">${i % 2 ? frond() : monstera()}</div>
        <header class="g-head"><span><span class="tm">TROPICAL QUEST™</span> · Гид организатора</span><span>Раздел ${String(sec.no).padStart(2, '0')}</span></header>
        <div class="g-title"><span class="num">${String(sec.no).padStart(2, '0')}</span><h1><span class="sub">${sec.sub}</span>${sec.title}${sec.pages.length > 1 ? ` <span style="font-size:11pt;color:var(--muted)">${i + 1}/${sec.pages.length}</span>` : ''}</h1></div>
        <div class="g-body">${body}</div>
        <footer class="g-foot"><span>tropical quest · the party is the adventure</span><span class="pn">${pageNo}</span></footer>
      </section>`);
      pageNo++;
    });
  }
  GUIDE_TOC.total = pageNo; // + задняя обложка
  const body = typo([coverPage(), tocPage(toc), ...pagesHtml, backPage()].join('\n'));
  return doc('TROPICAL QUEST — Гид организатора', CSS, body);
}

export const GUIDE_CSS = CSS;
