import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthlyRate, fisherReal, fvGrowingAnnuity, projectSeries } from '../js/engine/projection.js';

test('monthlyRate compounds to annual', () => {
  const m = monthlyRate(0.06);
  assert.ok(Math.abs((1 + m) ** 12 - 1.06) < 1e-12);
});

test('fisherReal exact relation', () => {
  assert.ok(Math.abs(fisherReal(0.06, 0.03) - 0.0291262135922) < 1e-10);
  assert.equal(fisherReal(0.05, 0.05), 0);
});

test('closed form ≡ iterative loop to within 1 satang/year', () => {
  for (const r of [-0.02, 0, 0.02, 0.05, 0.08]) {
    for (const g of [0, 0.02, r]) {
      const p = { monthlySatang: 2000000, annualRate: r, growthRate: g, years: 45, startSatang: 35000000 };
      const series = projectSeries(p);
      const closed = fvGrowingAnnuity(p);
      const loop = series[45].balanceSatang;
      assert.ok(Math.abs(closed - loop) <= 45, `r=${r} g=${g}: ${closed} vs ${loop}`);
    }
  }
});

test('r === g branch is finite and positive', () => {
  const v = fvGrowingAnnuity({ monthlySatang: 2000000, annualRate: 0.05, growthRate: 0.05, years: 30 });
  assert.ok(Number.isFinite(v) && v > 2000000 * 12 * 30);
});

test('Fisher-vs-subtraction gap is material (brief §5 order of magnitude)', () => {
  // 25y, ฿20,000/mo, nominal 6%, inflation 3%: exact real vs naive (6−3=3%) differs ~1–1.5%
  const base = { monthlySatang: 2000000, growthRate: 0, years: 25, startSatang: 0 };
  const exact = fvGrowingAnnuity({ ...base, annualRate: fisherReal(0.06, 0.03) });
  const naive = fvGrowingAnnuity({ ...base, annualRate: 0.03 });
  const gapTHB = (naive - exact) / 100;
  assert.ok(gapTHB > 80000 && gapTHB < 130000, `gap ฿${gapTHB}`);
  assert.ok((naive - exact) / exact > 0.008 && (naive - exact) / exact < 0.02);
});

test('negative rates do not break', () => {
  const s = projectSeries({ monthlySatang: 1000000, annualRate: -0.01, growthRate: 0, years: 10 });
  assert.equal(s.length, 11);
  assert.ok(s[10].balanceSatang > 0);
  assert.ok(s[10].growthSatang < 0);
});
