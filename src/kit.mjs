// TROPICAL QUEST — «Printable Kit»: всё, что нужно распечатать (A4).
import { C, SYMBOLS, palm, wave, pineapple, hibiscus, coconut, parrot, chest, monstera, frond, sun, shell,
  crab, turtle, monkey, volcano, shark, flamingo, surfboard, sunglasses, mustache, lei, island, star, scissors } from './art.mjs';
import { config, doc, typo, esc } from './lib.mjs';
import { treasureMap, tropicalCorners, place } from './parts.mjs';

const CSS = `
.kp { padding: 12mm 10mm 10mm; }
.kp-head { position: absolute; top: 4.6mm; left: 10mm; right: 10mm; display: flex; justify-content: space-between; font-size: 6.4pt; letter-spacing: .16em; text-transform: uppercase; color: #8FA3AA; font-weight: 800; }
.kp-head b { color: var(--ocean); }
.kp-foot { position: absolute; bottom: 3.6mm; left: 10mm; right: 10mm; display: flex; justify-content: space-between; align-items: center; font-size: 6.4pt; color: #8FA3AA; font-weight: 700; letter-spacing: .06em; }
.kp-foot .sc { display: inline-flex; align-items: center; gap: 1.2mm; }
.kp-foot .sc svg { width: 3.2mm; height: 3.2mm; }
.area { width: 190mm; height: 275mm; position: relative; }
.grid { display: grid; width: 100%; height: 100%; border-top: 1px dashed #A9BCC2; border-left: 1px dashed #A9BCC2; }
.grid > .cell { border-right: 1px dashed #A9BCC2; border-bottom: 1px dashed #A9BCC2; position: relative; overflow: hidden; }
.cutbox { border: 1px dashed #A9BCC2; position: relative; overflow: hidden; }
.center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.abs { position: absolute; }
.corner { position: absolute; pointer-events: none; }
.u { text-transform: uppercase; }
.line { display: block; border-bottom: 1.3px solid #9DB1B8; height: 7mm; }
.lbl { font-size: 7pt; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.ru-s { font-family: 'Pacifico'; color: var(--leaf); }

/* обложка набора */
.kcover-band { position: absolute; left: 0; right: 0; top: 0; height: 92mm; background: linear-gradient(180deg, #0B6E7F, #19A3A6); color: #fff; overflow: hidden; }
.kcover-band h1 { font-family: 'Unbounded'; font-weight: 900; font-size: 34pt; margin: 0; line-height: .95; }
.kidx { columns: 2; column-gap: 8mm; font-size: 9.6pt; }
.kidx div { display: flex; gap: 2mm; padding: 1.4mm 0; border-bottom: 1px dotted #BFD3D8; break-inside: avoid; }
.kidx .p { font-family: 'Unbounded'; font-weight: 700; color: var(--coral); font-size: 8pt; width: 12mm; flex: none; }
.kidx .t { flex: 1; font-weight: 700; }
.kidx .c { color: var(--muted); font-size: 8.4pt; }

/* приглашение */
.inv { padding: 9mm 8mm 7mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
.inv .script { font-size: 31pt; color: var(--coral); line-height: 1.1; margin-top: 8mm; }
.inv .d1 { font-family: 'Unbounded'; font-weight: 800; font-size: 9.4pt; color: var(--ocean); text-transform: uppercase; line-height: 1.25; margin: 2mm 0 1mm; }
.inv .tq { font-size: 7pt; letter-spacing: .3em; font-weight: 900; color: var(--muted); margin-bottom: 4mm; }
.inv .f { width: 100%; text-align: left; font-size: 9pt; font-weight: 800; display: grid; grid-template-columns: 19mm 1fr; align-items: end; gap: 2mm; margin-bottom: 2.4mm; }
.inv .f .line { height: 5.4mm; }
.inv .dc { margin-top: auto; font-size: 8.2pt; background: var(--pine-soft); border-radius: 3mm; padding: 2mm 3mm; width: 100%; }

/* бейдж */
.badge { padding: 7mm 7mm 6mm; display: flex; flex-direction: column; }
.badge .top { display: flex; gap: 3mm; align-items: center; margin-bottom: 4mm; }
.badge .top .i { width: 17mm; height: 17mm; flex: none; }
.badge h2 { font-family: 'Unbounded'; font-weight: 800; font-size: 12pt; color: var(--ocean); margin: 0; line-height: 1; }
.badge .f { margin-bottom: 3mm; }
.badge .f .lbl { display: block; }
.badge .pw { display: grid; grid-template-columns: 1fr 1fr; gap: 1.4mm 3mm; font-size: 8.6pt; font-weight: 700; margin: 1.4mm 0 3.4mm; }
.badge .pw span::before { content: ''; display: inline-block; width: 3.2mm; height: 3.2mm; border: 1.3px solid var(--ocean); border-radius: .8mm; margin-right: 1.6mm; vertical-align: -.5mm; }
.badge .syms { display: flex; justify-content: space-between; margin-top: 1.6mm; }
.badge .syms div { width: 14mm; height: 14mm; border-radius: 50%; border: 1.2px dashed #9DB1B8; padding: 2.4mm; }
.badge .syms div svg { opacity: .3; }

/* жетоны */
.tokrow { display: flex; justify-content: space-between; }
.tokpair { width: 92mm; text-align: center; }
.tokpair .cap { font-size: 7.4pt; font-weight: 800; color: var(--muted); margin-top: 1mm; }

/* карточки */
.mcard { padding: 8mm 7mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%; }
.mcard .i { width: 60mm; height: 60mm; margin-bottom: 5mm; }
.mcard .en { font-family: 'Unbounded'; font-weight: 900; font-size: 24pt; line-height: 1; }
.mcard .ru { font-family: 'Pacifico'; font-size: 14pt; margin-top: 2mm; }
.mcard .act { font-size: 11pt; font-weight: 800; margin-top: 2mm; color: var(--ink); }
.mcard .no { position: absolute; top: 5mm; left: 6mm; font-size: 6.6pt; letter-spacing: .16em; font-weight: 900; color: var(--muted); text-transform: uppercase; }

/* таблички еды */
.tent { display: grid; grid-template-rows: 1fr 1fr; }
.tent .half { display: flex; align-items: center; gap: 3mm; padding: 2mm 5mm; }
.tent .half.flip { transform: rotate(180deg); }
.tent .half .i { width: 17mm; height: 17mm; flex: none; }
.tent .half b { font-family: 'Unbounded'; font-weight: 800; font-size: 10pt; display: block; line-height: 1.1; }
.tent .half span { font-family: 'Pacifico'; font-size: 9.4pt; color: var(--leaf); }
.tent .fold { position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dotted #C4D2D6; }
.tent .fold::after { content: 'сгиб'; position: absolute; right: 2mm; top: -2.6mm; font-size: 5.5pt; color: #A9BCC2; background: #fff; padding: 0 1mm; }

/* дипломы */
.dip { position: absolute; inset: 9mm; border-radius: 6mm; border: 1.6mm solid var(--lagoon); overflow: hidden; background: #fff; }
.dip .in { position: absolute; inset: 4mm; border: .5mm solid var(--aqua); border-radius: 3mm; }
.dip .content { position: absolute; left: 22mm; right: 22mm; top: 40mm; bottom: 26mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
.dip .kick { font-size: 8pt; letter-spacing: .4em; font-weight: 900; color: var(--muted); }
.dip h1 { font-family: 'Unbounded'; font-weight: 900; font-size: 30pt; color: var(--ocean); margin: 3mm 0 1mm; line-height: 1; }
.dip .script { font-size: 18pt; color: var(--coral); }
.dip .bel { font-size: 11pt; font-weight: 800; margin-top: 10mm; }
.dip .nm { width: 120mm; border-bottom: 1.6px solid var(--ink); height: 15mm; margin: 2mm 0 6mm; display: flex; align-items: flex-end; justify-content: center; }
.dip .txt { font-size: 12pt; line-height: 1.5; max-width: 130mm; }
.dip .syms { display: flex; gap: 4mm; margin: 8mm 0 0; }
.dip .syms div { width: 15mm; height: 15mm; }
.dip .sign { margin-top: auto; width: 100%; display: flex; justify-content: space-between; font-size: 8.4pt; font-weight: 800; color: var(--muted); }
.dip .sign div { width: 56mm; border-top: 1.2px solid #9DB1B8; padding-top: 1.4mm; text-align: center; }
.seal { position: absolute; width: 34mm; height: 34mm; }

/* номинации (A5 альбомная — половина листа) */
.award { position: relative; height: 50%; }
.award .frame { position: absolute; inset: 4mm; border: 1.2mm solid var(--c); border-radius: 5mm; overflow: hidden; }
.award .body { position: absolute; inset: 0; display: grid; grid-template-columns: 50mm 1fr; align-items: center; padding: 6mm 10mm 6mm 6mm; }
.award .ic { width: 44mm; height: 44mm; border-radius: 50%; background: var(--soft); padding: 7mm; margin: 0 auto; }
.award .k { font-size: 7pt; letter-spacing: .3em; font-weight: 900; color: var(--muted); }
.award h2 { font-family: 'Unbounded'; font-weight: 900; font-size: 19pt; color: var(--c); margin: 1.4mm 0 .6mm; line-height: 1.02; }
.award .ru { font-family: 'Pacifico'; font-size: 13pt; color: var(--ink); }
.award .to { font-size: 9pt; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin-top: 5mm; }
.award .nm { border-bottom: 1.4px solid var(--ink); height: 11mm; margin: 0 0 3mm; display: flex; align-items: flex-end; }
.award .why { font-size: 10pt; }
.award .foot { display: flex; justify-content: space-between; font-size: 7.4pt; color: var(--muted); font-weight: 800; margin-top: 4mm; }

/* бирки */
.tag { padding: 6mm 6mm 5mm 15mm; display: flex; flex-direction: column; justify-content: center; }
.tag .hole { position: absolute; left: 5mm; top: 50%; width: 5mm; height: 5mm; margin-top: -2.5mm; border-radius: 50%; border: 1.2px dashed #9DB1B8; }
.tag .script { font-size: 22pt; color: var(--coral); line-height: 1.1; }

/* раскраска */
.lineart svg [fill]:not([fill="none"]) { fill: #fff !important; }
.lineart svg path, .lineart svg circle, .lineart svg ellipse, .lineart svg rect, .lineart svg line, .lineart svg polygon { stroke: #2B2B2B !important; stroke-width: 1.3px !important; vector-effect: non-scaling-stroke; }
.lineart svg [opacity], .lineart svg .hl { display: none; }
.lineart svg text { fill: #2B2B2B !important; stroke: none !important; }
`;

// ───────── каркас страницы ─────────
const pages = []; // { group, html }
const groups = []; // { title, copies, paper, first, last }
let current = null;
function group(title, copies, paper) { current = { title, copies, paper, first: null, last: null }; groups.push(current); }
function addPage(inner, { paperNote, cut = true } = {}) {
  const n = pages.length + 2; // стр. 1 — обложка набора
  if (current.first === null) current.first = n;
  current.last = n;
  pages.push(`<section class="page kp">
    <div class="kp-head"><span><b>TROPICAL QUEST™</b> · Printable Kit</span><span>${current.title}</span></div>
    <div class="area">${inner}</div>
    <div class="kp-foot"><span class="sc">${cut ? `${scissors()} вырежьте по пунктиру` : ''}</span><span>${paperNote || current.paper} · печать 100%</span><span>${n}</span></div>
  </section>`);
}

const nameLine = (w = '100%', size = '') => config.name
  ? `<span class="hand" style="font-size:${size || '20pt'};color:var(--coral-dark);line-height:1">${esc(config.name)}</span>`
  : `<span style="display:inline-block;width:${w};border-bottom:1.4px solid #9DB1B8;height:1em"></span>`;
const ageTxt = () => (config.age ? `<span class="hand" style="font-size:16pt;color:var(--coral-dark)">${esc(config.age)}</span>` : '<span style="display:inline-block;width:12mm;border-bottom:1.4px solid #9DB1B8;height:1em"></span>');

// ───────── 1. Обложка набора ─────────
function kitCover(index) {
  return `<section class="page kp">
    <div class="kcover-band">
      <div class="corner" style="width:70mm;height:70mm;right:-18mm;top:-16mm;transform:rotate(210deg);opacity:.55">${monstera(C.leaf, C.leafLight)}</div>
      <div class="corner" style="width:60mm;height:60mm;left:-18mm;bottom:-28mm;transform:rotate(20deg);opacity:.45">${frond(C.leafLight, C.leaf)}</div>
      <div style="position:absolute;left:16mm;top:18mm;right:60mm">
        <div style="font-size:7.5pt;letter-spacing:.3em;font-weight:800;opacity:.9">TROPICAL QUEST™ · ФАЙЛ 2 ИЗ 2</div>
        <h1 style="margin-top:5mm">PRINTABLE<br>KIT</h1>
        <div class="script" style="font-size:16pt;color:var(--pine);margin-top:2mm">Распечатай · вырежи · играй!</div>
        <p style="margin-top:4mm;font-weight:700;font-size:10pt;max-width:110mm">Все материалы для праздника: от приглашений до дипломов. Сценарий и инструкции — в файле «Гид организатора».</p>
      </div>
      <div class="corner" style="width:44mm;height:44mm;right:22mm;top:30mm">${parrot()}</div>
    </div>
    <div style="position:absolute;left:16mm;right:16mm;top:100mm">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-bottom:6mm">
        <div style="background:var(--aqua-soft);border-radius:4mm;padding:3.4mm 4mm"><b>Печать 100%</b><br><span style="font-size:8.6pt">«Фактический размер», без масштабирования</span></div>
        <div style="background:var(--pine-soft);border-radius:4mm;padding:3.4mm 4mm"><b>Плотная бумага</b><br><span style="font-size:8.6pt">160–200 г/м² для карточек, жетонов и дипломов</span></div>
        <div style="background:var(--coral-soft);border-radius:4mm;padding:3.4mm 4mm"><b>Пунктир = рез</b><br><span style="font-size:8.6pt">точки = линия сгиба</span></div>
      </div>
      <div class="kidx" style="margin-bottom:8mm">${index.map((g) => `<div><span class="p">${g.first === g.last ? g.first : g.first + '–' + g.last}</span><span class="t">${g.title}</span><span class="c">${g.copies}</span></div>`).join('')}</div>
      <div style="display:flex;justify-content:center;gap:7mm;margin-top:4mm">${SYMBOLS.map((s) => `<div style="width:20mm;height:20mm">${s.art()}</div>`).join('')}</div>
      <div style="text-align:center;font-family:Unbounded;font-weight:800;color:var(--ocean);font-size:10pt;margin-top:3mm;letter-spacing:.2em">PALM · WAVE · PINEAPPLE · FLOWER · COCONUT</div>
    </div>
    <div class="kp-foot"><span>© ${esc(config.brand)}, ${config.year}. Только для личного использования.</span><span></span><span>1</span></div>
  </section>`;
}

// ───────── 2. Приглашения ─────────
group('Приглашения', 'по числу гостей ÷ 4', 'плотная бумага');
const invite = (i) => `<div class="cell inv" data-fit="приглашение">
  <div class="corner" style="width:34mm;height:34mm;left:-8mm;top:-9mm;transform:rotate(150deg)">${monstera()}</div>
  <div class="corner" style="width:30mm;height:30mm;right:-9mm;top:-11mm;transform:rotate(200deg)">${frond()}</div>
  <div class="corner" style="width:15mm;height:15mm;right:6mm;top:12mm">${hibiscus()}</div>
  <div class="script">Aloha!</div>
  <div class="d1">Приглашаю на тропический<br>день рождения!</div>
  <div class="tq">TROPICAL QUEST</div>
  <div class="f"><span>Вождь:</span>${config.name ? `<span class="hand" style="font-size:15pt;color:var(--coral-dark);line-height:1">${esc(config.name)}</span>` : '<span class="line"></span>'}</div>
  <div class="f"><span>Исполняется:</span>${config.age ? `<span class="hand" style="font-size:15pt;color:var(--coral-dark);line-height:1">${esc(config.age)}</span>` : '<span class="line"></span>'}</div>
  <div class="f"><span>Когда:</span><span class="line"></span></div>
  <div class="f"><span>Где:</span><span class="line"></span></div>
  <div class="f"><span>Ответ до:</span><span class="line"></span></div>
  <div class="dc"><b>Дресс-код:</b> яркие цвета, цветы, гавайские рубашки.<br><span style="font-size:7.4pt">Пожалуйста, сообщите об аллергиях.</span></div>
</div>`;
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr">${[0, 1, 2, 3].map(invite).join('')}</div>`);

// ───────── 3. Постер Welcome ─────────
group('Постер Welcome', '1 (можно А3)', 'обычная бумага');
addPage(`<div class="cutbox" style="height:100%;border:none">
  ${tropicalCorners(1.15)}
  <div class="center" style="position:absolute;inset:0;padding:0 18mm">
    <div class="script" style="font-size:72pt;color:var(--coral);line-height:1">Aloha!</div>
    <div class="display" style="font-size:20pt;color:var(--ocean);margin-top:6mm;letter-spacing:.12em">WELCOME TO</div>
    <div style="margin:6mm 0 2mm;display:flex;align-items:flex-end;justify-content:center;gap:2mm;width:150mm">${config.name ? `<span class="hand" style="font-size:52pt;color:var(--coral-dark);line-height:1">${esc(config.name)}</span>` : '<span style="flex:1;border-bottom:2px solid #9DB1B8;height:22mm"></span>'}<span class="display" style="font-size:30pt;color:var(--ocean)">’S</span></div>
    <div class="display" style="font-size:38pt;color:var(--leaf);line-height:1.02;margin-top:4mm">TROPICAL<br>ISLAND</div>
    <div style="width:30mm;height:30mm;margin:8mm auto 4mm">${parrot()}</div>
    <div class="display" style="font-size:12pt;color:var(--pine-dark);letter-spacing:.06em">LET THE ADVENTURE BEGIN!</div>
    <div style="font-size:11pt;font-weight:700;color:var(--muted);margin-top:2mm">Добро пожаловать на остров — приключение начинается!</div>
  </div>
</div>`, { cut: false });

// ───────── 4–6. Баннер ALOHA ─────────
group('Баннер ALOHA', '1 комплект', 'плотная бумага');
const flagColors = [C.lagoon, C.coral, C.pine, C.leaf, C.ocean, C.coral];
const flag = (letter, color, art = '') => `<div class="cell" style="border:none">
  <svg viewBox="0 0 92 262" style="width:100%;height:100%" class="art">
    <path d="M2 14 L90 14 L90 140 L46 258 L2 140Z" fill="#fff" stroke="#A9BCC2" stroke-width=".5" stroke-dasharray="2 1.5"/>
    <path d="M6 22 L86 22 L86 138 L46 246 L6 138Z" fill="${color}"/>
    <path d="M2 14 L90 14" stroke="#A9BCC2" stroke-width=".4" stroke-dasharray=".8 1.2"/>
    <path d="M2 2 L90 2 L90 14 L2 14Z" fill="none" stroke="#A9BCC2" stroke-width=".5" stroke-dasharray="2 1.5"/>
    <text x="46" y="10" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="4" fill="#9DB1B8">загните назад — шпагат внутри сгиба</text>
    ${letter ? `<text x="46" y="122" text-anchor="middle" font-family="Unbounded" font-weight="900" font-size="74" fill="#fff">${letter}</text>` : ''}
    ${art}
    ${place(hibiscus('#fff', '#fff'), 36, 170, 20, '')}
  </svg></div>`;
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;border:none;gap:6mm">${flag('A', flagColors[0])}${flag('L', flagColors[1])}</div>`);
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;border:none;gap:6mm">${flag('O', flagColors[2])}${flag('H', flagColors[3])}</div>`);
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;border:none;gap:6mm">${flag('A', flagColors[4])}${flag('', flagColors[5], place(pineapple(), 18, 40, 56))}</div>`);

// ───────── 7. Табличка лей + наклейка на сундук ─────────
group('Табличка «Возьми лею» и наклейка на сундук', '1', 'плотная бумага');
addPage(`<div style="display:grid;grid-template-rows:1fr 1fr;gap:6mm;height:100%">
  <div class="cutbox center" style="border-radius:6mm" data-fit="лея">
    <div class="corner" style="width:52mm;height:52mm;left:-14mm;top:-16mm;transform:rotate(150deg)">${monstera()}</div>
    <div class="corner" style="width:52mm;height:52mm;right:-14mm;bottom:-16mm;transform:rotate(-30deg)">${monstera(C.leafDark, C.leaf)}</div>
    <div style="width:46mm;height:46mm">${lei()}</div>
    <div class="display" style="font-size:24pt;color:var(--ocean)">GRAB A LEI!</div>
    <div class="script" style="font-size:18pt;color:var(--coral);margin-top:1mm">Возьми свою лею —</div>
    <div style="font-size:13pt;font-weight:800">и стань жителем острова!</div>
  </div>
  <div class="cutbox center" style="border-radius:6mm;background:#fff" data-fit="сундук">
    <div class="corner" style="width:30mm;height:30mm;left:8mm;top:8mm">${sun()}</div>
    <div class="corner" style="width:26mm;height:26mm;right:10mm;top:10mm">${coconut()}</div>
    <div style="width:44mm;height:44mm">${chest()}</div>
    <div class="display" style="font-size:34pt;color:var(--wood)">TREASURE</div>
    <div style="font-size:12pt;font-weight:800;margin-top:2mm">Сундук заперт волшебным словом.</div>
    <div style="font-size:11pt;margin-top:1mm">Открыть его может только <b style="color:var(--coral-dark)">CHIEF OF THE ISLAND</b></div>
    <div style="display:flex;gap:3mm;margin-top:4mm">${SYMBOLS.map((s) => `<div style="width:11mm;height:11mm">${s.art()}</div>`).join('')}</div>
  </div>
</div>`);

// ───────── 8. Генератор островных имён ─────────
group('Генератор островных имён', '1', 'обычная бумага');
const months = [['Январь', 'Солнечный'], ['Февраль', 'Кокосовый'], ['Март', 'Танцующий'], ['Апрель', 'Смелый'], ['Май', 'Весёлый'], ['Июнь', 'Ананасовый'], ['Июль', 'Морской'], ['Август', 'Радужный'], ['Сентябрь', 'Быстрый'], ['Октябрь', 'Загадочный'], ['Ноябрь', 'Пушистый'], ['Декабрь', 'Золотой']];
const letters = [['А Б', 'Краб'], ['В Г', 'Дельфин'], ['Д Е Ё', 'Попугай'], ['Ж З', 'Кокос'], ['И Й К', 'Ананас'], ['Л М', 'Тукан'], ['Н О', 'Серфер'], ['П Р', 'Вулкан'], ['С Т', 'Осьминог'], ['У Ф', 'Ягуар'], ['Х Ц Ч', 'Пеликан'], ['Ш Щ', 'Бриз'], ['Э Ю', 'Коралл'], ['Я', 'Хамелеон']];
addPage(`<div style="position:relative;height:100%">
  <div class="corner" style="width:50mm;height:50mm;right:-12mm;top:-14mm;transform:rotate(210deg);opacity:.9">${monstera()}</div>
  <div style="text-align:center;padding-top:6mm">
    <div class="display" style="font-size:24pt;color:var(--ocean)">ISLAND NAME<br>GENERATOR</div>
    <div class="script" style="font-size:17pt;color:var(--coral);margin-top:2mm">Узнай своё островное имя!</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:7mm">
    <div><div class="lbl" style="margin-bottom:2mm">1 · Месяц рождения</div>
      ${months.map(([m, a], i) => `<div style="display:flex;justify-content:space-between;padding:1.6mm 3mm;border-radius:2mm;${i % 2 ? '' : 'background:var(--aqua-soft)'};font-size:11pt"><span>${m}</span><b style="color:var(--ocean)">${a}</b></div>`).join('')}
    </div>
    <div><div class="lbl" style="margin-bottom:2mm">2 · Первая буква имени</div>
      ${letters.map(([l, n], i) => `<div style="display:flex;justify-content:space-between;padding:1.18mm 3mm;border-radius:2mm;${i % 2 ? '' : 'background:var(--coral-soft)'};font-size:11pt"><span style="font-weight:800">${l}</span><b style="color:var(--coral-dark)">${n}</b></div>`).join('')}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:24mm 1fr;gap:4mm;align-items:center;margin-top:7mm;background:var(--pine-soft);border-radius:5mm;padding:4mm 6mm">
    <div style="width:24mm;height:24mm">${parrot()}</div>
    <div style="font-size:12pt"><b>Пример:</b> Маша родилась в июне → <b>Ананасовый</b>, имя на «М» → <b>Тукан</b>.<br>Островное имя Маши — <b style="color:var(--coral-dark)">Ананасовый Тукан!</b> Впиши своё имя в бейдж исследователя.</div>
  </div>
</div>`, { cut: false });

// ───────── 9. Бейджи Island Explorer ─────────
group('Бейджи Island Explorer', 'по числу гостей ÷ 4', 'плотная бумага');
const powers = [['Dancing', 'Танцы'], ['Bravery', 'Смелость'], ['Speed', 'Скорость'], ['Teamwork', 'Команда'], ['Imagination', 'Фантазия']];
const badge = () => `<div class="cell badge" data-fit="бейдж">
  <div class="corner" style="width:36mm;height:36mm;right:-10mm;bottom:-12mm;transform:rotate(-30deg)">${monstera()}</div>
  <div class="top"><div class="i">${hibiscus()}</div><div><h2>ISLAND<br>EXPLORER</h2><span class="ru-s" style="font-size:10pt">Исследователь острова</span></div></div>
  <div class="f"><span class="lbl">Имя · Name</span><span class="line"></span></div>
  <div class="f"><span class="lbl">Островное имя · Island name</span><span class="line"></span></div>
  <div class="lbl" style="margin-top:1mm">Моя суперсила · My special power</div>
  <div class="pw">${powers.map(([e, r]) => `<span>${r} <span style="color:var(--muted);font-weight:600;font-size:7.4pt">${e}</span></span>`).join('')}</div>
  <div class="lbl">Мои символы острова</div>
  <div class="syms">${SYMBOLS.map((s) => `<div>${s.art()}</div>`).join('')}</div>
</div>`;
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr">${badge()}${badge()}${badge()}${badge()}</div>`);

// ───────── 10. Корона вождя ─────────
group('Корона вождя', '1', 'плотная бумага');
const crownStrip = (part) => {
  const pts = [];
  const W = 268, H = 74, peaks = 5;
  for (let i = 0; i <= peaks * 2; i++) {
    const x = (part === 1 ? 0 : 0) + i * (W - 20) / (peaks * 2);
    pts.push(`${x.toFixed(1)} ${i % 2 ? 30 : 6}`);
  }
  const top = pts.join(' L');
  const body = part === 1
    ? `<text x="124" y="60" text-anchor="middle" font-family="Unbounded" font-weight="900" font-size="15" fill="#fff">CHIEF OF THE</text>`
    : `<text x="124" y="60" text-anchor="middle" font-family="Unbounded" font-weight="900" font-size="15" fill="#fff">ISLAND</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="art" style="width:100%;height:100%">
    <path d="M${top} L248 ${H - 2} L0 ${H - 2}Z" fill="${C.pine}" stroke="#A9BCC2" stroke-width=".5" stroke-dasharray="2 1.5"/>
    <rect x="0" y="40" width="248" height="32" fill="${C.ocean}"/>
    <rect x="248" y="40" width="18" height="32" fill="#fff" stroke="#A9BCC2" stroke-width=".5" stroke-dasharray="2 1.5"/>
    <text x="257" y="58" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="4.4" fill="#9DB1B8" transform="rotate(-90 257 56)">клей</text>
    ${[1, 3, 5, 7, 9].map((i) => place(i === 5 ? hibiscus() : hibiscus('#fff', C.coral), i * 24.8 - 7, 14, 14)).join('')}
    ${body}
    ${place(frond(C.leafLight, C.leafLight), 8, 42, 26, 'rotate(40 50 50)')}
    ${place(frond(C.leafLight, C.leafLight), 214, 42, 26, 'rotate(-40 50 50) scale(-1 1) translate(-100 0)')}
  </svg>`;
};
addPage(`<div style="display:flex;gap:10mm;height:100%;justify-content:center">
  <div style="width:74mm;height:268mm;position:relative"><div style="position:absolute;width:268mm;height:74mm;left:0;top:0;transform-origin:0 0;transform:translate(74mm,0) rotate(90deg)">${crownStrip(1)}</div></div>
  <div style="width:74mm;height:268mm;position:relative"><div style="position:absolute;width:268mm;height:74mm;left:0;top:0;transform-origin:0 0;transform:translate(74mm,0) rotate(90deg)">${crownStrip(2)}</div></div>
  <div style="width:24mm;font-size:8pt;color:var(--muted);font-weight:700;align-self:center">Вырежьте обе полосы, склейте встык по полю «клей». Подгоните по голове вождя и закрепите степлером или скотчем.</div>
</div>`);

// ───────── 11. Письмо Пико ─────────
group('Письмо Пико', '1', 'обычная бумага');
addPage(`<div style="position:relative;height:100%">
  <svg viewBox="0 0 190 275" class="art" style="position:absolute;inset:0">
    <path d="M10 8 C40 4 70 10 100 6 C130 2 160 8 182 5 C186 40 180 80 184 120 C188 160 180 200 185 240 C186 255 184 262 183 268 C150 272 120 266 90 270 C60 274 30 268 8 270 C4 230 10 190 6 150 C2 110 10 70 6 30 Z" fill="#FFF6E2" stroke="${C.sandDark}" stroke-width="1"/>
  </svg>
  <div class="corner" style="width:44mm;height:44mm;right:14mm;bottom:12mm">${parrot()}</div>
  <div style="position:absolute;left:22mm;right:22mm;top:22mm" class="hand">
    <div style="font-size:30pt;color:var(--coral-dark)">Aloha, команда!</div>
    <div style="font-size:16.5pt;line-height:1.32;color:#3B2A1A;margin-top:5mm">
      <p>Пишет вам Пико — попугай и лучший помощник Хранителя острова. Случилась беда! Ночью над островом пронёсся озорной ветер. Он перепутал все тропинки и разбросал пять символов острова: пальму, волну, ананас, цветок и кокос.</p>
      <p>Без них не открыть главный сундук с сокровищами — ведь Хранитель запер его волшебным словом и спрятал это слово в символах.</p>
      <p>Я принёс вам карту. Она откроется только настоящей команде: смелой, ловкой, весёлой и дружной. Пройдите пять испытаний, соберите все символы — и вождь острова сможет открыть сундук!</p>
      <p>Я буду рядом и иногда буду давать команды. Слушайте внимательно — я тот ещё хитрец!</p>
    </div>
    <div style="font-size:20pt;color:var(--ocean);margin-top:4mm">Твой друг, попугай Пико</div>
    <div style="font-size:15pt;color:#7A5A3A;margin-top:2mm">P.S. Не забудьте громко сказать ALOHA!</div>
  </div>
  <div class="corner" style="width:30mm;height:30mm;left:14mm;bottom:12mm">${hibiscus()}</div>
  <div class="corner" style="width:22mm;height:22mm;right:16mm;top:14mm">${shell()}</div>
</div>`, { cut: false, paperNote: 'обычная бумага · сверните свитком' });

// ───────── 12. Карта ─────────
group('Карта сокровищ', '1 (можно А3)', 'плотная бумага');
addPage(`<div style="height:100%;border-radius:5mm;overflow:hidden">${treasureMap()}</div>`, { cut: false, paperNote: 'плотная бумага или А3' });

// ───────── 13. Жетоны ─────────
group('Жетоны символов', '1', 'плотная бумага');
const TD = 46; // диаметр жетона, мм
const tokenPair = (s) => `<div class="tokpair">
  <svg viewBox="0 0 96 48" class="art" style="width:92mm;height:46mm">
    <g fill="none" stroke="#9DB1B8" stroke-width=".9" stroke-dasharray="2 1.4">
      <circle cx="23" cy="24" r="23"/><circle cx="73" cy="24" r="23"/><rect x="38" y="17" width="20" height="14"/>
    </g>
    <g fill="#fff"><circle cx="23" cy="24" r="22.6"/><circle cx="73" cy="24" r="22.6"/><rect x="38" y="17.4" width="20" height="13.2"/></g>
    <path d="M48 17.4 L48 30.6" stroke="#9DB1B8" stroke-width=".5" stroke-dasharray=".6 1"/>
    <circle cx="23" cy="24" r="21" fill="#fff" stroke="${s.color}" stroke-width="2.4"/>
    ${place(s.art(), 13, 7, 20)}
    <text x="23" y="32.5" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="${s.en.length > 6 ? 3.6 : 4.6}" fill="${s.color}">${s.en}</text>
    <text x="23" y="37" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="2.6" fill="${C.ink}">символ получен!</text>
    <circle cx="73" cy="24" r="21" fill="${s.color}"/>
    <circle cx="73" cy="24" r="17.5" fill="none" stroke="#fff" stroke-width=".6" stroke-dasharray="1 1.2"/>
    <text x="73" y="30" text-anchor="middle" font-family="Unbounded" font-weight="900" font-size="20" fill="#fff">${s.letter}</text>
    <circle cx="76" cy="37.6" r="3.6" fill="#fff"/>
    <text x="71" y="38.6" text-anchor="end" font-family="Nunito" font-weight="800" font-size="2.6" fill="#fff">код:</text>
  </svg>
  <div class="cap">${SYMBOLS.indexOf(s) + 1}. ${s.en} · ${s.ru} — сложите по точкам и склейте</div>
</div>`;
addPage(`<div style="display:flex;flex-direction:column;gap:7mm;height:100%">
  <div style="text-align:center"><div class="display" style="font-size:16pt;color:var(--ocean)">ISLAND TOKENS</div><div class="ru-s" style="font-size:12pt">Жетоны пяти символов острова</div></div>
  <div class="tokrow">${tokenPair(SYMBOLS[0])}${tokenPair(SYMBOLS[1])}</div>
  <div class="tokrow">${tokenPair(SYMBOLS[2])}${tokenPair(SYMBOLS[3])}</div>
  <div class="tokrow">${tokenPair(SYMBOLS[4])}
    <div style="width:92mm;background:var(--pine-soft);border-radius:4mm;padding:4mm 5mm;font-size:8.8pt;align-self:stretch">
      <b>Как собрать</b><br>1. Вырежьте жетон целиком по пунктиру.<br>2. Согните по точкам посередине, склейте половинки.<br>3. Лицевая сторона — символ, оборот — буква.<br>4. Есть кодовый замок? Впишите цифры кода в белые кружки по порядку станций.
    </div>
  </div>
  <div style="text-align:center;font-size:9pt;color:var(--muted);font-weight:700;margin-top:auto">По порядку карты буквы складываются в волшебное слово <b style="color:var(--coral-dark)">A · L · O · H · A</b></div>
</div>`);

// ───────── 14. Пальмовые листья (станция PALM) ─────────
group('Пальмовые листья — станция PALM', '1', 'плотная бумага');
const leafCard = (n) => `<div class="cutbox" style="border-radius:8mm;height:86mm;display:grid;grid-template-columns:76mm 1fr;align-items:center">
  <div style="position:relative;height:86mm">
    <div class="corner" style="width:96mm;height:96mm;left:-14mm;top:-6mm;transform:rotate(${n === 2 ? 0 : 10}deg)">${frond()}</div>
    <div style="position:absolute;left:20mm;top:26mm;width:30mm;height:30mm;border-radius:50%;background:#fff;border:1.6mm solid var(--leaf);display:flex;align-items:center;justify-content:center;font-family:Unbounded;font-weight:900;font-size:26pt;color:var(--leaf)">${n}</div>
  </div>
  <div style="padding-right:8mm">
    <div class="display" style="font-size:16pt;color:var(--leaf)">PALM LEAF ${n}/3</div>
    <div class="ru-s" style="font-size:12pt;margin-bottom:2mm">Пальмовый лист ${n} из 3</div>
    ${n < 3 ? `<div style="font-size:10pt;font-weight:800;margin-bottom:1mm">Следующий лист ищи…</div><span class="line"></span><span class="line"></span>`
      : `<div style="font-size:12pt;font-weight:800">Ура! Все три листа найдены!</div><div style="font-size:10.5pt;margin-top:1.4mm">Бегите к Хранителю острова — символ <b style="color:var(--leaf)">PALM</b> ваш!</div>`}
  </div>
</div>`;
addPage(`<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">${leafCard(1)}${leafCard(2)}${leafCard(3)}</div>`);

// ───────── 15–17. Таблички станций ─────────
group('Таблички станций', '1 комплект', 'плотная бумага');
const stationTasks = [
  'Найдите три спрятанных пальмовых листа',
  'Перейдите океан по островам — Tropical Wave',
  'Сбейте ананасы — Pineapple Bowling',
  'Станцуйте и создайте общий тропический цветок',
  'Соберите кокосы — Coconut Toss',
];
const station = (s, i) => `<div class="cutbox" style="height:131mm;border-radius:6mm;display:grid;grid-template-columns:86mm 1fr;align-items:center" data-fit="табличка">
  <div style="width:72mm;height:72mm;margin-left:10mm;border-radius:50%;background:var(--aqua-soft);padding:9mm">${s.art()}</div>
  <div style="padding-right:10mm">
    <div class="lbl">Station ${i + 1} · Станция ${i + 1}</div>
    <div class="display" style="font-size:${s.en.length > 6 ? 22 : 30}pt;color:${s.color};margin:2mm 0 1mm">${s.en}</div>
    <div class="ru-s" style="font-size:15pt">${s.ru}</div>
    <div style="font-size:12pt;font-weight:800;margin-top:4mm">${stationTasks[i]}</div>
  </div>
</div>`;
const treasureSign = `<div class="cutbox" style="height:131mm;border-radius:6mm;display:grid;grid-template-columns:86mm 1fr;align-items:center">
  <div style="width:72mm;height:72mm;margin-left:10mm;border-radius:50%;background:var(--pine-soft);padding:8mm">${chest()}</div>
  <div style="padding-right:10mm"><div class="lbl">Final · Финал</div><div class="display" style="font-size:26pt;color:var(--wood);margin:2mm 0 1mm">TREASURE</div><div class="ru-s" style="font-size:15pt">Сокровище</div><div style="font-size:12pt;font-weight:800;margin-top:4mm">Соберите код из пяти символов и откройте сундук</div></div>
</div>`;
addPage(`<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">${station(SYMBOLS[0], 0)}${station(SYMBOLS[1], 1)}</div>`);
addPage(`<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">${station(SYMBOLS[2], 2)}${station(SYMBOLS[3], 3)}</div>`);
addPage(`<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">${station(SYMBOLS[4], 4)}${treasureSign}</div>`);

// ───────── 18–19. Карточки разминки ─────────
group('Карточки Tropical Warm-up', '1 комплект', 'плотная бумага');
const moves = [
  ['PALM', 'Пальма', 'Качаемся как пальмы', palm(), C.leaf],
  ['WAVE', 'Волна', 'Изображаем волну', wave(), C.ocean],
  ['CRAB', 'Краб', 'Идём боком', crab(), C.red],
  ['TURTLE', 'Черепаха', 'Двигаемся медленно', turtle(), C.leafDark],
  ['PARROT', 'Попугай', 'Машем руками', parrot(), C.coralDark],
  ['MONKEY', 'Обезьянка', 'Прыгаем', monkey(), C.wood],
  ['VOLCANO', 'Вулкан', 'Присели — и резко вверх!', volcano(), C.red],
  ['CHIEF’S MOVE', 'Движение вождя', 'Вождь придумывает своё!', hibiscus(C.pine, C.pineDark), C.pineDark],
];
const moveCard = ([en, ru, actTxt, art, col], i) => `<div class="cell"><div class="mcard" data-fit="карточка">
  <span class="no">Warm-up · ${i + 1}</span>
  <div class="i">${art}</div><div class="en" style="color:${col};font-size:${en.length > 8 ? 17 : 24}pt">${en}</div><div class="ru" style="color:${col}">${ru}</div><div class="act">${actTxt}</div></div></div>`;
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr">${moves.slice(0, 4).map(moveCard).join('')}</div>`);
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr">${moves.slice(4).map((m, i) => moveCard(m, i + 4)).join('')}</div>`);

// ───────── 20. Карточки Freeze ─────────
group('Карточки Tropical Freeze', '1', 'плотная бумага');
const poses = [
  ['PALM', 'Пальма', 'руки вверх, качаемся', palm(), C.leaf],
  ['SHARK', 'Акула', 'ладони над головой — плавник', shark(), '#5E7A8C'],
  ['FLAMINGO', 'Фламинго', 'стоим на одной ноге', flamingo(), C.coral],
  ['SURFER', 'Серфер', 'ловим волну на доске', surfboard(), C.ocean],
  ['PARROT', 'Попугай', 'крылья в стороны', parrot(), C.coralDark],
  ['YOUR POSE', 'Твоя поза', 'придумай сам!', star(), C.pineDark],
];
const poseCard = ([en, ru, a, art, col]) => `<div class="cell"><div class="mcard" style="padding:5mm" data-fit="поза">
  <span class="no">Freeze</span>
  <div class="i" style="width:44mm;height:44mm;margin-bottom:3mm">${art}</div><div class="en" style="color:${col};font-size:${en.length > 6 ? 16 : 20}pt">${en}</div><div class="ru" style="color:${col};font-size:12pt">${ru}</div><div class="act" style="font-size:9.4pt">${a}</div></div></div>`;
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr 1fr">${poses.map(poseCard).join('')}</div>`);

// ───────── 21. Таблички Coconut Toss ─────────
group('Таблички Coconut Toss', '1', 'плотная бумага');
const toss = (en, pts, dist, col) => `<div class="cutbox" style="height:86mm;border-radius:6mm;display:grid;grid-template-columns:1fr 64mm;align-items:center;padding:0 10mm" data-fit="корзина">
  <div><div class="lbl">Coconut Toss · ${dist}</div><div class="display" style="font-size:34pt;color:${col};margin-top:2mm">${en}</div>
  <div style="display:flex;gap:2mm;margin-top:4mm">${Array.from({ length: pts }, () => `<div style="width:14mm;height:14mm">${coconut()}</div>`).join('')}</div></div>
  <div style="text-align:center"><div style="font-family:Unbounded;font-weight:900;font-size:64pt;color:${col};line-height:1">${pts}</div><div style="font-weight:900;font-size:12pt">${pts === 1 ? 'балл' : 'балла'}</div></div>
</div>`;
addPage(`<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">${toss('NEAR', 1, '1,5 м', C.leaf)}${toss('MIDDLE', 2, '2,5 м', C.ocean)}${toss('ISLAND', 3, '3,5 м', C.coral)}</div>`);

// ───────── 22. Шпаргалка ведущего ─────────
group('Шпаргалка ведущего', '1–2', 'обычная бумага');
const plan = [
  ['0:00', 'Встреча: леи, бейджи, имена, фото', ''], ['0:15', 'Открытие, письмо Пико, карта, титул вождя', ''],
  ['0:25', 'Warm-up', ''], ['0:35', 'Станция PALM — 3 листа', 'PALM'], ['0:45', 'Piko Says', ''],
  ['0:55', 'Станция PINEAPPLE — боулинг', 'PINEAPPLE'], ['1:10', 'Limbo', ''], ['1:20', 'Обед', ''],
  ['1:45', 'Memory', ''], ['1:55', 'Станция COCONUT — бросок', 'COCONUT'], ['2:05', 'Станция WAVE — острова', 'WAVE'],
  ['2:15', 'Freeze', ''], ['2:20', 'Станция FLOWER — Dance Battle', 'FLOWER'], ['2:30', 'Финал: ALOHA → сундук', ''],
  ['2:40', 'Торт', ''], ['2:50', 'Дипломы, Mahalo, прощание', ''],
];
addPage(`<div style="display:grid;grid-template-columns:92mm 1fr;gap:6mm;height:100%">
  <div>
    <div class="display" style="font-size:15pt;color:var(--ocean)">HOST CHEAT SHEET</div>
    <div class="ru-s" style="font-size:12pt;margin-bottom:3mm">Шпаргалка ведущего</div>
    ${plan.map(([t, b, s]) => `<div style="display:grid;grid-template-columns:12mm 1fr auto;gap:2mm;padding:1.5mm 2mm;border-bottom:1px solid var(--line);font-size:9.4pt;${s ? 'background:var(--pine-soft)' : ''}"><b style="font-family:Unbounded;font-size:7.8pt;color:var(--ocean);padding-top:.5mm">${t}</b><span>${b}</span>${s ? `<span style="width:5mm;height:5mm">${SYMBOLS.find((x) => x.en === s).art()}</span>` : '<span></span>'}</div>`).join('')}
    <div style="margin-top:4mm;background:var(--coral-soft);border-radius:3mm;padding:3mm 4mm;font-size:9.2pt"><b>Главное правило:</b> никто не проигрывает и не выбывает. Ошибся — делает «волну» и играет дальше.</div>
  </div>
  <div style="font-size:9.2pt">
    <div class="lbl" style="color:var(--coral-dark)">Открытие</div>
    <p>«Aloha, маленькие путешественники! Исчез главный островной сундук с сокровищами! Хранитель оставил карту, но она открывается только настоящей команде. Вы готовы? Тогда громко скажем: ALOHA!»</p>
    <div class="lbl" style="color:var(--coral-dark)">Warm-up</div>
    <p>PALM — качаемся · WAVE — волна · CRAB — боком · TURTLE — медленно · PARROT — машем · MONKEY — прыгаем · VOLCANO — присели и вверх!</p>
    <div class="lbl" style="color:var(--coral-dark)">Piko Says</div>
    <p>стать пальмой · показать волну · превратиться в краба · спрятаться от акулы · стать серфером · полететь как попугай · показать ананас</p>
    <div class="lbl" style="color:var(--coral-dark)">Coconut Toss</div>
    <p>NEAR 1 · MIDDLE 2 · ISLAND 3. Каждый бросает 3 раза. Цель команды = 2 × число детей.</p>
    <div class="lbl" style="color:var(--coral-dark)">Tropical Wave</div>
    <p>Островов на 1–2 меньше, чем детей. Каждый раунд −1 остров. Финал — все на одном.</p>
    <div class="lbl" style="color:var(--coral-dark)">Freeze</div>
    <p>PALM · SHARK · FLAMINGO · SURFER · PARROT</p>
    <div class="lbl" style="color:var(--coral-dark)">Dance Battle</div>
    <p>Palm → Wave → Monkey → Parrot → Free Dance → общий цветок в кругу</p>
    <div class="lbl" style="color:var(--coral-dark)">Memory</div>
    <p>ананас · ракушка · очки · цветок · мяч · лист · ложка · стакан · попугай · кокос. 30 секунд смотрим, накрываем, убираем 1.</p>
    <div class="lbl" style="color:var(--coral-dark)">Финал</div>
    <p>«У нас есть все пять символов! Но открыть сундук может только Chief of the Island!» Перевернуть жетоны: <b>A-L-O-H-A</b>. Вождь говорит слово, все: «ALOHA!»</p>
    <div class="lbl" style="color:var(--coral-dark)">Прощание</div>
    <p style="margin:0">«Mahalo — по-гавайски спасибо! Mahalo, что были с нами!»</p>
  </div>
</div>`, { cut: false });

// ───────── 23. Таблички еды ─────────
group('Таблички для food bar', '1', 'плотная бумага');
const foods = [
  ['PINEAPPLE BAR', 'Ананасовый бар', pineapple()], ['TROPICAL FRUIT', 'Тропические фрукты', palm()],
  ['COCONUT CUPCAKES', 'Кокосовые капкейки', coconut()], ['OCEAN JELLY', 'Желе «Океан»', shark()],
  ['ALOHA CHICKEN', 'Курочка Алоха', hibiscus()], ['MINI HAWAIIAN PIZZA', 'Мини-пицца', sun()],
  ['TROPICAL PUNCH', 'Тропический пунш', hibiscus(C.orange, C.pineDark)], ['', 'впишите своё блюдо', shell()],
];
const tentHalf = ([en, ru, art], flip) => `<div class="half ${flip ? 'flip' : ''}"><div class="i">${art}</div><div>${en ? `<b style="color:var(--ocean)">${en}</b>` : '<span style="display:block;border-bottom:1.4px solid #9DB1B8;width:50mm;height:6mm"></span>'}<span>${ru}</span></div></div>`;
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;grid-template-rows:repeat(4,1fr)">${foods.map((f) => `<div class="cell tent">${tentHalf(f, true)}${tentHalf(f, false)}<div class="fold"></div></div>`).join('')}</div>`);

// ───────── 24. Топперы и флажки ─────────
group('Топперы и флажки для трубочек', '1–2', 'плотная бумага');
const topperArts = [
  ...SYMBOLS.map((s) => `<div style="width:62%;height:62%">${s.art()}</div>`),
  `<div class="script" style="font-size:16pt;color:var(--coral)">Aloha!</div>`,
  `<div style="width:62%;height:62%">${parrot()}</div>`,
  `<div style="text-align:center"><div style="font-family:Unbounded;font-weight:900;font-size:24pt;color:var(--ocean);line-height:1">${config.age ? esc(config.age) : '<span style="display:inline-block;width:14mm;border-bottom:1.6px solid #9DB1B8;height:9mm"></span>'}</div><div style="font-size:7pt;font-weight:900;letter-spacing:.1em">ЛЕТ ВОЖДЮ</div></div>`,
];
const topper = (inner, i) => `<div style="width:44mm;height:44mm;border-radius:50%;border:1px dashed #A9BCC2;display:flex;align-items:center;justify-content:center;position:relative">
  <div style="position:absolute;inset:2mm;border-radius:50%;border:1.2mm solid ${[C.lagoon, C.coral, C.pine, C.leaf][i % 4]}"></div>${inner}</div>`;
const strawFlag = (i) => {
  const s = SYMBOLS[i % 5];
  return `<div style="width:58mm;height:20mm;border:1px dashed #A9BCC2;display:grid;grid-template-columns:1fr 1fr;position:relative">
    <div style="display:flex;align-items:center;justify-content:center;gap:1.4mm;background:${s.color};color:#fff;font-family:Unbounded;font-weight:800;font-size:6.6pt"><span style="width:8mm;height:8mm;background:#fff;border-radius:50%;padding:.8mm">${s.art()}</span>ALOHA</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:1.4mm;background:${s.color};color:#fff;font-family:Unbounded;font-weight:800;font-size:6.6pt">ALOHA<span style="width:8mm;height:8mm;background:#fff;border-radius:50%;padding:.8mm">${s.art()}</span></div>
    <div style="position:absolute;left:50%;top:0;bottom:0;border-left:1px dotted #fff"></div></div>`;
};
addPage(`<div style="display:flex;flex-direction:column;gap:5mm;height:100%">
  <div class="lbl">Топперы для капкейков — приклейте на зубочистку</div>
  <div style="display:grid;grid-template-columns:repeat(4,44mm);justify-content:space-between;row-gap:4mm">${[...topperArts, ...topperArts.slice(0, 4)].map(topper).join('')}</div>
  <div class="lbl" style="margin-top:2mm">Флажки для трубочек — оберните вокруг трубочки по линии сгиба и склейте</div>
  <div style="display:grid;grid-template-columns:repeat(3,58mm);justify-content:space-between;row-gap:3mm">${Array.from({ length: 12 }, (_, i) => strawFlag(i)).join('')}</div>
</div>`);

// ───────── 25. Этикетки на бутылочки ─────────
group('Этикетки на бутылочки', 'по числу гостей ÷ 5', 'обычная бумага');
const labelTitles = [['ISLAND WATER', 'Островная вода', C.lagoon], ['TROPICAL PUNCH', 'Тропический пунш', C.coral], ['COCONUT MILK', 'Кокосовое молоко', C.wood], ['PINEAPPLE JUICE', 'Ананасовый сок', C.pineDark], ['ALOHA LEMONADE', 'Лимонад Алоха', C.leaf]];
const bottle = ([en, ru, col]) => `<div class="cutbox" style="height:48mm;display:grid;grid-template-columns:40mm 1fr 40mm 1fr;align-items:center" data-fit="этикетка">
  <div style="height:36mm;margin-left:3mm">${frond(col, col)}</div>
  <div><div style="font-family:Unbounded;font-weight:900;font-size:12pt;color:${col};line-height:1.05">${en}</div><div class="ru-s" style="font-size:10pt">${ru}</div><div style="font-size:7pt;font-weight:900;letter-spacing:.2em;color:var(--muted);margin-top:1mm">TROPICAL QUEST</div></div>
  <div style="height:34mm;padding:1mm">${hibiscus()}</div>
  <div><div class="script" style="font-size:18pt;color:var(--coral)">Aloha!</div><div style="font-size:8pt;font-weight:800">Имя:</div><div style="border-bottom:1.3px solid #9DB1B8;height:5mm;margin-right:6mm"></div></div>
</div>`;
addPage(`<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">${labelTitles.map(bottle).join('')}</div>`, { paperNote: 'обычная бумага · длина 19 см — для бутылочки 0,33–0,5 л' });

// ───────── 26–27. Фотобутафория ─────────
group('Фотобутафория', '1 комплект', 'плотная бумага');
const stick = '<div style="position:absolute;bottom:2mm;left:50%;transform:translateX(-50%);font-size:6pt;color:#9DB1B8;font-weight:800">↓ палочка</div>';
const bubble = (txt, col, size = 20) => `<div style="position:relative;height:100%;display:flex;align-items:center;justify-content:center">
  <svg viewBox="0 0 100 70" class="art" style="position:absolute;inset:0"><path d="M10 6 H90 Q96 6 96 12 V46 Q96 52 90 52 H44 L30 66 L32 52 H10 Q4 52 4 46 V12 Q4 6 10 6Z" fill="#fff" stroke="${col}" stroke-width="2.4"/></svg>
  <div style="position:relative;font-family:Unbounded;font-weight:900;font-size:${size}pt;color:${col};text-align:center;line-height:1.05;margin-top:-8mm">${txt}</div></div>`;
addPage(`<div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr 1fr;gap:5mm;height:100%">
  <div class="cutbox" style="padding:10mm 4mm">${sunglasses(C.coral)}${stick}</div>
  <div class="cutbox" style="padding:10mm 4mm">${sunglasses(C.lagoon)}${stick}</div>
  <div class="cutbox" style="padding:14mm 8mm">${mustache()}${stick}</div>
  <div class="cutbox" style="padding:6mm 18mm">${hibiscus()}${stick}</div>
  <div class="cutbox" style="padding:6mm 18mm">${hibiscus(C.pine, C.pineDark)}${stick}</div>
  <div class="cutbox" style="padding:5mm 20mm">${pineapple()}${stick}</div>
</div>`);
addPage(`<div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr 1fr;gap:5mm;height:100%">
  <div class="cutbox" style="padding:4mm">${bubble('ALOHA!', C.coral, 24)}</div>
  <div class="cutbox" style="padding:4mm">${bubble('Я ВОЖДЬ<br>ОСТРОВА!', C.ocean, 15)}</div>
  <div class="cutbox" style="padding:4mm">${bubble('MAHALO!', C.leaf, 22)}</div>
  <div class="cutbox" style="padding:4mm">${bubble('ISLAND<br>EXPLORER', C.pineDark, 15)}</div>
  <div class="cutbox" style="padding:4mm">${bubble('ГДЕ МОЙ<br>КОКОС?', C.wood, 15)}</div>
  <div class="cutbox" style="padding:6mm 20mm">${parrot()}${stick}</div>
</div>`);

// ───────── 28. Цветок пожеланий ─────────
group('Цветок пожеланий', '1–2', 'плотная бумага');
const petal = (i) => `<div style="position:relative;width:44mm;height:70mm">
  <svg viewBox="0 0 44 70" class="art" style="position:absolute;inset:0"><path d="M22 69 C4 58 0 30 6 14 C10 4 34 4 38 14 C44 30 40 58 22 69Z" fill="#fff" stroke="#A9BCC2" stroke-width=".4" stroke-dasharray="1.6 1.2"/>
  <path d="M22 66 C6 56 3 31 8.5 16 C12 7.5 32 7.5 35.5 16 C41 31 38 56 22 66Z" fill="${[C.coral, C.pink, C.coral, C.pink][i % 4]}" opacity=".18"/></svg>
  <div style="position:absolute;left:8mm;right:8mm;top:12mm;font-size:7.4pt;font-weight:800;text-align:center">Желаю тебе…</div>
  <div style="position:absolute;left:8mm;right:8mm;top:20mm">${'<div style="border-bottom:1px solid #C9A0AA;height:6.4mm"></div>'.repeat(5)}</div>
  <div style="position:absolute;left:0;right:0;bottom:6mm;text-align:center;font-size:6.6pt;color:var(--muted)">от: ______</div></div>`;
addPage(`<div style="display:flex;flex-direction:column;align-items:center;height:100%">
  <div style="display:grid;grid-template-columns:1fr 74mm 1fr;align-items:center;width:100%">
    <div style="font-size:9pt;padding-right:4mm"><b>Как сделать:</b> вырежьте центр и лепестки. Каждый гость пишет пожелание вождю. Лепестки приклейте вокруг центра на ватман — получится цветок на память.</div>
    <div style="width:74mm;height:74mm;border-radius:50%;border:1px dashed #A9BCC2;display:flex;align-items:center;justify-content:center;position:relative">
      <div style="position:absolute;inset:3mm;border-radius:50%;background:${C.pine};opacity:.22"></div>
      <div style="position:relative;text-align:center"><div class="script" style="font-size:15pt;color:var(--coral-dark)">С днём рождения,</div><div style="width:50mm;margin:3mm auto 0">${nameLine('50mm', '20pt')}</div><div style="font-size:7pt;font-weight:900;letter-spacing:.16em;margin-top:2mm;color:var(--ocean)">CHIEF OF THE ISLAND</div></div>
    </div>
    <div style="height:40mm">${hibiscus()}</div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,44mm);justify-content:space-between;width:100%;row-gap:4mm;margin-top:6mm">${Array.from({ length: 8 }, (_, i) => petal(i)).join('')}</div>
</div>`);

// ───────── 29. Диплом Island Explorer ─────────
group('Диплом Island Explorer', 'по числу гостей', 'плотная бумага');
const seal = (txt, col) => `<svg viewBox="0 0 100 100" class="art">
  <circle cx="50" cy="50" r="46" fill="${col}"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-width="1.4" stroke-dasharray="2 2"/>
  <defs><path id="sealp${txt.length}" d="M50 50 m-31 0 a31 31 0 1 1 62 0 a31 31 0 1 1 -62 0"/></defs>
  <text font-family="Unbounded" font-weight="800" font-size="7.6" fill="#fff" letter-spacing="1.6"><textPath href="#sealp${txt.length}" startOffset="0">${txt}</textPath></text>
  ${place(palm(), 32, 30, 36)}
</svg>`;
addPage(`<div style="position:relative;height:100%">
  <div class="dip" style="inset:0">
    ${tropicalCorners(1)}
    <div class="in"></div>
    <div class="content">
      <div style="width:24mm;height:24mm;margin-bottom:2mm">${star()}</div>
      <div class="kick">ДИПЛОМ · CERTIFICATE</div>
      <h1>ISLAND<br>EXPLORER</h1>
      <div class="script">Исследователь острова</div>
      <div class="bel">Этот диплом вручается · This certificate belongs to</div>
      <div class="nm"></div>
      <div class="txt">за прохождение <b>TROPICAL QUEST</b><br>и звание официального исследователя острова —<br><b style="color:var(--ocean)">ISLAND EXPLORER!</b></div>
      <div class="syms">${SYMBOLS.map((s) => `<div>${s.art()}</div>`).join('')}</div>
      <div class="sign"><div>Хранитель острова</div><div>Дата</div></div>
    </div>
    <div class="seal" style="right:24mm;bottom:40mm;transform:rotate(-12deg)">${seal('TROPICAL QUEST · OFFICIAL · ', C.coral)}</div>
  </div>
</div>`, { cut: false });

// ───────── 30. Диплом вождя ─────────
group('Диплом Chief of the Island', '1', 'плотная бумага');
addPage(`<div style="position:relative;height:100%">
  <div class="dip" style="inset:0;border-color:${C.pine}">
    ${tropicalCorners(1)}
    <div class="in" style="border-color:${C.sand}"></div>
    <div class="content">
      <div style="width:30mm;height:30mm;margin-bottom:1mm">${chest()}</div>
      <div class="kick">ОСОБЫЙ ДИПЛОМ · SPECIAL TITLE</div>
      <h1 style="color:var(--pine-dark)">CHIEF OF<br>THE ISLAND</h1>
      <div class="script">Вождь острова</div>
      <div class="bel">Сегодня, в свой день рождения,</div>
      <div class="nm">${config.name ? `<span class="hand" style="font-size:30pt;color:var(--coral-dark)">${esc(config.name)}</span>` : ''}</div>
      <div class="txt">получает почётный титул <b>CHIEF OF THE ISLAND</b>.<br>Вождь вместе со своей командой прошёл<br>все испытания и открыл сокровища острова!</div>
      <div style="margin-top:6mm;font-family:Unbounded;font-weight:800;font-size:13pt;color:var(--coral)">Hau’oli lā hānau!</div>
      <div style="font-size:9pt;color:var(--muted);font-weight:700">«С днём рождения» по-гавайски</div>
      <div class="sign"><div>Хранитель острова</div><div>Дата</div></div>
    </div>
    <div class="seal" style="right:24mm;bottom:40mm;transform:rotate(-12deg)">${seal('CHIEF · OF · THE · ISLAND · ', C.pineDark)}</div>
  </div>
</div>`, { cut: false });

// ───────── 31–36. Номинации ─────────
group('Номинации Special Awards', 'по числу гостей', 'плотная бумага');
const awards = [
  ['BEST ISLAND DANCER', 'Лучший танцор острова', 'за самые зажигательные танцы', hibiscus(), C.coral, '#FDE8EC'],
  ['LIMBO MASTER', 'Мастер лимбо', 'за невероятную гибкость', volcano(), C.red, '#FDE6E4'],
  ['COCONUT CHAMPION', 'Кокосовый чемпион', 'за самый меткий бросок', coconut(), C.wood, '#F6EBE2'],
  ['TROPICAL TEAM PLAYER', 'Душа команды', 'за помощь и поддержку друзей', lei(), C.leaf, '#E4F4EA'],
  ['PINEAPPLE PRO', 'Ананасовый профи', 'за мастерство в боулинге', pineapple(), C.pineDark, '#FFF4D9'],
  ['WAVE RIDER', 'Покоритель волн', 'за ловкость на островах', wave(), C.ocean, '#E2F3F5'],
  ['FREEZE STATUE', 'Лучшая статуя', 'за самую смешную позу', flamingo(), C.coral, '#FDE8EC'],
  ['EAGLE EYE', 'Зоркий глаз', 'за отличную память', parrot(), C.blue, '#E3EEFA'],
  ['ISLAND SUNSHINE', 'Солнце острова', 'за самую яркую улыбку', sun(), C.pineDark, '#FFF4D9'],
  ['BRAVE EXPLORER', 'Смелый исследователь', 'за смелость и задор', turtle(), C.leafDark, '#E4F4EA'],
  ['', 'Своя номинация', '', star(), C.lagoon, '#E2F6F4'],
  ['', 'Своя номинация', '', star(C.coral), C.coral, '#FDE8EC'],
];
const award = ([en, ru, why, art, col, soft]) => `<div class="award" style="--c:${col};--soft:${soft}">
  <div class="frame" style="border-style:solid"></div>
  <div class="body" data-fit="номинация">
    <div class="ic">${art}</div>
    <div>
      <div class="k">SPECIAL AWARD · НОМИНАЦИЯ</div>
      ${en ? `<h2>${en}</h2>` : '<div style="border-bottom:1.4px solid #9DB1B8;height:12mm;margin:1mm 0 1mm"></div>'}
      <div class="ru">${ru}</div>
      <div class="to">Awarded to · Награждается</div>
      <div class="nm"></div>
      <div class="why">${why || '<span style="display:inline-block;width:100%;border-bottom:1.3px solid #9DB1B8;height:5mm"></span>'}</div>
      <div class="foot"><span>TROPICAL QUEST™</span><span>Хранитель острова ____________</span></div>
    </div>
  </div>
</div>`;
for (let i = 0; i < awards.length; i += 2) {
  addPage(`<div style="height:100%;display:flex;flex-direction:column;border:1px dashed #A9BCC2">${award(awards[i])}<div style="border-top:1px dashed #A9BCC2"></div>${award(awards[i + 1])}</div>`);
}

// ───────── 37. Бирки Mahalo ─────────
group('Бирки Mahalo для подарков', 'по числу гостей ÷ 8', 'плотная бумага');
const tag = (i) => `<div class="cell tag" data-fit="бирка">
  <span class="hole"></span>
  <div class="corner" style="width:26mm;height:26mm;right:-6mm;top:-6mm;transform:rotate(200deg)">${i % 2 ? frond() : monstera()}</div>
  <div class="script">Mahalo!</div>
  <div style="font-size:9pt;font-weight:800;line-height:1.3">Спасибо, что был(а)<br>на нашем острове!</div>
  <div style="font-size:7.4pt;color:var(--muted);margin-top:1mm">Thank you for joining our island adventure!</div>
  <div style="display:grid;grid-template-columns:auto 1fr;gap:2mm;align-items:end;margin-top:3mm;font-size:8pt;font-weight:900"><span>From:</span>${config.name ? `<span class="hand" style="font-size:14pt;color:var(--coral-dark);line-height:1">${esc(config.name)}</span>` : '<span style="border-bottom:1.3px solid #9DB1B8;height:5mm"></span>'}</div>
  <div style="display:flex;gap:1.6mm;margin-top:2.4mm">${SYMBOLS.map((s) => `<span style="width:5mm;height:5mm">${s.art()}</span>`).join('')}</div>
</div>`;
addPage(`<div class="grid" style="grid-template-columns:1fr 1fr;grid-template-rows:repeat(4,1fr)">${Array.from({ length: 8 }, (_, i) => tag(i)).join('')}</div>`);

// ───────── 38. Раскраска ─────────
group('Раскраска «Остров Пико»', 'по числу гостей', 'обычная бумага');
addPage(`<div style="height:100%;display:flex;flex-direction:column">
  <div style="text-align:center;margin-bottom:4mm"><div class="display" style="font-size:18pt;color:var(--ocean)">COLOR THE ISLAND</div><div class="ru-s" style="font-size:13pt">Раскрась остров Пико!</div></div>
  <div class="lineart" style="flex:1;border:1.4px solid #2B2B2B;border-radius:6mm;overflow:hidden;position:relative">
    <svg viewBox="0 0 190 236" class="art" style="width:100%;height:100%">
      <path d="M0 122 C30 116 60 126 95 120 C130 114 160 124 190 118" fill="none" stroke="#2B2B2B" stroke-width="1"/>
      <path d="M0 176 C40 160 150 158 190 174 L190 236 L0 236Z" fill="#fff"/>
      ${place(sun(), 146, 6, 38)}
      ${place(hibiscus(), 66, 8, 26)}
      ${place(wave(), 128, 92, 58)}
      ${place(palm(), 2, 40, 116)}
      ${place(parrot(), 96, 30, 56)}
      ${place(chest(), 76, 160, 50)}
      ${place(pineapple(), 140, 162, 42)}
      ${place(coconut(), 48, 176, 26)}
      ${place(crab(), 10, 196, 32)}
      ${place(turtle(), 58, 206, 28)}
      ${place(shell(), 150, 208, 22)}
    </svg>
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:3mm;font-size:10pt;font-weight:800"><span>Художник: ____________________</span><span>TROPICAL QUEST™</span></div>
</div>`, { cut: false });

// ───────── сборка ─────────
export function kitIndex() {
  return groups.map((g) => ({ ...g }));
}

export function buildKit() {
  const index = kitIndex();
  const body = typo([kitCover(index), ...pages].join('\n'));
  return doc('TROPICAL QUEST — Printable Kit', CSS, body);
}
