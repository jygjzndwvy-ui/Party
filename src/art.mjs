// TROPICAL QUEST — авторские SVG-иллюстрации набора.
// Все иконки нарисованы в системе координат 0..100 и возвращаются строкой <svg>,
// чтобы их можно было вставлять прямо в HTML и перекрашивать в режиме раскраски.

let uid = 0;
const nid = (p) => `${p}${++uid}`;

export const C = {
  ocean: '#0B6E7F',
  oceanDeep: '#08505C',
  lagoon: '#2EC4B6',
  aqua: '#BFEDE6',
  coral: '#F25C78',
  coralDark: '#C93A5A',
  pine: '#FFBF3F',
  pineDark: '#E8961E',
  leaf: '#2A9D5C',
  leafDark: '#1E7045',
  leafLight: '#5CC27F',
  sand: '#FFE7B8',
  sandDark: '#F2CB85',
  wood: '#A2643A',
  woodDark: '#6E3F20',
  red: '#E8433B',
  blue: '#2E86DE',
  orange: '#FF8A3D',
  pink: '#FF8FAB',
  ink: '#183A4A',
  cream: '#FFF8EC',
  white: '#FFFFFF',
};

const svg = (vb, body, cls = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="art ${cls}" aria-hidden="true">${body}</svg>`;

// ───────────────────────── ПЯТЬ СИМВОЛОВ ОСТРОВА ─────────────────────────

export function palm() {
  return svg('0 0 100 100', `
    <ellipse cx="50" cy="92" rx="36" ry="6.5" fill="${C.sand}"/>
    <path d="M44 92 C47 74 51 58 56 42 L62.5 43 C58.5 58 56 74 55.5 92Z" fill="${C.wood}"/>
    <g stroke="${C.woodDark}" stroke-width="1.6" stroke-linecap="round" opacity=".55">
      <path d="M46 84 L55 85"/><path d="M47.5 76 L56 77"/><path d="M49.5 68 L57 69"/>
      <path d="M51.5 60 L58 61"/><path d="M53.5 52 L59.5 53"/>
    </g>
    <g fill="${C.leaf}">
      <path d="M59 40 C47 27 30 27 13 41 C28 35 44 36 59 44Z"/>
      <path d="M59 40 C72 27 89 29 97 45 C84 36 72 37 59 44Z"/>
      <path d="M59 41 C51 47 42 57 38 71 C46 60 53 52 60 45Z"/>
      <path d="M59 41 C67 48 74 57 76 71 C70 60 64 52 58 45Z"/>
    </g>
    <g fill="${C.leafDark}">
      <path d="M59 41 C52 24 40 14 23 13 C38 20 49 30 58 44Z"/>
      <path d="M59 41 C66 24 78 15 93 17 C80 22 69 31 60 44Z"/>
    </g>
    <circle cx="55.5" cy="45.5" r="4.2" fill="${C.woodDark}"/>
    <circle cx="63" cy="45.5" r="4.2" fill="${C.woodDark}"/>
    <circle cx="59.3" cy="50.5" r="4.2" fill="${C.wood}"/>
  `);
}

export function wave() {
  return svg('0 0 100 100', `
    <path d="M3 80 C9 58 22 38 42 29 C60 21 81 26 88 42 C93 53 86 63 75 62 C66 61 62 52 68 47 C60 45 54 53 56 62 C58 72 70 78 97 76 L97 93 L3 93Z" fill="${C.lagoon}"/>
    <path d="M3 80 C9 58 22 38 42 29 C52 25 62 24 70 26 C54 29 40 39 32 53 C25 66 23 79 30 93 L3 93Z" fill="${C.ocean}"/>
    <path d="M44 28.5 C61 21 81 26 88 42 C93 53 86 63 75 62 C82 57 84 47 76 39 C68 31.5 55 29.5 44 28.5Z" fill="#fff" opacity=".6"/>
    <circle cx="89" cy="29" r="2.8" fill="${C.lagoon}"/>
    <circle cx="94.5" cy="36" r="2" fill="${C.lagoon}"/>
    <circle cx="83" cy="22.5" r="1.8" fill="${C.lagoon}"/>
    <path d="M3 91 C15 85 27 85 39 91 C51 97 63 97 75 91 C85 86 92 86 97 88 L97 97 L3 97Z" fill="${C.oceanDeep}"/>
  `);
}

export function pineapple() {
  const cp = nid('pc');
  let lines = '';
  for (let k = -66; k <= 66; k += 9) {
    lines += `<line x1="${28 + k}" y1="40" x2="${88 + k}" y2="100"/><line x1="${72 - k}" y1="40" x2="${12 - k}" y2="100"/>`;
  }
  return svg('0 0 100 100', `
    <defs><clipPath id="${cp}"><ellipse cx="50" cy="70" rx="22" ry="26"/></clipPath></defs>
    <g fill="${C.leafDark}">
      <path d="M50 47 C40 41 29 37 18 36 C29 31 42 35 50 43Z"/>
      <path d="M50 47 C60 41 71 37 82 36 C71 31 58 35 50 43Z"/>
    </g>
    <g fill="${C.leaf}">
      <path d="M50 47 C42 35 36 24 29 13 C40 19 47 30 52 43Z"/>
      <path d="M50 47 C58 35 64 24 71 13 C60 19 53 30 48 43Z"/>
    </g>
    <path d="M50 47 C45.5 32 46 17 50 3 C54 17 54.5 32 50 47Z" fill="${C.leafLight}"/>
    <ellipse cx="50" cy="70" rx="22" ry="26" fill="${C.pine}"/>
    <g clip-path="url(#${cp})" stroke="${C.pineDark}" stroke-width="2.2" stroke-linecap="round">${lines}</g>
    <ellipse cx="50" cy="70" rx="22" ry="26" fill="none" stroke="${C.pineDark}" stroke-width="2"/>
    <ellipse cx="41" cy="61" rx="4" ry="8" fill="#fff" opacity=".35" class="hl"/>
  `);
}

export function hibiscus(color = C.coral, dark = C.coralDark) {
  const petal = 'M50 50 C35 42 29 20 43 11.5 C47.5 9.5 52.5 9.5 57 11.5 C71 20 65 42 50 50Z';
  let petals = '';
  let veins = '';
  for (let i = 0; i < 5; i++) {
    petals += `<path d="${petal}" transform="rotate(${i * 72 + 12} 50 50)"/>`;
    veins += `<path d="M50 50 L50 20" transform="rotate(${i * 72 + 12} 50 50)"/>`;
  }
  return svg('0 0 100 100', `
    <g fill="${color}">${petals}</g>
    <g stroke="${dark}" stroke-width="1.5" opacity=".5" stroke-linecap="round" fill="none">${veins}</g>
    <circle cx="50" cy="50" r="10.5" fill="${dark}"/>
    <path d="M50 50 C56 42 62 34 68 26" stroke="${C.pine}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <g fill="${C.pine}"><circle cx="69.5" cy="24" r="3.2"/><circle cx="64" cy="26.5" r="2.1"/><circle cx="72.5" cy="29.5" r="2.1"/><circle cx="66" cy="20.5" r="2.1"/></g>
  `);
}

export function coconut() {
  return svg('0 0 100 100', `
    <path d="M58 32 C64 18 78 10 94 11 C83 17 74 24 67 35Z" fill="${C.leaf}"/>
    <path d="M60 33 C70 26 82 26 92 32 C80 31 72 33 64 37Z" fill="${C.leafDark}"/>
    <circle cx="41" cy="50" r="28" fill="${C.woodDark}"/>
    <g stroke="#4F2A12" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".75">
      <path d="M22 41 C26 37 30 36 34 37"/><path d="M20 55 C24 51 28 51 32 52"/>
      <path d="M45 27 C49 25 53 26 56 29"/><path d="M26 68 C30 66 34 66 37 68"/>
    </g>
    <circle cx="35" cy="34" r="2.8" fill="#3B1F0D"/><circle cx="43.5" cy="32" r="2.8" fill="#3B1F0D"/><circle cx="39.5" cy="39.5" r="2.8" fill="#3B1F0D"/>
    <circle cx="64" cy="67" r="25" fill="${C.wood}"/>
    <circle cx="64" cy="67" r="20" fill="${C.cream}"/>
    <circle cx="64" cy="67" r="14" fill="#fff"/>
    <path d="M53 61 C55 56.5 59 54.5 64 54.5" stroke="${C.sandDark}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  `);
}

// ───────────────────────── ПЕРСОНАЖИ И ПРЕДМЕТЫ ─────────────────────────

export function parrot() {
  return svg('0 0 100 100', `
    <path d="M41 76 C37 86 34 93 29 99 C38 96 45 89 47 80Z" fill="${C.ocean}"/>
    <path d="M47 79 C47 89 47 95 45 100 C53 95 55 88 54 79Z" fill="${C.blue}"/>
    <path d="M52 79 C55 87 58 92 63 96 C62 88 60 83 57 77Z" fill="${C.pine}"/>
    <ellipse cx="50" cy="60" rx="20" ry="24" fill="${C.red}"/>
    <ellipse cx="55.5" cy="66" rx="11" ry="15.5" fill="${C.orange}"/>
    <path d="M32 48 C23 61 27 78 42 84 C37.5 72 37.5 60 40 49Z" fill="${C.blue}"/>
    <path d="M31.5 55 C28.5 63 30.5 72 36 78 C35 70 35 62 37 54.5Z" fill="${C.pine}"/>
    <path d="M44 21 C41 13 45 6 50 3 C49 10 50 15 53 18.5Z" fill="${C.red}"/>
    <path d="M50 19 C52 10.5 58 6 63 6 C59.5 11 57.5 15.5 56.5 20Z" fill="${C.pine}"/>
    <circle cx="52" cy="34" r="17.5" fill="${C.red}"/>
    <ellipse cx="58.5" cy="31.5" rx="7.8" ry="8.8" fill="#fff"/>
    <circle cx="60" cy="32" r="4.2" fill="${C.ink}"/><circle cx="61.6" cy="30.4" r="1.5" fill="#fff"/>
    <path d="M64.5 36 C75 33.5 79.5 44 73 50.5 C72 45.5 70 43.2 64.5 43.2Z" fill="#F5E6C8"/>
    <path d="M64.5 43.2 C68.5 43.2 70.5 45 70.7 47.3 C67.5 47.4 65.5 46.3 64.5 45Z" fill="#3A3A3A"/>
    <circle cx="47" cy="40.5" r="3.6" fill="${C.pink}" opacity=".85"/>
    <path d="M24 86.5 L80 86.5" stroke="${C.wood}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M70 86.5 C74 82 78 81 82 82" stroke="${C.leaf}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <g fill="#8A8A8A"><ellipse cx="45" cy="85" rx="4.2" ry="2.5"/><ellipse cx="56" cy="85" rx="4.2" ry="2.5"/></g>
  `);
}

export function chest() {
  const cp = nid('cc');
  return svg('0 0 100 100', `
    <defs><clipPath id="${cp}"><path d="M16 50 L16 40 C16 24 84 24 84 40 L84 88 L16 88Z"/></clipPath></defs>
    <rect x="16" y="48" width="68" height="40" rx="4" fill="${C.wood}"/>
    <path d="M16 50 L16 40 C16 24 84 24 84 40 L84 50Z" fill="${C.woodDark}"/>
    <g stroke="#7A4524" stroke-width="1.3" opacity=".55"><path d="M16 63 H84"/><path d="M16 76 H84"/></g>
    <g fill="${C.pine}" clip-path="url(#${cp})">
      <rect x="25" y="20" width="7.5" height="70"/><rect x="67.5" y="20" width="7.5" height="70"/>
    </g>
    <rect x="13.5" y="46" width="73" height="6.5" rx="2.5" fill="${C.pine}"/>
    <rect x="42.5" y="43.5" width="15" height="17" rx="3" fill="${C.pine}" stroke="${C.pineDark}" stroke-width="1.2"/>
    <circle cx="50" cy="50.5" r="2.7" fill="${C.ink}"/><path d="M48.8 51.5 L47.8 57 L52.2 57 L51.2 51.5Z" fill="${C.ink}"/>
    <g fill="${C.pine}">
      <path d="M87 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>
      <path d="M11 14 l1.5 3.8 3.8 1.5 -3.8 1.5 -1.5 3.8 -1.5 -3.8 -3.8 -1.5 3.8 -1.5z"/>
      <path d="M50 4 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2z"/>
    </g>
  `);
}

export function monstera(color = C.leaf, vein = C.leafLight) {
  const m = nid('mm');
  const slits = [[30, 20], [43, 40], [57, 62], [71, 84]];
  let cuts = '';
  for (const [y, oy] of slits) {
    cuts += `<path d="M43 ${y - 0.9} L43 ${y + 0.9} L-6 ${oy + 5} L-6 ${oy - 5}Z"/>`;
    cuts += `<path d="M57 ${y - 0.9} L57 ${y + 0.9} L106 ${oy + 5} L106 ${oy - 5}Z"/>`;
  }
  return svg('0 0 100 100', `
    <defs><mask id="${m}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <path d="M50 97 C22 89 3 67 4 41 C5 19 26 5 46 11 L50 15 L54 11 C74 5 95 19 96 41 C97 67 78 89 50 97Z" fill="#fff"/>
      <g fill="#000">${cuts}
        <ellipse cx="36" cy="50" rx="2.2" ry="4" transform="rotate(-50 36 50)"/><ellipse cx="64" cy="50" rx="2.2" ry="4" transform="rotate(50 64 50)"/>
        <ellipse cx="38" cy="66" rx="2" ry="3.6" transform="rotate(-50 38 66)"/><ellipse cx="62" cy="66" rx="2" ry="3.6" transform="rotate(50 62 66)"/>
      </g>
    </mask></defs>
    <rect width="100" height="100" fill="${color}" mask="url(#${m})"/>
    <path d="M50 15 C50 40 50 70 50 95" stroke="${vein}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M50 15 C49 9 47 5 44 1" stroke="${color}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  `);
}

export function frond(color = C.leaf, stem = C.leafDark) {
  const P = (t) => {
    const a = (1 - t) ** 2, b = 2 * (1 - t) * t, c = t * t;
    return [a * 8 + b * 22 + c * 94, a * 96 + b * 24 + c * 8];
  };
  let leaves = '';
  const n = 15;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1.2);
    const [x, y] = P(t);
    const [x2, y2] = P(t + 0.01);
    const ang = Math.atan2(y2 - y, x2 - x);
    const len = 30 * Math.sin(Math.PI * (0.15 + t * 0.8));
    for (const s of [1, -1]) {
      const a = ang + s * 1.0;
      const tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len;
      const mx = (x + tx) / 2, my = (y + ty) / 2;
      const px = -Math.sin(a) * 3.2, py = Math.cos(a) * 3.2;
      leaves += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${(mx + px).toFixed(1)} ${(my + py).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q${(mx - px).toFixed(1)} ${(my - py).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}Z"/>`;
    }
  }
  return svg('0 0 100 100', `
    <g fill="${color}">${leaves}</g>
    <path d="M8 96 Q22 24 94 8" stroke="${stem}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  `);
}

export function shell(color = C.pink, line = C.coralDark) {
  let ribs = '';
  for (let i = 0; i < 7; i++) {
    const a = (-60 + i * 20) * Math.PI / 180;
    ribs += `<path d="M50 82 L${(50 + Math.sin(a) * 38).toFixed(1)} ${(82 - Math.cos(a) * 52).toFixed(1)}"/>`;
  }
  return svg('0 0 100 100', `
    <path d="M38 84 L30 94 L70 94 L62 84Z" fill="${color}"/>
    <path d="M50 84 C20 84 8 62 12 44 C16 26 32 20 50 20 C68 20 84 26 88 44 C92 62 80 84 50 84Z" fill="${color}"/>
    <g stroke="${line}" stroke-width="2" stroke-linecap="round" opacity=".55" fill="none">${ribs}</g>
  `);
}

export function sun() {
  let rays = '';
  for (let i = 0; i < 12; i++) rays += `<path d="M50 6 L54 18 L46 18Z" transform="rotate(${i * 30} 50 50)"/>`;
  return svg('0 0 100 100', `
    <g fill="${C.pine}">${rays}</g>
    <circle cx="50" cy="50" r="25" fill="${C.pine}"/>
    <circle cx="50" cy="50" r="19" fill="#FFD36B"/>
  `);
}

export function crab() {
  return svg('0 0 100 100', `
    <g stroke="#D7372F" stroke-width="4.2" stroke-linecap="round" fill="none">
      <path d="M30 62 L15 69"/><path d="M31 68 L17 80"/><path d="M35 73 L26 87"/>
      <path d="M70 62 L85 69"/><path d="M69 68 L83 80"/><path d="M65 73 L74 87"/>
      <path d="M35 52 C26 46 22 40 21 32"/><path d="M65 52 C74 46 78 40 79 32"/>
      <path d="M42 47 L40 34"/><path d="M58 47 L60 34"/>
    </g>
    <path d="M20 27 L30 17 A11 11 0 1 0 31 31 Z" fill="${C.red}"/>
    <path d="M80 27 L70 17 A11 11 0 1 1 69 31 Z" fill="${C.red}"/>
    <ellipse cx="50" cy="60" rx="25" ry="17" fill="${C.red}"/>
    <ellipse cx="44" cy="54" rx="8" ry="4" fill="#fff" opacity=".25" class="hl"/>
    <circle cx="40" cy="31" r="6.5" fill="#fff"/><circle cx="41" cy="31.5" r="3.2" fill="${C.ink}"/>
    <circle cx="60" cy="31" r="6.5" fill="#fff"/><circle cx="59" cy="31.5" r="3.2" fill="${C.ink}"/>
    <path d="M43 64 Q50 70 57 64" stroke="${C.ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  `);
}

export function turtle() {
  return svg('0 0 100 100', `
    <g fill="${C.leafLight}">
      <ellipse cx="28" cy="72" rx="8" ry="6"/><ellipse cx="66" cy="72" rx="8" ry="6"/>
      <path d="M16 64 L6 66 L14 70Z"/>
      <circle cx="84" cy="52" r="11"/>
    </g>
    <circle cx="87" cy="49" r="2.6" fill="${C.ink}"/>
    <path d="M84 57 Q88 59 92 56" stroke="${C.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M14 66 C14 34 76 30 78 66Z" fill="${C.leafDark}"/>
    <g fill="${C.leaf}">
      <path d="M38 40 L50 36 L60 42 L58 54 L44 56 L35 50Z"/>
      <path d="M22 56 L32 52 L38 60 L34 66 L20 66Z"/>
      <path d="M62 56 L70 50 L76 60 L74 66 L62 66Z"/>
      <path d="M42 60 L56 58 L58 66 L40 66Z"/>
    </g>
    <rect x="12" y="64" width="68" height="6" rx="3" fill="${C.sandDark}"/>
  `);
}

export function monkey() {
  return svg('0 0 100 100', `
    <circle cx="20" cy="46" r="12" fill="${C.wood}"/><circle cx="80" cy="46" r="12" fill="${C.wood}"/>
    <circle cx="20" cy="46" r="6.5" fill="#F3C9A0"/><circle cx="80" cy="46" r="6.5" fill="#F3C9A0"/>
    <circle cx="50" cy="48" r="32" fill="${C.wood}"/>
    <path d="M50 30 C42 22 28 26 28 40 C28 46 31 50 34 53 C28 60 30 76 50 78 C70 76 72 60 66 53 C69 50 72 46 72 40 C72 26 58 22 50 30Z" fill="#F3C9A0"/>
    <circle cx="40" cy="42" r="4" fill="${C.ink}"/><circle cx="60" cy="42" r="4" fill="${C.ink}"/>
    <circle cx="41.3" cy="40.6" r="1.3" fill="#fff"/><circle cx="61.3" cy="40.6" r="1.3" fill="#fff"/>
    <ellipse cx="46" cy="56" rx="2" ry="1.4" fill="${C.woodDark}"/><ellipse cx="54" cy="56" rx="2" ry="1.4" fill="${C.woodDark}"/>
    <path d="M40 63 Q50 72 60 63" stroke="${C.woodDark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M44 18 C46 12 52 10 56 13 C52 14 49 16 48 20Z" fill="${C.woodDark}"/>
  `);
}

export function volcano() {
  return svg('0 0 100 100', `
    <g fill="#B9B4AE"><circle cx="40" cy="16" r="7"/><circle cx="50" cy="11" r="8"/><circle cx="61" cy="15" r="6.5"/></g>
    <g fill="${C.orange}"><circle cx="30" cy="24" r="2.3"/><circle cx="72" cy="22" r="2.6"/><circle cx="64" cy="28" r="1.8"/></g>
    <path d="M6 92 L36 34 L64 34 L94 92Z" fill="#7D5A4A"/>
    <path d="M6 92 L36 34 L46 34 L30 92Z" fill="#6A4A3C"/>
    <path d="M36 34 L64 34 L68 42 C64 46 62 40 58 46 C55 52 52 44 49 50 C46 56 44 46 40 48 C36 50 34 44 32 42Z" fill="${C.red}"/>
    <path d="M38 34 L62 34 L64 38 C60 40 58 36 55 40 C52 44 50 38 47 42 C44 45 42 39 39 40Z" fill="${C.orange}"/>
    <ellipse cx="50" cy="34" rx="14" ry="3.5" fill="${C.pine}"/>
    <path d="M2 92 L98 92" stroke="${C.leaf}" stroke-width="5" stroke-linecap="round"/>
  `);
}

export function shark() {
  return svg('0 0 100 100', `
    <path d="M30 70 C40 48 52 26 70 14 C66 34 68 54 76 70Z" fill="#7C93A3"/>
    <path d="M30 70 C40 48 52 26 70 14 C62 30 56 50 56 70Z" fill="#94AAB8"/>
    <path d="M4 70 C14 64 22 64 32 70 C42 76 50 76 60 70 C70 64 78 64 88 70 C92 72 95 72 96 71 L96 96 L4 96Z" fill="${C.lagoon}"/>
    <path d="M4 82 C14 76 22 76 32 82 C42 88 50 88 60 82 C70 76 78 76 88 82 L96 84 L96 96 L4 96Z" fill="${C.ocean}"/>
  `);
}

export function flamingo() {
  return svg('0 0 100 100', `
    <g stroke="#E88AA0" stroke-width="2.6" stroke-linecap="round" fill="none">
      <path d="M50 66 L50 96"/><path d="M54 66 L58 80 L46 84"/>
    </g>
    <path d="M58 22 C48 22 44 30 48 38 C52 46 58 50 54 58" stroke="${C.pink}" stroke-width="6.5" fill="none" stroke-linecap="round"/>
    <path d="M30 56 C30 44 46 42 60 48 C74 54 78 62 70 68 C62 74 40 74 34 66 C26 70 18 66 16 60 C22 62 27 60 30 56Z" fill="${C.pink}"/>
    <path d="M40 54 C48 52 56 56 60 62 C52 62 44 60 40 54Z" fill="${C.coral}" opacity=".6"/>
    <circle cx="60" cy="21" r="7.5" fill="${C.pink}"/>
    <circle cx="62" cy="19" r="1.8" fill="${C.ink}"/>
    <path d="M66 20 L76 23 C76 28 72 31 68 30 C69 27 68 25 66 24Z" fill="#fff"/>
    <path d="M73 22 L76 23 C76 28 72 31 68 30 C71 28 73 26 73 22Z" fill="${C.ink}"/>
  `);
}

export function surfboard() {
  return svg('0 0 100 100', `
    <g transform="rotate(35 50 50)">
      <ellipse cx="50" cy="50" rx="15" ry="46" fill="${C.coral}"/>
      <path d="M50 4 L50 96" stroke="#fff" stroke-width="3"/>
      <path d="M36.5 34 Q50 40 63.5 34 L64.5 44 Q50 50 35.5 44Z" fill="${C.pine}"/>
      <path d="M44 86 L50 96 L56 86Z" fill="${C.ocean}"/>
    </g>
  `);
}

export function sunglasses(color = C.coral) {
  return svg('0 0 200 80', `
    <path d="M10 18 L190 18" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
    <rect x="16" y="16" width="70" height="48" rx="20" fill="${color}"/>
    <rect x="114" y="16" width="70" height="48" rx="20" fill="${color}"/>
    <rect x="24" y="23" width="54" height="34" rx="14" fill="${C.ink}"/>
    <rect x="122" y="23" width="54" height="34" rx="14" fill="${C.ink}"/>
    <path d="M32 30 L46 30" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    <path d="M130 30 L144 30" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    <path d="M86 30 Q100 22 114 30" stroke="${color}" stroke-width="8" fill="none"/>
  `);
}

export function mustache() {
  return svg('0 0 200 80', `
    <path d="M100 30 C88 14 66 14 54 28 C44 40 30 46 10 38 C18 58 44 66 66 56 C80 50 92 44 100 40 C108 44 120 50 134 56 C156 66 182 58 190 38 C170 46 156 40 146 28 C134 14 112 14 100 30Z" fill="${C.woodDark}"/>
  `);
}

export function miniFlower(cx, cy, r, color = C.coral, center = C.pine) {
  let p = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180;
    p += `<circle cx="${(cx + Math.cos(a) * r * 0.55).toFixed(2)}" cy="${(cy + Math.sin(a) * r * 0.55).toFixed(2)}" r="${(r * 0.5).toFixed(2)}"/>`;
  }
  return `<g fill="${color}">${p}</g><circle cx="${cx}" cy="${cy}" r="${(r * 0.32).toFixed(2)}" fill="${center}"/>`;
}

export function lei() {
  const cols = [C.coral, C.pine, C.pink, C.lagoon, C.orange];
  let f = '';
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.05 + 0.9 * (i / (n - 1)));
    const x = 50 + Math.cos(a) * 40, y = 30 + Math.sin(a) * 52;
    f += miniFlower(+x.toFixed(1), +y.toFixed(1), 8, cols[i % cols.length], i % 2 ? C.white : C.pine);
  }
  return svg('0 0 100 100', `
    <path d="M10 32 C10 100 90 100 90 32" stroke="${C.leaf}" stroke-width="2" fill="none"/>
    ${f}
  `);
}

export function island() {
  return svg('0 0 100 100', `
    <ellipse cx="50" cy="80" rx="46" ry="12" fill="${C.aqua}"/>
    <path d="M14 80 C20 66 40 62 52 64 C66 66 80 70 86 80Z" fill="${C.sand}"/>
    <g transform="translate(26 6) scale(.6)">${palm().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
  `);
}

export function star(color = C.pine) {
  return svg('0 0 100 100', `<path d="M50 4 L62 36 L96 38 L69 59 L79 93 L50 73 L21 93 L31 59 L4 38 L38 36Z" fill="${color}"/>`);
}

export function scissors() {
  return svg('0 0 24 24', `<g fill="none" stroke="#7A8A92" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.2 7.8 L20 18"/><path d="M8.2 16.2 L20 6"/></g>`, 'scissors');
}

export const SYMBOLS = [
  { key: 'palm', en: 'PALM', ru: 'Пальма', letter: 'A', color: C.leaf, art: palm },
  { key: 'wave', en: 'WAVE', ru: 'Волна', letter: 'L', color: C.ocean, art: wave },
  { key: 'pineapple', en: 'PINEAPPLE', ru: 'Ананас', letter: 'O', color: C.pineDark, art: pineapple },
  { key: 'flower', en: 'FLOWER', ru: 'Цветок', letter: 'H', color: C.coral, art: () => hibiscus() },
  { key: 'coconut', en: 'COCONUT', ru: 'Кокос', letter: 'A', color: C.wood, art: coconut },
];

export const ART = {
  palm, wave, pineapple, hibiscus, coconut, parrot, chest, monstera, frond, shell, sun,
  crab, turtle, monkey, volcano, shark, flamingo, surfboard, sunglasses, mustache, lei, island, star,
};
