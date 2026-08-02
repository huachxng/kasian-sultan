// SSO old-age pension (brief §4): 180-month minimum; 20% of the average wage
// over the final 60 months (capped by the gazetted ceiling schedule),
// +1.5pp per full 12 months beyond 180.
export function ssoMonthlyPension({ avgMonthlyWageSatang, monthsContributed, claimYear }, ssoCfg) {
  if (monthsContributed < ssoCfg.min_months) return 0;
  const row = ssoCfg.ceiling_schedule.find(r => claimYear >= r.from && (r.to === null || claimYear <= r.to));
  const base = Math.min(avgMonthlyWageSatang, row.ceiling_thb * 100);
  const bp = ssoCfg.base_bp + ssoCfg.per_year_bp * Math.floor((monthsContributed - ssoCfg.min_months) / 12);
  return Math.round(base * bp / 10000);
}
