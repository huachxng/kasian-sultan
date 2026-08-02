import { session, update } from '../session.js';
import { targetRange } from '../engine/withdrawal.js';
import { satang, fmtTHB, fmtPct } from '../engine/money.js';
import { animateCount } from '../choreography.js';
import { t } from '../i18n.js';

let app;

const row = (id, key, min, max, step, val) => `
  <div class="control-row">
    <label for="${id}-in" class="microlabel" data-i18n="${key}"></label>
    <output id="${id}-out" for="${id}-in">${fmtTHB(satang(val))}</output>
  </div>
  <input id="${id}-in" type="range" min="${min}" max="${max}" step="${step}" value="${val}">`;

export function init() {
  const host = document.getElementById('ch02-panel');
  if (!host) return;
  fetch('./config/app.json').then(r => r.json()).then(cfg => { app = cfg; build(host); });
}

function build(host) {
  host.innerHTML = `
    ${row('ess', 'number.essential', 5000, 100000, 500, session.essentialTHB)}
    ${row('dis', 'number.discretionary', 0, 100000, 500, session.discretionaryTHB)}
    ${row('gua', 'number.guaranteed', 0, 30000, 500, session.guaranteedTHB)}
    <p class="note" data-i18n="number.guaranteedNote"></p>
    <hr class="hairline">
    <p class="microlabel" data-i18n="number.target"></p>
    <div aria-live="polite">
      <p><span id="num-target" class="big stat gold display">—</span></p>
      <p class="microlabel" id="num-range"></p>
      <p class="microlabel" id="num-mult"></p>
    </div>
    <p class="note" data-i18n="number.essNote"></p>`;

  for (const [id, key] of [['ess', 'essentialTHB'], ['dis', 'discretionaryTHB'], ['gua', 'guaranteedTHB']]) {
    host.querySelector(`#${id}-in`).addEventListener('input',
      (e) => update({ [key]: +e.target.value }));
  }
  document.addEventListener('session:change', render);
  document.addEventListener('i18n:change', render);
  render();
}

function render() {
  if (!app) return;
  const annual = satang((session.essentialTHB + session.discretionaryTHB) * 12);
  const guaranteed = satang(session.guaranteedTHB * 12);
  const r = targetRange({ annualSpendSatang: annual, guaranteedAnnualSatang: guaranteed }, app);

  for (const [id, v] of [['ess', session.essentialTHB], ['dis', session.discretionaryTHB], ['gua', session.guaranteedTHB]]) {
    document.getElementById(`${id}-out`).textContent = fmtTHB(satang(v));
  }
  animateCount(document.getElementById('num-target'), r.low.targetSatang, { format: fmtTHB });
  document.getElementById('num-range').textContent = t('number.range', {
    low: fmtPct(app.swr.low_bp), high: fmtPct(app.swr.high_bp), date: app.swr.as_of,
  });
  document.getElementById('num-mult').textContent = t('number.multiples', {
    lowX: r.low.multiple.toFixed(1), highX: r.high.multiple.toFixed(1),
  });
}
