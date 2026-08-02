import { t } from '../i18n.js';

const CONFIGS = [
  ['./config/tax/th/2026.json', 'Thai tax rules'],
  ['./config/calendar/th/2026.json', 'Calendar dates'],
  ['./config/app.json', 'Projection assumptions'],
];

export function init() {
  const host = document.getElementById('ch08-sources');
  if (!host) return;
  Promise.all(CONFIGS.map(([p]) => fetch(p).then(r => r.json())))
    .then(cfgs => {
      render(host, cfgs);
      document.addEventListener('i18n:change', () => render(host, cfgs));
    });
}

function render(host, cfgs) {
  host.innerHTML = `
    <p class="lede" data-i18n="begin.lede"></p>

    <hr class="hairline">
    <p class="microlabel" data-i18n="disclaimer.title"></p>
    <p class="note" style="max-width:70ch" data-i18n="disclaimer.full"></p>

    <hr class="hairline">
    <p class="microlabel" data-i18n="begin.nextTitle"></p>
    <p class="note" data-i18n="begin.next"></p>

    <hr class="hairline">
    <p class="microlabel" data-i18n="begin.sources"></p>
    <div class="sources">
      ${cfgs.map((cfg, i) => `
        <h3>${CONFIGS[i][1]}</h3>
        <p>${t('begin.stamp', { v: cfg.verified_on, r: cfg.review_by })}</p>
        ${cfg.sources.map(u => `<p><a href="${u}" rel="noopener noreferrer nofollow">${u}</a></p>`).join('')}
      `).join('')}
    </div>

    <hr class="hairline">
    <p class="note" data-i18n="begin.privacy2"></p>
    <a class="btn" href="#ch-01" data-i18n="begin.again"></a>`;

  host.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
}
