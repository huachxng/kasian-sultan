import { t } from '../i18n.js';

// Risk is a coarse 1–5 teaching signal, not a rating. Order runs roughly
// safest → most volatile so the gallery itself reads as a spectrum.
const CARDS = [
  { id: 'savings', risk: 1 },
  { id: 'deposit', risk: 1 },
  { id: 'sso', risk: 1 },
  { id: 'pvd', risk: 3 },
  { id: 'rmf', risk: 3 },
  { id: 'esg', risk: 4 },
  { id: 'fund', risk: 3 },
  { id: 'stock', risk: 5 },
  { id: 'bond', risk: 2 },
  { id: 'gold', risk: 4 },
];

const dots = (n) => `<span class="dots" role="img" aria-label="${t('instruments.riskLabel')} ${n}/5">${
  [1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;

export function init() {
  const host = document.getElementById('ch07-cards');
  if (!host) return;
  render(host);
  document.addEventListener('i18n:change', () => render(host));
}

function render(host) {
  host.innerHTML = `
    <p class="lede" data-i18n="instruments.lede"></p>
    <div class="cards" style="margin-top:1.5rem">
      ${CARDS.map(c => `
        <details class="card">
          <summary>${t(`instruments.cards.${c.id}.name`)}</summary>
          <dl>
            <div><dt>${t('instruments.whatLabel')}</dt><dd>${t(`instruments.cards.${c.id}.what`)}</dd></div>
            <div><dt>${t('instruments.riskLabel')} ${dots(c.risk)}</dt><dd>${t(`instruments.cards.${c.id}.risk`)}</dd></div>
            <div><dt>${t('instruments.liqLabel')}</dt><dd>${t(`instruments.cards.${c.id}.liq`)}</dd></div>
            <div><dt>${t('instruments.taxLabel')}</dt><dd>${t(`instruments.cards.${c.id}.tax`)}</dd></div>
          </dl>
        </details>`).join('')}
    </div>

    <hr class="hairline">
    <p class="microlabel" data-i18n="instruments.mixTitle"></p>
    <p class="note" data-i18n="instruments.mix"></p>

    <p class="microlabel" style="margin-top:1.5rem" data-i18n="instruments.windfallTitle"></p>
    <p class="note" data-i18n="instruments.windfall"></p>

    <p class="microlabel" style="margin-top:1.5rem" data-i18n="instruments.foreignTitle"></p>
    <p class="note" data-i18n="instruments.foreign"></p>`;

  // stamp the [data-i18n] nodes this render just created
  host.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
}
