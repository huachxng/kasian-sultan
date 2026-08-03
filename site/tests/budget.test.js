import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = fileURLToPath(new URL('../', import.meta.url));

const walk = (dir, exts) => readdirSync(dir, { withFileTypes: true }).flatMap(d => {
  const p = join(dir, d.name);
  return d.isDirectory() ? walk(p, exts) : exts.some(e => p.endsWith(e)) ? [p] : [];
});

test('gz JS+CSS ≤ 200 KB', () => {
  const files = walk(SITE, ['.js', '.css']).filter(p => !p.includes('/tests/'));
  const total = files.reduce((s, p) => s + gzipSync(readFileSync(p)).length, 0);
  assert.ok(total <= 200 * 1024, `total gz ${(total / 1024).toFixed(1)} KB over budget`);
});

test('fonts ≤ 250 KB raw', () => {
  const fonts = walk(join(SITE, 'fonts'), ['.woff2']);
  const total = fonts.reduce((s, p) => s + statSync(p).size, 0);
  assert.ok(total <= 250 * 1024, `fonts ${(total / 1024).toFixed(1)} KB over budget`);
});

test('no external runtime requests in source', () => {
  const files = walk(SITE, ['.js', '.css', '.html']).filter(p => !p.includes('/tests/'));
  for (const p of files) {
    const src = readFileSync(p, 'utf8');
    // http(s) URLs are allowed only as human-readable source citations in
    // config/locale text and as anchor hrefs — never as loaded subresources.
    const bad = [...src.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)/g)]
      .map(m => m[1])
      .filter(u => !u.startsWith('https://www.rd.go.th')
                && !u.startsWith('https://taxsummaries')
                && !u.startsWith('https://sherrings')
                && !u.startsWith('https://static.twentyoverten')
                && !u.startsWith('https://www.bot.or.th')
                && !u.startsWith('https://flowaccount'));
    assert.equal(bad.length, 0, `${p} loads external resources: ${bad.join(', ')}`);
    assert.ok(!/@import\s+url\(["']?https?:/.test(src), `${p} has an external @import`);
  }
});

test('palette discipline: no stray hex colours outside the token block', () => {
  const css = readFileSync(join(SITE, 'css/kasian.css'), 'utf8');
  const allowed = new Set(['#0B0B0C', '#F6F4EF', '#C6A15B', '#E9CD8F', '#fff', '#ffffff']);
  const hexes = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m => m[0]);
  const stray = hexes.filter(h => !allowed.has(h));
  assert.deepEqual(stray, [], `unexpected colours: ${stray.join(', ')}`);
});

test('every chapter stamps the text into the markup it builds', () => {
  // Chapters build their DOM after the page-wide i18n pass has already run, so
  // any module that writes [data-i18n] markup must call applyI18n on it or the
  // labels render blank until the user happens to switch language.
  const dir = join(SITE, 'js/chapters');
  for (const f of readdirSync(dir).filter(n => n.endsWith('.js'))) {
    const src = readFileSync(join(dir, f), 'utf8');
    if (!src.includes('data-i18n')) continue;
    assert.ok(/applyI18n\s*\(/.test(src),
      `js/chapters/${f} injects [data-i18n] markup but never calls applyI18n — its labels would be blank on first load`);
    assert.ok(/from '\.\.\/i18n\.js'/.test(src) && src.includes('applyI18n'),
      `js/chapters/${f} must import applyI18n`);
  }
});

test('authored line breaks in copy can actually render', () => {
  // A translator writing paragraph breaks into a locale file must see them on the
  // page. Default CSS collapses newlines, so every class that renders a string
  // containing "\n" needs pre-line.
  const css = readFileSync(join(SITE, 'css/kasian.css'), 'utf8');
  const preLineBlock = css.match(/([^}]*)\{\s*white-space:\s*pre-line;\s*\}/);
  assert.ok(preLineBlock, 'no white-space: pre-line rule found');
  const selectors = preLineBlock[1];

  const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]);

  for (const loc of ['en', 'th']) {
    const d = JSON.parse(readFileSync(join(SITE, `locales/${loc}.json`), 'utf8'));
    const multiline = flat(d).filter(([, v]) => String(v).includes('\n')).map(([k]) => k);
    if (multiline.length === 0) continue;
    // the classes those strings land in
    for (const cls of ['.lede', '.note', '.microlabel']) {
      assert.ok(selectors.includes(cls),
        `${cls} must allow line breaks — ${loc}.json has multi-line copy (${multiline.join(', ')})`);
    }
  }
});

test('attribution and terms survive in both locales', () => {
  const REQUIRED = ['ownerName', 'schoolName', 'made', 'noCommercial', 'eduPurpose', 'noData'];
  for (const loc of ['en', 'th']) {
    const d = JSON.parse(readFileSync(join(SITE, `locales/${loc}.json`), 'utf8'));
    assert.ok(d.credits, `${loc}.json is missing the credits block`);
    for (const k of REQUIRED) {
      assert.ok(d.credits[k]?.trim(), `${loc}.json credits.${k} is empty — attribution must not be dropped`);
    }
  }
  // the author's name and school are proper nouns: identical in both locales
  const en = JSON.parse(readFileSync(join(SITE, 'locales/en.json'), 'utf8'));
  const th = JSON.parse(readFileSync(join(SITE, 'locales/th.json'), 'utf8'));
  assert.equal(en.credits.ownerName, th.credits.ownerName);
  assert.equal(en.credits.schoolName, th.credits.schoolName);
});

test('the begin chapter renders the colophon', () => {
  const src = readFileSync(join(SITE, 'js/chapters/begin.js'), 'utf8');
  for (const k of ['credits.ownerName', 'credits.noCommercial', 'credits.eduPurpose', 'credits.noData']) {
    assert.ok(src.includes(k), `begin.js does not render ${k}`);
  }
});

test('every chapter carries the disclaimer footer', () => {
  const html = readFileSync(join(SITE, 'index.html'), 'utf8');
  const chapters = (html.match(/<section class="chapter/g) || []).length;
  const foots = (html.match(/chapter__foot/g) || []).length;
  assert.equal(chapters, 9);
  assert.equal(foots, 9, 'each of the 9 chapters needs a disclaimer footer');
});
