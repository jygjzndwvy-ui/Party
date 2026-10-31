// Сборка набора: HTML → PDF (+ проверка, что ничего не вылезает за страницу).
// Запуск:  node src/build.mjs [--name "Маша"] [--age 7] [--brand "Мой бренд"] [--only guide|kit|avito]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './lib.mjs';
import { execFileSync } from 'child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, 'build');
const DIST = path.join(ROOT, 'dist');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
if (arg('name')) config.name = arg('name');
if (arg('age')) config.age = arg('age');
if (arg('brand')) config.brand = arg('brand');
const only = arg('only');
const suffix = config.name ? '_' + config.name.replace(/\s+/g, '_') : '';

fs.mkdirSync(path.join(BUILD, 'fonts'), { recursive: true });
fs.mkdirSync(DIST, { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'src/fonts'))) fs.copyFileSync(path.join(ROOT, 'src/fonts', f), path.join(BUILD, 'fonts', f));

const jobs = [];
if (!only || only === 'guide') { const { buildGuide } = await import('./guide.mjs'); jobs.push(['guide', buildGuide(), `TROPICAL_QUEST_1_Гид_организатора${suffix}.pdf`]); }
if (!only || only === 'kit') { const { buildKit } = await import('./kit.mjs'); jobs.push(['kit', buildKit(), `TROPICAL_QUEST_2_Printable_Kit${suffix}.pdf`]); }

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [key, html, pdfName] of jobs) {
  const file = path.join(BUILD, key + '.html');
  fs.writeFileSync(file, html);
  await page.goto('file://' + file, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const problems = await page.evaluate(() => {
    const out = [];
    const corners = [...document.querySelectorAll('.corner')];
    corners.forEach((c) => (c.style.display = 'none'));
    document.querySelectorAll('.page').forEach((p, i) => {
      const body = p.querySelector('.g-body');
      if (body && body.scrollHeight > body.clientHeight + 1) out.push(`стр. ${i + 1}: текст не помещается (${body.scrollHeight - body.clientHeight}px)`);
      p.querySelectorAll('[data-fit]').forEach((el) => { if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) out.push(`стр. ${i + 1}: ${el.dataset.fit} не помещается`); });
    });
    corners.forEach((c) => (c.style.display = ''));
    return out;
  });
  const count = await page.evaluate(() => document.querySelectorAll('.page').length);
  await page.pdf({ path: path.join(DIST, pdfName), preferCSSPageSize: true, printBackground: true });
  console.log(`${pdfName}: ${count} стр.`);
  problems.forEach((p) => console.log('  ⚠ ' + p));
}

// ── Картинки для Авито ──
if (!only || only === 'avito') {
  const { buildGuide, GUIDE_TOC } = await import('./guide.mjs');
  const { kitIndex } = await import('./kit.mjs');
  if (!GUIDE_TOC.length) buildGuide();
  const guidePdf = path.join(DIST, `TROPICAL_QUEST_1_Гид_организатора${suffix}.pdf`);
  const kitPdf = path.join(DIST, `TROPICAL_QUEST_2_Printable_Kit${suffix}.pdf`);
  const thumbs = path.join(BUILD, 'thumbs');
  fs.rmSync(thumbs, { recursive: true, force: true });
  fs.mkdirSync(thumbs, { recursive: true });
  execFileSync('pdftoppm', ['-r', '110', '-png', guidePdf, path.join(thumbs, 'guide')]);
  execFileSync('pdftoppm', ['-r', '110', '-png', kitPdf, path.join(thumbs, 'kit')]);
  const pagesOf = (pdf) => Number(execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1]);
  const guidePages = { count: pagesOf(guidePdf), sec: Object.fromEntries(GUIDE_TOC.map((t) => [t.no, t.page])) };
  const kitPages = { count: pagesOf(kitPdf), byTitle: Object.fromEntries(kitIndex().map((g) => [g.title, g.first])) };
  const { buildAvito } = await import('./avito.mjs');
  const file = path.join(BUILD, 'avito.html');
  fs.writeFileSync(file, buildAvito({ guidePages, kitPages, totalPages: guidePages.count + kitPages.count }));
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.goto('file://' + file, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const outDir = path.join(DIST, 'avito');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const slides = await page.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    await slides[i].screenshot({ path: path.join(outDir, `${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 90 });
  }
  console.log(`Авито: ${slides.length} картинок → dist/avito/`);
}
await browser.close();
