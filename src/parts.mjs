// Общие крупные элементы: карта сокровищ, жетон, планы зон, рамки.
import { C, SYMBOLS, palm, wave, pineapple, hibiscus, coconut, parrot, chest, monstera, frond, sun, shell } from './art.mjs';

const inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
// Вставить иконку внутрь другого SVG: x, y, размер (в единицах родителя)
export const place = (art, x, y, size, extra = '') =>
  `<g transform="translate(${x} ${y}) scale(${size / 100}) ${extra}">${inner(art)}</g>`;

// ── Карта сокровищ (A4, единицы — мм) ──
// Круги станций рассчитаны под жетоны диаметром 52 мм.
export const MAP_STOPS = [
  { x: 52, y: 228 }, // PALM
  { x: 152, y: 196 }, // WAVE
  { x: 58, y: 152 }, // PINEAPPLE
  { x: 154, y: 112 }, // FLOWER
  { x: 62, y: 76 }, // COCONUT
];
export const MAP_START = { x: 150, y: 262 };
export const MAP_TREASURE = { x: 160, y: 46 };

export function treasureMap({ withTitle = true, slots = true } = {}) {
  const R = 29; // радиус круга (мм) — жетон 52 мм ложится внутрь
  const pts = [MAP_START, ...MAP_STOPS, MAP_TREASURE];
  let path = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    path += ` Q${mx + (i % 2 ? -22 : 22)} ${my + 8} ${b.x} ${b.y}`;
  }
  const stops = MAP_STOPS.map((p, i) => {
    const s = SYMBOLS[i];
    return `
      <circle cx="${p.x}" cy="${p.y}" r="${R + 3}" fill="#fff" opacity=".9"/>
      <circle cx="${p.x}" cy="${p.y}" r="${R}" fill="#fff" stroke="${s.color}" stroke-width="1.4" stroke-dasharray="${slots ? '3 2' : '0'}"/>
      <g opacity=".22">${place(s.art(), p.x - 17, p.y - 19, 34)}</g>
      <rect x="${p.x - 20}" y="${p.y + R - 4}" width="40" height="9" rx="4.5" fill="${s.color}"/>
      <text x="${p.x}" y="${p.y + R + 2.2}" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="4.6" fill="#fff">${i + 1}. ${s.en}</text>
      <text x="${p.x}" y="${p.y + 12}" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="3.3" fill="${C.ink}" opacity=".7">положите жетон</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" class="art map">
    <defs>
      <radialGradient id="mapsea" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#E3F7F4"/><stop offset="1" stop-color="#A9E4DC"/></radialGradient>
    </defs>
    <rect x="0" y="0" width="210" height="297" fill="url(#mapsea)"/>
    <path d="M22 286 C4 240 10 190 20 150 C28 110 10 74 30 46 C50 20 96 30 128 22 C160 14 196 26 198 66 C200 104 186 128 192 168 C198 208 204 250 184 278 C160 300 60 300 22 286Z" fill="${C.sand}"/>
    <path d="M22 286 C4 240 10 190 20 150 C28 110 10 74 30 46 C50 20 96 30 128 22 C160 14 196 26 198 66 C200 104 186 128 192 168 C198 208 204 250 184 278 C160 300 60 300 22 286Z" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="1 3.5" stroke-linecap="round"/>
    ${place(frond(C.leafLight, C.leaf), -6, 168, 34, 'rotate(-10 50 50)')}
    ${place(monstera(C.leaf, C.leafLight), 176, 220, 30, 'rotate(160 50 50)')}
    ${place(palm(), 102, 228, 30)}
    ${place(palm(), 98, 132, 26)}
    ${place(sun(), 4, 8, 26)}
    ${place(shell(), 112, 74, 14)}
    ${place(shell(C.pine, C.pineDark), 30, 192, 11)}
    <path d="${path}" fill="none" stroke="${C.coralDark}" stroke-width="1.6" stroke-dasharray="3.2 2.6" stroke-linecap="round"/>
    ${stops}
    <g>
      <circle cx="${MAP_START.x}" cy="${MAP_START.y}" r="10" fill="${C.ocean}"/>
      <text x="${MAP_START.x}" y="${MAP_START.y + 1.6}" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="4.4" fill="#fff">START</text>
    </g>
    <g>
      ${place(chest(), MAP_TREASURE.x - 22, MAP_TREASURE.y - 26, 44)}
      <path d="M${MAP_TREASURE.x - 30} ${MAP_TREASURE.y + 18} l8 8 m0 -8 l-8 8" stroke="${C.red}" stroke-width="2.4" stroke-linecap="round"/>
      <text x="${MAP_TREASURE.x}" y="${MAP_TREASURE.y + 26}" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="5.2" fill="${C.woodDark}">TREASURE</text>
    </g>
    ${withTitle ? `
    <text x="105" y="21" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="10" fill="${C.ocean}">THE LOST TREASURE</text>
    <text x="105" y="30" text-anchor="middle" font-family="Pacifico" font-size="7" fill="${C.coral}">Карта потерянного сокровища</text>` : ''}
  </svg>`;
}

// ── Жетон-медаль (лицевая сторона) ──
export function tokenFront(s, d = 52) {
  return `<div class="token" style="--c:${s.color};width:${d}mm;height:${d}mm">
    <div class="token-art">${s.art()}</div>
    <div class="token-name">${s.en}</div>
    <div class="token-ru">символ получен!</div>
  </div>`;
}
export function tokenBack(s, d = 52) {
  return `<div class="token back" style="--c:${s.color};width:${d}mm;height:${d}mm">
    <div class="token-letter">${s.letter}</div>
    <div class="token-code"><span></span>цифра кода</div>
  </div>`;
}

// ── План квартиры (HOME EDITION) ──
export function homePlan() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 112" class="art plan">
    <rect x="4" y="4" width="172" height="104" rx="3" fill="#FAFCFC" stroke="${C.ink}" stroke-width="2"/>
    <path d="M74 108 L96 108" stroke="#FAFCFC" stroke-width="3"/>
    <path d="M74 108 A22 22 0 0 1 96 86" fill="none" stroke="${C.ink}" stroke-width=".8" stroke-dasharray="2 1.5"/>
    <text x="85" y="104" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="4" fill="${C.ink}">вход</text>
    <rect x="10" y="10" width="46" height="34" rx="3" fill="#FDE1E7"/>
    <text x="33" y="25" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="5" fill="${C.coralDark}">PHOTO</text>
    <text x="33" y="32" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="5" fill="${C.coralDark}">ZONE</text>
    <rect x="62" y="10" width="72" height="72" rx="36" fill="#D9F3EF"/>
    <text x="98" y="44" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="6" fill="${C.ocean}">PARTY ZONE</text>
    <text x="98" y="52" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="4.2" fill="${C.ocean}">свободный пол от 3×3 м</text>
    <rect x="140" y="10" width="30" height="62" rx="3" fill="#FFF0C9"/>
    <text x="155" y="38" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="5" fill="${C.pineDark}">FOOD</text>
    <text x="155" y="45" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="5" fill="${C.pineDark}">BAR</text>
    <rect x="10" y="80" width="40" height="22" rx="3" fill="#E9EEF0"/>
    <text x="30" y="93" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="4.2" fill="#7B8B93">диван к стене</text>
    <rect x="140" y="80" width="30" height="22" rx="3" fill="#E4F4EA"/>
    <text x="155" y="90" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="4" fill="${C.leafDark}">сундук +</text>
    <text x="155" y="95" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="4" fill="${C.leafDark}">подарки</text>
  </svg>`;
}

// ── План двора (GARDEN EDITION) ──
export function gardenPlan() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 112" class="art plan">
    <rect x="4" y="4" width="172" height="104" rx="6" fill="#E3F2DF" stroke="${C.leafDark}" stroke-width="1.6"/>
    <rect x="58" y="4" width="64" height="16" fill="#E7E2DA" stroke="#9C8F80" stroke-width="1"/>
    <text x="90" y="14" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="4.4" fill="#6E6257">дом / веранда</text>
    <rect x="10" y="26" width="44" height="26" rx="3" fill="#FFF0C9"/>
    <text x="32" y="37" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="4.6" fill="${C.pineDark}">3 · FOOD BAR</text>
    <text x="32" y="44" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="3.8" fill="${C.pineDark}">в тени, у дома</text>
    <ellipse cx="96" cy="60" rx="34" ry="26" fill="#CDEFE9"/>
    <text x="96" y="58" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="5.4" fill="${C.ocean}">4 · GAME ZONE</text>
    <text x="96" y="65" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="3.8" fill="${C.ocean}">ровный газон, без препятствий</text>
    <rect x="138" y="26" width="32" height="30" rx="3" fill="#EDE3F7"/>
    <text x="154" y="39" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="4.4" fill="#6B4A9A">5 · CHILL</text>
    <text x="154" y="46" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="3.6" fill="#6B4A9A">пледы, подушки</text>
    <rect x="10" y="62" width="34" height="24" rx="3" fill="#FDE1E7"/>
    <text x="27" y="73" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="4.4" fill="${C.coralDark}">2 · PHOTO</text>
    <text x="27" y="80" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="3.6" fill="${C.coralDark}">спиной к солнцу</text>
    <rect x="140" y="64" width="30" height="22" rx="3" fill="#F1E1D4" stroke="${C.red}" stroke-width=".8" stroke-dasharray="2 1.4"/>
    <text x="155" y="74" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="3.8" fill="${C.red}">гриль</text>
    <text x="155" y="80" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="3.4" fill="${C.red}">только взрослые</text>
    <rect x="72" y="96" width="36" height="12" rx="2" fill="#fff" stroke="${C.ocean}" stroke-width="1"/>
    <text x="90" y="104" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="4.2" fill="${C.ocean}">1 · ENTRANCE</text>
  </svg>`;
}

// ── Декоративная тропическая рамка для дипломов и постеров ──
export function tropicalCorners(scale = 1) {
  const s = (v) => v * scale;
  return `
    <div class="corner tl" style="width:${s(62)}mm;height:${s(62)}mm;left:${s(-14)}mm;top:${s(-16)}mm;transform:rotate(150deg)">${monstera()}</div>
    <div class="corner tl2" style="width:${s(52)}mm;height:${s(52)}mm;left:${s(16)}mm;top:${s(-20)}mm;transform:rotate(110deg)">${frond(C.leafLight, C.leaf)}</div>
    <div class="corner tr" style="width:${s(34)}mm;height:${s(34)}mm;right:${s(4)}mm;top:${s(4)}mm">${hibiscus()}</div>
    <div class="corner br" style="width:${s(64)}mm;height:${s(64)}mm;right:${s(-16)}mm;bottom:${s(-14)}mm;transform:rotate(-30deg)">${monstera(C.leafDark, C.leaf)}</div>
    <div class="corner br2" style="width:${s(50)}mm;height:${s(50)}mm;right:${s(30)}mm;bottom:${s(-22)}mm;transform:rotate(-80deg)">${frond()}</div>
    <div class="corner bl" style="width:${s(30)}mm;height:${s(30)}mm;left:${s(6)}mm;bottom:${s(6)}mm">${pineapple()}</div>`;
}

export { inner };
