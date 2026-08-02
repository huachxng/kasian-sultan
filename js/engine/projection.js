// Projection conventions (research brief §5, hard requirements):
// true monthly compounding, month-end contributions, exact Fisher relation,
// contribution escalates once per year by growthRate.
export const monthlyRate = (annual) => (1 + annual) ** (1 / 12) - 1;
export const fisherReal = (nominal, inflation) => (1 + nominal) / (1 + inflation) - 1;

// s12: FV at year-end of 12 month-end contributions of 1, at the monthly rate for `annualRate`
function s12(annualRate) {
  const m = monthlyRate(annualRate);
  return m === 0 ? 12 : ((1 + m) ** 12 - 1) / m;
}

export function fvGrowingAnnuity({ monthlySatang, annualRate, growthRate, years, startSatang = 0 }) {
  const r = annualRate, g = growthRate, n = years;
  const S = s12(r), C0 = monthlySatang;
  let contrib;
  if (Math.abs(r - g) < 1e-12) contrib = n * C0 * S * (1 + r) ** (n - 1);
  else contrib = C0 * S * ((1 + r) ** n - (1 + g) ** n) / (r - g);
  return Math.round(contrib + startSatang * (1 + r) ** n);
}

export function projectSeries({ monthlySatang, annualRate, growthRate, years, startSatang = 0 }) {
  const m = monthlyRate(annualRate);
  const out = [{ year: 0, balanceSatang: Math.round(startSatang), contributedSatang: 0, growthSatang: 0 }];
  let bal = startSatang, contributed = 0, monthly = monthlySatang;
  for (let y = 1; y <= years; y++) {
    for (let k = 0; k < 12; k++) {
      bal = bal * (1 + m) + monthly;   // month-end contribution
      contributed += monthly;
    }
    out.push({
      year: y,
      balanceSatang: Math.round(bal),
      contributedSatang: Math.round(contributed),
      growthSatang: Math.round(bal - contributed - startSatang),
    });
    monthly *= 1 + growthRate;          // escalate once per year
  }
  return out;
}
