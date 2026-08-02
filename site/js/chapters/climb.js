import { session, update } from '../session.js';
import { projectSeries, fisherReal } from '../engine/projection.js';
import { runMC } from '../engine/montecarlo.js';
import { satang, fmtTHB } from '../engine/money.js';
import { renderAreaChart } from '../svgchart.js';
import { animateCount } from '../choreography.js';
import { t } from '../i18n.js';

let app, worker = null, timer = null;

export function init() {
  const host = document.getElementById('ch03-chart');
  if (!host) return;
  try {
    worker = new Worker(new URL('../mc.worker.js', import.meta.url), { type: 'module' });
  } catch { worker = null; }
  fetch('./config/app.json').then(r => r.json()).then(cfg => { app = cfg; build(host); });
}

function build(host) {
  host.innerHTML = `
    <div class="control-row">
      <label for="mo-in" class="microlabel" data-i18n="climb.monthly"></label>
      <output id="mo-out" for="mo-in"></output>
    </div>
    <input id="mo-in" type="range" min="1000" max="100000" step="1000" value="${session.monthlyTHB}">

    <div class="control-row">
      <label for="ret-in" class="microlabel" data-i18n="climb.retire"></label>
      <output id="ret-out" for="ret-in"></output>
    </div>
    <input id="ret-in" type="range" min="45" max="70" step="1" value="${session.retireAge}">

    <p class="microlabel" style="margin-top:1rem" data-i18n="climb.scenario"></p>
    <div class="seg" id="scen" role="group">
      <button type="button" data-scen="bear" data-i18n="climb.bear"></button>
      <button type="button" data-scen="base" data-i18n="climb.base"></button>
      <button type="button" data-scen="bull" data-i18n="climb.bull"></button>
    </div>

    <div class="chart-wrap" id="climb-canvas"></div>

    <div class="readout" aria-live="polite">
      <div><span class="big stat" id="cl-in">—</span><span class="microlabel" data-i18n="climb.putIn"></span></div>
      <div><span class="big stat" id="cl-gr">—</span><span class="microlabel" data-i18n="climb.growth"></span></div>
      <div><span class="big stat gold" id="cl-tot">—</span><span class="microlabel" data-i18n="climb.total"></span></div>
    </div>
    <p class="note" data-i18n="climb.band"></p>

    <hr class="hairline">
    <p class="microlabel" data-i18n="climb.seqTitle"></p>
    <p class="note" data-i18n="climb.seq"></p>
    <div class="readout">
      <div><span class="big stat">฿1,037,519</span><span class="microlabel" data-i18n="climb.seqBest"></span></div>
      <div><span class="big stat">฿968,555</span><span class="microlabel" data-i18n="climb.seqFlat"></span></div>
      <div><span class="big stat gold">฿558,039</span><span class="microlabel" data-i18n="climb.seqWorst"></span></div>
    </div>
    <p class="note" data-i18n="climb.seqNote"></p>`;

  host.querySelector('#mo-in').addEventListener('input', e => update({ monthlyTHB: +e.target.value }));
  host.querySelector('#ret-in').addEventListener('input', e => update({ retireAge: +e.target.value }));
  host.querySelectorAll('#scen button').forEach(b =>
    b.addEventListener('click', () => update({ scenario: b.dataset.scen })));

  document.addEventListener('session:change', render);
  document.addEventListener('i18n:change', render);
  render();
}

function params() {
  const scen = app.scenarios[session.scenario];
  const years = Math.max(1, session.retireAge - session.age);
  return {
    monthlySatang: satang(session.monthlyTHB),
    // real terms: a flat real contribution keeps its purchasing power
    annualRate: fisherReal(scen.return_bp / 1e4, scen.inflation_bp / 1e4),
    growthRate: 0,
    years,
    startSatang: 0,
  };
}

function draw(series, band) {
  renderAreaChart(document.getElementById('climb-canvas'), {
    years: series.map(p => session.age + p.year),
    contributed: series.map(p => p.contributedSatang),
    balance: series.map(p => p.balanceSatang),
    band,
    yFmt: fmtTHB,
    ariaLabel: t('climb.band'),
  });
}

function render() {
  if (!app) return;
  // keep retire-age slider above current age
  const retMin = Math.min(70, session.age + 1);
  const retIn = document.getElementById('ret-in');
  retIn.min = retMin;
  if (session.retireAge < retMin) { session.retireAge = retMin; retIn.value = retMin; }

  document.getElementById('mo-out').textContent = fmtTHB(satang(session.monthlyTHB));
  document.getElementById('ret-out').textContent = session.retireAge;
  document.querySelectorAll('#scen button').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.scen === session.scenario)));

  const p = params();
  const series = projectSeries(p);
  const last = series[series.length - 1];
  animateCount(document.getElementById('cl-in'), last.contributedSatang, { format: fmtTHB });
  animateCount(document.getElementById('cl-gr'), last.growthSatang, { format: fmtTHB });
  animateCount(document.getElementById('cl-tot'), last.balanceSatang, { format: fmtTHB });
  draw(series, null);

  // Monte Carlo band, debounced and off the main thread
  const mcParams = {
    monthlySatang: p.monthlySatang, growthRate: 0, years: p.years, startSatang: 0,
    medianReturn: p.annualRate, volatility: app.mc.volatility_bp / 1e4,
    paths: app.mc.paths, seed: app.mc.seed,
  };
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!worker) { draw(series, runMC(mcParams)); return; }
    worker.onmessage = (e) => draw(series, e.data);
    worker.postMessage({ params: mcParams });
  }, 150);
}
