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

export function setLocale(l) {
  active = l;
  localStorage.setItem('ks-locale', l);
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) el.setAttribute(attr, t(key)); else el.textContent = t(key);
  });
  document.dispatchEvent(new CustomEvent('i18n:change', { detail: { locale: l } }));
}

export const beYear = (ce) => ce + 543;
export const yearLabel = (ce, locale) => locale === 'th' ? `${beYear(ce)} (${ce})` : `${ce}`;
