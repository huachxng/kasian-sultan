import { session } from '../session.js';
import { computeTax } from '../engine/tax_th.js';
import { applyVehicleCaps } from '../engine/deductions.js';
import { satang, fmtTHB } from '../engine/money.js';
import { animateCount } from '../choreography.js';
import { t } from '../i18n.js';

let taxCfg;
const inputs = { rmf: 0, thaiEsg: 0, pvd: 0, pensionLife: 0, lifeIns: 0, healthIns: 0, parentsHealth: 0 };

const VEHICLES = [
  { id: 'rmf', key: 'cheats.rmf', max: 500000 },
  { id: 'thaiEsg', key: 'cheats.thaiEsg', max: 300000, note: 'cheats.esgNote' },
  { id: 'pvd', key: 'cheats.pvd', max: 500000 },
  { id: 'pensionLife', key: 'cheats.pensionLife', max: 200000, note: 'cheats.pensionTrap' },
  { id: 'lifeIns', key: 'cheats.lifeIns', max: 100000 },
  { id: 'healthIns', key: 'cheats.healthIns', max: 25000 },
  { id: 'parentsHealth', key: 'cheats.parentsHealth', max: 15000 },
];

export function init() {
  const host = document.getElementById('ch05-panel');
  if (!host) return;
  fetch('./config/tax/th/2026.json').then(r => r.json()).then(cfg => { taxCfg = cfg; build(host); });
}

function build(host) {
  host.innerHTML = `
    <p class="lede" data-i18n="cheats.lede"></p>

    <div class="readout" aria-live="polite" style="margin-block:1.5rem">
      <div><span class="big stat gold" id="saved-out">฿0</span>
        <span class="microlabel" data-i18n="cheats.saved"></span></div>
    </div>
    <p class="microlabel" id="ba-line"></p>

    <div id="veh-rows" style="margin-top:1.5rem"></div>

    <hr class="hairline">
    <p class="microlabel" data-i18n="cheats.ceilRet"></p>
    <div class="meter" role="meter" id="meter-ret" aria-valuemin="0" aria-valuemax="500000" aria-valuenow="0">
      <div class="meter__fill" style="transform:scaleX(0)"></div>
    </div>
    <p class="microlabel" id="ret-nums"></p>

    <p class="microlabel" style="margin-top:1rem" data-i18n="cheats.ceilIns"></p>
    <div class="meter" role="meter" id="meter-ins" aria-valuemin="0" aria-valuemax="100000" aria-valuenow="0">
      <div class="meter__fill" style="transform:scaleX(0)"></div>
    </div>
    <p class="microlabel" id="ins-nums"></p>

    <p class="note" data-i18n="cheats.pensionTrap"></p>
    <p class="note" data-i18n="cheats.esgNote"></p>
    <p class="note" data-i18n="cheats.note"></p>`;

  host.querySelector('#veh-rows').innerHTML = VEHICLES.map(v => `
    <div class="control-row">
      <label for="${v.id}-in" class="microlabel">
        <span data-i18n="${v.key}"></span><span class="chip" id="${v.id}-chip" hidden data-i18n="cheats.capped"></span>
      </label>
      <output id="${v.id}-out" for="${v.id}-in">฿0</output>
    </div>
    <input id="${v.id}-in" type="range" min="0" max="${v.max}" step="5000" value="0">`).join('');

  VEHICLES.forEach(v => {
    host.querySelector(`#${v.id}-in`).addEventListener('input', (e) => {
      inputs[v.id] = satang(+e.target.value);
      render();
    });
  });

  document.addEventListener('session:change', render);
  document.addEventListener('i18n:change', render);
  render();
}

function render() {
  if (!taxCfg) return;
  const gross = satang(session.incomeTHB);
  const caps = applyVehicleCaps({ grossSatang: gross, inputs }, taxCfg);

  const before = computeTax({ grossSatang: gross, profile: {} }, taxCfg).taxSatang;
  const after = computeTax({ grossSatang: gross, profile: {}, deductionsSatang: caps.totalDeductibleSatang }, taxCfg).taxSatang;

  animateCount(document.getElementById('saved-out'), before - after, { format: fmtTHB });
  document.getElementById('ba-line').textContent =
    t('cheats.beforeAfter', { before: fmtTHB(before), after: fmtTHB(after) });

  VEHICLES.forEach(v => {
    document.getElementById(`${v.id}-out`).textContent = fmtTHB(caps.allowed[v.id] ?? 0);
    document.getElementById(`${v.id}-chip`).hidden = !caps.clampedIds.includes(v.id);
  });

  const meter = (id, used, ceiling) => {
    const el = document.getElementById(id);
    el.querySelector('.meter__fill').style.transform = `scaleX(${(used / ceiling).toFixed(4)})`;
    el.setAttribute('aria-valuenow', String(Math.round(used / 100)));
  };
  meter('meter-ret', caps.retirement.usedSatang, caps.retirement.ceilingSatang);
  meter('meter-ins', caps.insurance.usedSatang, caps.insurance.ceilingSatang);
  document.getElementById('ret-nums').textContent =
    `${fmtTHB(caps.retirement.usedSatang)} / ${fmtTHB(caps.retirement.ceilingSatang)}`;
  document.getElementById('ins-nums').textContent =
    `${fmtTHB(caps.insurance.usedSatang)} / ${fmtTHB(caps.insurance.ceilingSatang)}`;
}
