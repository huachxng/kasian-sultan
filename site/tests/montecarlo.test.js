import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, gaussian } from '../js/engine/rng.js';
import { runMC } from '../js/engine/montecarlo.js';
import { projectSeries } from '../js/engine/projection.js';

test('mulberry32 deterministic', () => {
  const a = mulberry32(2569), b = mulberry32(2569);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

test('gaussian roughly standard', () => {
  const rng = mulberry32(7); let s = 0, s2 = 0; const N = 20000;
  for (let i = 0; i < N; i++) { const z = gaussian(rng); s += z; s2 += z * z; }
  assert.ok(Math.abs(s / N) < 0.03);
  assert.ok(Math.abs(s2 / N - 1) < 0.05);
});

test('runMC deterministic for same seed', () => {
  const p = { monthlySatang: 1000000, growthRate: 0.02, years: 20, medianReturn: 0.05, volatility: 0.15, paths: 200, seed: 42 };
  assert.deepEqual(runMC(p).p50, runMC(p).p50);
});

test('volatility 0 collapses onto deterministic series', () => {
  const base = { monthlySatang: 1000000, growthRate: 0.02, years: 20, startSatang: 5000000 };
  const det = projectSeries({ ...base, annualRate: 0.05 });
  const mc = runMC({ ...base, medianReturn: 0.05, volatility: 0, paths: 10, seed: 1 });
  for (let y = 0; y <= 20; y++) assert.ok(Math.abs(mc.p50[y] - det[y].balanceSatang) <= 20);
});

test('band ordered and median near deterministic at real vol', () => {
  const base = { monthlySatang: 1000000, growthRate: 0, years: 30, medianReturn: 0.05, volatility: 0.15, paths: 1000, seed: 2569 };
  const det = projectSeries({ monthlySatang: 1000000, growthRate: 0, years: 30, annualRate: 0.05 });
  const { p5, p50, p95 } = runMC(base);
  assert.ok(p5[30] < p50[30] && p50[30] < p95[30]);
  const rel = Math.abs(p50[30] - det[30].balanceSatang) / det[30].balanceSatang;
  assert.ok(rel < 0.10, `median drift ${(rel * 100).toFixed(1)}%`);
});
