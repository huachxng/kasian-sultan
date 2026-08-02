import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satang } from '../js/engine/money.js';
import { employmentExpense, allowancesTotal, taxFromTaxable, computeTax } from '../js/engine/tax_th.js';

const cfg = JSON.parse(readFileSync(new URL('../config/tax/th/2026.json', import.meta.url)));

test('brief golden: ฿310,000 single salaried → zero tax', () => {
  const r = computeTax({ grossSatang: satang(310000), profile: {} }, cfg);
  assert.equal(r.taxSatang, 0);
  assert.equal(r.taxableSatang, satang(150000));
});

test('brief golden: ฿320,000 → ฿500 tax', () => {
  const r = computeTax({ grossSatang: satang(320000), profile: {} }, cfg);
  assert.equal(r.taxSatang, satang(500));
});

test('cumulative-at-floor goldens from RD table (taxable direct)', () => {
  assert.equal(taxFromTaxable(satang(300000), cfg), satang(7500));
  assert.equal(taxFromTaxable(satang(500000), cfg), satang(27500));
  assert.equal(taxFromTaxable(satang(750000), cfg), satang(65000));
  assert.equal(taxFromTaxable(satang(1000000), cfg), satang(115000));
  assert.equal(taxFromTaxable(satang(2000000), cfg), satang(365000));
  assert.equal(taxFromTaxable(satang(5000000), cfg), satang(1265000));
  assert.equal(taxFromTaxable(satang(6000000), cfg), satang(1265000 + 350000));
});

test('employment expense: 50% capped at 100k', () => {
  assert.equal(employmentExpense(satang(150000), cfg), satang(75000));
  assert.equal(employmentExpense(satang(1000000), cfg), satang(100000));
});

test('child allowance birth-year rule', () => {
  // two children born 2017 & 2019: first 30k; second born ≥2018 → 60k
  const a = allowancesTotal({ childrenBirthYears: [2017, 2019] }, cfg);
  assert.equal(a, satang(60000 + 30000 + 60000)); // personal + child1 + child2
  // both born before 2018 → 30k each
  const b = allowancesTotal({ childrenBirthYears: [2015, 2017] }, cfg);
  assert.equal(b, satang(60000 + 30000 + 30000));
});

test('spouse + parents + SSO contribution reduce taxable', () => {
  const r = computeTax({
    grossSatang: satang(600000),
    profile: { spouseNoIncome: true, parentsCared: 2, ssoContributionSatang: satang(9000) },
  }, cfg);
  // 600000 − 100000(exp) − 60000 − 60000 − 60000(parents) − 9000 = 311000
  // tax: 7500 + 10% × 11,000 = 8,600
  assert.equal(r.taxableSatang, satang(311000));
  assert.equal(r.taxSatang, satang(8600));
});

test('marginal / effective / next-thousand', () => {
  const r = computeTax({ grossSatang: satang(1200000), profile: {} }, cfg);
  assert.equal(r.taxableSatang, satang(1040000));
  assert.equal(r.marginalBp, 2500);
  assert.equal(r.nextThousandSatang, satang(250));
  assert.ok(r.effectiveBp > 0 && r.effectiveBp < r.marginalBp);
});

test('bands sum to total and fill correctly', () => {
  const r = computeTax({ grossSatang: satang(1200000), profile: {} }, cfg);
  const sum = r.bands.reduce((s, b) => s + b.taxSatang, 0);
  assert.equal(sum, r.taxSatang);
});
