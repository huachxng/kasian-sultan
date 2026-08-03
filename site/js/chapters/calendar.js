import { session } from '../session.js';
import { personalMilestones } from '../engine/milestones.js';
import { buildICS } from '../ics.js';
import { t, getLocale, yearLabel, applyI18n } from '../i18n.js';

let cal, blobUrl = null;

const fmtDate = (iso, locale) => {
  const [y, m, d] = iso.split('-').map(Number);
  const months = locale === 'th'
    ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${locale === 'th' ? y + 543 : y}`;
};

export function init() {
  const host = document.getElementById('ch06-timeline');
  if (!host) return;
  fetch('./config/calendar/th/2026.json').then(r => r.json()).then(c => { cal = c; build(host); });
}

function build(host) {
  host.innerHTML = `
    <p class="lede" data-i18n="cal.lede"></p>
    <div class="timeline" id="tl-statutory"></div>
    <a class="btn" id="ics-btn" href="#" download data-i18n="cal.ics"></a>
    <hr class="hairline">
    <p class="microlabel" data-i18n="cal.mine"></p>
    <p class="note" data-i18n="cal.minelede"></p>
    <div class="timeline" id="tl-personal"></div>
    <hr class="hairline">
    <p class="microlabel" data-i18n="cal.ssoTitle"></p>
    <p class="note" data-i18n="cal.sso"></p>`;

  document.addEventListener('session:change', renderPersonal);
  document.addEventListener('i18n:change', render);
  render();
}

function render() {
  applyI18n(document.getElementById('ch06-timeline'));
  renderStatutory();
  renderPersonal();
}

function renderStatutory() {
  const loc = getLocale();
  document.getElementById('tl-statutory').innerHTML = cal.events.map(e => `
    <article class="tl-card">
      <p class="tl-date">${fmtDate(e.date, loc)}</p>
      <h3 class="tl-title">${t(e.locale_key)}</h3>
      <p class="tl-note">${e.note_key ? t(e.note_key) : ''}</p>
    </article>`).join('');

  const ics = buildICS(cal.events.map(e => ({
    uid: `${e.id}@kasiansultan`,
    dateISO: e.date,
    summary: t(e.locale_key),
    description: e.note_key ? t(e.note_key) : '',
  })));
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  blobUrl = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const btn = document.getElementById('ics-btn');
  btn.href = blobUrl;
  btn.download = `kasian-sultan-${cal.tax_year}.ics`;
}

function renderPersonal() {
  const loc = getLocale();
  const birthYear = cal.tax_year - session.age;
  document.getElementById('tl-personal').innerHTML =
    personalMilestones(birthYear, cal.tax_year).map(m => `
      <article class="tl-card is-milestone">
        <p class="tl-date">${yearLabel(m.year, loc)} · ${t('time.ageLabel')} ${m.age}</p>
        <h3 class="tl-title">${t(`cal.${m.id}`)}</h3>
        <p class="tl-note">${t(`cal.${m.id}note`)}</p>
      </article>`).join('');
}
