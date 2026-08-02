import { session, update } from '../session.js';
import { computeTax } from '../engine/tax_th.js';
import { satang, fmtTHB, fmtPct } from '../engine/money.js';
import { animateCount } from '../choreography.js';
import { t, getLocale, yearLabel } from '../i18n.js';

let taxCfg, app, mode = 'th';

export function init() {
  const host = document.getElementById('ch04-stairs');
  if (!host) return;
  Promise.all([
    fetch('./config/tax/th/2026.json').then(r => r.json()),
    fetch('./config/app.json').then(r => r.json()),
  ]).then(([tax, a]) => { taxCfg = tax; app = a; build(host); });
}

// The demo country runs through the SAME engine — only the config differs.
function demoCfg() {
  return {
    brackets: app.demo_brackets.map(b => ({ up_to_thb: b.up_to, rate_bp: b.rate_bp })),
    employment_expense: { rate_bp: 0, cap_thb: 0 },
    allowances: {
      personal_thb: 0, spouse_thb: 0, child_first_thb: 0,
      child_later_born_from_year: 9999, child_later_thb: 0,
      parent_care_thb: 0, disabled_dependent_thb: 0,
    },
  };
}

function build(host) {
  host.innerHTML = `
    <p class="lede" data-i18n="rules.lede"></p>
    <div class="seg" id="rules-mode" role="group" aria-label="Rules">
      <button type="button" data-mode="th" id="mode-th"></button>
      <button type="button" data-mode="demo" data-i18n="rules.modeDemo"></button>
    </div>
    <div class="control-row" style="margin-top:1.2rem">
      <label for="inc-in" class="microlabel" data-i18n="rules.income"></label>
      <output id="inc-out" for="inc-in"></output>
    </div>
    <input id="inc-in" type="range" min="120000" max="3000000" step="10000" value="${session.incomeTHB}">
    <div id="stairs" style="margin-top:1.2rem"></div>
    <p class="microlabel" id="taxable-line" style="margin-top:.6rem"></p>
    <div class="readout" aria-live="polite">
      <div><span class="big stat gold" id="marg-out">—</span><span class="microlabel" data-i18n="rules.marginal"></span></div>
      <div><span class="big stat" id="eff-out">—</span><span class="microlabel" data-i18n="rules.effective"></span></div>
      <div><span class="big stat" id="nxt-out">—</span><span class="microlabel" data-i18n="rules.next1000"></span></div>
    </div>
    <p class="note" data-i18n="rules.myth"></p>
    <p class="note" id="rules-assume"></p>`;

  host.querySelector('#inc-in').addEventListener('input', e => update({ incomeTHB: +e.target.value }));
  host.querySelectorAll('#rules-mode button').forEach(b =>
    b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));

  document.addEventListener('session:change', render);
  document.addEventListener('i18n:change', render);
  render();
}

function render() {
  if (!taxCfg || !app) return;
  const cfg = mode === 'th' ? taxCfg : demoCfg();
  const gross = satang(session.incomeTHB);
  const r = computeTax({ grossSatang: gross, profile: {} }, cfg);

  document.getElementById('mode-th').textContent =
    t('rules.modeTh', { year: yearLabel(taxCfg.tax_year, getLocale()) });
  document.querySelectorAll('#rules-mode button').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  document.getElementById('inc-out').textContent = fmtTHB(gross);
  document.getElementById('rules-assume').textContent =
    mode === 'th' ? t('rules.assume') : t('rules.demoNote');

  // staircase: one bar per bracket, filled by how much of it your income occupies
  document.getElementById('stairs').innerHTML = r.bands.map(b => {
    const width = b.toSatang === null
      ? Math.max(satang(1000000), b.amountInBandSatang)   // open-ended top band
      : b.toSatang - b.fromSatang;
    const frac = width > 0 ? Math.min(1, b.amountInBandSatang / width) : 0;
    const hi = b.toSatang === null ? '+' : fmtTHB(b.toSatang);
    return `<div class="stair">
      <div class="stair__fill" style="transform:scaleX(${frac.toFixed(4)})"></div>
      <span class="stair__label">${fmtPct(b.rateBp, 0)} · ${fmtTHB(b.fromSatang)} – ${hi}</span>
    </div>`;
  }).join('');

  document.getElementById('taxable-line').textContent =
    `${fmtTHB(r.taxableSatang)} — ${t('rules.taxable')}`;
  document.getElementById('marg-out').textContent = fmtPct(r.marginalBp, 0);
  animateCount(document.getElementById('eff-out'), r.effectiveBp,
    { format: v => fmtPct(v, 1) });
  animateCount(document.getElementById('nxt-out'), r.nextThousandSatang, { format: fmtTHB });
}
