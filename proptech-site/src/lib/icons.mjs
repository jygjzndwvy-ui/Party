// Единый набор линейных иконок: сетка 24×24, толщина линии 1.75.
// Использование в шаблонах: ${icon('key')}
const P = {
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
  'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-right': '<path d="m9 6 6 6-6 6"/>',
  'chevron-left': '<path d="m15 6-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5c1.4-3.6 4.4-5.2 8-5.2s6.6 1.6 8 5.2"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.9-3.2 3.3-4.7 6.5-4.7s5.6 1.5 6.5 4.7M16 5.2a3.5 3.5 0 0 1 0 6.6M17.8 15.6c1.9.6 3.1 2.1 3.7 4.4"/>',
  phone: '<path d="M6.5 3.5h3l1.6 4.6-2.2 1.5a11.5 11.5 0 0 0 5.5 5.5l1.5-2.2 4.6 1.6v3a2.6 2.6 0 0 1-2.8 2.6C10.2 19.6 4.4 13.8 3.9 6.3A2.6 2.6 0 0 1 6.5 3.5z"/>',
  send: '<path d="M21 4 3 11l6 2.4M21 4l-3.2 15L9 13.4M21 4 9 13.4V19l3.2-3.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  key: '<circle cx="8" cy="15.5" r="4"/><path d="m11 12.5 9-9M16.5 7l2.5 2.5M13.8 9.7l2 2"/>',
  home: '<path d="m4 11 8-7 8 7M6 9.5V20h12V9.5M10 20v-6h4v6"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7.5h2M13 7.5h2M9 11.5h2M13 11.5h2M9 15.5h2M13 15.5h2"/>',
  door: '<path d="M6.5 21V4.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1V21M4 21h16M14 12.5h.01"/>',
  ruble: '<circle cx="12" cy="12" r="9"/><path d="M10 17V7.5h3a2.4 2.4 0 0 1 0 4.8H8.5M8.5 15h5"/>',
  percent: '<path d="M6 18 18 6"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M12 2.5V6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12 4 7.5"/>',
  orbit: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><path d="M12 3c-2.6 2.3-2.6 15.7 0 18M12 3c2.6 2.3 2.6 15.7 0 18"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2.5"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7M12 15v2.5"/>',
  keypad: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>',
  shield: '<path d="m12 3 7 3v5c0 5-3.4 8.5-7 10-3.6-1.5-7-5-7-10V6l7-3z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
  pen: '<path d="m4 20 1-4.2L16.2 4.6l3.2 3.2L8.2 19 4 20zM14 6.8l3.2 3.2"/>',
  stamp: '<path d="M10 3.5h4a1 1 0 0 1 1 1c0 2.5-1 3.5-1 5.5 0 1.4 3 1.5 3 4H7c0-2.5 3-2.6 3-4 0-2-1-3-1-5.5a1 1 0 0 1 1-1zM5 17.5h14v3H5z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  area: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.5h3M4 14.5h3M9.5 4v3M14.5 4v3"/>',
  stairs: '<path d="M4 20h4v-4h4v-4h4V8h4"/>',
  bed: '<path d="M3 19V6M3 15h18v4M21 15v-2.5a3 3 0 0 0-3-3h-6.5V15"/><circle cx="7.3" cy="11.3" r="1.6"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18M7 15h4"/>',
  doc: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20.5a2 2 0 0 0 4 0"/>',
  play: '<path d="m8 5 11 7-11 7V5z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0M12 17l4-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  logout: '<path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h9"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
  umbrella: '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v7a2 2 0 0 0 4 0"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 14-5.3L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-14 5.3L4 15.5M4 20v-4.5h4.5"/>',
  sparkle: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.800 2.2L22 19l-2.2.800L19 22l-.800-2.2L16 19l2.2-.800L19 16z"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v4M4 7.5V17a2.5 2.5 0 0 0 2.5 2.5H20V9H6.5A2.5 2.5 0 0 1 4 7.5zM16.5 14.3h.01"/>',
  scale: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a2.8 2.8 0 0 0 5 0L5 8zM19 8l-2.5 6a2.8 2.8 0 0 0 5 0L19 8z"/>',
  hand: '<path d="M3 13.5 7 10l4 1.5h3a1.5 1.5 0 0 1 0 3h-3M3 18.5l4-1 5 1.5 8.5-4a1.6 1.6 0 0 0-1.5-2.8L14.5 14"/><circle cx="16" cy="6" r="2.5"/>',
  megaphone: '<path d="M4 10v4h3l8 4.5v-13L7 10H4zM18 9.5a3.5 3.5 0 0 1 0 5M8 14v4.5h2.5"/>',
  database: '<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6M4.5 12v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/>',
};


export function icon(name, { size = 24, cls = "", draw = false } = {}) {
  let body = P[name];
  if (!body) throw new Error(`Нет иконки «${name}»`);
  // draw: линии можно «прорисовать» анимацией stroke-dashoffset
  if (draw) body = body.replace(/<(path|circle|rect|ellipse)/g, '<$1 pathLength="1"');
  return `<svg class="i${cls ? ` ${cls}` : ""}${draw ? " i--draw" : ""}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export const iconNames = Object.keys(P);
