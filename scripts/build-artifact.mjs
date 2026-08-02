// Bundles site/ into one self-contained HTML file for the Artifact preview.
// The canonical site remains site/ unbundled — this exists only so the page
// can be published somewhere with a strict CSP and no sibling files.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SITE = join(ROOT, 'site');
const read = (p) => readFileSync(join(SITE, p), 'utf8');

// ---- data the runtime would otherwise fetch() ----
const DATA = {
  './locales/en.json': JSON.parse(read('locales/en.json')),
  './locales/th.json': JSON.parse(read('locales/th.json')),
  './config/tax/th/2026.json': JSON.parse(read('config/tax/th/2026.json')),
  './config/calendar/th/2026.json': JSON.parse(read('config/calendar/th/2026.json')),
  './config/app.json': JSON.parse(read('config/app.json')),
};

// ---- fonts inlined as data: URIs ----
let fontCss = '';
for (const f of ['fraunces.css', 'inter.css', 'plexthai.css']) {
  let css = read(`fonts/${f}`);
  for (const woff of readdirSync(join(SITE, 'fonts')).filter(n => n.endsWith('.woff2'))) {
    if (!css.includes(woff)) continue;
    const b64 = readFileSync(join(SITE, 'fonts', woff)).toString('base64');
    css = css.replaceAll(`url(${woff})`, `url(data:font/woff2;base64,${b64})`);
  }
  fontCss += css + '\n';
}

// ---- modules, concatenated in dependency order ----
const MODULES = [
  'js/engine/money.js', 'js/engine/projection.js', 'js/engine/rng.js',
  'js/engine/montecarlo.js', 'js/engine/tax_th.js', 'js/engine/deductions.js',
  'js/engine/withdrawal.js', 'js/engine/sso.js', 'js/engine/milestones.js',
  'js/ics.js', 'js/staleness.js', 'js/i18n.js', 'js/session.js',
  'js/svgchart.js', 'js/choreography.js',
  'js/chapters/time.js', 'js/chapters/number.js', 'js/chapters/climb.js',
  'js/chapters/rules.js', 'js/chapters/cheats.js', 'js/chapters/calendar.js',
  'js/chapters/instruments.js', 'js/chapters/begin.js',
];

const strip = (src) => src
  .replace(/^\s*import\s+[^;]*?;\s*$/gm, '')        // drop import statements
  .replace(/^\s*export\s+(?=(const|function|let|async))/gm, '')
  .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');

let body = MODULES.map(m => `\n/* ===== ${m} ===== */\n${strip(read(m))}`).join('\n');

// The Monte Carlo worker becomes an inline blob (no sibling file to load).
const workerSrc = [
  strip(read('js/engine/rng.js')),
  strip(read('js/engine/montecarlo.js')),
  'onmessage = (e) => postMessage(runMC(e.data.params));',
].join('\n');

// main.js: swap fetch() for the embedded data, worker URL for the blob
let main = strip(read('js/main.js'))
  .replace(
    /new Worker\(new URL\([^)]*\)[^)]*\)/,
    'new Worker(URL.createObjectURL(new Blob([__KS_WORKER__], {type:"text/javascript"})))'
  );

// climb.js constructs the worker — patch it there too
body = body.replace(
  /new Worker\(new URL\('\.\.\/mc\.worker\.js', import\.meta\.url\), \{ type: 'module' \}\)/,
  'new Worker(URL.createObjectURL(new Blob([__KS_WORKER__], {type:"text/javascript"})))'
);

// chapter modules are imported dynamically in main.js — they are already inlined,
// so replace the dynamic-import loop with direct init() calls.
main = main.replace(
  /for \(const mod of \[[^\]]*\]\) \{[\s\S]*?\n  \}/,
  `for (const fn of [initTime, initNumber, initClimb, initRules, initCheats, initCalendar, initInstruments, initBegin]) {
    try { fn(); } catch (err) { console.warn('chapter failed', err); }
  }`
);

// each chapter module exports init(); give them distinct names when concatenated
const CHAPTER_NAMES = ['Time', 'Number', 'Climb', 'Rules', 'Cheats', 'Calendar', 'Instruments', 'Begin'];
let idx = 0;
body = body.replace(/^function init\(\)/gm, () => `function init${CHAPTER_NAMES[idx++]}()`);
if (idx !== 8) throw new Error(`expected 8 chapter init() functions, renamed ${idx}`);

const html = read('index.html');
const inner = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));

const out = `<style>
${fontCss}
${read('css/kasian.css')}
</style>
${inner}
<script type="module">
const __KS_DATA__ = ${JSON.stringify(DATA)};
const __KS_WORKER__ = ${JSON.stringify(workerSrc)};
const fetch = (u) => Promise.resolve({ json: () => Promise.resolve(__KS_DATA__[u]) });
${body}
${main}
</script>
`;

mkdirSync(join(ROOT, 'dist'), { recursive: true });
const dest = join(ROOT, 'dist', 'kasian-sultan.html');
writeFileSync(dest, out);
console.log(`built ${dest} — ${(out.length / 1024).toFixed(0)} KB`);
