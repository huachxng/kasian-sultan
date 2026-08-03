import { initI18n, setLocale, getLocale, t, applyI18n } from './i18n.js';
import { initChoreography, seedParticles } from './choreography.js';
import { isStale } from './staleness.js';

const todayISO = new Date().toISOString().slice(0, 10);

async function boot() {
  await initI18n();
  setLocale(getLocale());                    // stamp all [data-i18n] once
  initChoreography();
  seedParticles(document.getElementById('hero-particles'));

  document.getElementById('lang-toggle').addEventListener('click',
    () => setLocale(getLocale() === 'en' ? 'th' : 'en'));

  const panel = document.getElementById('index-panel');
  const openPanel = (open) => {
    panel.dataset.open = String(open);
    panel.setAttribute('aria-hidden', String(!open));
  };
  document.getElementById('index-toggle').addEventListener('click', () => openPanel(true));
  document.getElementById('index-close').addEventListener('click', () => openPanel(false));
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) openPanel(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openPanel(false); });

  const taxCfg = await fetch('./config/tax/th/2026.json').then(r => r.json());
  if (isStale(taxCfg, todayISO)) {
    const b = document.getElementById('stale-banner');
    b.style.display = 'block';
    b.textContent = t('chrome.stale', { date: taxCfg.verified_on });
  }

  for (const mod of ['time', 'number', 'climb', 'rules', 'cheats', 'calendar', 'instruments', 'begin']) {
    try { (await import(`./chapters/${mod}.js`)).init?.(); }
    catch (err) { console.warn(`chapter ${mod} not available`, err); }
  }

  // Safety net: every chapter stamps its own text, but a chapter that fails to
  // load must not leave neighbouring markup blank.
  applyI18n();

  // Deep link: chapters are shareable URLs. Chapter content is injected after
  // boot, so the browser's own hash restore fires too early — redo it here.
  const target = location.hash && document.querySelector(location.hash);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }));
}

boot();
