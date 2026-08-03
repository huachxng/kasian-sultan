// EN/TH i18n. Dictionaries are loaded once; setLocale swaps every [data-i18n]
// element in place and broadcasts 'i18n:change'. Only persistence: ks-locale.
let dicts = { en: {}, th: {} };
let active = 'en';

export function _initForTest(en, th, locale) { dicts = { en, th }; active = locale; }

export async function initI18n() {
  const [en, th] = await Promise.all(
    ['en', 'th'].map(l => fetch(`./locales/${l}.json`).then(r => r.json())));
  dicts = { en, th };
  const saved = localStorage.getItem('ks-locale');
  active = saved === 'th' || saved === 'en' ? saved
    : (navigator.language || '').toLowerCase().startsWith('th') ? 'th' : 'en';
  document.documentElement.lang = active;
  return active;
}

const dig = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

export function t(key, params = {}) {
  let s = dig(dicts[active], key) ?? dig(dicts.en, key) ?? key;
  for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function getLocale() { return active; }

// Fill in every [data-i18n] node under `root`. Chapters build their markup after
// the initial page-wide pass, and rebuild it again on locale change, so each one
// calls this on its own container once its DOM exists — otherwise those labels
// stay blank until something else happens to re-stamp them.
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) el.setAttribute(attr, t(key)); else el.textContent = t(key);
  });
}

export function setLocale(l) {
  active = l;
  localStorage.setItem('ks-locale', l);
  document.documentElement.lang = l;
  applyI18n();
  document.dispatchEvent(new CustomEvent('i18n:change', { detail: { locale: l } }));
}

export const beYear = (ce) => ce + 543;
export const yearLabel = (ce, locale) => locale === 'th' ? `${beYear(ce)} (${ce})` : `${ce}`;
