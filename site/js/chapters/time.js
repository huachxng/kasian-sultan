import { session, update } from '../session.js';
import { animateCount } from '../choreography.js';
import { t } from '../i18n.js';

export function init() {
  const host = document.getElementById('ch01-dial');
  if (!host) return;

  host.innerHTML = `
    <div class="control-row">
      <label for="age-in" class="microlabel" data-i18n="time.ageLabel"></label>
      <output id="age-out" for="age-in"></output>
    </div>
    <input id="age-in" type="range" min="15" max="70" step="1" value="${session.age}"
           aria-describedby="years-desc">
    <div class="readout" aria-live="polite">
      <div>
        <span class="big stat" id="years-out">0</span>
        <span class="microlabel" id="years-desc" data-i18n="time.yearsLeft"></span>
      </div>
      <div>
        <span class="big stat gold" id="dbl-out">0</span>
        <span class="microlabel" data-i18n="time.doublings"></span>
      </div>
    </div>
    <p class="note" data-i18n="time.note"></p>`;

  const render = () => {
    const yearsLeft = Math.max(0, 65 - session.age);
    document.getElementById('age-out').textContent = session.age;
    animateCount(document.getElementById('years-out'), yearsLeft);
    // rule of 72 at 6%: one doubling per ~12 years
    animateCount(document.getElementById('dbl-out'), yearsLeft / 12, { format: v => v.toFixed(1) });
  };

  document.getElementById('age-in').addEventListener('input',
    (e) => update({ age: +e.target.value }));
  document.addEventListener('session:change', render);
  document.addEventListener('i18n:change', render);
  render();
}
