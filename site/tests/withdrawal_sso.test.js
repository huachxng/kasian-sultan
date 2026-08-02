import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satang } from '../js/engine/money.js';
import { targetRange } from '../js/engine/withdrawal.js';
import { ssoMonthlyPension } from '../js/engine/sso.js';

const app = JSON.parse(readFileSync(new URL('../config/app.json', import.meta.url)));

test('targetRange multiples: 3.9% → ~25.6×, 5.7% → ~17.5×', () => {
  const r = targetRange({ annualSpendSatang: satang(390000) }, app);
  assert.ok(Math.abs(r.low.multiple - 25.64) < 0.01);
  assert.ok(Math.abs(r.high.multiple - 17.54) < 0.01);
  assert.equal(r.low.targetSatang, satang(10000000)); // 390k / 3.9% = 10,000,000
});

test('guaranteed income nets off before the multiple', () => {
  const r = targetRange({ annualSpendSatang: satang(400000), guaranteedAnnualSatang: satang(100000) }, app);
  assert.equal(r.fundedSpendSatang, satang(300000));
  assert.equal(r.low.targetSatang, Math.round(satang(300000) * 10000 / 390));
  const zero = targetRange({ annualSpendSatang: satang(50000), guaranteedAnnualSatang: satang(90000) }, app);
  assert.equal(zero.low.targetSatang, 0);
});

test('SSO: below 180 months → 0', () => {
  assert.equal(ssoMonthlyPension({ avgMonthlyWageSatang: satang(20000), monthsContributed: 179, claimYear: 2026 }, app.sso), 0);
});

test('SSO: 180 months at/above ceiling 2026 → 20% of 17,500 = ฿3,500', () => {
  assert.equal(ssoMonthlyPension({ avgMonthlyWageSatang: satang(30000), monthsContributed: 180, claimYear: 2026 }, app.sso), satang(3500));
});

test('SSO: 240 months → 27.5%; ceiling schedule by claim year', () => {
  assert.equal(ssoMonthlyPension({ avgMonthlyWageSatang: satang(30000), monthsContributed: 240, claimYear: 2026 }, app.sso), satang(4812.5));
  assert.equal(ssoMonthlyPension({ avgMonthlyWageSatang: satang(30000), monthsContributed: 240, claimYear: 2030 }, app.sso), satang(5500)); // 27.5% of 20,000
});
