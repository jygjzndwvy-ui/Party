// Иллюстрации, которые сайт рисует сам: интерьеры для карточек объектов,
// стены для демо 3D-тура, планировки и знак логотипа.
// Это заглушки на время, пока нет настоящих фото. Как только у объекта
// появится поле photos, сайт покажет фотографии вместо иллюстраций.

const n = (v) => +(+v).toFixed(1);
const rect = (x, y, w, h, fill, rx = 0, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${n(rx)}"` : ''} fill="${fill}"${extra}/>`;
const el = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (x1, y1, x2, y2, stroke, w = 1, extra = '') =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${w}"${extra}/>`;

export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
const hash = (str) => [...String(str)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

export const PALETTES = {
  blue: { wall: '#DDE5EE', wall2: '#CBD6E2', floor: '#B88A5E', floor2: '#A57A50', soft: '#2B4666', soft2: '#1D3250', wood: '#8B6442', accent: '#FFC145', textile: '#F6F3EC', leaf: '#3F7A5C', leaf2: '#2E6048' },
  sand: { wall: '#EFE6D8', wall2: '#E1D4C0', floor: '#A9805A', floor2: '#96704C', soft: '#C8643F', soft2: '#A84F30', wood: '#7A5638', accent: '#2B4666', textile: '#FBF7EF', leaf: '#5C8A5A', leaf2: '#456E46' },
  sage: { wall: '#DFE7DC', wall2: '#CDD9CA', floor: '#B9976F', floor2: '#A6855F', soft: '#56755C', soft2: '#425C48', wood: '#86633F', accent: '#FFC145', textile: '#F6F3EA', leaf: '#2F6B4B', leaf2: '#235239' },
  night: { wall: '#27384F', wall2: '#1E2C42', floor: '#6C543F', floor2: '#5A4533', soft: '#DDB98C', soft2: '#C49F72', wood: '#3A2C22', accent: '#FFC145', textile: '#EFE7DA', leaf: '#4E8A68', leaf2: '#3A6E52' },
  rose: { wall: '#F0E1DC', wall2: '#E3CFC8', floor: '#9C7458', floor2: '#89634A', soft: '#8E4A55', soft2: '#733A44', wood: '#6E4D38', accent: '#FFC145', textile: '#FCF6F1', leaf: '#4F7F62', leaf2: '#3B6549' },
  sky: { wall: '#D9E8F1', wall2: '#C6D9E5', floor: '#C4A07A', floor2: '#B18E68', soft: '#E9B93F', soft2: '#CF9E24', wood: '#8E6B48', accent: '#2B4666', textile: '#FFFFFF', leaf: '#3B7D5E', leaf2: '#2C6148' },
};
const PAL_KEYS = Object.keys(PALETTES);

// ── Кирпичики ───────────────────────────────────────────────────────────────

function defs(id, time) {
  const sky =
    time === 'day'
      ? '<stop offset="0" stop-color="#8DBBE6"/><stop offset=".7" stop-color="#CFE4F5"/><stop offset="1" stop-color="#F3EFE2"/>'
      : '<stop offset="0" stop-color="#16294A"/><stop offset=".45" stop-color="#3C5788"/><stop offset=".78" stop-color="#B78FA0"/><stop offset="1" stop-color="#F8B583"/>';
  return `<defs><linearGradient id="sk${id}" x1="0" y1="0" x2="0" y2="1">${sky}</linearGradient><radialGradient id="gl${id}"><stop offset="0" stop-color="#FFD98A" stop-opacity=".75"/><stop offset="1" stop-color="#FFC145" stop-opacity="0"/></radialGradient><linearGradient id="cn${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3A1" stop-opacity=".5"/><stop offset="1" stop-color="#FFE3A1" stop-opacity="0"/></linearGradient></defs>`;
}

function windowEl(x, y, w, h, p, { id, curtains = true, cols = 2, time = 'dusk', floorY = 0 } = {}) {
  const rand = rng(hash(`${id}${x}${w}`));
  let s = rect(x, y, w, h, `url(#sk${id})`, 2);
  // город за окном
  let bx = x;
  const dark = time === 'day' ? 'rgba(74,104,140,.35)' : 'rgba(13,24,44,.6)';
  while (bx < x + w - 2) {
    const bw = 8 + rand() * 16;
    const bh = h * (0.14 + rand() * 0.3);
    const ww = Math.min(bw, x + w - bx);
    s += rect(bx, y + h - bh, ww, bh, dark);
    if (time !== 'day' && rand() > 0.35 && ww > 7) s += rect(bx + 3, y + h - bh + 4, 2.4, 3, '#FFC145', 0, ' opacity=".9"');
    if (time !== 'day' && rand() > 0.6 && ww > 12) s += rect(bx + 8, y + h - bh + 11, 2.4, 3, '#FFD98A', 0, ' opacity=".8"');
    bx += bw + 1;
  }
  // рама
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="2" fill="none" stroke="${p.textile}" stroke-width="5"/>`;
  for (let i = 1; i < cols; i++) s += line(x + (w / cols) * i, y, x + (w / cols) * i, y + h, p.textile, 3.5);
  s += line(x, y + h * 0.3, x + w, y + h * 0.3, p.textile, 2.5);
  s += rect(x - 7, y + h + 2, w + 14, 6, p.textile, 2);
  s += rect(x - 7, y + h + 8, w + 14, 2, 'rgba(0,0,0,.08)');
  if (curtains) {
    const cw = w * 0.2;
    const top = y - 12;
    const bot = Math.max(y + h + 20, floorY ? floorY - 6 : 0);
    s += line(x - 22, top, x + w + 22, top, p.wood, 3, ' stroke-linecap="round"');
    const cur = (cx, dir) =>
      path(
        `M${n(cx)} ${n(top)}h${n(cw * dir)}q${n(-4 * dir)} ${n((bot - top) / 2)} ${n(3 * dir)} ${n(bot - top)}h${n(-(cw + 6) * dir)}z`,
        p.textile,
        ' opacity=".94"',
      ) +
      line(cx + cw * 0.35 * dir, top + 4, cx + cw * 0.3 * dir, bot - 3, 'rgba(0,0,0,.07)', 1.5) +
      line(cx + cw * 0.7 * dir, top + 4, cx + cw * 0.68 * dir, bot - 3, 'rgba(0,0,0,.07)', 1.5);
    s += cur(x - 14, 1) + cur(x + w + 14, -1);
  }
  return s;
}

function lightPatch(x, w, floorY, H) {
  return path(`M${n(x)} ${n(floorY)}h${n(w)}l${n(w * 0.35)} ${n(H - floorY)}h${n(-w * 1.5)}z`, '#fff', ' opacity=".1"');
}

function sofa(x, floorY, w, p, { pillows = true } = {}) {
  const h = w * 0.4;
  let s = '';
  s += rect(x + w * 0.08, floorY - 5, 4, 5, p.wood) + rect(x + w * 0.92 - 4, floorY - 5, 4, 5, p.wood);
  s += rect(x + w * 0.05, floorY - h, w * 0.9, h * 0.66, p.soft2, 12);
  s += rect(x, floorY - h * 0.62, w * 0.15, h * 0.62 - 5, p.soft, 9);
  s += rect(x + w * 0.85, floorY - h * 0.62, w * 0.15, h * 0.62 - 5, p.soft, 9);
  s += rect(x + w * 0.1, floorY - h * 0.46, w * 0.8, h * 0.46 - 5, p.soft, 8);
  s += line(x + w * 0.5, floorY - h * 0.44, x + w * 0.5, floorY - 8, 'rgba(0,0,0,.14)', 1.5);
  if (pillows) {
    s += `<rect x="${n(x + w * 0.2)}" y="${n(floorY - h * 0.8)}" width="${n(w * 0.17)}" height="${n(w * 0.15)}" rx="5" fill="${p.accent}" transform="rotate(-8 ${n(x + w * 0.28)} ${n(floorY - h * 0.6)})"/>`;
    s += `<rect x="${n(x + w * 0.62)}" y="${n(floorY - h * 0.78)}" width="${n(w * 0.16)}" height="${n(w * 0.14)}" rx="5" fill="${p.textile}" transform="rotate(7 ${n(x + w * 0.7)} ${n(floorY - h * 0.6)})"/>`;
  }
  return s;
}

function armchair(x, floorY, w, p) {
  const h = w * 0.85;
  return (
    rect(x + w * 0.14, floorY - 5, 4, 5, p.wood) +
    rect(x + w * 0.82, floorY - 5, 4, 5, p.wood) +
    rect(x + w * 0.1, floorY - h, w * 0.8, h * 0.7, p.soft2, 14) +
    rect(x, floorY - h * 0.55, w * 0.22, h * 0.55 - 5, p.soft, 8) +
    rect(x + w * 0.78, floorY - h * 0.55, w * 0.22, h * 0.55 - 5, p.soft, 8) +
    rect(x + w * 0.16, floorY - h * 0.4, w * 0.68, h * 0.4 - 5, p.soft, 7)
  );
}

function floorLamp(x, floorY, h, p, id) {
  const top = floorY - h;
  return (
    path(`M${n(x - 11)} ${n(top + 24)}L${n(x - 46)} ${n(floorY)}h92L${n(x + 11)} ${n(top + 24)}z`, `url(#cn${id})`) +
    el(x, top + 16, 44, 44, `url(#gl${id})`) +
    line(x, top + 20, x, floorY - 2, p.wood, 2.5) +
    el(x, floorY - 1.5, 12, 3, p.wood) +
    path(`M${n(x - 9)} ${n(top)}h18l6 24h-30z`, '#FFE3A1')
  );
}

function pendant(x, y0, len, p, id, { size = 13 } = {}) {
  return (
    line(x, y0, x, y0 + len, 'rgba(0,0,0,.45)', 1.2) +
    el(x, y0 + len + size * 0.8, size * 2.6, size * 2.6, `url(#gl${id})`) +
    path(`M${n(x - size)} ${n(y0 + len + size * 0.75)}a${size} ${size} 0 0 1 ${size * 2} 0z`, p.accent === '#FFC145' ? p.soft2 : p.accent) +
    el(x, y0 + len + size * 0.8, size * 0.5, size * 0.22, '#FFE3A1')
  );
}

function plant(x, floorY, s, p, { tall = false } = {}) {
  const potH = 16 * s;
  const potW = 20 * s;
  let out = '';
  const top = floorY - potH;
  const leaves = tall ? 7 : 6;
  for (let i = 0; i < leaves; i++) {
    const a = -70 + (140 / (leaves - 1)) * i;
    const len = (tall ? 30 : 20) * s * (1 - Math.abs(a) / 260);
    out += `<ellipse cx="${n(x)}" cy="${n(top - len)}" rx="${n(5.5 * s)}" ry="${n(len)}" fill="${i % 2 ? p.leaf : p.leaf2}" transform="rotate(${n(a)} ${n(x)} ${n(top + 2)})"/>`;
  }
  out += path(`M${n(x - potW / 2)} ${n(top)}h${n(potW)}l${n(-3 * s)} ${n(potH)}h${n(-(potW - 6 * s))}z`, '#C97B4A');
  out += rect(x - potW / 2 - 1.5, top - 1, potW + 3, 4 * s, '#B8683A', 1.5);
  return out;
}

function frameArt(x, y, w, h, p, kind = 0) {
  let s = rect(x, y, w, h, p.textile, 1.5, ` stroke="${p.wood}" stroke-width="2.5"`);
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (kind % 3 === 0) {
    s += el(cx, cy + h * 0.08, w * 0.24, w * 0.24, p.accent) + rect(x + 5, cy + h * 0.14, w - 10, h * 0.3 - 5, p.soft, 0, ' opacity=".85"');
  } else if (kind % 3 === 1) {
    s += path(`M${n(x + 5)} ${n(y + h - 5)}l${n(w * 0.3)} ${n(-h * 0.5)}l${n(w * 0.2)} ${n(h * 0.25)}l${n(w * 0.15)} ${n(-h * 0.2)}l${n(w * 0.35 - 10)} ${n(h * 0.45)}z`, p.soft) + el(x + w * 0.72, y + h * 0.28, 4.5, 4.5, p.accent);
  } else {
    s += rect(x + 6, y + 6, (w - 12) * 0.5, h - 12, p.soft2) + el(x + w * 0.64, cy, w * 0.2, w * 0.2, p.accent, ' opacity=".9"');
  }
  return s;
}

function rug(cx, y, rx, p) {
  return el(cx, y, rx, rx * 0.16, p.accent, ' opacity=".42"') + el(cx, y, rx * 0.74, rx * 0.105, p.textile, ' opacity=".35"');
}

function coffeeTable(x, floorY, w, p) {
  return (
    line(x + 6, floorY - 16, x + 3, floorY, p.wood, 2.2) +
    line(x + w - 6, floorY - 16, x + w - 3, floorY, p.wood, 2.2) +
    rect(x, floorY - 19, w, 5, p.wood, 2.5) +
    rect(x + w * 0.2, floorY - 25, w * 0.22, 6, p.textile, 1) +
    el(x + w * 0.7, floorY - 23, 5, 4, p.accent)
  );
}

function shelf(x, y, w, p) {
  const cols = ['#C8643F', p.soft, '#E9B93F', p.leaf, p.soft2, '#8E4A55'];
  let s = rect(x, y, w, 4, p.wood, 1);
  let bx = x + 6;
  let i = 0;
  while (bx < x + w * 0.62) {
    const bh = 15 + ((i * 7) % 9);
    s += rect(bx, y - bh, 5.5, bh, cols[i % cols.length], 0.8);
    bx += 7;
    i++;
  }
  s += plant(x + w - 16, y, 0.55, p);
  return s;
}

function bed(x, floorY, w, p) {
  const h = w * 0.36;
  return (
    rect(x, floorY - h * 1.5, w, h * 1.1, p.soft2, 12) +
    rect(x + 6, floorY - 6, 5, 6, p.wood) +
    rect(x + w - 11, floorY - 6, 5, 6, p.wood) +
    rect(x - 4, floorY - h * 0.72, w + 8, h * 0.72 - 5, p.textile, 7) +
    rect(x + w * 0.1, floorY - h * 0.98, w * 0.34, h * 0.36, '#fff', 9) +
    rect(x + w * 0.56, floorY - h * 0.98, w * 0.34, h * 0.36, '#fff', 9) +
    rect(x - 4, floorY - h * 0.5, w + 8, h * 0.5 - 5, p.soft, 7) +
    rect(x - 4, floorY - h * 0.5, w + 8, 7, p.accent, 3.5, ' opacity=".9"')
  );
}

function nightstand(x, floorY, w, p, id) {
  const h = w * 0.9;
  return (
    el(x + w / 2, floorY - h - 22, 30, 30, `url(#gl${id})`) +
    rect(x, floorY - h, w, h - 4, p.wood, 3) +
    rect(x + 3, floorY - 4, 3, 4, p.wood) +
    rect(x + w - 6, floorY - 4, 3, 4, p.wood) +
    line(x + 5, floorY - h / 2, x + w - 5, floorY - h / 2, 'rgba(0,0,0,.2)', 1) +
    line(x + w / 2, floorY - h, x + w / 2, floorY - h - 12, p.soft2, 2) +
    path(`M${n(x + w / 2 - 7)} ${n(floorY - h - 26)}h14l4 15h-22z`, '#FFE3A1')
  );
}

function kitchenRun(x, floorY, w, p, id) {
  const lowH = 62;
  const upY = floorY - 168;
  const doors = Math.max(3, Math.round(w / 52));
  const dw = w / doors;
  let s = '';
  // фартук
  s += rect(x, floorY - lowH - 46, w, 46, p.textile, 0, ' opacity=".7"');
  for (let i = 1; i < 8; i++) s += line(x + (w / 8) * i, floorY - lowH - 46, x + (w / 8) * i, floorY - lowH, 'rgba(0,0,0,.05)', 1);
  s += line(x, floorY - lowH - 23, x + w, floorY - lowH - 23, 'rgba(0,0,0,.05)', 1);
  // верхние шкафы
  s += rect(x, upY, w, 60, p.soft, 3);
  for (let i = 1; i < doors; i++) s += line(x + dw * i, upY + 3, x + dw * i, upY + 57, 'rgba(0,0,0,.18)', 1.2);
  // нижние шкафы и столешница
  s += rect(x, floorY - lowH, w, lowH - 4, p.soft2, 2);
  s += rect(x, floorY - 4, w, 4, 'rgba(0,0,0,.35)');
  for (let i = 0; i < doors; i++) {
    if (i) s += line(x + dw * i, floorY - lowH + 6, x + dw * i, floorY - 6, 'rgba(0,0,0,.22)', 1.2);
    s += rect(x + dw * i + dw / 2 - 7, floorY - lowH + 9, 14, 2.4, p.accent, 1.2);
  }
  s += rect(x - 3, floorY - lowH - 5, w + 6, 6, p.wood, 2);
  // мойка и мелочи на столешнице
  s += `<path d="M${n(x + w * 0.3)} ${n(floorY - lowH - 5)}v-13q0-6 6-6h3" fill="none" stroke="#9AA8B8" stroke-width="2.4" stroke-linecap="round"/>`;
  s += rect(x + w * 0.62, floorY - lowH - 19, 12, 14, p.accent, 2) + rect(x + w * 0.69, floorY - lowH - 14, 9, 9, p.textile, 2);
  s += plant(x + w * 0.9, floorY - lowH - 5, 0.5, p);
  return s;
}

function fridge(x, floorY, p) {
  return (
    rect(x, floorY - 150, 56, 148, '#E9EEF3', 5) +
    line(x, floorY - 96, x + 56, floorY - 96, 'rgba(0,0,0,.18)', 1.4) +
    rect(x + 7, floorY - 124, 2.6, 20, '#9AA8B8', 1.3) +
    rect(x + 7, floorY - 86, 2.6, 28, '#9AA8B8', 1.3) +
    rect(x + 4, floorY - 2, 48, 2, 'rgba(0,0,0,.3)')
  );
}

function stool(x, floorY, p) {
  return (
    line(x - 8, floorY - 36, x - 11, floorY, p.wood, 2.2) +
    line(x + 8, floorY - 36, x + 11, floorY, p.wood, 2.2) +
    line(x - 9, floorY - 14, x + 9, floorY - 14, p.wood, 1.6) +
    rect(x - 13, floorY - 41, 26, 6, p.soft, 3)
  );
}

function diningTable(x, floorY, w, p) {
  return (
    line(x + 10, floorY - 44, x + 6, floorY, p.wood, 2.6) +
    line(x + w - 10, floorY - 44, x + w - 6, floorY, p.wood, 2.6) +
    rect(x, floorY - 49, w, 6, p.wood, 3) +
    el(x + w * 0.5, floorY - 53, 9, 4, p.textile) +
    rect(x + w * 0.5 - 1, floorY - 68, 2, 14, p.leaf) +
    el(x + w * 0.5 - 4, floorY - 68, 4, 6, p.leaf2) +
    el(x + w * 0.5 + 4, floorY - 71, 4, 6, p.leaf)
  );
}

function door(x, floorY, w, h, p) {
  return (
    rect(x - 5, floorY - h - 5, w + 10, h + 5, p.textile) +
    rect(x, floorY - h, w, h, p.wood, 1) +
    rect(x + 8, floorY - h + 10, w - 16, h * 0.4, 'rgba(255,255,255,.08)', 2) +
    rect(x + 8, floorY - h * 0.5 + 4, w - 16, h * 0.42, 'rgba(255,255,255,.08)', 2) +
    el(x + w - 9, floorY - h * 0.47, 2.8, 2.8, p.accent)
  );
}

function wardrobe(x, floorY, w, h, p) {
  return (
    rect(x, floorY - h, w, h - 3, p.soft2, 3) +
    line(x + w / 2, floorY - h + 4, x + w / 2, floorY - 7, 'rgba(0,0,0,.25)', 1.3) +
    rect(x + w / 2 - 7, floorY - h * 0.52, 2.4, 18, p.accent, 1.2) +
    rect(x + w / 2 + 4.6, floorY - h * 0.52, 2.4, 18, p.accent, 1.2) +
    rect(x + 4, floorY - 3, w - 8, 3, 'rgba(0,0,0,.3)')
  );
}

function tv(x, floorY, w, p) {
  return (
    rect(x, floorY - 30, w, 26, p.wood, 3) +
    line(x + w / 3, floorY - 28, x + w / 3, floorY - 6, 'rgba(0,0,0,.2)', 1) +
    line(x + (w / 3) * 2, floorY - 28, x + (w / 3) * 2, floorY - 6, 'rgba(0,0,0,.2)', 1) +
    rect(x + 8, floorY - 4, 4, 4, p.wood) +
    rect(x + w - 12, floorY - 4, 4, 4, p.wood) +
    rect(x + w * 0.12, floorY - 96, w * 0.76, 56, '#0F1B2E', 3) +
    rect(x + w * 0.12 + 3, floorY - 93, w * 0.76 - 6, 50, '#1D3250', 2) +
    path(`M${n(x + w * 0.2)} ${n(floorY - 50)}l${n(w * 0.16)} ${n(-22)}l${n(w * 0.12)} ${n(12)}l${n(w * 0.1)} ${n(-9)}l${n(w * 0.2)} ${n(19)}z`, '#3F5B7D')
  );
}

// ── Сцены ───────────────────────────────────────────────────────────────────

function room(W, H, floorY, p) {
  let s = rect(0, 0, W, H, p.wall);
  s += rect(0, 0, W, floorY * 0.42, p.wall2, 0, ' opacity=".35"');
  if (floorY < H) {
    s += rect(0, floorY, W, H - floorY, p.floor);
    const planks = 7;
    for (let i = 0; i <= planks; i++) {
      const x0 = (W / planks) * i;
      s += line(x0, floorY, W / 2 + (x0 - W / 2) * 1.5, H, p.floor2, 1.2);
    }
    s += line(0, floorY + (H - floorY) * 0.42, W, floorY + (H - floorY) * 0.42, p.floor2, 1);
    s += rect(0, floorY - 5, W, 5, p.textile, 0, ' opacity=".9"');
  } else {
    s += rect(0, H - 7, W, 7, p.textile, 0, ' opacity=".9"');
  }
  return s;
}

const SCENES = {
  living(W, H, fy, p, id, time, flip) {
    let s = room(W, H, fy, p);
    const wx = W * 0.09;
    s += windowEl(wx, fy * 0.2, W * 0.34, fy * 0.5, p, { id, time, floorY: fy });
    if (fy < H) s += lightPatch(wx, W * 0.34, fy, H);
    s += frameArt(W * 0.58, fy * 0.22, W * 0.11, fy * 0.2, p, id) + frameArt(W * 0.72, fy * 0.3, W * 0.085, fy * 0.14, p, id + 1);
    if (fy < H) s += rug(W * 0.62, fy + (H - fy) * 0.5, W * 0.3, p);
    s += floorLamp(W * 0.905, fy, fy * 0.6, p, id);
    s += sofa(W * 0.47, fy, W * 0.38, p);
    s += plant(W * 0.06, fy, 1.15, p, { tall: true });
    if (fy < H) s += coffeeTable(W * 0.52, fy + (H - fy) * 0.62, W * 0.2, p);
    return flip ? `<g transform="translate(${W} 0) scale(-1 1)">${s}</g>` : s;
  },
  bedroom(W, H, fy, p, id, time, flip) {
    let s = room(W, H, fy, p);
    s += windowEl(W * 0.68, fy * 0.2, W * 0.24, fy * 0.5, p, { id, time, cols: 2, floorY: fy });
    if (fy < H) s += lightPatch(W * 0.68, W * 0.24, fy, H);
    s += frameArt(W * 0.27, fy * 0.16, W * 0.13, fy * 0.2, p, id + 2);
    s += nightstand(W * 0.085, fy, W * 0.085, p, id) + nightstand(W * 0.535, fy, W * 0.085, p, id);
    s += bed(W * 0.19, fy, W * 0.33, p);
    if (fy < H) s += rug(W * 0.36, fy + (H - fy) * 0.55, W * 0.27, p);
    s += plant(W * 0.95, fy, 0.95, p, { tall: true });
    return flip ? `<g transform="translate(${W} 0) scale(-1 1)">${s}</g>` : s;
  },
  kitchen(W, H, fy, p, id, time, flip) {
    let s = room(W, H, fy, p);
    s += windowEl(W * 0.72, fy * 0.22, W * 0.2, fy * 0.4, p, { id, time, curtains: false, cols: 2 });
    s += kitchenRun(W * 0.2, fy, W * 0.46, p, id);
    s += fridge(W * 0.05, fy, p);
    s += pendant(W * 0.76, 0, fy * 0.1, p, id) + pendant(W * 0.88, 0, fy * 0.16, p, id);
    const ty = fy < H ? fy + (H - fy) * 0.5 : fy;
    s += diningTable(W * 0.7, ty, W * 0.22, p) + stool(W * 0.69, ty, p) + stool(W * 0.93, ty, p);
    return flip ? `<g transform="translate(${W} 0) scale(-1 1)">${s}</g>` : s;
  },
  studio(W, H, fy, p, id, time, flip) {
    let s = room(W, H, fy, p);
    s += windowEl(W * 0.36, fy * 0.16, W * 0.28, fy * 0.56, p, { id, time, cols: 3, floorY: fy });
    if (fy < H) s += lightPatch(W * 0.36, W * 0.28, fy, H);
    s += shelf(W * 0.72, fy * 0.42, W * 0.2, p);
    s += pendant(W * 0.2, 0, fy * 0.14, p, id, { size: 15 });
    s += armchair(W * 0.1, fy, W * 0.2, p);
    s += tv(W * 0.7, fy, W * 0.24, p);
    if (fy < H) s += rug(W * 0.5, fy + (H - fy) * 0.55, W * 0.26, p);
    s += plant(W * 0.345, fy, 0.9, p);
    return flip ? `<g transform="translate(${W} 0) scale(-1 1)">${s}</g>` : s;
  },
  gallery(W, H, fy, p, id, time, flip) {
    let s = room(W, H, fy, p);
    s += frameArt(W * 0.12, fy * 0.2, W * 0.14, fy * 0.3, p, id) + frameArt(W * 0.3, fy * 0.26, W * 0.1, fy * 0.18, p, id + 1) + frameArt(W * 0.3, fy * 0.5, W * 0.1, fy * 0.14, p, id + 2);
    s += shelf(W * 0.56, fy * 0.36, W * 0.3, p) + shelf(W * 0.62, fy * 0.58, W * 0.24, p);
    s += pendant(W * 0.47, 0, fy * 0.12, p, id, { size: 14 });
    s += armchair(W * 0.6, fy, W * 0.17, p);
    s += floorLamp(W * 0.86, fy, fy * 0.56, p, id);
    s += plant(W * 0.1, fy, 1.2, p, { tall: true });
    s += rect(W * 0.2, fy - 30, W * 0.2, 26, p.wood, 3) + rect(W * 0.22, fy - 4, 4, 4, p.wood) + rect(W * 0.38 - 4, fy - 4, 4, 4, p.wood) + plant(W * 0.34, fy - 30, 0.55, p);
    return flip ? `<g transform="translate(${W} 0) scale(-1 1)">${s}</g>` : s;
  },
  hall(W, H, fy, p, id) {
    let s = room(W, H, fy, p);
    s += door(W * 0.42, fy, W * 0.17, fy * 0.74, p);
    s += wardrobe(W * 0.68, fy, W * 0.24, fy * 0.8, p);
    s += frameArt(W * 0.12, fy * 0.26, W * 0.16, fy * 0.3, p, id + 1);
    s += rect(W * 0.1, fy - 26, W * 0.2, 22, p.wood, 3) + rect(W * 0.12, fy - 4, 4, 4, p.wood) + rect(W * 0.28 - 4, fy - 4, 4, 4, p.wood);
    s += plant(W * 0.2, fy - 26, 0.6, p);
    return s;
  },
  // дом снаружи: для коттеджей и таунхаусов
  house(W, H, fy, p, id, time) {
    const gy = H * 0.78;
    let s = rect(0, 0, W, H, `url(#sk${id})`);
    if (time !== 'day') for (let i = 0; i < 14; i++) s += el((i * 97) % W, (i * 53) % (H * 0.4), 0.9, 0.9, '#fff', ' opacity=".7"');
    s += el(W * 0.14, gy - 34, 34, 40, p.leaf2) + rect(W * 0.14 - 2.5, gy - 16, 5, 16, p.wood);
    s += el(W * 0.9, gy - 44, 30, 46, p.leaf) + rect(W * 0.9 - 2.5, gy - 18, 5, 18, p.wood);
    const hx = W * 0.26;
    const hw = W * 0.5;
    const hy = gy - H * 0.34;
    s += rect(hx + hw * 0.7, hy - H * 0.2, 14, 34, p.soft2);
    s += path(`M${n(hx - 16)} ${n(hy)}L${n(hx + hw / 2)} ${n(hy - H * 0.24)}L${n(hx + hw + 16)} ${n(hy)}z`, p.soft2);
    s += rect(hx, hy, hw, gy - hy, p.textile);
    s += rect(hx, hy, hw, 6, 'rgba(0,0,0,.08)');
    s += rect(hx + hw * 0.43, gy - 56, hw * 0.16, 56, p.wood, 2) + el(hx + hw * 0.56, gy - 28, 2, 2, '#FFC145');
    for (const wx of [0.1, 0.7]) {
      s += el(hx + hw * (wx + 0.1), gy - 52, 30, 26, `url(#gl${id})`);
      s += rect(hx + hw * wx, gy - 72, hw * 0.2, 40, '#FFD98A', 2) + line(hx + hw * (wx + 0.1), gy - 72, hx + hw * (wx + 0.1), gy - 32, p.textile, 2.5) + line(hx + hw * wx, gy - 56, hx + hw * (wx + 0.2), gy - 56, p.textile, 2.5);
    }
    s += rect(hx + hw * 0.4, hy - H * 0.11, hw * 0.2, 22, '#FFD98A', 2) + line(hx + hw * 0.5, hy - H * 0.11, hx + hw * 0.5, hy - H * 0.11 + 22, p.textile, 2.5);
    s += rect(0, gy, W, H - gy, p.leaf2) + rect(0, gy, W, 5, p.leaf);
    s += path(`M${n(hx + hw * 0.43)} ${n(gy)}h${n(hw * 0.16)}l${n(hw * 0.1)} ${n(H - gy)}h${n(-hw * 0.36)}z`, p.wall2);
    return s;
  },
  // коммерческое помещение: витрина с улицы
  shop(W, H, fy, p, id, time) {
    const gy = H * 0.84;
    let s = rect(0, 0, W, H, `url(#sk${id})`);
    s += rect(W * 0.06, H * 0.1, W * 0.88, gy - H * 0.1, p.wall);
    for (let i = 0; i < 5; i++) s += rect(W * (0.12 + i * 0.165), H * 0.15, W * 0.1, H * 0.14, i % 2 ? '#FFD98A' : p.soft, 2, i % 2 ? '' : ' opacity=".55"');
    s += rect(W * 0.06, H * 0.36, W * 0.88, H * 0.1, p.soft2);
    for (let i = 0; i < 11; i++) s += path(`M${n(W * 0.06 + (W * 0.88 / 11) * i)} ${n(H * 0.46)}h${n(W * 0.08)}l${n(-W * 0.012)} ${n(H * 0.06)}h${n(-W * 0.056)}z`, i % 2 ? p.textile : p.accent);
    s += el(W * 0.34, H * 0.66, 90, 50, `url(#gl${id})`);
    s += rect(W * 0.12, H * 0.54, W * 0.44, gy - H * 0.54 - 8, '#FFE3A1', 3, ' opacity=".92"');
    s += line(W * 0.34, H * 0.54, W * 0.34, gy - 8, p.soft2, 3);
    s += rect(W * 0.64, H * 0.54, W * 0.22, gy - H * 0.54, p.soft2, 3) + rect(W * 0.67, H * 0.58, W * 0.16, gy - H * 0.66, '#FFD98A', 2, ' opacity=".8"') + rect(W * 0.81, H * 0.7, 3, 14, p.textile, 1.5);
    s += plant(W * 0.18, gy - 8, 0.9, p) + plant(W * 0.5, gy - 8, 0.7, p);
    s += rect(0, gy, W, H - gy, '#3A4658') + rect(0, gy, W, 4, '#566477');
    return s;
  },
};

/**
 * Иллюстрация комнаты для карточки объекта.
 * @param {string} scene living | bedroom | kitchen | studio | hall | house | shop
 * @param {object} o { palette, time: 'dusk' | 'day', seed, flip }
 */
export function roomArt(scene = 'living', { palette, time = 'dusk', seed = 1, flip = false, W = 400, H = 300, floor = 0.74, cls = 'art', label = '' } = {}) {
  const h = hash(`${scene}${seed}`);
  const p = PALETTES[palette] || PALETTES[PAL_KEYS[h % PAL_KEYS.length]];
  const id = `${h % 9973}`;
  const fy = floor >= 1 ? H : H * floor;
  const body = (SCENES[scene] || SCENES.living)(W, H, fy, p, +id, time, flip);
  return `<svg class="${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label || 'Иллюстрация интерьера'}">${defs(id, time)}${body}</svg>`;
}

/** Стена для демо 3D-тура: та же иллюстрация без пола, пропорции 5:3. */
export function wallArt(scene, palette, seed, flip = false) {
  return roomArt(scene, { palette, seed, flip, W: 500, H: 300, floor: 1, cls: 'wall-art', time: 'dusk' }).replace('role="img"', 'aria-hidden="true"').replace(/ aria-label="[^"]*"/, '').replace('xMidYMid slice', 'none');
}

export function palettePick(seed) {
  return PAL_KEYS[hash(seed) % PAL_KEYS.length];
}
export const paletteColors = (key) => PALETTES[key] || PALETTES.blue;

// ── Планировки ──────────────────────────────────────────────────────────────
// Комнаты задаются прямоугольниками на сетке. dir у дверей и окон:
// 'h' лежит на горизонтальной стене, 'v' на вертикальной.
export const PLANS = {
  studio: {
    W: 300, H: 200,
    rooms: [
      { k: 'living', name: 'Студия', x: 0, y: 0, w: 200, h: 200 },
      { k: 'hall', name: 'Холл', x: 200, y: 0, w: 100, h: 100 },
      { k: 'bath', name: 'Санузел', x: 200, y: 100, w: 100, h: 100 },
    ],
    doors: [{ x: 200, y: 30, dir: 'v', len: 34 }, { x: 240, y: 100, dir: 'h', len: 30 }, { x: 300, y: 36, dir: 'v', len: 34, entry: true }],
    windows: [{ x: 30, y: 0, dir: 'h', len: 70 }, { x: 0, y: 70, dir: 'v', len: 70 }],
  },
  one: {
    W: 340, H: 220,
    rooms: [
      { k: 'living', name: 'Комната', x: 0, y: 0, w: 190, h: 220 },
      { k: 'kitchen', name: 'Кухня', x: 190, y: 0, w: 150, h: 120 },
      { k: 'hall', name: 'Холл', x: 190, y: 120, w: 80, h: 100 },
      { k: 'bath', name: 'Санузел', x: 270, y: 120, w: 70, h: 100 },
    ],
    doors: [{ x: 190, y: 150, dir: 'v', len: 34 }, { x: 210, y: 120, dir: 'h', len: 34 }, { x: 270, y: 150, dir: 'v', len: 30 }, { x: 215, y: 220, dir: 'h', len: 34, entry: true }],
    windows: [{ x: 50, y: 0, dir: 'h', len: 90 }, { x: 230, y: 0, dir: 'h', len: 70 }],
  },
  two: {
    W: 380, H: 250,
    rooms: [
      { k: 'living', name: 'Гостиная', x: 0, y: 0, w: 210, h: 140 },
      { k: 'kitchen', name: 'Кухня', x: 210, y: 0, w: 170, h: 140 },
      { k: 'bedroom', name: 'Спальня', x: 0, y: 140, w: 170, h: 110 },
      { k: 'hall', name: 'Холл', x: 170, y: 140, w: 120, h: 110 },
      { k: 'bath', name: 'Санузел', x: 290, y: 140, w: 90, h: 110 },
    ],
    doors: [{ x: 180, y: 140, dir: 'h', len: 26 }, { x: 222, y: 140, dir: 'h', len: 34 }, { x: 170, y: 180, dir: 'v', len: 34 }, { x: 290, y: 176, dir: 'v', len: 30 }, { x: 214, y: 250, dir: 'h', len: 36, entry: true }],
    windows: [{ x: 50, y: 0, dir: 'h', len: 100 }, { x: 255, y: 0, dir: 'h', len: 80 }, { x: 0, y: 170, dir: 'v', len: 56 }],
  },
  three: {
    W: 420, H: 270,
    rooms: [
      { k: 'living', name: 'Гостиная', x: 0, y: 0, w: 200, h: 150 },
      { k: 'kitchen', name: 'Кухня', x: 200, y: 0, w: 120, h: 150 },
      { k: 'kids', name: 'Детская', x: 320, y: 0, w: 100, h: 150 },
      { k: 'bedroom', name: 'Спальня', x: 0, y: 150, w: 160, h: 120 },
      { k: 'hall', name: 'Холл', x: 160, y: 150, w: 170, h: 120 },
      { k: 'bath', name: 'Санузел', x: 330, y: 150, w: 90, h: 120 },
    ],
    doors: [{ x: 166, y: 150, dir: 'h', len: 26 }, { x: 230, y: 150, dir: 'h', len: 34 }, { x: 322, y: 150, dir: 'h', len: 0 }, { x: 160, y: 196, dir: 'v', len: 34 }, { x: 330, y: 190, dir: 'v', len: 30 }, { x: 226, y: 270, dir: 'h', len: 36, entry: true }, { x: 320, y: 100, dir: 'v', len: 30 }],
    windows: [{ x: 50, y: 0, dir: 'h', len: 100 }, { x: 228, y: 0, dir: 'h', len: 64 }, { x: 345, y: 0, dir: 'h', len: 50 }, { x: 0, y: 182, dir: 'v', len: 56 }],
  },
};

export function planSvg(kind = 'two', { cls = 'plan', labels = true, areas = null, interactive = false } = {}) {
  const pl = PLANS[kind] || PLANS.two;
  const pad = 14;
  let s = '';
  for (const r of pl.rooms) {
    s += `<rect class="plan__room" data-room="${r.k}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"${interactive ? ' tabindex="-1"' : ''}/>`;
  }
  // внутренние стены
  for (const r of pl.rooms) s += `<rect class="plan__wall-in" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`;
  s += `<rect class="plan__wall" x="0" y="0" width="${pl.W}" height="${pl.H}"/>`;
  for (const w of pl.windows) {
    s += w.dir === 'h'
      ? `<line class="plan__gap" x1="${w.x}" y1="${w.y}" x2="${w.x + w.len}" y2="${w.y}"/><line class="plan__win" x1="${w.x}" y1="${w.y}" x2="${w.x + w.len}" y2="${w.y}"/>`
      : `<line class="plan__gap" x1="${w.x}" y1="${w.y}" x2="${w.x}" y2="${w.y + w.len}"/><line class="plan__win" x1="${w.x}" y1="${w.y}" x2="${w.x}" y2="${w.y + w.len}"/>`;
  }
  for (const d of pl.doors) {
    if (!d.len) continue;
    if (d.dir === 'h') {
      s += `<line class="plan__gap" x1="${d.x}" y1="${d.y}" x2="${d.x + d.len}" y2="${d.y}"/>`;
      s += `<path class="plan__door" d="M${d.x} ${d.y}v${-d.len * 0.9}a${d.len * 0.9} ${d.len * 0.9} 0 0 1 ${d.len * 0.9} ${d.len * 0.9}"/>`;
    } else {
      s += `<line class="plan__gap" x1="${d.x}" y1="${d.y}" x2="${d.x}" y2="${d.y + d.len}"/>`;
      s += `<path class="plan__door" d="M${d.x} ${d.y}h${-d.len * 0.9}a${d.len * 0.9} ${d.len * 0.9} 0 0 0 ${d.len * 0.9} ${d.len * 0.9}"/>`;
    }
  }
  if (labels) {
    for (const r of pl.rooms) {
      const a = areas?.[r.k];
      const small = r.w < 100 || r.h < 100;
      s += `<text class="plan__label${small ? ' plan__label--sm' : ''}" x="${r.x + r.w / 2}" y="${r.y + r.h / 2 - (a ? 3 : -4)}" text-anchor="middle">${r.name}</text>`;
      if (a) s += `<text class="plan__area" x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 13}" text-anchor="middle">${String(a).replace('.', ',')} м²</text>`;
    }
  }
  return `<svg class="${cls}" viewBox="${-pad} ${-pad} ${pl.W + pad * 2} ${pl.H + pad * 2}" role="img" aria-label="Планировка">${s}</svg>`;
}

// ── Знак логотипа: окно из четырёх створок, одна горит ──────────────────────
export function logoMark({ size = 32, lit = 1, cls = 'logo__mark' } = {}) {
  const panes = [[5.5, 5.5], [17.5, 5.5], [5.5, 17.5], [17.5, 17.5]];
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true"><rect class="logo__frame" x="1" y="1" width="30" height="30" rx="8"/>${panes
    .map(([x, y], i) => `<rect class="logo__pane${i === lit ? ' is-lit' : ''}" x="${x}" y="${y}" width="9" height="9" rx="2.2"/>`)
    .join('')}</svg>`;
}
