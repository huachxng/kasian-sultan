// Money lives in integer satang (1 THB = 100 satang); rates in integer basis points.
export const satang = (t) => Math.round(t * 100);
export const thb = (s) => Math.round(s / 100);
export const bpToRate = (bp) => bp / 10000;

export function fmtTHB(s, _locale = 'en') {
  const t = thb(Math.abs(s));
  const body = t.toLocaleString('en-US'); // Arabic numerals, comma grouping, both locales
  return `${s < 0 ? '−' : ''}฿${body}`;
}

export function fmtPct(bp, dp = 1) {
  return `${(bp / 100).toFixed(dp)}%`;
}
