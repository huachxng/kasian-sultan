import { mulberry32, gaussian } from './rng.js';

// Lognormal annual returns with mu = ln(1 + medianReturn), so the MEDIAN path
// equals the deterministic geometric-mean line — the honest anchor (brief §5).
export function runMC({ monthlySatang, growthRate, years, startSatang = 0, medianReturn, volatility, paths, seed }) {
  const mu = Math.log(1 + medianReturn);
  const yearly = Array.from({ length: years + 1 }, () => new Float64Array(paths));
  const rng = mulberry32(seed);
  for (let p = 0; p < paths; p++) {
    let bal = startSatang, monthly = monthlySatang;
    yearly[0][p] = bal;
    for (let y = 1; y <= years; y++) {
      const factor = Math.exp(mu + volatility * gaussian(rng));
      const mf = factor ** (1 / 12);
      for (let k = 0; k < 12; k++) bal = bal * mf + monthly;
      yearly[y][p] = bal;
      monthly *= 1 + growthRate;
    }
  }
  const pick = (arr, q) => {
    const s = Float64Array.from(arr).sort();
    return Math.round(s[Math.min(paths - 1, Math.floor(q * paths))]);
  };
  const p5 = [], p50 = [], p95 = [];
  for (let y = 0; y <= years; y++) {
    p5.push(pick(yearly[y], 0.05)); p50.push(pick(yearly[y], 0.50)); p95.push(pick(yearly[y], 0.95));
  }
  return { p5, p50, p95 };
}
