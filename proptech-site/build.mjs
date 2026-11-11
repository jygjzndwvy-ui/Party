#!/usr/bin/env node
// Сборка сайта: content/ + src/ → dist/ (готовые HTML, CSS, JS).
//   node build.mjs            собрать один раз
//   node build.mjs --serve    собрать, открыть на http://localhost:4173 и пересобирать при правках
// Зависимостей нет, нужен только Node.js 18+.
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');
const args = process.argv.slice(2);

async function build() {
  const t0 = Date.now();
  const { site } = await import('./content/site.mjs');
  const { objects: rawObjects, districts } = await import('./content/objects.mjs');
  const { layout } = await import('./src/partials/layout.mjs');
  const { typoHtml, nbDeep } = await import('./src/lib/html.mjs');
  const { roomArt, logoMark } = await import('./src/lib/art.mjs');
  const { icon } = await import('./src/lib/icons.mjs');
  await import('./src/assets/js/card.js'); // определяет globalThis.Obj
  const Obj = globalThis.Obj;
  Obj.icons = Object.fromEntries(['cube', 'keypad', 'heart', 'pin', 'check'].map((n) => [n, icon(n, { size: 20 })]));

  // Объекты: добавляем обложку. Фото есть → берём фото, нет → рисуем иллюстрацию.
  const objects = nbDeep(rawObjects).map((o) => ({
    ...o,
    cover: o.photos?.length ? '' : roomArt(o.scenes?.[0] || 'living', { palette: o.palette, seed: o.id, label: `${Obj.title(o)}: иллюстрация` }),
  }));

  const ctx = {
    site,
    objects,
    districts,
    Obj,
    card: (o) => Obj.card(o, { demo: site.demo }),
  };

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(path.join(OUT, 'assets/css'), { recursive: true });
  await fs.mkdir(path.join(OUT, 'assets/js'), { recursive: true });

  // Страницы: каждый файл в src/pages возвращает одну страницу или массив страниц.
  const pageFiles = (await fs.readdir(path.join(SRC, 'pages'))).filter((f) => f.endsWith('.mjs')).sort();
  let count = 0;
  for (const f of pageFiles) {
    const mod = await import(`./src/pages/${f}`);
    const result = await mod.default(ctx);
    for (const page of Array.isArray(result) ? result : [result]) {
      const out = typoHtml(layout({ site, page, body: page.body }));
      await fs.writeFile(path.join(OUT, page.file), out);
      count++;
    }
  }

  // Стили: файлы из src/assets/css склеиваются по порядку номеров в один app.css.
  const cssFiles = (await fs.readdir(path.join(SRC, 'assets/css'))).filter((f) => f.endsWith('.css')).sort();
  let css = '';
  for (const f of cssFiles) css += `${await fs.readFile(path.join(SRC, 'assets/css', f), 'utf8')}\n`;
  await fs.writeFile(path.join(OUT, 'assets/css/app.css'), css);

  // Скрипты и шрифты копируются как есть.
  await fs.cp(path.join(SRC, 'assets/js'), path.join(OUT, 'assets/js'), { recursive: true });
  await fs.cp(path.join(SRC, 'assets/fonts'), path.join(OUT, 'assets/fonts'), { recursive: true });

  // Данные каталога для браузера.
  const data = `window.OBJECTS=${JSON.stringify(objects)};window.DISTRICTS=${JSON.stringify(districts)};`;
  await fs.writeFile(path.join(OUT, 'assets/js/data.js'), data);

  // Иконка сайта: знак логотипа.
  const fav = logoMark({ size: 32 })
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace('class="logo__frame"', 'fill="#0C1626"')
    .replace(/class="logo__pane is-lit"/g, 'fill="#FFC145"')
    .replace(/class="logo__pane"/g, 'fill="#fff" opacity=".28"');
  await fs.writeFile(path.join(OUT, 'assets/favicon.svg'), fav);

  console.log(`Готово: ${count} страниц, ${objects.length} объектов, ${Date.now() - t0} мс → dist/`);
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };

function serve(port) {
  http
    .createServer(async (req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      let file = path.join(OUT, path.normalize(p));
      if (!file.startsWith(OUT)) { res.writeHead(403).end(); return; }
      try {
        const buf = await fs.readFile(file);
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(buf);
      } catch {
        try {
          res.writeHead(404, { 'Content-Type': MIME['.html'] }).end(await fs.readFile(path.join(OUT, '404.html')));
        } catch {
          res.writeHead(404).end('404');
        }
      }
    })
    .listen(port, () => console.log(`Сайт открыт: http://localhost:${port}`));
}

function watch() {
  let timer = null;
  let running = false;
  const rebuild = () => {
    if (running) return;
    running = true;
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url)], { stdio: 'inherit' });
    child.on('exit', () => { running = false; });
  };
  for (const dir of ['src', 'content']) {
    fss.watch(path.join(ROOT, dir), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(rebuild, 150);
    });
  }
}

await build();
if (args.includes('--serve')) {
  const i = args.indexOf('--port');
  serve(i > -1 ? +args[i + 1] : 4173);
  watch();
}
