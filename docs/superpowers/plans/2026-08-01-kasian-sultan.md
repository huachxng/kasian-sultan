# Kasian Sultan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Kasian Sultan static cinematic educational site — 9 scroll-driven chapters teaching retirement math and Thai tax literacy with in-browser calculators, EN/TH, zero data collection.

**Architecture:** Pure static site (`site/`): one `index.html` of 9 full-viewport `<section>` chapters, CSS-first choreography (scroll-snap + IntersectionObserver), a dependency-free pure-function engine (`site/js/engine/`) tested with `node --test`, all figures from year-versioned JSON config. Monte Carlo runs in a Web Worker. No framework, no build step for the site itself (a tiny bundler script exists only to produce the single-file Artifact preview).

**Tech Stack:** HTML5, CSS custom properties, ES modules (vanilla JS), SVG charts, `node --test` (Node ≥ 20), git.

**Spec:** `docs/superpowers/specs/2026-08-01-kasian-sultan-static-design.md` · **Research:** `docs/research/2026-08-01-research-brief.md`

## Global Constraints

- Palette ONLY: `--ink:#0B0B0C` `--paper:#F6F4EF` `--gold:#C6A15B` `--gold-hi:#E9CD8F` + the rgba line/muted tokens from spec §2. No other hues anywhere, charts included.
- No WebGL, no scroll-jacking, no frameworks, no runtime dependencies, no analytics, no external requests at runtime (CSP `default-src 'self'`; fonts self-hosted).
- Only persistence: `localStorage` key `ks-locale`. Everything else in-memory.
- Money = integer **satang** everywhere in engine (`1 THB = 100 satang`); rates in config = integer **basis points** (`_bp` suffix); config THB amounts = integer baht (`_thb` suffix). Engine converts at boundaries; floats allowed inside compounding math only.
- Never compute UNVERIFIED items (dividend credit, remittance amounts, fund-distribution tax) — explainer text only.
- Every config file carries `tax_year`, `be_year`, `verified_on`, `review_by`, `sources[]`. `today > review_by` ⇒ staleness banner.
- Copy vocabulary: "example / illustration / scenario"; never "recommendation"; never name a fund/ticker as a suggestion. Footer of every chapter: `Educational only — not financial advice. / เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน`
- Thai locale shows Buddhist Era with CE: `ปีภาษี 2569 (2026)`. Arabic numerals only.
- `prefers-reduced-motion: reduce` ⇒ all animation becomes instant final state; site fully usable.
- Accessibility: real `<input type="range">` controls, keyboard operable, `aria-live="polite"` result readouts, body text never gold, AA contrast both scenes.
- Perf budget (enforced by test in Task 20): total gz JS+CSS ≤ 200 KB; fonts ≤ 250 KB total.
- Commit after every task (steps include the command). Working directory: repo root `retirement-app/`.

## File Structure (locked)

```
site/
├── index.html
├── css/kasian.css
├── js/
│   ├── engine/money.js  projection.js  rng.js  montecarlo.js  tax_th.js
│   │          deductions.js  withdrawal.js  sso.js  milestones.js
│   ├── chapters/hero.js  time.js  number.js  climb.js  rules.js
│   │            cheats.js  calendar.js  instruments.js  begin.js
│   ├── choreography.js  svgchart.js  i18n.js  ics.js  staleness.js
│   ├── session.js  main.js  mc.worker.js
├── locales/en.json  th.json
├── config/tax/th/2026.json  config/calendar/th/2026.json  config/app.json
├── fonts/            (woff2, self-hosted)
└── tests/            (node --test)
scripts/build-artifact.mjs      (preview bundler only)
DEPLOY.md
```

---

### Task 1: Test harness + repo scaffold

**Files:**
- Create: `package.json`, `site/tests/smoke.test.js`, empty dirs per File Structure

**Interfaces:**
- Produces: `npm test` ⇒ `node --test site/tests/` green. All later tasks add tests under `site/tests/`.

- [ ] **Step 1: Write package.json** (repo root; no dependencies — this is a runner config, not a build step)

```json
{
  "name": "kasian-sultan",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test site/tests/" }
}
```

- [ ] **Step 2: Write the smoke test** — `site/tests/smoke.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('harness runs', () => { assert.equal(1 + 1, 2); });
```

- [ ] **Step 3: Create the directory tree**

```bash
mkdir -p site/css site/js/engine site/js/chapters site/locales site/config/tax/th site/config/calendar/th site/fonts site/tests scripts
```

- [ ] **Step 4: Run tests — expect PASS (1 test)**

Run: `npm test` · Expected: `pass 1`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: test harness and site scaffold"
```

---

### Task 2: Engine — money

**Files:**
- Create: `site/js/engine/money.js` · Test: `site/tests/money.test.js`

**Interfaces:**
- Produces: `satang(thb:number):number` (×100, rounds), `thb(satang:number):number` (÷100, rounds), `fmtTHB(satang:number, locale?:'en'|'th'):string` → `"฿1,234,568"` (rounds to whole baht, `,` grouping, ฿ prefix both locales), `fmtPct(bp:number, dp=1):string` → `"6.0%"`, `bpToRate(bp:number):number` (÷10000).

- [ ] **Step 1: Write failing tests** — `site/tests/money.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { satang, thb, fmtTHB, fmtPct, bpToRate } from '../js/engine/money.js';

test('satang/thb round-trip', () => {
  assert.equal(satang(310000), 31000000);
  assert.equal(thb(31000000), 310000);
  assert.equal(thb(satang(0.005) ? satang(0.005) : 1), 0); // 0.005 THB → 1 satang → 0 THB rounded
});
test('fmtTHB groups and rounds', () => {
  assert.equal(fmtTHB(123456789), '฿1,234,568');
  assert.equal(fmtTHB(0), '฿0');
  assert.equal(fmtTHB(-50000), '−฿500');
});
test('fmtPct from bp', () => {
  assert.equal(fmtPct(600), '6.0%');
  assert.equal(fmtPct(1550, 2), '15.50%');
});
test('bpToRate', () => { assert.equal(bpToRate(390), 0.039); });
```

- [ ] **Step 2: Run — expect FAIL** (`ERR_MODULE_NOT_FOUND`)

Run: `npm test`

- [ ] **Step 3: Implement** — `site/js/engine/money.js`

```js
export const satang = (t) => Math.round(t * 100);
export const thb = (s) => Math.round(s / 100);
export const bpToRate = (bp) => bp / 10000;

export function fmtTHB(s, _locale = 'en') {
  const t = thb(Math.abs(s));
  const body = t.toLocaleString('en-US'); // Arabic numerals, comma grouping, both locales
  return `${s < 0 ? '−' : ''}฿${body}`;
}
export function fmtPct(bp, dp = 1) {
  return `${(bp / 100).toFixed(dp)}%`;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm test`

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(engine): money units and formatting"`

---

### Task 3: Engine — projection (Fisher, monthly compounding, closed form)

**Files:**
- Create: `site/js/engine/projection.js` · Test: `site/tests/projection.test.js`

**Interfaces:**
- Produces:
  - `monthlyRate(annual:number):number` = `(1+annual)^(1/12) − 1`
  - `fisherReal(nominal:number, inflation:number):number` = `(1+n)/(1+i) − 1`
  - `fvGrowingAnnuity({monthlySatang, annualRate, growthRate, years, startSatang=0}):number` — closed form, month-end contributions, contribution escalates `growthRate` annually, `r===g` guarded
  - `projectSeries(sameParams):Array<{year:number, balanceSatang:number, contributedSatang:number, growthSatang:number}>` — length `years+1`, index 0 = start; iterative monthly loop (chart + cross-check)
- Consumes: nothing (pure).

- [ ] **Step 1: Write failing tests** — `site/tests/projection.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthlyRate, fisherReal, fvGrowingAnnuity, projectSeries } from '../js/engine/projection.js';

test('monthlyRate compounds to annual', () => {
  const m = monthlyRate(0.06);
  assert.ok(Math.abs((1 + m) ** 12 - 1.06) < 1e-12);
});

test('fisherReal exact relation', () => {
  assert.ok(Math.abs(fisherReal(0.06, 0.03) - 0.0291262135922) < 1e-10);
  assert.equal(fisherReal(0.05, 0.05), 0);
});

test('closed form ≡ iterative loop to within 1 satang/year', () => {
  for (const r of [-0.02, 0, 0.02, 0.05, 0.08]) {
    for (const g of [0, 0.02, r]) {
      const p = { monthlySatang: 2000000, annualRate: r, growthRate: g, years: 45, startSatang: 35000000 };
      const series = projectSeries(p);
      const closed = fvGrowingAnnuity(p);
      const loop = series[45].balanceSatang;
      assert.ok(Math.abs(closed - loop) <= 45, `r=${r} g=${g}: ${closed} vs ${loop}`);
    }
  }
});

test('r === g branch is finite and positive', () => {
  const v = fvGrowingAnnuity({ monthlySatang: 2000000, annualRate: 0.05, growthRate: 0.05, years: 30 });
  assert.ok(Number.isFinite(v) && v > 2000000 * 12 * 30);
});

test('Fisher-vs-subtraction gap is material (brief §5 order of magnitude)', () => {
  // 25y, ฿20,000/mo, nominal 6%, inflation 3%: exact real vs naive (6−3=3%) differs ~1–1.5%
  const base = { monthlySatang: 2000000, growthRate: 0, years: 25, startSatang: 0 };
  const exact = fvGrowingAnnuity({ ...base, annualRate: fisherReal(0.06, 0.03) });
  const naive = fvGrowingAnnuity({ ...base, annualRate: 0.03 });
  const gapTHB = (naive - exact) / 100;
  assert.ok(gapTHB > 80000 && gapTHB < 130000, `gap ฿${gapTHB}`);
  assert.ok((naive - exact) / exact > 0.008 && (naive - exact) / exact < 0.02);
});

test('negative rates do not break', () => {
  const s = projectSeries({ monthlySatang: 1000000, annualRate: -0.01, growthRate: 0, years: 10 });
  assert.equal(s.length, 11);
  assert.ok(s[10].balanceSatang > 0);
  assert.ok(s[10].growthSatang < 0);
});
```

- [ ] **Step 2: Run — expect FAIL** · `npm test`

- [ ] **Step 3: Implement** — `site/js/engine/projection.js`

```js
export const monthlyRate = (annual) => (1 + annual) ** (1 / 12) - 1;
export const fisherReal = (nominal, inflation) => (1 + nominal) / (1 + inflation) - 1;

// s12: FV at year-end of 12 month-end contributions of 1, at monthly rate m
function s12(annualRate) {
  const m = monthlyRate(annualRate);
  return m === 0 ? 12 : ((1 + m) ** 12 - 1) / m;
}

export function fvGrowingAnnuity({ monthlySatang, annualRate, growthRate, years, startSatang = 0 }) {
  const r = annualRate, g = growthRate, n = years;
  const S = s12(r), C0 = monthlySatang;
  let contrib;
  if (Math.abs(r - g) < 1e-12) contrib = n * C0 * S * (1 + r) ** (n - 1);
  else contrib = C0 * S * ((1 + r) ** n - (1 + g) ** n) / (r - g);
  return Math.round(contrib + startSatang * (1 + r) ** n);
}

export function projectSeries({ monthlySatang, annualRate, growthRate, years, startSatang = 0 }) {
  const m = monthlyRate(annualRate);
  const out = [{ year: 0, balanceSatang: Math.round(startSatang), contributedSatang: 0, growthSatang: 0 }];
  let bal = startSatang, contributed = 0, monthly = monthlySatang;
  for (let y = 1; y <= years; y++) {
    for (let k = 0; k < 12; k++) {
      bal = bal * (1 + m) + monthly;   // month-end contribution
      contributed += monthly;
    }
    out.push({
      year: y,
      balanceSatang: Math.round(bal),
      contributedSatang: Math.round(contributed),
      growthSatang: Math.round(bal - contributed - startSatang),
    });
    monthly *= 1 + growthRate;          // escalate once per year
  }
  return out;
}
```

- [ ] **Step 4: Run — expect PASS** · `npm test`

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(engine): projection math — Fisher, monthly compounding, closed form"`

---

### Task 4: Engine — seeded RNG + Monte Carlo

**Files:**
- Create: `site/js/engine/rng.js`, `site/js/engine/montecarlo.js` · Test: `site/tests/montecarlo.test.js`

**Interfaces:**
- Produces:
  - `mulberry32(seed:number):()=>number` uniform [0,1); `gaussian(rng):number` standard normal
  - `runMC({monthlySatang, growthRate, years, startSatang=0, medianReturn, volatility, paths, seed}) : {p5:number[], p50:number[], p95:number[]}` — arrays of yearly `balanceSatang`, length `years+1`; annual return factor `exp(ln(1+medianReturn) + volatility·z)` so the **median path equals the deterministic geometric line**; contributions compounded monthly inside each year at that year's factor^(1/12).
- Consumes: `projectSeries` (for the vol=0 equivalence test only).

- [ ] **Step 1: Write failing tests** — `site/tests/montecarlo.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, gaussian } from '../js/engine/rng.js';
import { runMC } from '../js/engine/montecarlo.js';
import { projectSeries } from '../js/engine/projection.js';

test('mulberry32 deterministic', () => {
  const a = mulberry32(2569), b = mulberry32(2569);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});
test('gaussian roughly standard', () => {
  const rng = mulberry32(7); let s = 0, s2 = 0; const N = 20000;
  for (let i = 0; i < N; i++) { const z = gaussian(rng); s += z; s2 += z * z; }
  assert.ok(Math.abs(s / N) < 0.03);
  assert.ok(Math.abs(s2 / N - 1) < 0.05);
});
test('runMC deterministic for same seed', () => {
  const p = { monthlySatang: 1000000, growthRate: 0.02, years: 20, medianReturn: 0.05, volatility: 0.15, paths: 200, seed: 42 };
  assert.deepEqual(runMC(p).p50, runMC(p).p50);
});
test('volatility 0 collapses onto deterministic series (±1 satang/yr)', () => {
  const base = { monthlySatang: 1000000, growthRate: 0.02, years: 20, startSatang: 5000000 };
  const det = projectSeries({ ...base, annualRate: 0.05 });
  const mc = runMC({ ...base, medianReturn: 0.05, volatility: 0, paths: 10, seed: 1 });
  for (let y = 0; y <= 20; y++) assert.ok(Math.abs(mc.p50[y] - det[y].balanceSatang) <= 20);
});
test('band ordered and median near deterministic at real vol', () => {
  const base = { monthlySatang: 1000000, growthRate: 0, years: 30, medianReturn: 0.05, volatility: 0.15, paths: 1000, seed: 2569 };
  const det = projectSeries({ monthlySatang: 1000000, growthRate: 0, years: 30, annualRate: 0.05 });
  const { p5, p50, p95 } = runMC(base);
  assert.ok(p5[30] < p50[30] && p50[30] < p95[30]);
  const rel = Math.abs(p50[30] - det[30].balanceSatang) / det[30].balanceSatang;
  assert.ok(rel < 0.10, `median drift ${(rel * 100).toFixed(1)}%`);
});
```

- [ ] **Step 2: Run — expect FAIL** · `npm test`

- [ ] **Step 3: Implement** — `site/js/engine/rng.js`

```js
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gaussian(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
```

`site/js/engine/montecarlo.js`

```js
import { mulberry32, gaussian } from './rng.js';

export function runMC({ monthlySatang, growthRate, years, startSatang = 0, medianReturn, volatility, paths, seed }) {
  const mu = Math.log(1 + medianReturn);
  const yearly = Array.from({ length: years + 1 }, () => new Float64Array(paths));
  const rng = mulberry32(seed);
  for (let p = 0; p < paths; p++) {
    let bal = startSatang, monthly = monthlySatang;
    yearly[0][p] = bal;
    for (let y = 1; y <= years; y++) {
      const factor = Math.exp(mu + volatility * gaussian(rng));
      const mf = factor ** (1 / 12);
      for (let k = 0; k < 12; k++) bal = bal * mf + monthly;
      yearly[y][p] = bal;
      monthly *= 1 + growthRate;
    }
  }
  const pick = (arr, q) => {
    const s = Float64Array.from(arr).sort();
    return Math.round(s[Math.min(paths - 1, Math.floor(q * paths))]);
  };
  const p5 = [], p50 = [], p95 = [];
  for (let y = 0; y <= years; y++) {
    p5.push(pick(yearly[y], 0.05)); p50.push(pick(yearly[y], 0.50)); p95.push(pick(yearly[y], 0.95));
  }
  return { p5, p50, p95 };
}
```

- [ ] **Step 4: Run — expect PASS** · `npm test`
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(engine): seeded Monte Carlo with median-anchored lognormal returns"`

---

### Task 5: Thai tax config + core PIT engine

**Files:**
- Create: `site/config/tax/th/2026.json`, `site/js/engine/tax_th.js` · Test: `site/tests/tax_th.test.js`

**Interfaces:**
- Produces:
  - Config shape (consumed by Tasks 6, 15, 18): see Step 1 JSON — brackets, employment expense, allowances, `vehicles`, all `_thb`/`_bp`, plus `tax_year/be_year/verified_on/review_by/sources`.
  - `employmentExpense(grossSatang, cfg):number`
  - `allowancesTotal(profile, cfg):number` where `profile = {spouseNoIncome?:bool, childrenBirthYears?:number[], parentsCared?:0..4, disabledDependents?:number, ssoContributionSatang?:number}` (SSO handled in taxableIncome, not here)
  - `taxableIncome({grossSatang, profile, deductionsSatang=0}, cfg):number`
  - `taxFromTaxable(taxableSatang, cfg):number` — integer satang, banker-free floor at satang precision via integer bp math
  - `computeTax({grossSatang, profile, deductionsSatang=0}, cfg) : {taxSatang, taxableSatang, marginalBp, effectiveBp, nextThousandSatang, bands:[{fromSatang,toSatang|null,rateBp,amountInBandSatang,taxSatang}]}`
- Consumes: `satang` from Task 2.

- [ ] **Step 1: Write the config** — `site/config/tax/th/2026.json` (values verbatim from research brief §1/§3; do not "improve" them)

```json
{
  "tax_year": 2026,
  "be_year": 2569,
  "verified_on": "2026-08-01",
  "review_by": "2027-01-31",
  "sources": [
    "https://www.rd.go.th/fileadmin/download/english_form/2024/GUIDE_91_67_Complete.pdf",
    "https://taxsummaries.pwc.com/thailand/individual/taxes-on-personal-income",
    "https://taxsummaries.pwc.com/thailand/individual/deductions",
    "https://sherrings.com/personal-tax-deductions-allowances-thailand.html"
  ],
  "brackets": [
    { "up_to_thb": 150000,  "rate_bp": 0 },
    { "up_to_thb": 300000,  "rate_bp": 500 },
    { "up_to_thb": 500000,  "rate_bp": 1000 },
    { "up_to_thb": 750000,  "rate_bp": 1500 },
    { "up_to_thb": 1000000, "rate_bp": 2000 },
    { "up_to_thb": 2000000, "rate_bp": 2500 },
    { "up_to_thb": 5000000, "rate_bp": 3000 },
    { "up_to_thb": null,    "rate_bp": 3500 }
  ],
  "employment_expense": { "rate_bp": 5000, "cap_thb": 100000 },
  "allowances": {
    "personal_thb": 60000,
    "spouse_thb": 60000,
    "child_first_thb": 30000,
    "child_later_born_from_year": 2018,
    "child_later_thb": 60000,
    "parent_care_thb": 30000,
    "disabled_dependent_thb": 60000
  },
  "vehicles": {
    "retirement_ceiling_thb": 500000,
    "rmf":         { "income_cap_bp": 3000, "cap_thb": 500000, "in_retirement_ceiling": true },
    "pvd":         { "income_cap_bp": 1500, "cap_thb": 500000, "in_retirement_ceiling": true },
    "gpf":         { "income_cap_bp": 3000, "cap_thb": 500000, "in_retirement_ceiling": true },
    "nsf":         { "income_cap_bp": null, "cap_thb": 30000,  "in_retirement_ceiling": true },
    "pension_life":{ "income_cap_bp": 1500, "cap_thb": 200000, "in_retirement_ceiling": true },
    "thai_esg":    { "income_cap_bp": 3000, "cap_thb": 300000, "in_retirement_ceiling": false, "last_enhanced_year": 2026 },
    "life_ins":    { "income_cap_bp": null, "cap_thb": 100000, "in_retirement_ceiling": false, "group": "insurance100k" },
    "health_ins":  { "income_cap_bp": null, "cap_thb": 25000,  "in_retirement_ceiling": false, "group": "insurance100k" },
    "insurance100k_group_cap_thb": 100000,
    "parents_health": { "income_cap_bp": null, "cap_thb": 15000, "in_retirement_ceiling": false }
  }
}
```

- [ ] **Step 2: Write failing tests** — `site/tests/tax_th.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satang } from '../js/engine/money.js';
import { employmentExpense, allowancesTotal, taxableIncome, taxFromTaxable, computeTax } from '../js/engine/tax_th.js';

const cfg = JSON.parse(readFileSync(new URL('../config/tax/th/2026.json', import.meta.url)));

test('brief golden: ฿310,000 single salaried → zero tax', () => {
  const r = computeTax({ grossSatang: satang(310000), profile: {} }, cfg);
  assert.equal(r.taxSatang, 0);
  assert.equal(r.taxableSatang, satang(150000));
});
test('brief golden: ฿320,000 → ฿500 tax', () => {
  const r = computeTax({ grossSatang: satang(320000), profile: {} }, cfg);
  assert.equal(r.taxSatang, satang(500));
});
test('cumulative-at-floor goldens from RD table (taxable direct)', () => {
  assert.equal(taxFromTaxable(satang(300000), cfg), satang(7500));
  assert.equal(taxFromTaxable(satang(500000), cfg), satang(27500));
  assert.equal(taxFromTaxable(satang(750000), cfg), satang(65000));
  assert.equal(taxFromTaxable(satang(1000000), cfg), satang(115000));
  assert.equal(taxFromTaxable(satang(2000000), cfg), satang(365000));
  assert.equal(taxFromTaxable(satang(5000000), cfg), satang(1265000));
  assert.equal(taxFromTaxable(satang(6000000), cfg), satang(1265000 + 350000));
});
test('employment expense: 50% capped at 100k', () => {
  assert.equal(employmentExpense(satang(150000), cfg), satang(75000));
  assert.equal(employmentExpense(satang(1000000), cfg), satang(100000));
});
test('child allowance birth-year rule', () => {
  // two children born 2017 & 2019: first 30k; second born ≥2018 → 60k
  const a = allowancesTotal({ childrenBirthYears: [2017, 2019] }, cfg);
  assert.equal(a, satang(60000 + 30000 + 60000)); // personal + child1 + child2
  // both born before 2018 → 30k each
  const b = allowancesTotal({ childrenBirthYears: [2015, 2017] }, cfg);
  assert.equal(b, satang(60000 + 30000 + 30000));
});
test('spouse + parents + SSO contribution reduce taxable', () => {
  const r = computeTax({
    grossSatang: satang(600000),
    profile: { spouseNoIncome: true, parentsCared: 2, ssoContributionSatang: satang(9000) },
  }, cfg);
  // 600000 − 100000(exp) − 60000 − 60000 − 60000(parents) − 9000 = 311000 → tax = 5%·(311000−150000)... wait 311000>300000 → 7500 + 10%·11000 = 8600
  assert.equal(r.taxableSatang, satang(311000));
  assert.equal(r.taxSatang, satang(8600));
});
test('marginal / effective / next-thousand', () => {
  const r = computeTax({ grossSatang: satang(1200000), profile: {} }, cfg);
  assert.equal(r.taxableSatang, satang(1040000));
  assert.equal(r.marginalBp, 2500);
  assert.equal(r.nextThousandSatang, satang(250));
  assert.ok(r.effectiveBp > 0 && r.effectiveBp < r.marginalBp);
});
test('bands sum to total and fill correctly', () => {
  const r = computeTax({ grossSatang: satang(1200000), profile: {} }, cfg);
  const sum = r.bands.reduce((s, b) => s + b.taxSatang, 0);
  assert.equal(sum, r.taxSatang);
});
```

- [ ] **Step 3: Run — expect FAIL** · `npm test`

- [ ] **Step 4: Implement** — `site/js/engine/tax_th.js`

```js
// All amounts integer satang; rates integer bp. Config amounts are THB → ×100 here once.
const S = (thbAmount) => thbAmount * 100;

export function employmentExpense(grossSatang, cfg) {
  const { rate_bp, cap_thb } = cfg.employment_expense;
  return Math.min(Math.round(grossSatang * rate_bp / 10000), S(cap_thb));
}

export function allowancesTotal(profile = {}, cfg) {
  const A = cfg.allowances;
  let total = S(A.personal_thb);
  if (profile.spouseNoIncome) total += S(A.spouse_thb);
  const kids = [...(profile.childrenBirthYears ?? [])].sort((a, b) => a - b);
  kids.forEach((born, i) => {
    const later = i > 0 && born >= A.child_later_born_from_year;
    total += S(later ? A.child_later_thb : A.child_first_thb);
  });
  total += Math.min(profile.parentsCared ?? 0, 4) * S(A.parent_care_thb);
  total += (profile.disabledDependents ?? 0) * S(A.disabled_dependent_thb);
  return total;
}

export function taxableIncome({ grossSatang, profile = {}, deductionsSatang = 0 }, cfg) {
  const sso = profile.ssoContributionSatang ?? 0;
  return Math.max(0,
    grossSatang - employmentExpense(grossSatang, cfg) - allowancesTotal(profile, cfg) - sso - deductionsSatang);
}

export function taxFromTaxable(taxableSatang, cfg) {
  let tax = 0, prev = 0;
  for (const b of cfg.brackets) {
    const upper = b.up_to_thb === null ? Infinity : S(b.up_to_thb);
    const inBand = Math.max(0, Math.min(taxableSatang, upper) - prev);
    tax += inBand * b.rate_bp / 10000;
    prev = upper;
    if (taxableSatang <= upper) break;
  }
  return Math.round(tax);
}

export function computeTax(input, cfg) {
  const taxable = taxableIncome(input, cfg);
  const taxSatang = taxFromTaxable(taxable, cfg);
  let prev = 0, marginalBp = 0;
  const bands = [];
  for (const b of cfg.brackets) {
    const upper = b.up_to_thb === null ? null : S(b.up_to_thb);
    const hi = upper ?? Infinity;
    const amountInBand = Math.max(0, Math.min(taxable, hi) - prev);
    if (amountInBand > 0) marginalBp = b.rate_bp;
    bands.push({ fromSatang: prev, toSatang: upper, rateBp: b.rate_bp,
      amountInBandSatang: amountInBand, taxSatang: Math.round(amountInBand * b.rate_bp / 10000) });
    prev = hi;
  }
  const effectiveBp = input.grossSatang > 0 ? Math.round(taxSatang / input.grossSatang * 10000) : 0;
  const nextThousandSatang = taxFromTaxable(taxable + 100000, cfg) - taxSatang; // +฿1,000
  return { taxSatang, taxableSatang: taxable, marginalBp, effectiveBp, nextThousandSatang, bands };
}
```

- [ ] **Step 5: Run — expect PASS** · `npm test`
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(engine): Thai PIT engine with verified 2026 config and RD goldens"`

---

### Task 6: Engine — vehicle deduction caps

**Files:**
- Create: `site/js/engine/deductions.js` · Test: `site/tests/deductions.test.js`

**Interfaces:**
- Produces: `applyVehicleCaps({grossSatang, inputs}, cfg)` where `inputs = {rmf?, pvd?, gpf?, nsf?, pensionLife?, thaiEsg?, lifeIns?, healthIns?, parentsHealth?}` (satang). Returns `{allowed:{...same keys, satang}, clampedIds:string[], retirement:{usedSatang, ceilingSatang}, insurance:{usedSatang, ceilingSatang}, totalDeductibleSatang}`. Clamp order inside the ฿500k retirement ceiling is fixed: `rmf → pvd → gpf → nsf → pensionLife`. Consumed by Chapter 05 (Task 15).
- Consumes: cfg shape from Task 5.

- [ ] **Step 1: Write failing tests** — `site/tests/deductions.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satang } from '../js/engine/money.js';
import { applyVehicleCaps } from '../js/engine/deductions.js';

const cfg = JSON.parse(readFileSync(new URL('../config/tax/th/2026.json', import.meta.url)));
const run = (grossTHB, inputsTHB) => applyVehicleCaps({
  grossSatang: satang(grossTHB),
  inputs: Object.fromEntries(Object.entries(inputsTHB).map(([k, v]) => [k, satang(v)])),
}, cfg);

test('RMF alone: min(30% income, 500k)', () => {
  assert.equal(run(1000000, { rmf: 400000 }).allowed.rmf, satang(300000)); // 30% binds
  assert.equal(run(3000000, { rmf: 600000 }).allowed.rmf, satang(500000)); // cap binds
});
test('shared 500k ceiling: pension life inside it', () => {
  const r = run(4000000, { rmf: 400000, pensionLife: 200000 });
  assert.equal(r.allowed.rmf, satang(400000));
  assert.equal(r.allowed.pensionLife, satang(100000)); // only 100k headroom left
  assert.deepEqual(r.clampedIds.includes('pensionLife'), true);
  assert.equal(r.retirement.usedSatang, satang(500000));
});
test('Thai ESG stacks separately from the 500k', () => {
  const r = run(4000000, { rmf: 500000, thaiEsg: 400000 });
  assert.equal(r.allowed.rmf, satang(500000));
  assert.equal(r.allowed.thaiEsg, satang(300000)); // its own 300k cap, NOT squeezed by ceiling
  assert.equal(r.totalDeductibleSatang, satang(800000));
});
test('PVD 15% test binds before ceiling', () => {
  assert.equal(run(1000000, { pvd: 300000 }).allowed.pvd, satang(150000));
});
test('insurance group: life+health ≤ 100k, health ≤ 25k', () => {
  const r = run(2000000, { lifeIns: 90000, healthIns: 25000 });
  assert.equal(r.allowed.lifeIns, satang(90000));
  assert.equal(r.allowed.healthIns, satang(10000)); // group cap 100k
  const r2 = run(2000000, { healthIns: 40000 });
  assert.equal(r2.allowed.healthIns, satang(25000)); // own cap
});
test('parents health independent 15k; NSF fund cap 30k', () => {
  const r = run(2000000, { parentsHealth: 20000, nsf: 50000 });
  assert.equal(r.allowed.parentsHealth, satang(15000));
  assert.equal(r.allowed.nsf, satang(30000));
});
```

- [ ] **Step 2: Run — expect FAIL** · `npm test`

- [ ] **Step 3: Implement** — `site/js/engine/deductions.js`

```js
const S = (thb) => thb * 100;
const perVehicleCap = (v, grossSatang) => {
  const incomeCap = v.income_cap_bp === null ? Infinity : Math.round(grossSatang * v.income_cap_bp / 10000);
  return Math.min(incomeCap, S(v.cap_thb));
};

export function applyVehicleCaps({ grossSatang, inputs = {} }, cfg) {
  const V = cfg.vehicles;
  const allowed = {}; const clampedIds = [];
  const clamp = (id, want, cap) => {
    const got = Math.max(0, Math.min(want ?? 0, cap));
    if ((want ?? 0) > got) clampedIds.push(id);
    allowed[id] = got; return got;
  };

  // Retirement group, fixed order, shared ceiling
  const ceiling = S(V.retirement_ceiling_thb);
  let used = 0;
  for (const [id, key] of [['rmf','rmf'],['pvd','pvd'],['gpf','gpf'],['nsf','nsf'],['pensionLife','pension_life']]) {
    const cap = Math.min(perVehicleCap(V[key], grossSatang), ceiling - used);
    used += clamp(id, inputs[id], cap);
  }

  // Thai ESG — separate stack
  clamp('thaiEsg', inputs.thaiEsg, perVehicleCap(V.thai_esg, grossSatang));

  // Insurance 100k group: health own-cap first, then group cap
  const groupCap = S(V.insurance100k_group_cap_thb);
  const health = clamp('healthIns', inputs.healthIns, Math.min(perVehicleCap(V.health_ins, grossSatang), groupCap));
  clamp('lifeIns', inputs.lifeIns, Math.min(perVehicleCap(V.life_ins, grossSatang), groupCap - health));
  // group check when life entered first exceeds: recompute health against remaining
  if ((allowed.lifeIns + allowed.healthIns) > groupCap) {
    allowed.healthIns = groupCap - allowed.lifeIns;
    if (!clampedIds.includes('healthIns')) clampedIds.push('healthIns');
  }

  clamp('parentsHealth', inputs.parentsHealth, perVehicleCap(V.parents_health, grossSatang));

  const totalDeductibleSatang = Object.values(allowed).reduce((a, b) => a + b, 0);
  return {
    allowed, clampedIds,
    retirement: { usedSatang: used, ceilingSatang: ceiling },
    insurance: { usedSatang: allowed.lifeIns + allowed.healthIns, ceilingSatang: groupCap },
    totalDeductibleSatang,
  };
}
```

- [ ] **Step 4: Run — expect PASS.** Note the insurance test order-sensitivity: the test enters life=90k **then** health=25k expecting health clamped to 10k — the implementation clamps health first. Fix the implementation order to match the documented UI priority (life before health) if the test fails:  in the group section, clamp `lifeIns` first against `groupCap`, then `healthIns` against `min(own cap, groupCap − life)`. Run `npm test` until green with that order, and keep the final order documented in a code comment.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(engine): vehicle deduction caps — shared 500k ceiling, separate stacks, insurance group"`

---

### Task 7: Engine — withdrawal targets + SSO pension + app config

**Files:**
- Create: `site/js/engine/withdrawal.js`, `site/js/engine/sso.js`, `site/config/app.json` · Test: `site/tests/withdrawal_sso.test.js`

**Interfaces:**
- Produces:
  - `site/config/app.json` (consumed by Tasks 12–14, 18): `{ swr: {low_bp:390, high_bp:570, as_of:"2026-08-01", source}, mc: {paths:1000, volatility_bp:1500, seed:2569}, scenarios: {bear:{return_bp:400, inflation_bp:200}, base:{return_bp:600, inflation_bp:150}, bull:{return_bp:800, inflation_bp:100}}, demo_brackets:[{up_to:10000,rate_bp:0},{up_to:40000,rate_bp:1000},{up_to:null,rate_bp:3000}], verified_on, review_by, sources[] }`
  - `targetRange({annualSpendSatang, guaranteedAnnualSatang=0}, appCfg) : {low:{rateBp,multiple,targetSatang}, high:{...}, fundedSpendSatang}` — `target = fundedSpend × 10000/rateBp`, `multiple = 10000/rateBp` (25.6× / 17.5×)
  - `ssoMonthlyPension({avgMonthlyWageSatang, monthsContributed, claimYear}, ssoCfg) : number` — 0 if months < 180; else `(2000 + 150·floor((months−180)/12)) bp` of `min(wage, ceiling(claimYear))`. `ssoCfg` lives inside `app.json` as `sso: {min_months:180, base_bp:2000, per_year_bp:150, ceiling_schedule:[{from:2026,to:2028,ceiling_thb:17500},{from:2029,to:2031,ceiling_thb:20000},{from:2032,to:null,ceiling_thb:23000}]}`
- Consumes: nothing new.

- [ ] **Step 1: Write `site/config/app.json`** exactly as the shape above, filled:

```json
{
  "verified_on": "2026-08-01",
  "review_by": "2027-01-31",
  "sources": [
    "https://static.twentyoverten.com/5b5730126af0247efe4f2066/zT8sbuFanVR/Morningstar-2025-State-of-Retirement-Income.pdf",
    "https://www.bot.or.th/en/our-roles/monetary-policy/monetary-policy-target.html",
    "https://flowaccount.com/blog/new-social-security-ceiling-2026/"
  ],
  "swr": { "low_bp": 390, "high_bp": 570, "as_of": "2026-08-01" },
  "mc": { "paths": 1000, "volatility_bp": 1500, "seed": 2569 },
  "scenarios": {
    "bear": { "return_bp": 400, "inflation_bp": 200 },
    "base": { "return_bp": 600, "inflation_bp": 150 },
    "bull": { "return_bp": 800, "inflation_bp": 100 }
  },
  "demo_brackets": [
    { "up_to": 10000, "rate_bp": 0 },
    { "up_to": 40000, "rate_bp": 1000 },
    { "up_to": null,  "rate_bp": 3000 }
  ],
  "sso": {
    "min_months": 180, "base_bp": 2000, "per_year_bp": 150,
    "ceiling_schedule": [
      { "from": 2026, "to": 2028, "ceiling_thb": 17500 },
      { "from": 2029, "to": 2031, "ceiling_thb": 20000 },
      { "from": 2032, "to": null, "ceiling_thb": 23000 }
    ]
  }
}
```

- [ ] **Step 2: Write failing tests** — `site/tests/withdrawal_sso.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satang } from '../js/engine/money.js';
import { targetRange } from '../js/engine/withdrawal.js';
import { ssoMonthlyPension } from '../js/engine/sso.js';

const app = JSON.parse(readFileSync(new URL('../config/app.json', import.meta.url)));

test('targetRange multiples: 3.9% → ~25.6×, 5.7% → ~17.5×', () => {
  const r = targetRange({ annualSpendSatang: satang(390000) }, app);
  assert.ok(Math.abs(r.low.multiple - 25.64) < 0.01);
  assert.ok(Math.abs(r.high.multiple - 17.54) < 0.01);
  assert.equal(r.low.targetSatang, satang(10000000)); // 390k / 3.9% = 10,000,000
});
test('guaranteed income nets off before the multiple', () => {
  const r = targetRange({ annualSpendSatang: satang(400000), guaranteedAnnualSatang: satang(100000) }, app);
  assert.equal(r.fundedSpendSatang, satang(300000));
  assert.equal(r.low.targetSatang, Math.round(satang(300000) * 10000 / 390));
  const zero = targetRange({ annualSpendSatang: satang(50000), guaranteedAnnualSatang: satang(90000) }, app);
  assert.equal(zero.low.targetSatang, 0);
});
test('SSO: below 180 months → 0', () => {
  assert.equal(ssoMonthlyPension({ avgMonthlyWageSatang: satang(20000), monthsContributed: 179, claimYear: 2026 }, app.sso), 0);
});
test('SSO: 180 months at/above ceiling 2026 → 20% of 17,500 = ฿3,500', () => {
  assert.equal(ssoMonthlyPension({ avgMonthlyWageSatang: satang(30000), monthsContributed: 180, claimYear: 2026 }, app.sso), satang(3500));
});
test('SSO: 240 months → 27.5%; ceiling schedule by claim year', () => {
  assert.equal(ssoMonthlyPension({ avgMonthlyWageSatang: satang(30000), monthsContributed: 240, claimYear: 2026 }, app.sso), satang(4812.5));
  assert.equal(ssoMonthlyPension({ avgMonthlyWageSatang: satang(30000), monthsContributed: 240, claimYear: 2030 }, app.sso), satang(5500)); // 27.5% of 20,000
});
```

- [ ] **Step 3: Run — expect FAIL** · `npm test`

- [ ] **Step 4: Implement** — `site/js/engine/withdrawal.js`

```js
export function targetRange({ annualSpendSatang, guaranteedAnnualSatang = 0 }, appCfg) {
  const funded = Math.max(0, annualSpendSatang - guaranteedAnnualSatang);
  const leg = (rateBp) => ({
    rateBp,
    multiple: 10000 / rateBp,
    targetSatang: Math.round(funded * 10000 / rateBp),
  });
  return { low: leg(appCfg.swr.low_bp), high: leg(appCfg.swr.high_bp), fundedSpendSatang: funded };
}
```

`site/js/engine/sso.js`

```js
export function ssoMonthlyPension({ avgMonthlyWageSatang, monthsContributed, claimYear }, ssoCfg) {
  if (monthsContributed < ssoCfg.min_months) return 0;
  const row = ssoCfg.ceiling_schedule.find(r => claimYear >= r.from && (r.to === null || claimYear <= r.to));
  const base = Math.min(avgMonthlyWageSatang, row.ceiling_thb * 100);
  const bp = ssoCfg.base_bp + ssoCfg.per_year_bp * Math.floor((monthsContributed - ssoCfg.min_months) / 12);
  return Math.round(base * bp / 10000);
}
```

- [ ] **Step 5: Run — expect PASS** · `npm test`
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(engine): withdrawal target range and SSO pension with gazetted ceiling schedule"`

---

### Task 8: Calendar config + milestones + .ics generator

**Files:**
- Create: `site/config/calendar/th/2026.json`, `site/js/engine/milestones.js`, `site/js/ics.js` · Test: `site/tests/calendar_ics.test.js`

**Interfaces:**
- Produces:
  - Calendar config: `{tax_year, be_year, verified_on, review_by, sources[], events:[{id, date:"YYYY-MM-DD", locale_key, kind:"statutory"|"sunset"|"info", note_key?}]}` — **dates are explicit ISO dates for the season already resolved** (no +8 hard-code; the note for e-filing lives in copy).
  - `personalMilestones(birthYear:number, nowYear:number):Array<{id:'rmf55'|'nsf60'|'exempt65', age:number, year:number}>` (pure arithmetic, config-free).
  - `buildICS(events:Array<{uid:string, dateISO:'YYYY-MM-DD', summary:string, description?:string}>):string` — folds none, CRLF `\r\n`, escapes `, ; \n`, `VALUE=DATE`, `PRODID:-//Kasian Sultan//EN`.
- Consumes: nothing new. Chapter 06 (Task 16) consumes all three.

- [ ] **Step 1: Write the calendar config** — dates per research brief §4; TY2026 files in 2027 **without** assuming the lapsed e-file extension:

```json
{
  "tax_year": 2026, "be_year": 2569,
  "verified_on": "2026-08-01", "review_by": "2027-01-31",
  "sources": [
    "https://www.rd.go.th/english/6045.html",
    "https://www.rd.go.th/5937.html",
    "https://sherrings.com/esg-mutual-fund-tax-incentive-thailand.html"
  ],
  "events": [
    { "id": "pnd94",      "date": "2026-09-30", "kind": "statutory", "locale_key": "cal.pnd94",   "note_key": "cal.pnd94Note" },
    { "id": "fundCutoff", "date": "2026-12-28", "kind": "info",      "locale_key": "cal.cutoff",  "note_key": "cal.cutoffNote" },
    { "id": "esgSunset",  "date": "2026-12-31", "kind": "sunset",    "locale_key": "cal.esg",     "note_key": "cal.esgNote" },
    { "id": "tavi50",     "date": "2027-02-15", "kind": "statutory", "locale_key": "cal.tavi",    "note_key": "cal.taviNote" },
    { "id": "filing",     "date": "2027-03-31", "kind": "statutory", "locale_key": "cal.filing",  "note_key": "cal.filingNote" }
  ]
}
```

- [ ] **Step 2: Write failing tests** — `site/tests/calendar_ics.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { personalMilestones } from '../js/engine/milestones.js';
import { buildICS } from '../js/ics.js';

test('calendar config sane and dated', () => {
  const cal = JSON.parse(readFileSync(new URL('../config/calendar/th/2026.json', import.meta.url)));
  assert.equal(cal.events.length, 5);
  for (const e of cal.events) assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(cal.events.some(e => e.id === 'esgSunset' && e.date === '2026-12-31'));
});
test('personal milestones from birth year', () => {
  const m = personalMilestones(1990, 2026);
  assert.deepEqual(m, [
    { id: 'rmf55', age: 55, year: 2045 },
    { id: 'nsf60', age: 60, year: 2050 },
    { id: 'exempt65', age: 65, year: 2055 },
  ]);
});
test('ICS structure, CRLF, escaping', () => {
  const ics = buildICS([{ uid: 'a@kasian', dateISO: '2027-03-31', summary: 'File PND90/91; do not be late', description: 'Line1\nLine2, with; chars' }]);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('BEGIN:VEVENT\r\n'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20270331'));
  assert.ok(ics.includes('SUMMARY:File PND90/91\\; do not be late'));
  assert.ok(ics.includes('DESCRIPTION:Line1\\nLine2\\, with\\; chars'));
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
  assert.ok(!/(^|[^\r])\n/.test(ics), 'every LF must be preceded by CR');
});
```

- [ ] **Step 3: Run — expect FAIL** · `npm test`

- [ ] **Step 4: Implement** — `site/js/engine/milestones.js`

```js
export function personalMilestones(birthYear, _nowYear) {
  return [
    { id: 'rmf55', age: 55, year: birthYear + 55 },
    { id: 'nsf60', age: 60, year: birthYear + 60 },
    { id: 'exempt65', age: 65, year: birthYear + 65 },
  ];
}
```

`site/js/ics.js`

```js
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

export function buildICS(events) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kasian Sultan//EN', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    const d = e.dateISO.replaceAll('-', '');
    L.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${d}T000000Z`,
      `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${esc(e.summary)}`);
    if (e.description) L.push(`DESCRIPTION:${esc(e.description)}`);
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n') + '\r\n';
}
```

- [ ] **Step 5: Run — expect PASS** · `npm test`
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: calendar config, personal milestones, client-side ics generator"`

---

### Task 9: i18n + locale seeds + parity test + staleness

**Files:**
- Create: `site/js/i18n.js`, `site/js/staleness.js`, `site/locales/en.json`, `site/locales/th.json` · Test: `site/tests/i18n.test.js`

**Interfaces:**
- Produces:
  - `initI18n():Promise<'en'|'th'>` — order: `localStorage['ks-locale']` → `navigator.language` startsWith `th` → `'en'`; loads both locale JSONs via `fetch('./locales/…')` in browser; sets `document.documentElement.lang`.
  - `t(key:string, params?:object):string` — dot-path; `{name}` interpolation; missing key in active locale falls back to EN; missing in both returns the key itself.
  - `setLocale(l:'en'|'th'):void` — persists to localStorage, swaps every `[data-i18n]` element's text (`data-i18n` holds the key; optional `data-i18n-attr="aria-label"`), dispatches `document` CustomEvent `'i18n:change'`.
  - `beYear(ce:number):number` = ce + 543. `yearLabel(ce, locale)` → `'2026'` (en) / `'2569 (2026)'` (th).
  - `staleness.js`: `isStale(cfg:{review_by:string}, todayISO:string):boolean` (string compare on ISO dates).
  - Locale JSON key tree (top-level): `chrome`, `hero`, `time`, `number`, `climb`, `rules`, `cheats`, `cal`, `instruments`, `begin`, `disclaimer`.
- For node tests, `i18n.js` accepts injected dictionaries: `_initForTest(enObj, thObj, locale)`.

- [ ] **Step 1: Write locale seeds.** `site/locales/en.json` — full EN copy for chrome + disclaimer now (chapter copy keys are added by their chapter tasks; parity test runs on key sets so both files always move together):

```json
{
  "chrome": {
    "wordmark": "KASIAN SULTAN",
    "tagline": "Retire like a sultan",
    "footerDisclaimer": "Educational only — not financial advice.",
    "langToggle": "ไทย",
    "chapterIndex": "Chapters",
    "stale": "These figures were last verified {date}. Tax rules change — confirm at rd.go.th."
  },
  "disclaimer": {
    "title": "What this site is — and is not",
    "full": "Kasian Sultan is a free educational project. It is not investment, tax, or legal advice, and no part of it is a recommendation to buy or sell any fund, security, or product. It is not operated by a licensed securities professional, financial advisor, or tax preparer, and is not affiliated with any financial institution or government agency. The calculators are illustrations driven entirely by assumptions you choose; projections are mathematical scenarios, not predictions or guarantees — real markets rise, fall, and misbehave, and past or assumed returns do not determine future results. Tax rules shown are for tax year 2026 (B.E. 2569), verified against the sources listed below on the date shown, and change often — confirm current rules with the Revenue Department (rd.go.th) before acting. Before making investment, tax, or retirement decisions, consult a licensed professional: an SEC-licensed investment advisor for investments, or a qualified tax advisor for your filing. Nothing you enter here is collected, stored, or transmitted — all calculations run and remain in your browser (your language choice is saved on your own device only)."
  }
}
```

`site/locales/th.json` — same keys, Thai (verbatim; chapter tasks append their own keys in both files):

```json
{
  "chrome": {
    "wordmark": "KASIAN SULTAN",
    "tagline": "เกษียณอย่างสุลต่าน",
    "footerDisclaimer": "เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน",
    "langToggle": "EN",
    "chapterIndex": "สารบัญ",
    "stale": "ตัวเลขเหล่านี้ตรวจสอบล่าสุดเมื่อ {date} กฎภาษีเปลี่ยนแปลงได้ โปรดตรวจสอบที่ rd.go.th"
  },
  "disclaimer": {
    "title": "เว็บไซต์นี้คืออะไร — และไม่ใช่อะไร",
    "full": "Kasian Sultan เป็นโครงการเพื่อการศึกษาที่ไม่มีค่าใช้จ่าย ไม่ใช่คำแนะนำด้านการลงทุน ภาษี หรือกฎหมาย และไม่มีส่วนใดเป็นคำแนะนำให้ซื้อหรือขายกองทุน หลักทรัพย์ หรือผลิตภัณฑ์ใด ๆ เว็บไซต์นี้ไม่ได้ดำเนินการโดยผู้ประกอบวิชาชีพที่ได้รับใบอนุญาตด้านหลักทรัพย์ ที่ปรึกษาการเงิน หรือผู้จัดทำภาษี และไม่มีส่วนเกี่ยวข้องกับสถาบันการเงินหรือหน่วยงานรัฐใด ๆ เครื่องคำนวณทั้งหมดเป็นเพียงภาพประกอบที่ขับเคลื่อนด้วยสมมติฐานที่คุณเลือกเอง ผลการฉายภาพเป็นสถานการณ์ทางคณิตศาสตร์ ไม่ใช่คำพยากรณ์หรือการรับประกัน — ตลาดจริงขึ้น ลง และผันผวนได้เสมอ ผลตอบแทนในอดีตหรือที่สมมติไว้ไม่ได้กำหนดผลลัพธ์ในอนาคต กฎภาษีที่แสดงเป็นของปีภาษี 2569 (2026) ตรวจสอบกับแหล่งข้อมูลที่ระบุไว้ด้านล่าง ณ วันที่แสดง และเปลี่ยนแปลงได้บ่อย — โปรดยืนยันกฎปัจจุบันกับกรมสรรพากร (rd.go.th) ก่อนดำเนินการ ก่อนตัดสินใจด้านการลงทุน ภาษี หรือการเกษียณ โปรดปรึกษาผู้ประกอบวิชาชีพที่ได้รับใบอนุญาต: ที่ปรึกษาการลงทุนที่ได้รับใบอนุญาตจาก ก.ล.ต. สำหรับการลงทุน หรือผู้เชี่ยวชาญด้านภาษีสำหรับการยื่นภาษีของคุณ ข้อมูลที่คุณกรอกจะไม่ถูกเก็บ บันทึก หรือส่งไปที่ใดทั้งสิ้น — การคำนวณทั้งหมดทำงานและคงอยู่ในเบราว์เซอร์ของคุณเท่านั้น (ตัวเลือกภาษาถูกบันทึกไว้ในอุปกรณ์ของคุณเองเท่านั้น)"
  }
}
```

- [ ] **Step 2: Write failing tests** — `site/tests/i18n.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { _initForTest, t, beYear, yearLabel } from '../js/i18n.js';
import { isStale } from '../js/staleness.js';

const en = JSON.parse(readFileSync(new URL('../locales/en.json', import.meta.url)));
const th = JSON.parse(readFileSync(new URL('../locales/th.json', import.meta.url)));

const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'object' && v !== null ? keys(v, `${p}${k}.`) : [`${p}${k}`]);

test('locale key parity en ↔ th', () => {
  assert.deepEqual(keys(en).sort(), keys(th).sort());
});
test('t: dot path, interpolation, fallback', () => {
  _initForTest(en, th, 'th');
  assert.equal(t('chrome.tagline'), 'เกษียณอย่างสุลต่าน');
  assert.equal(t('chrome.stale', { date: '1 ส.ค. 2569' }).includes('1 ส.ค. 2569'), true);
  assert.equal(t('no.such.key'), 'no.such.key');
});
test('BE years', () => {
  assert.equal(beYear(2026), 2569);
  assert.equal(yearLabel(2026, 'en'), '2026');
  assert.equal(yearLabel(2026, 'th'), '2569 (2026)');
});
test('staleness by ISO compare', () => {
  assert.equal(isStale({ review_by: '2027-01-31' }, '2026-08-01'), false);
  assert.equal(isStale({ review_by: '2027-01-31' }, '2027-02-01'), true);
});
```

- [ ] **Step 3: Run — expect FAIL** · `npm test`

- [ ] **Step 4: Implement** — `site/js/staleness.js`

```js
export const isStale = (cfg, todayISO) => todayISO > cfg.review_by;
```

`site/js/i18n.js`

```js
let dicts = { en: {}, th: {} };
let active = 'en';

export function _initForTest(en, th, locale) { dicts = { en, th }; active = locale; }

export async function initI18n() {
  const [en, th] = await Promise.all(
    ['en', 'th'].map(l => fetch(`./locales/${l}.json`).then(r => r.json())));
  dicts = { en, th };
  const saved = localStorage.getItem('ks-locale');
  active = saved === 'th' || saved === 'en' ? saved
    : (navigator.language || '').toLowerCase().startsWith('th') ? 'th' : 'en';
  document.documentElement.lang = active;
  return active;
}

const dig = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

export function t(key, params = {}) {
  let s = dig(dicts[active], key) ?? dig(dicts.en, key) ?? key;
  for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function getLocale() { return active; }

export function setLocale(l) {
  active = l;
  localStorage.setItem('ks-locale', l);
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) el.setAttribute(attr, t(key)); else el.textContent = t(key);
  });
  document.dispatchEvent(new CustomEvent('i18n:change', { detail: { locale: l } }));
}

export const beYear = (ce) => ce + 543;
export const yearLabel = (ce, locale) => locale === 'th' ? `${beYear(ce)} (${ce})` : `${ce}`;
```

- [ ] **Step 5: Run — expect PASS** · `npm test`
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: i18n with EN/TH parity test, BE years, staleness check, verbatim disclaimers"`

---

### Task 10: Shell — index.html, kasian.css, choreography, fonts

**Files:**
- Create: `site/index.html`, `site/css/kasian.css`, `site/js/choreography.js`, `site/js/session.js`, `site/js/main.js`, `site/fonts/*.woff2`

**Interfaces:**
- Produces (consumed by every chapter task):
  - `session.js`: `export const session = { age: 30, monthlyTHB: 5000, retireAge: 60, essentialTHB: 15000, discretionaryTHB: 8000, guaranteedTHB: 0, incomeTHB: 480000, scenario: 'base' };` and `export function update(patch)` which `Object.assign`s and dispatches `document` CustomEvent `'session:change'` with `{detail: patch}`.
  - `choreography.js`: `initChoreography()` — IntersectionObserver (threshold 0.35) toggles `.is-active` on `section.chapter`; syncs `#rail` links (`aria-current`); `animateCount(el, toNumber, {format})` rAF count-up ~700 ms, instant when `matchMedia('(prefers-reduced-motion: reduce)')`, runs once per activation.
  - DOM contract: each chapter is `<section class="chapter scene-ink|scene-paper" id="ch-XX" data-chapter="XX">`, contains `.chapter__inner`, and a footer `<p class="microlabel" data-i18n="chrome.footerDisclaimer">`. Interactive mount points use ids `ch01-dial`, `ch02-panel`, `ch03-chart`, `ch04-stairs`, `ch05-panel`, `ch06-timeline`, `ch07-cards`, `ch08-sources` (chapter tasks fill them).
  - CSS tokens exactly as spec §2; utility classes `.microlabel`, `.display`, `.stat`, `.hairline`, `.gold`; `#rail` fixed right with dots 00–08.
- Consumes: `initI18n`, `setLocale`, `t` (Task 9).

- [ ] **Step 1: Fetch fonts (self-hosted).** Run, from repo root:

```bash
mkdir -p site/fonts && cd site/fonts
# Fraunces variable (display EN), Inter (UI), IBM Plex Sans Thai Looped (TH)
curl -sL "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&display=swap" -A "Mozilla/5.0" -o fraunces.css
curl -sL "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" -A "Mozilla/5.0" -o inter.css
curl -sL "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@400;500;600&display=swap" -A "Mozilla/5.0" -o plexthai.css
# Download every woff2 URL found in those css files, rewrite css to local paths:
grep -hoE 'https://[^)]+\.woff2' *.css | sort -u | while read u; do curl -sL "$u" -o "$(basename "$u")"; done
sed -i '' -E 's#https://[^)]+/([^/)]+\.woff2)#\1#g' *.css
```

If the fetch fails (offline), proceed with fallback stacks only (`Georgia, serif` / `system-ui` / `Thonburi, sans-serif`) — the CSS in Step 2 already declares them; fonts are progressive enhancement. Check total: `du -ch site/fonts/*.woff2` ≤ 250 KB; if over, delete unused weights/subsets (keep latin for Fraunces/Inter, thai+latin for Plex Thai Looped).

- [ ] **Step 2: Write `site/css/kasian.css`** — tokens + scenes + chrome + choreography states (core mechanisms in full; this file is the design system):

```css
:root {
  --ink: #0B0B0C; --paper: #F6F4EF; --gold: #C6A15B; --gold-hi: #E9CD8F;
  --line-dark: rgba(246,244,239,.14); --line-light: rgba(11,11,12,.12);
  --muted-dark: rgba(246,244,239,.55); --muted-light: rgba(11,11,12,.55);
  --font-display: "Fraunces", Georgia, "Times New Roman", serif;
  --font-ui: "Inter", system-ui, -apple-system, sans-serif;
  --step-hero: clamp(3rem, 10vw, 9rem);
  --step-h2: clamp(2rem, 6vw, 4.5rem);
  --dur: 700ms; --ease: cubic-bezier(.22,.8,.24,1);
}
:lang(th) { --font-display: "IBM Plex Sans Thai Looped", "Thonburi", sans-serif;
            --font-ui: "IBM Plex Sans Thai Looped", "Thonburi", system-ui, sans-serif; }

* { box-sizing: border-box; margin: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-ui); background: var(--ink); color: var(--paper); }

.chapter { min-height: 100svh; display: grid; place-items: center;
  padding: clamp(3rem, 8vh, 6rem) clamp(1.25rem, 6vw, 5rem); position: relative; }
.scene-ink   { background: var(--ink);   color: var(--paper); --line: var(--line-dark);  --muted: var(--muted-dark); }
.scene-paper { background: var(--paper); color: var(--ink);   --line: var(--line-light); --muted: var(--muted-light); }
.chapter__inner { width: min(100%, 68rem); }

.display { font-family: var(--font-display); font-weight: 340; line-height: .98;
  font-size: var(--step-h2); letter-spacing: -0.015em; }
.hero-title { font-size: var(--step-hero); }
.microlabel { font-size: .72rem; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); }
.gold { color: var(--gold); }
.stat { font-variant-numeric: tabular-nums; font-weight: 600; }
.hairline { border: 0; border-top: 1px solid var(--line); }

/* choreography: masked line reveal + rise */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease); }
.reveal:nth-child(2) { transition-delay: 90ms; } .reveal:nth-child(3) { transition-delay: 180ms; }
.is-active .reveal { opacity: 1; transform: none; }

/* hairlines draw in */
.drawline { transform: scaleX(0); transform-origin: left; transition: transform 900ms var(--ease) 120ms; }
.is-active .drawline { transform: scaleX(1); }

/* chapter wipe: gold sweep on activation */
.chapter::before { content: ""; position: absolute; inset: 0 100% 0 0; background: var(--gold);
  opacity: .06; transition: inset 800ms var(--ease); pointer-events: none; }
.is-active::before { inset: 0; }

/* progress rail */
#rail { position: fixed; right: clamp(.5rem, 2vw, 1.5rem); top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; gap: .9rem; z-index: 10; }
#rail a { width: 8px; height: 8px; border-radius: 50%; background: var(--line-dark);
  transition: background .3s, transform .3s; }
#rail a[aria-current="true"] { background: var(--gold); transform: scale(1.4); }

/* chrome */
#chrome { position: fixed; inset: 0 0 auto 0; display: flex; justify-content: space-between;
  align-items: center; padding: 1.1rem clamp(1.25rem, 4vw, 3rem); z-index: 10; mix-blend-mode: difference; color: #fff; }
#chrome button { all: unset; cursor: pointer; }

/* controls */
input[type="range"] { width: 100%; accent-color: var(--gold); }
.control-row { display: grid; grid-template-columns: 1fr auto; gap: .6rem; align-items: baseline; margin-block: .9rem; }

/* banners */
#stale-banner { position: fixed; inset: auto 0 0 0; background: var(--gold); color: var(--ink);
  padding: .5rem 1rem; font-size: .8rem; text-align: center; z-index: 20; display: none; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal, .drawline, .chapter::before, #rail a { transition: none !important; }
  .reveal { opacity: 1; transform: none; } .drawline { transform: scaleX(1); }
}
```

- [ ] **Step 3: Write `site/index.html`** — full skeleton (all 9 sections with ids/classes per DOM contract, alternating scenes ink/paper starting ink at 00; chrome with wordmark + lang toggle `id="lang-toggle"` + chapter index `<details>`; `#rail` with 9 dots linking `#ch-00`…`#ch-08`; `#stale-banner`; every chapter footer carries the microlabel disclaimer; `<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`; `<noscript>` paragraph per chapter slot explaining calculators need JS while all copy remains visible). Mount-point ids exactly: `ch01-dial`, `ch02-panel`, `ch03-chart`, `ch04-stairs`, `ch05-panel`, `ch06-timeline`, `ch07-cards`, `ch08-sources`. Load `./css/kasian.css` and the three font css files; `<script type="module" src="./js/main.js">`.

- [ ] **Step 4: Write `site/js/session.js`** exactly per Interfaces, and `site/js/choreography.js`:

```js
// choreography.js
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initChoreography() {
  const chapters = document.querySelectorAll('section.chapter');
  const rail = document.querySelectorAll('#rail a');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-active');
        const n = e.target.dataset.chapter;
        rail.forEach(a => a.setAttribute('aria-current', a.hash === `#ch-${n}` ? 'true' : 'false'));
      }
    }
  }, { threshold: 0.35 });
  chapters.forEach(c => io.observe(c));
}

export function animateCount(el, to, { format = (v) => String(Math.round(v)) } = {}) {
  if (reduced) { el.textContent = format(to); return; }
  const from = Number(el.dataset.from ?? 0), t0 = performance.now(), D = 700;
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / D), e = 1 - (1 - k) ** 3;
    el.textContent = format(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  el.dataset.from = to;
}
```

`site/js/main.js`:

```js
import { initI18n, setLocale, getLocale, t } from './i18n.js';
import { initChoreography } from './choreography.js';
import { isStale } from './staleness.js';

const todayISO = new Date().toISOString().slice(0, 10);

async function boot() {
  await initI18n();
  setLocale(getLocale());                    // stamp all [data-i18n] once
  initChoreography();
  document.getElementById('lang-toggle').addEventListener('click',
    () => setLocale(getLocale() === 'en' ? 'th' : 'en'));

  const taxCfg = await fetch('./config/tax/th/2026.json').then(r => r.json());
  if (isStale(taxCfg, todayISO)) {
    const b = document.getElementById('stale-banner');
    b.style.display = 'block';
    b.textContent = t('chrome.stale', { date: taxCfg.verified_on });
  }
  // chapter modules registered here as later tasks land:
  for (const mod of ['hero','time','number','climb','rules','cheats','calendar','instruments','begin']) {
    try { (await import(`./chapters/${mod}.js`)).init?.(); } catch { /* chapter not built yet */ }
  }
}
boot();
```

- [ ] **Step 5: Visual acceptance (manual, via preview).** Serve `site/` (`python3 -m http.server 4173 --directory site`) and verify: 9 chapters snap-scroll with alternating scenes; gold wipe plays once per chapter entry; rail dot tracks and clicks jump; EN⇄ไทย toggle swaps chrome strings live (footer disclaimers change); `<html lang>` updates; with DevTools "emulate prefers-reduced-motion" everything appears instantly; keyboard Tab reaches toggle + rail; no console errors; no network requests beyond self.

- [ ] **Step 6: Run tests (unchanged suite must stay green)** · `npm test`
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: shell — scenes, choreography, chrome, rail, staleness banner, fonts"`

---

### Task 11: Chapters 00 Hero + 01 Time

**Files:**
- Create: `site/js/chapters/hero.js`, `site/js/chapters/time.js` · Modify: `site/index.html` (fill `#ch-00`, `#ch-01` inner content), `site/locales/en.json` + `site/locales/th.json` (add `hero.*`, `time.*` keys — every EN key added must land in TH in the same commit; Thai copy written now, refined in Task 19)

**Interfaces:**
- Consumes: `session/update`, `animateCount`, `t`, `fmtTHB`.
- Produces: hero = static scene (CSS-only gold particle drift: ~24 absolutely-positioned 2px dots animated with long `translate` keyframes, `animation: none` under reduced motion). `time.js` exports `init()`; renders age dial into `#ch01-dial`; on input calls `update({age})`; displays `yearsLeft = Math.max(0, 65 − age)` and doublings `≈ yearsLeft / (72 / 6)` labelled as the rule-of-72 illustration at the base scenario's 6%.
- Locale keys added (EN shown; TH mirrors): `hero.title` "Kasian Sultan", `hero.sub` "A free guide to retiring in Thailand — the math, the tax, the dates.", `hero.privacy` "Nothing you type leaves this page.", `hero.scroll` "Scroll", `time.title` "Time is the asset.", `time.ageLabel` "Your age", `time.yearsLeft` "years until 65", `time.doublings` "times your money can double by 65 at 6% — the rule of 72, an illustration, not a promise".

- [ ] **Step 1: Fill `#ch-00` and `#ch-01` markup** in `index.html`:

```html
<!-- inside #ch-00 .chapter__inner -->
<p class="microlabel reveal" data-i18n="hero.privacy"></p>
<h1 class="display hero-title reveal"><span data-i18n="hero.title"></span></h1>
<p class="reveal" style="color:var(--muted)" data-i18n="hero.sub"></p>
<p class="microlabel reveal" data-i18n="hero.scroll"></p>

<!-- inside #ch-01 .chapter__inner -->
<h2 class="display reveal" data-i18n="time.title"></h2>
<hr class="hairline drawline">
<div id="ch01-dial" class="reveal"></div>
```

- [ ] **Step 2: Implement `site/js/chapters/time.js`**

```js
import { session, update } from '../session.js';
import { animateCount } from '../choreography.js';
import { t } from '../i18n.js';

export function init() {
  const host = document.getElementById('ch01-dial');
  host.innerHTML = `
    <div class="control-row">
      <label for="age-in" class="microlabel" data-i18n="time.ageLabel">${t('time.ageLabel')}</label>
      <output class="stat gold" id="age-out">${session.age}</output>
    </div>
    <input id="age-in" type="range" min="15" max="70" step="1" value="${session.age}">
    <div class="control-row"><span class="display stat" id="years-out">0</span>
      <span class="microlabel" data-i18n="time.yearsLeft">${t('time.yearsLeft')}</span></div>
    <div class="control-row"><span class="display stat gold" id="dbl-out">0</span>
      <span class="microlabel" data-i18n="time.doublings">${t('time.doublings')}</span></div>`;
  const render = () => {
    const yearsLeft = Math.max(0, 65 - session.age);
    document.getElementById('age-out').textContent = session.age;
    animateCount(document.getElementById('years-out'), yearsLeft);
    animateCount(document.getElementById('dbl-out'), yearsLeft / 12, { format: v => v.toFixed(1) });
  };
  document.getElementById('age-in').addEventListener('input', (e) => update({ age: +e.target.value }));
  document.addEventListener('session:change', render);
  render();
}
```

- [ ] **Step 3: Add the locale keys to BOTH `en.json` and `th.json`** (TH: `time.title` "เวลาคือทรัพย์สินที่มีค่าที่สุด", `time.ageLabel` "อายุของคุณ", `time.yearsLeft` "ปี ก่อนถึงอายุ 65", `time.doublings` "ครั้งที่เงินของคุณสามารถเพิ่มเป็นสองเท่าได้ก่อนอายุ 65 ที่ผลตอบแทน 6% — กฎ 72 เป็นภาพประกอบ ไม่ใช่คำสัญญา", `hero.sub` "คู่มือฟรีสำหรับการเกษียณในประเทศไทย — คณิตศาสตร์ ภาษี และวันสำคัญ", `hero.privacy` "ข้อมูลที่คุณกรอกไม่ถูกส่งออกจากหน้านี้", `hero.scroll` "เลื่อนลง", `hero.title` "Kasian Sultan").
- [ ] **Step 4: Run `npm test`** — parity test forces the key sets equal; fix any mismatch.
- [ ] **Step 5: Manual acceptance:** dial drags smoothly, stats count up, works by keyboard (arrow keys on the range), TH toggle re-renders labels.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: chapters 00 hero and 01 time"`

---

### Task 12: Chapter 02 — The Number

**Files:**
- Create: `site/js/chapters/number.js` · Modify: `site/index.html` (`#ch02-panel`), both locale files (`number.*` keys)

**Interfaces:**
- Consumes: `targetRange` (Task 7), `session/update`, `fmtTHB`, `animateCount`, app config via `fetch('./config/app.json')`.
- Produces: sliders — essential ฿5k–100k/mo, discretionary ฿0–100k/mo, guaranteed income ฿0–30k/mo; readout: target range `low.targetSatang`–`high.targetSatang` (display low first as the conservative number, labelled with both withdrawal rates and "assumptions, not magic"); the 25.6×/17.5× multiples shown with `swr.as_of` date; updates `session.essentialTHB/discretionaryTHB/guaranteedTHB`.
- Locale keys: `number.title` "Your number.", `number.essential` "Essential spending / month", `number.discretionary` "Discretionary / month", `number.guaranteed` "Guaranteed income / month (SSO pension, rent…)", `number.target` "Portfolio that could fund it", `number.range` "at a {low}–{high} starting withdrawal rate (research as of {date}) — assumptions, not magic", `number.essNote` "Essentials are the floor that must be funded no matter what. Discretionary is where flexibility lives — flexible spenders can start higher.".

- [ ] **Step 1: Markup** in `#ch-02` inner (scene-paper): title `h2.display[data-i18n=number.title]`, `hr.hairline.drawline`, `div#ch02-panel.reveal`.
- [ ] **Step 2: Implement `site/js/chapters/number.js`** — same control-row pattern as Task 11 (three ranges with `<output>`), compute on `session:change`:

```js
import { session, update } from '../session.js';
import { targetRange } from '../engine/withdrawal.js';
import { satang, fmtTHB, fmtPct } from '../engine/money.js';
import { animateCount } from '../choreography.js';
import { t } from '../i18n.js';

let app;
export function init() {
  fetch('./config/app.json').then(r => r.json()).then(cfg => { app = cfg; build(); });
}
function build() {
  const host = document.getElementById('ch02-panel');
  host.innerHTML = `
    ${row('ess', 'number.essential', 5000, 100000, session.essentialTHB)}
    ${row('dis', 'number.discretionary', 0, 100000, session.discretionaryTHB)}
    ${row('gua', 'number.guaranteed', 0, 30000, session.guaranteedTHB)}
    <hr class="hairline">
    <p class="microlabel" data-i18n="number.target">${t('number.target')}</p>
    <p><span id="num-target" class="display stat gold">—</span></p>
    <p class="microlabel" id="num-range"></p>
    <p style="color:var(--muted)" data-i18n="number.essNote">${t('number.essNote')}</p>`;
  for (const [id, key] of [['ess','essentialTHB'],['dis','discretionaryTHB'],['gua','guaranteedTHB']]) {
    host.querySelector(`#${id}-in`).addEventListener('input', e => update({ [key]: +e.target.value }));
  }
  document.addEventListener('session:change', render);
  document.addEventListener('i18n:change', render);
  render();
}
const row = (id, key, min, max, val) => `
  <div class="control-row"><label for="${id}-in" class="microlabel" data-i18n="${key}">${t(key)}</label>
  <output class="stat" id="${id}-out">${fmtTHB(satang(val))}</output></div>
  <input id="${id}-in" type="range" min="${min}" max="${max}" step="500" value="${val}">`;
function render() {
  const annual = satang((session.essentialTHB + session.discretionaryTHB) * 12);
  const guaranteed = satang(session.guaranteedTHB * 12);
  const r = targetRange({ annualSpendSatang: annual, guaranteedAnnualSatang: guaranteed }, app);
  for (const [id, v] of [['ess', session.essentialTHB], ['dis', session.discretionaryTHB], ['gua', session.guaranteedTHB]])
    document.getElementById(`${id}-out`).textContent = fmtTHB(satang(v));
  animateCount(document.getElementById('num-target'), r.low.targetSatang, { format: fmtTHB });
  document.getElementById('num-range').textContent =
    t('number.range', { low: fmtPct(app.swr.low_bp), high: fmtPct(app.swr.high_bp), date: app.swr.as_of });
}
```

- [ ] **Step 3: Add `number.*` keys to both locales** (TH: title "ตัวเลขของคุณ", essential "รายจ่ายจำเป็นต่อเดือน", discretionary "รายจ่ายตามใจต่อเดือน", guaranteed "รายได้ประจำหลังเกษียณต่อเดือน (บำนาญ สปส., ค่าเช่า…)", target "พอร์ตที่อาจรองรับได้", range "ที่อัตราถอนเริ่มต้น {low}–{high} (งานวิจัย ณ {date}) — เป็นสมมติฐาน ไม่ใช่สูตรวิเศษ", essNote "รายจ่ายจำเป็นคือขั้นต่ำที่ต้องมีเงินรองรับเสมอ ส่วนรายจ่ายตามใจคือพื้นที่ของความยืดหยุ่น — ผู้ที่ยืดหยุ่นได้สามารถเริ่มที่อัตราสูงกว่า").
- [ ] **Step 4: `npm test` green (parity)**; manual: sliders live-update the gold number; guaranteed ≥ spending shows ฿0 target without breaking.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: chapter 02 the number — withdrawal-range target with guaranteed income netting"`

---

### Task 13: Chapter 03 — The Climb (DCA chart + worker)

**Files:**
- Create: `site/js/svgchart.js`, `site/js/mc.worker.js`, `site/js/chapters/climb.js` · Modify: `site/index.html` (`#ch03-chart`), locales (`climb.*`)

**Interfaces:**
- Consumes: `projectSeries`, `fvGrowingAnnuity`, `fisherReal`, `runMC`, app config `scenarios` + `mc`, session (`age`, `retireAge`, `monthlyTHB`, `scenario`).
- Produces:
  - `svgchart.js`: `renderAreaChart(host, {years:number[], contributed:number[], balance:number[], band?:{p5:number[], p95:number[]}, yFmt:(satang)=>string})` — single `<svg viewBox="0 0 1000 520">`; band = gold polygon `fill-opacity:.12`; balance line = gold `stroke-width:3` with draw-in via `stroke-dasharray` when `.is-active` (skip under reduced motion); contributed area = `var(--muted)` at `fill-opacity:.25`; 4 hairline y-gridlines with labels; x labels every 5 years. No axis libraries — plain path building.
  - `mc.worker.js`: `onmessage({data:{params}})` → imports `runMC` (worker is `{type:"module"}`) → `postMessage(result)`.
  - `climb.js` `init()`: sliders monthly ฿1k–100k, retire age (age+1)–70, scenario segmented control bear/base/bull; real-terms display (Fisher: scenario return vs scenario inflation); recompute deterministic immediately on input; debounce 150 ms then request MC from worker (fallback: synchronous `runMC` if `typeof Worker === 'undefined'`); stat readouts "you put in" vs "growth added" (`animateCount`); sequence-risk explainer block with the brief's worked demo rendered as three static labelled figures (best-first ฿1,037,519 · flat ฿968,555 · worst-first ฿558,039, from ฿1M with ฿50k/yr withdrawals over the same ten returns).
- Locale keys: `climb.title` "The climb.", `climb.monthly` "You invest / month", `climb.retire` "Retire at", `climb.scenario` "Scenario", `climb.bear/base/bull` "Bear/Base/Bull", `climb.putIn` "you put in", `climb.growth` "growth added", `climb.band` "The band is the middle 90% of 1,000 simulated futures — a range, not a promise. All figures in today's baht.", `climb.seq` "Order matters: the same average return can end very differently depending on when bad years hit…" (+ the three demo labels `climb.seqBest/seqFlat/seqWorst`).

- [ ] **Step 1: Implement `svgchart.js`** (build `<path>` d-strings by mapping year→x `40+920·i/(n−1)`, satang→y `480−440·v/maxV`; band polygon = p95 forward then p5 reversed; contributed area closes to baseline; include `role="img"` + `aria-label` from `climb.band`).
- [ ] **Step 2: Implement `mc.worker.js`**:

```js
import { runMC } from './engine/montecarlo.js';
onmessage = (e) => postMessage(runMC(e.data.params));
```

- [ ] **Step 3: Implement `climb.js`** — deterministic redraw synchronous; worker call pattern:

```js
let worker; try { worker = new Worker(new URL('../mc.worker.js', import.meta.url), { type: 'module' }); } catch { worker = null; }
let timer;
function requestBand(params, onBand) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!worker) return onBand(runMC(params));
    worker.onmessage = (e) => onBand(e.data);
    worker.postMessage({ params });
  }, 150);
}
```

Parameters per scenario: `medianReturn = fisherReal(scen.return_bp/1e4, scen.inflation_bp/1e4)` (real terms!), `volatility = app.mc.volatility_bp/1e4`, `paths = app.mc.paths`, `seed = app.mc.seed`, `growthRate = 0` (flat real contribution — copy explains contributions rise with inflation automatically in real terms), `years = retireAge − age`.
- [ ] **Step 4: Markup + locale keys both files** (TH: title "เส้นทางไต่ขึ้น", putIn "เงินที่คุณใส่", growth "ผลตอบแทนที่งอกเงย", band "แถบสีคือช่วงกลาง 90% จากอนาคตจำลอง 1,000 แบบ — เป็นช่วง ไม่ใช่คำสัญญา ตัวเลขทั้งหมดเป็นค่าเงินปัจจุบัน", seq "ลำดับสำคัญ: ผลตอบแทนเฉลี่ยเท่ากันอาจจบต่างกันมาก ขึ้นกับว่าปีที่แย่มาถึงเมื่อไร…").
- [ ] **Step 5: `npm test` green; manual:** dragging monthly slider updates line instantly and band ~150 ms later without jank; band ordered p5<median<p95 visually; reduced-motion renders final chart instantly; chart has no colors beyond gold/neutrals.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: chapter 03 climb — DCA area chart with Monte Carlo band in a worker"`

---

### Task 14: Chapter 04 — The Rules of the Game (bracket staircase)

**Files:**
- Create: `site/js/chapters/rules.js` · Modify: `site/index.html` (`#ch04-stairs`), locales (`rules.*`)

**Interfaces:**
- Consumes: `computeTax` (Task 5), tax config fetch, `demo_brackets` from app config, session `incomeTHB`.
- Produces: income slider ฿120k–3M/yr; staircase = one horizontal bar per bracket (height fixed, width ∝ band width capped for the top band; fill = gold `scaleX` proportion `amountInBandSatang/(toSatang−fromSatang)`); three readouts (marginal / effective / next ฿1,000) with `animateCount`; the misconception callout; TH ⇄ demo-brackets toggle (demo mode relabels axis "a made-up 3-band country" — teaching progressive mechanics without Thai numbers).
- Locale keys: `rules.title` "The rules of the game.", `rules.income` "Your yearly income", `rules.marginal` "marginal rate — tax on your NEXT baht", `rules.effective` "effective rate — tax on ALL your baht", `rules.next1000` "tax on your next ฿1,000", `rules.myth` "Crossing into a higher bracket never taxes your whole income at the new rate — only the slice above the line. A raise cannot shrink your take-home pay.", `rules.modeTh` "Thailand {beYear}", `rules.modeDemo` "Demo country", `rules.assume` "Assumes salaried income, standard expense deduction, personal allowance only — adjust nothing else. An illustration, not your filing.".

- [ ] **Step 1: Implement `rules.js`** — build bars from `computeTax({grossSatang, profile:{}}, cfg).bands`; each bar:

```html
<div class="stair"><div class="stair__fill" style="transform:scaleX(0.62)"></div>
  <span class="microlabel">5% · ฿150,001–300,000</span></div>
```

with CSS (add to `kasian.css`): `.stair{position:relative;height:2.2rem;border:1px solid var(--line);margin-block:.35rem}.stair__fill{position:absolute;inset:0;transform-origin:left;background:var(--gold);opacity:.85;transition:transform 500ms var(--ease)}`. Demo mode swaps the bracket array for `app.demo_brackets` run through `taxFromTaxable`-style folding via `computeTax` with a cfg stub `{brackets: app.demo_brackets, employment_expense:{rate_bp:0,cap_thb:0}, allowances:{personal_thb:0, …zeros}}` — build the stub inline in `rules.js` so the engine path is identical.
- [ ] **Step 2: Locale keys both files** (TH: title "กติกาของเกม", marginal "อัตราส่วนเพิ่ม — ภาษีของบาทถัดไป", effective "อัตราที่แท้จริง — ภาษีเฉลี่ยของรายได้ทั้งหมด", myth "การขยับขึ้นขั้นภาษีไม่เคยทำให้รายได้ทั้งก้อนถูกเก็บที่อัตราใหม่ — เก็บเฉพาะส่วนที่เกินเส้นเท่านั้น เงินเดือนขึ้นไม่มีทางทำให้รายรับสุทธิลดลง", assume "สมมติรายได้เงินเดือน หักค่าใช้จ่ายมาตรฐานและค่าลดหย่อนส่วนตัวเท่านั้น — เป็นภาพประกอบ ไม่ใช่การยื่นภาษีของคุณ").
- [ ] **Step 3: `npm test`; manual:** slider sweeps fill the stairs progressively; marginal jumps at ฿310k-equivalent boundaries while effective climbs smoothly; demo toggle relabels; BE year shows in TH.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: chapter 04 rules — bracket staircase, marginal vs effective"`

---

### Task 15: Chapter 05 — The Cheat Codes (deduction simulator)

**Files:**
- Create: `site/js/chapters/cheats.js` · Modify: `site/index.html` (`#ch05-panel`), locales (`cheats.*`)

**Interfaces:**
- Consumes: `applyVehicleCaps` (Task 6), `computeTax` (Task 5), session `incomeTHB` (shared with Ch.04 — moving the Ch.04 income slider updates Ch.05 via `session:change`).
- Produces: sliders for rmf / thaiEsg / pvd / pensionLife / lifeIns / healthIns / parentsHealth (0 → their `cap_thb`); two ceiling meters (`retirement.usedSatang/ceilingSatang`, `insurance.usedSatang/ceilingSatang`) as hairline bars with gold fill + `aria-valuenow`; clamped inputs flash their label gold and show "capped" chip (`clampedIds`); headline counter "tax saved this year" = `computeTax(income,{})` − `computeTax(income,{deductionsSatang: totalDeductibleSatang})`; sunset note on Thai ESG row; NSF/GPF rows omitted from UI (niche; engine still covers them) — noted in copy as "also inside the shared ceiling: GPF, NSF".
- Locale keys: `cheats.title` "The cheat codes (the legal ones).", `cheats.saved` "tax saved this year", `cheats.ceilRet` "shared retirement ceiling — RMF + PVD + GPF + NSF + pension insurance", `cheats.ceilIns` "life + health insurance group", `cheats.capped` "capped", `cheats.esgNote` "Thai ESG's enhanced ฿300,000 cap ends 31 Dec 2026 (B.E. 2569) unless extended.", `cheats.pensionTrap` "Pension life insurance counts INSIDE the ฿500,000 retirement ceiling — the most commonly misfiled deduction.", `cheats.note` "Simulator only: caps depend on your income and change by tax year. Confirm before filing.", per-vehicle labels `cheats.rmf` "RMF — retirement mutual fund (hold to 55)", `cheats.thaiEsg` "Thai ESG (hold 5 years)", `cheats.pvd` "Provident fund (via employer)", `cheats.pensionLife` "Pension life insurance", `cheats.lifeIns` "Life insurance", `cheats.healthIns` "Health insurance", `cheats.parentsHealth` "Parents' health insurance".

- [ ] **Step 1: Implement `cheats.js`** — pattern identical to Task 12's rows plus meters; recompute pipeline on any input:

```js
const caps = applyVehicleCaps({ grossSatang, inputs }, taxCfg);
const before = computeTax({ grossSatang, profile: {} }, taxCfg).taxSatang;
const after = computeTax({ grossSatang, profile: {}, deductionsSatang: caps.totalDeductibleSatang }, taxCfg).taxSatang;
animateCount(savedEl, before - after, { format: fmtTHB });
```

Meters: `<div class="meter" role="meter" aria-valuemin="0" aria-valuemax="500000" aria-valuenow="...">` with `.meter__fill{transform:scaleX(used/ceiling)}` (CSS mirrors `.stair__fill`).
- [ ] **Step 2: Locale keys both files** (TH: title "สูตรลัด (ที่ถูกกฎหมาย)", saved "ภาษีที่ประหยัดได้ปีนี้", ceilRet "เพดานรวมเพื่อการเกษียณ — RMF + PVD + กบข. + กอช. + ประกันบำนาญ", pensionTrap "ประกันชีวิตแบบบำนาญนับรวมในเพดาน 500,000 บาท — จุดที่คนกรอกผิดบ่อยที่สุด", esgNote "เพดานพิเศษ 300,000 บาทของ Thai ESG สิ้นสุด 31 ธ.ค. 2569 (2026) เว้นแต่มีการต่ออายุ", note "เป็นเครื่องจำลองเท่านั้น เพดานขึ้นกับรายได้และเปลี่ยนตามปีภาษี โปรดตรวจสอบก่อนยื่น").
- [ ] **Step 3: `npm test`; manual:** pushing RMF to 500k then adding pension-life shows the clamp chip + ceiling meter full; tax-saved counter moves; Thai ESG slider unaffected by the full retirement ceiling.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: chapter 05 cheat codes — deduction simulator with ceiling meters"`

---

### Task 16: Chapter 06 — The Calendar (timeline + .ics)

**Files:**
- Create: `site/js/chapters/calendar.js` · Modify: `site/index.html` (`#ch06-timeline`), locales (`cal.*`)

**Interfaces:**
- Consumes: calendar config fetch, `personalMilestones` (Task 8), `buildICS` (Task 8), session `age`, `yearLabel`, SSO copy only (formula taught as text with one worked figure from Task 7's golden: "180 months at the 2026 ceiling → ฿3,500/month").
- Produces: horizontal scroll-snap timeline (`overflow-x:auto`, cards `scroll-snap-align:center`, hairline spine) — statutory events from config (localized via `locale_key`/`note_key`), then personal milestone cards computed from `session.age` (`year = currentYear + (55−age)` etc. via `personalMilestones(currentYear − age, currentYear)`); "Add to your calendar (.ics)" button → `buildICS` of the five statutory events with localized summaries → `Blob` download `kasian-sultan-{year}.ics`; SSO 180-month explainer card.
- Locale keys (note-keys referenced by the config MUST exist): `cal.title` "The calendar.", `cal.filing` "File PND 90/91 (tax year 2026)", `cal.filingNote` "Paper deadline 31 Mar 2027. An 8-day e-filing extension has been granted in recent years but its current authorization lapses 31 Jan 2027 — check rd.go.th each season.", `cal.pnd94` "PND 94 half-year return", `cal.pnd94Note` "Only if you have rental/freelance/other 40(5)–(8) income earned Jan–Jun.", `cal.cutoff` "Last fund-dealing days of December", `cal.cutoffNote` "RMF / Thai ESG purchases must settle within 2026 to count for 2026 — exact final dealing day varies by fund; buy by mid-December to be safe.", `cal.tavi` "Chase your 50 tawi", `cal.taviNote` "Employers must issue the withholding certificate by 15 Feb.", `cal.esg` "Thai ESG enhanced cap ends", `cal.esgNote` "Last day of the ฿300,000 enhanced deduction era.", `cal.ics` "Add to your calendar", `cal.mine` "Your milestones", `cal.rmf55` "RMF unlocks (55)", `cal.nsf60` "NSF pension age (60)", `cal.exempt65` "฿190,000 income exemption (65)", `cal.sso` "SSO pension needs 180 contribution months — at the 2026 ceiling that's ฿3,500/month from age 55, more with extra years. Check your months at sso.go.th.".

- [ ] **Step 1: Implement `calendar.js`** — timeline cards + download:

```js
const ics = buildICS(cal.events.map(e => ({
  uid: `${e.id}@kasiansultan`, dateISO: e.date,
  summary: t(e.locale_key), description: e.note_key ? t(e.note_key) : '',
})));
const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
btn.href = url; btn.download = `kasian-sultan-${cal.tax_year}.ics`;
```

(regenerate the blob on `i18n:change` so the download localizes).
- [ ] **Step 2: Locale keys both files** (TH: title "ปฏิทิน", filing "ยื่น ภ.ง.ด.90/91 (ปีภาษี 2569)", filingNote "กำหนดยื่นกระดาษ 31 มี.ค. 2570 การขยายเวลา e-Filing 8 วันมีมาต่อเนื่องแต่ประกาศฉบับปัจจุบันสิ้นสุด 31 ม.ค. 2570 — โปรดตรวจสอบที่ rd.go.th ทุกฤดูยื่น", cutoffNote "การซื้อ RMF / Thai ESG ต้องทำรายการสำเร็จภายในปี 2569 — วันทำการสุดท้ายต่างกันตามกองทุน ซื้อภายในกลางธันวาคมเพื่อความปลอดภัย", tavi "ทวงใบ 50 ทวิ", sso "บำนาญประกันสังคมต้องส่งเงินสมทบครบ 180 เดือน — ที่เพดานปี 2569 ได้ ฿3,500/เดือน ตั้งแต่อายุ 55 และเพิ่มตามปีที่ส่งเกิน ตรวจสอบเดือนของคุณที่ sso.go.th", ฯลฯ mirroring every key).
- [ ] **Step 3: `npm test`; manual:** timeline scrolls horizontally with snap; `.ics` downloads and imports into Google Calendar with 5 all-day events; personal milestone years shift when the Ch.01 age dial moves; TH download contains Thai summaries.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: chapter 06 calendar — statutory timeline, personal milestones, ics export"`

---

### Task 17: Chapter 07 — The Instruments

**Files:**
- Create: `site/js/chapters/instruments.js` · Modify: `site/index.html` (`#ch07-cards`), locales (`instruments.*`)

**Interfaces:**
- Consumes: `t`, choreography reveal classes only (content chapter — no engine).
- Produces: 10 expandable cards (`<details>` styled — native a11y): Savings account · Fixed deposit · SSO (what your contributions already buy) · PVD · RMF · Thai ESG · Index funds / broad mutual funds · SET stocks · Bonds · Gold. Each card body renders four microlabel rows — What it is · Risk · Liquidity · Tax — from locale keys `instruments.{id}.{what|risk|liq|tax}`; risk shown as 1–5 filled gold dots (`aria-label="risk 2 of 5"`). After the grid: the illustration block `instruments.mix` — three *example* mixes by decade ("illustrative textbook patterns, not recommendations": 20s growth-heavy / 40s balanced / 60s preservation-heavy, described in words, no percentages, no products); windfall note `instruments.windfall` (evidence favors investing a windfall promptly over spreading it out; monthly salary investing is simply how salaries arrive — the studies do not apply to it); foreign-assets remittance explainer `instruments.foreign` (earned-abroad income remitted while Thai tax-resident is taxable — the rule changed in 2024; complex cases need a professional).
- Every card's tax row states only verified treatments (e.g., SET gains "exempt for listed shares sold on-exchange — verify off-market cases", deposit interest "15% withholding; can be final or credited").

- [ ] **Step 1: Implement `instruments.js`** — render cards from a local array of ids `['savings','deposit','sso','pvd','rmf','esg','fund','stock','bond','gold']`, all copy via `t()`; add `.card` CSS (border hairline, `details[open]` gold left rule).
- [ ] **Step 2: Write all `instruments.*` copy in BOTH locales** — 10 cards × 4 rows + `mix`, `windfall`, `foreign`, `title` "The instruments." / "เครื่องมือ", each tax row sourced from research brief §2/§3 (write final EN + TH copy now; Task 19 reviews TH).
- [ ] **Step 3: `npm test` (parity enforces the ~46 new keys land in both); manual:** cards expand by keyboard (native `<details>`), risk dots render, no card names a specific fund or provider.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: chapter 07 instruments — education cards with verified tax rows"`

---

### Task 18: Chapter 08 — Begin (disclaimer, sources, stamps)

**Files:**
- Create: `site/js/chapters/begin.js` · Modify: `site/index.html` (`#ch08-sources`), locales (`begin.*`)

**Interfaces:**
- Consumes: all three config files (fetched), `disclaimer.full` (Task 9), `yearLabel`, `isStale`.
- Produces: full disclaimer rendered from `disclaimer.full`; auto-generated sources list = union of `sources[]` across tax/calendar/app configs as visible plain-text URLs grouped by config, each group stamped "verified {verified_on} · review due {review_by}"; a "start again" link to `#ch-01`; a plain-text privacy note repeating the zero-collection stance; GitHub link placeholder is **omitted** — the site has no external links except the source URLs and rd.go.th/sso.go.th mentions (all plain text, `rel="noopener"`, target self).
- Locale keys: `begin.title` "Begin.", `begin.sources` "Every number's source", `begin.stamp` "verified {v} · review due {r}", `begin.again` "Change your assumptions and climb again", `begin.privacy2` "This page has no accounts, no analytics, no cookies, and no server — your numbers never left your browser.".

- [ ] **Step 1: Implement `begin.js`** (fetch the three configs, render groups; wire `isStale` re-check so the section itself shows the gold stamp row).
- [ ] **Step 2: Locale keys both files** (TH: title "เริ่ม", sources "ที่มาของตัวเลขทุกตัว", stamp "ตรวจสอบเมื่อ {v} · ครบกำหนดทบทวน {r}", again "ปรับสมมติฐานแล้วไต่ขึ้นอีกครั้ง", privacy2 "หน้านี้ไม่มีบัญชีผู้ใช้ ไม่มีระบบวิเคราะห์ ไม่มีคุกกี้ และไม่มีเซิร์ฟเวอร์ — ตัวเลขของคุณไม่เคยออกจากเบราว์เซอร์").
- [ ] **Step 3: `npm test`; manual:** every URL from the three configs appears exactly once per group; disclaimer full text renders in both languages; BE year label correct in TH.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: chapter 08 begin — full disclaimer, auto-sourced references, verification stamps"`

---

### Task 19: Thai language full pass

**Files:**
- Modify: `site/locales/th.json` (review every string), `site/index.html` (`lang` handling only if bugs found)

- [ ] **Step 1: Read `en.json` and `th.json` side by side, key by key.** Fix: literal-translation stiffness, formality consistency (use polite-neutral written Thai, no ครับ/ค่ะ), number/date formats (BE first: "31 มี.ค. 2570"), Thai typography (no space before ๆ, correct ไม้ยมก usage), terminology consistency (ค่าลดหย่อน = deduction/allowance consistently; อัตราส่วนเพิ่ม = marginal rate everywhere).
- [ ] **Step 2: Browser pass in TH:** every chapter, checking line-breaking (no orphaned particles), `--font-display` fallback renders Thai headlines cleanly, no overflow on 375px width.
- [ ] **Step 3: `npm test` (parity still green).**
- [ ] **Step 4: Commit** — `git add -A && git commit -m "polish: Thai copy full review pass"`

---

### Task 20: Polish — a11y, reduced motion, perf budget test

**Files:**
- Create: `site/tests/budget.test.js` · Modify: anything the audits flag

- [ ] **Step 1: Write the perf-budget test** — `site/tests/budget.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const walk = (dir, ext) => readdirSync(dir, { withFileTypes: true }).flatMap(d => {
  const p = join(dir, d.name);
  return d.isDirectory() ? walk(p, ext) : ext.some(e => p.endsWith(e)) ? [p] : [];
});

test('gz JS+CSS ≤ 200 KB', () => {
  const files = walk(new URL('../', import.meta.url).pathname, ['.js', '.css'])
    .filter(p => !p.includes('/tests/'));
  const total = files.reduce((s, p) => s + gzipSync(readFileSync(p)).length, 0);
  assert.ok(total <= 200 * 1024, `total gz ${(total / 1024).toFixed(1)} KB`);
});
test('fonts ≤ 250 KB raw', () => {
  const fonts = walk(new URL('../fonts/', import.meta.url).pathname, ['.woff2']);
  const total = fonts.reduce((s, p) => s + statSync(p).size, 0);
  assert.ok(total <= 250 * 1024, `fonts ${(total / 1024).toFixed(1)} KB`);
});
```

- [ ] **Step 2: Run and fix** (subset/drop font weights if over; no minifier — write tighter code if JS is over).
- [ ] **Step 3: Accessibility sweep (manual checklist, fix everything found):** tab order front to back on every chapter; every range has a visible label + live `<output>`; `aria-live="polite"` on `#num-target`, tax readouts, `cheats.saved`; rail links have `aria-label` "Chapter 04 — The rules"; contrast-check gold-on-ink and gold-on-paper at used sizes (body text never gold); `details` cards operable by Enter/Space; zoom 200% doesn't clip.
- [ ] **Step 4: Reduced-motion + device pass:** emulate reduced motion (all content instant, counters show finals); 375×812 and 1280×800 in both locales; throttled CPU — no long tasks from MC (worker isolates it).
- [ ] **Step 5: `npm test` all green.**
- [ ] **Step 6: Commit** — `git add -A && git commit -m "polish: a11y sweep, reduced motion, enforced perf budget"`

---

### Task 21: Artifact bundle + DEPLOY.md + ship

**Files:**
- Create: `scripts/build-artifact.mjs`, `DEPLOY.md`

**Interfaces:**
- Produces: `node scripts/build-artifact.mjs` → `dist/kasian-sultan.html` — single self-contained file: inlines `kasian.css` + font css (fonts become `data:` URIs), locale JSONs and config JSONs injected as `window.__KS_DATA__ = {...}`, all ES modules concatenated in dependency order inside one `<script type="module">` with `fetch()` calls replaced by lookups into `__KS_DATA__` (the bundler does a literal string replace of the four fetch URLs → `Promise.resolve(window.__KS_DATA__[...])`), worker inlined via `Blob` URL. This file exists ONLY for the Artifact preview; the canonical site remains `site/` unbundled.

- [ ] **Step 1: Write `scripts/build-artifact.mjs`** (plain node, no deps: read files, string-assemble, write `dist/`; ~80 lines: css inline, fonts→base64 `data:font/woff2`, JSON embed, module concat in the order engine→ics/i18n/staleness/session/svgchart/choreography→chapters→main with `import`/`export` statements stripped by regex `^\s*(im|ex)port[^\n]*$` — modules were written dependency-clean so concatenation is safe; worker code embedded as a template string + `new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})))`).
- [ ] **Step 2: Build and verify locally** — open `dist/kasian-sultan.html` via `file://`: all 9 chapters function, MC band renders, .ics downloads, both locales work offline.
- [ ] **Step 3: Write `DEPLOY.md`** — three sections with exact steps: (a) GitHub Pages: create repo → push → Settings→Pages→`main`/`site/` → URL; (b) Cloudflare Pages: dashboard → direct upload of `site/` → URL; (c) later custom domain: buy at Porkbun (~$11/yr) → DNS CNAME per host's doc link. State: site is non-commercial and static; both hosts' free tiers apply.
- [ ] **Step 4: Full suite + fresh clone sanity** — `npm test`; `git status` clean.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: artifact bundler and deployment guide"`
- [ ] **Step 6: Publish the Artifact** (session owner action, in-session): load `artifact-design` skill, then Artifact-publish `dist/kasian-sultan.html` (title "Kasian Sultan", favicon 🏛️ or 👑, description "A free bilingual guide to retiring in Thailand — the math, the tax, the dates."). Share link with owner.

---

## Self-Review (completed)

**Spec coverage:** §1 decisions → Tasks 1–21 (free/static/no-collection everywhere); §2 palette/type/motion → Tasks 10, 20; §3 chapters 00–08 → Tasks 11–18; §4 architecture/tests/errors → Tasks 1–10 (engine guards live in engine tasks' clamps + unknown-config refusal is N/A since configs ship with the site — the staleness banner covers drift, Task 9/10); §5 deployment → Task 21; §6 disclaimer verbatim → Task 9 (full EN+TH) + Task 18 render; §7 out-of-scope respected (no remittance/dividend computation — explainers only, Tasks 16–17). Gap check: spec's "JS-disabled ⇒ content visible" → Task 10 Step 3 noscript requirement. Perf budget → Task 20 enforced by test.

**Placeholder scan:** no TBDs; every step has code, exact copy, or an explicit manual checklist. Thai strings provided at first introduction, reviewed in Task 19.

**Type consistency:** satang-suffixed money fields everywhere; `_bp`/`_thb` config suffixes uniform (app.json `demo_brackets` uses `up_to` in THB-taxable units consumed only by the Ch.04 demo stub — labelled in Task 14); `session` field names match between Tasks 10/11/12/13/14/15; event names `'session:change'`/`'i18n:change'` consistent; `buildICS` signature identical in Tasks 8 and 16; `targetRange`/`ssoMonthlyPension`/`applyVehicleCaps`/`computeTax` signatures match producer and consumer tasks.
