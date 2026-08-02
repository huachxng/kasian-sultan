// Thai PIT engine. All amounts integer satang; rates integer bp.
// Config amounts are whole THB → ×100 exactly once, here.
const S = (thbAmount) => thbAmount * 100;

export function employmentExpense(grossSatang, cfg) {
  const { rate_bp, cap_thb } = cfg.employment_expense;
  return Math.min(Math.round(grossSatang * rate_bp / 10000), S(cap_thb));
}

export function allowancesTotal(profile = {}, cfg) {
  const A = cfg.allowances;
  let total = S(A.personal_thb);
  if (profile.spouseNoIncome) total += S(A.spouse_thb);
  const kids = [...(profile.childrenBirthYears ?? [])].sort((a, b) => a - b);
  kids.forEach((born, i) => {
    const later = i > 0 && born >= A.child_later_born_from_year;
    total += S(later ? A.child_later_thb : A.child_first_thb);
  });
  total += Math.min(profile.parentsCared ?? 0, 4) * S(A.parent_care_thb);
  total += (profile.disabledDependents ?? 0) * S(A.disabled_dependent_thb);
  return total;
}

export function taxableIncome({ grossSatang, profile = {}, deductionsSatang = 0 }, cfg) {
  const sso = profile.ssoContributionSatang ?? 0;
  return Math.max(0,
    grossSatang - employmentExpense(grossSatang, cfg) - allowancesTotal(profile, cfg) - sso - deductionsSatang);
}

export function taxFromTaxable(taxableSatang, cfg) {
  let tax = 0, prev = 0;
  for (const b of cfg.brackets) {
    const upper = b.up_to_thb === null ? Infinity : S(b.up_to_thb);
    const inBand = Math.max(0, Math.min(taxableSatang, upper) - prev);
    tax += inBand * b.rate_bp / 10000;
    prev = upper;
    if (taxableSatang <= upper) break;
  }
  return Math.round(tax);
}

export function computeTax(input, cfg) {
  const taxable = taxableIncome(input, cfg);
  const taxSatang = taxFromTaxable(taxable, cfg);
  let prev = 0, marginalBp = 0;
  const bands = [];
  for (const b of cfg.brackets) {
    const upper = b.up_to_thb === null ? null : S(b.up_to_thb);
    const hi = upper ?? Infinity;
    const amountInBand = Math.max(0, Math.min(taxable, hi) - prev);
    if (amountInBand > 0) marginalBp = b.rate_bp;
    bands.push({
      fromSatang: prev, toSatang: upper, rateBp: b.rate_bp,
      amountInBandSatang: amountInBand,
      taxSatang: Math.round(amountInBand * b.rate_bp / 10000),
    });
    prev = hi;
  }
  const effectiveBp = input.grossSatang > 0 ? Math.round(taxSatang / input.grossSatang * 10000) : 0;
  const nextThousandSatang = taxFromTaxable(taxable + 100000, cfg) - taxSatang; // +฿1,000
  return { taxSatang, taxableSatang: taxable, marginalBp, effectiveBp, nextThousandSatang, bands };
}
