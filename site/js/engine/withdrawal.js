// Withdrawal-rule target range (brief §5.8): model the RULE, not a magic number.
// target = (spending that the portfolio must fund) / starting withdrawal rate.
export function targetRange({ annualSpendSatang, guaranteedAnnualSatang = 0 }, appCfg) {
  const funded = Math.max(0, annualSpendSatang - guaranteedAnnualSatang);
  const leg = (rateBp) => ({
    rateBp,
    multiple: 10000 / rateBp,
    targetSatang: Math.round(funded * 10000 / rateBp),
  });
  return { low: leg(appCfg.swr.low_bp), high: leg(appCfg.swr.high_bp), fundedSpendSatang: funded };
}
