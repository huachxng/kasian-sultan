import { test } from 'node:test';
import assert from 'node:assert/strict';
import { satang, thb, fmtTHB, fmtPct, bpToRate } from '../js/engine/money.js';

test('satang/thb round-trip', () => {
  assert.equal(satang(310000), 31000000);
  assert.equal(thb(31000000), 310000);
  assert.equal(satang(0.005), 1);   // half a satang rounds up to 1
  assert.equal(thb(1), 0);          // 1 satang rounds to ฿0
});
test('fmtTHB groups and rounds', () => {
  assert.equal(fmtTHB(123456789), '฿1,234,568');
  assert.equal(fmtTHB(0), '฿0');
  assert.equal(fmtTHB(-50000), '−฿500');
});
test('fmtPct from bp', () => {
  assert.equal(fmtPct(600), '6.0%');
  assert.equal(fmtPct(1550, 2), '15.50%');
});
test('bpToRate', () => { assert.equal(bpToRate(390), 0.039); });
