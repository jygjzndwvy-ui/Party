// Общие стили, настройки и помощники вёрстки для всех файлов набора.
import { C, scissors } from './art.mjs';

// ── Настройки (можно переопределить из командной строки, см. build.mjs) ──
export const config = {
  brand: 'TROPICAL QUEST',
  year: 2026,
  name: '', // имя именинника: пусто = строка для заполнения от руки
  age: '',
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Неразрывные пробелы после коротких слов — чтобы предлоги не висели в конце строки.
// Меняем только текст между тегами, атрибуты не трогаем.
export function typo(html) {
  return html.replace(/>([^<]+)</g, (m, t) =>
    '>' + t.replace(/(?<=^|[\s(«])([А-Яа-яЁёA-Za-z]{1,2}|[0-9]{1,3})\s+(?=\S)/g, '$1\u00A0') + '<');
}

// Имя именинника или линия для подписи
export const nameOr = (w = '60mm', cls = '') =>
  config.name ? `<span class="filled ${cls}">${esc(config.name)}</span>` : `<span class="blank ${cls}" style="width:${w}"></span>`;

export const CSS = `
@font-face { font-family: 'Unbounded'; src: url('fonts/Unbounded.ttf') format('truetype'); font-weight: 200 900; }
@font-face { font-family: 'Nunito'; src: url('fonts/Nunito.ttf') format('truetype'); font-weight: 200 1000; }
@font-face { font-family: 'Caveat'; src: url('fonts/Caveat.ttf') format('truetype'); font-weight: 400 700; }
@font-face { font-family: 'Pacifico'; src: url('fonts/Pacifico.ttf') format('truetype'); }

:root {
  --ocean: ${C.ocean}; --ocean-deep: ${C.oceanDeep}; --lagoon: ${C.lagoon}; --aqua: ${C.aqua}; --aqua-soft: #EAF8F6;
  --coral: ${C.coral}; --coral-dark: ${C.coralDark}; --coral-soft: #FDE8EC;
  --pine: ${C.pine}; --pine-dark: ${C.pineDark}; --pine-soft: #FFF4D9;
  --leaf: ${C.leaf}; --leaf-dark: ${C.leafDark}; --leaf-soft: #E4F4EA;
  --sand: ${C.sand}; --wood: ${C.wood};
  --ink: ${C.ink}; --muted: #5B7380; --line: #D3E4E7;
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: 'Nunito', sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.42;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #9AA9AE; }
@media screen { .page { margin: 10mm auto; box-shadow: 0 4px 24px rgba(0,0,0,.25); } }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; background: #fff; break-after: page; page-break-after: always; }
.page:last-child { break-after: auto; page-break-after: auto; }
svg.art { display: block; width: 100%; height: 100%; overflow: visible; }

.display { font-family: 'Unbounded', sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: .01em; line-height: 1.02; }
.script { font-family: 'Pacifico', cursive; font-weight: 400; }
.hand { font-family: 'Caveat', cursive; font-weight: 600; }
b, strong { font-weight: 800; }
p { margin: 0 0 2.2mm; }
ul, ol { margin: 0 0 2.4mm; padding-left: 5mm; }
li { margin: 0 0 1mm; }
li::marker { color: var(--coral); font-weight: 800; }

.blank { display: inline-block; border-bottom: 1.4px solid currentColor; height: 1.1em; vertical-align: baseline; opacity: .75; }
.filled { font-family: 'Caveat', cursive; font-weight: 700; font-size: 1.35em; color: var(--coral-dark); }

/* ── Линии реза ── */
.cut { position: relative; border: 1.2px dashed #9DB1B8; }
.cutnote { position: absolute; top: 5mm; right: 10mm; display: flex; align-items: center; gap: 1.5mm; font-size: 7.5pt; color: #7A8A92; }
.cutnote svg { width: 4mm; height: 4mm; }
.foldline { border-top: 1.2px dashed #9DB1B8; position: relative; }
`;

export const scissorNote = (t = 'вырежьте по пунктиру') =>
  `<div class="cutnote">${scissors()}<span>${t}</span></div>`;

export function doc(title, css, body) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${CSS}${css}</style></head><body>${body}</body></html>`;
}
