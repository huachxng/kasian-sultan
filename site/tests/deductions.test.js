import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satang } from '../js/engine/money.js';
import { applyVehicleCaps } from '../js/engine/deductions.js';

const cfg = JSON.parse(readFileSync(new URL('../config/tax/th/2026.json', import.meta.url)));
const run = (grossTHB, inputsTHB) => applyVehicleCaps({
  grossSatang: satang(grossTHB),
  inputs: Object.fromEntries(Object.entries(inputsTHB).map(([k, v]) => [k, satang(v)])),
}, cfg);

test('RMF alone: min(30% income, 500k)', () => {
  assert.equal(run(1000000, { rmf: 400000 }).allowed.rmf, satang(300000)); // 30% binds
  assert.equal(run(3000000, { rmf: 600000 }).allowed.rmf, satang(500000)); // cap binds
});

test('shared 500k ceiling: pension life inside it', () => {
  const r = run(4000000, { rmf: 400000, pensionLife: 200000 });
  assert.equal(r.allowed.rmf, satang(400000));
  assert.equal(r.allowed.pensionLife, satang(100000)); // only 100k headroom left
  assert.equal(r.clampedIds.includes('pensionLife'), true);
  assert.equal(r.retirement.usedSatang, satang(500000));
});

test('Thai ESG stacks separately from the 500k', () => {
  const r = run(4000000, { rmf: 500000, thaiEsg: 400000 });
  assert.equal(r.allowed.rmf, satang(500000));
  assert.equal(r.allowed.thaiEsg, satang(300000)); // its own 300k cap, NOT squeezed by ceiling
  assert.equal(r.totalDeductibleSatang, satang(800000));
});

test('PVD 15% test binds before ceiling', () => {
  assert.equal(run(1000000, { pvd: 300000 }).allowed.pvd, satang(150000));
});

test('insurance group: life first, life+health ≤ 100k, health own-cap 25k', () => {
  const r = run(2000000, { lifeIns: 90000, healthIns: 25000 });
  assert.equal(r.allowed.lifeIns, satang(90000));
  assert.equal(r.allowed.healthIns, satang(10000)); // group cap 100k squeezes health
  const r2 = run(2000000, { healthIns: 40000 });
  assert.equal(r2.allowed.healthIns, satang(25000)); // own cap binds
  assert.equal(r.insurance.usedSatang, satang(100000));
});

test('parents health independent 15k; NSF fund cap 30k', () => {
  const r = run(2000000, { parentsHealth: 20000, nsf: 50000 });
  assert.equal(r.allowed.parentsHealth, satang(15000));
  assert.equal(r.allowed.nsf, satang(30000));
});
