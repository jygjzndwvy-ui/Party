// Небольшие помощники для шаблонов: экранирование, типограф, форматирование.

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Шаблонная строка: массивы склеиваются, null/undefined/false пропускаются. */
export const html = (strings, ...vals) =>
  strings.reduce((out, s, i) => {
    let v = vals[i - 1];
    if (Array.isArray(v)) v = v.join('');
    if (v === null || v === undefined || v === false) v = '';
    return out + v + s;
  });

// ── Типограф ────────────────────────────────────────────────────────────────
// Короткие предлоги и союзы приклеиваются к следующему слову неразрывным
// пробелом, частицы к предыдущему, числа к единицам измерения.
const NB = ' ';
const PRE = ['в', 'во', 'с', 'со', 'к', 'ко', 'о', 'об', 'у', 'и', 'а', 'но', 'да', 'из', 'от', 'до', 'по', 'за', 'на', 'под', 'над', 'при', 'про', 'без', 'для', 'не', 'ни', 'что', 'как', 'или', 'чем', 'где', 'то', 'если', 'между', 'через'];
const POST = ['бы', 'б', 'же', 'ж', 'ли', 'ль'];
const RE_PRE = new RegExp(`(^|[\\s${NB}(«„"'])(${PRE.join('|')}) `, 'giu');
const RE_POST = new RegExp(` (${POST.join('|')})(?=[\\s${NB}.,!?:;)»]|$)`, 'giu');

export function nb(text) {
  let t = String(text);
  t = t.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NB}`); // разряды: 12 400 000
  t = t.replace(/(\d) (?=[₽%№A-Za-zА-Яа-яЁё])/g, `$1${NB}`); // 5 дней, 60 %
  t = t.replace(/№ (?=\d)/g, `№${NB}`);
  t = t.replace(RE_PRE, `$1$2${NB}`).replace(RE_PRE, `$1$2${NB}`);
  t = t.replace(RE_POST, `${NB}$1`);
  return t;
}

/** Применяет типограф только к видимому тексту, теги и код не трогает. */
export function typoHtml(source) {
  return source.replace(
    /(<(script|style|pre|code|textarea|svg)\b[\s\S]*?<\/\2>)|(<[^>]+>)|([^<]+)/gi,
    (m, _block, _tag, _single, text) => (text ? nb(text) : m),
  );
}

/** Глубокий типограф для данных (строки внутри объектов и массивов). */
export function nbDeep(value, skip = new Set(['id', 'href', 'slug', 'tour', 'photos', 'key', 'icon', 'art', 'plan'])) {
  if (typeof value === 'string') return nb(value);
  if (Array.isArray(value)) return value.map((v) => nbDeep(v, skip));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, skip.has(k) ? v : nbDeep(v, skip)]));
  }
  return value;
}

// ── Форматирование ──────────────────────────────────────────────────────────
export const money = (n) => `${Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ')} ₽`;

export function priceShort(n) {
  if (n >= 1e6) return `${(n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} тыс. ₽`;
  return `${n} ₽`;
}

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
