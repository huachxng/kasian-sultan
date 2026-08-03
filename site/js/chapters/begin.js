import { t, applyI18n } from '../i18n.js';

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
    <a class="btn" href="#ch-01" data-i18n="begin.again"></a>

    <hr class="hairline">
    <section class="colophon">
      <p class="microlabel" data-i18n="credits.title"></p>
      <dl class="colophon__who">
        <dt class="microlabel" data-i18n="credits.ownerLabel"></dt>
        <dd class="colophon__name" data-i18n="credits.ownerName"></dd>
        <dt class="microlabel" data-i18n="credits.schoolLabel"></dt>
        <dd data-i18n="credits.schoolName"></dd>
        <dt class="microlabel" data-i18n="credits.madeLabel"></dt>
        <dd data-i18n="credits.made"></dd>
      </dl>
      <ul class="colophon__terms">
        <li data-i18n="credits.noCommercial"></li>
        <li data-i18n="credits.eduPurpose"></li>
        <li data-i18n="credits.noData"></li>
      </ul>
    </section>`;

  applyI18n(host);
}
