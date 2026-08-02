import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { _initForTest, t, beYear, yearLabel } from '../js/i18n.js';
import { isStale } from '../js/staleness.js';

const en = JSON.parse(readFileSync(new URL('../locales/en.json', import.meta.url)));
const th = JSON.parse(readFileSync(new URL('../locales/th.json', import.meta.url)));

const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'object' && v !== null ? keys(v, `${p}${k}.`) : [`${p}${k}`]);

test('locale key parity en ↔ th', () => {
  assert.deepEqual(keys(en).sort(), keys(th).sort());
});

test('t: dot path, interpolation, fallback', () => {
  _initForTest(en, th, 'th');
  assert.equal(t('chrome.tagline'), 'เกษียณอย่างสุลต่าน');
  assert.equal(t('chrome.stale', { date: '1 ส.ค. 2569' }).includes('1 ส.ค. 2569'), true);
  assert.equal(t('no.such.key'), 'no.such.key');
});

test('BE years', () => {
  assert.equal(beYear(2026), 2569);
  assert.equal(yearLabel(2026, 'en'), '2026');
  assert.equal(yearLabel(2026, 'th'), '2569 (2026)');
});

test('staleness by ISO compare', () => {
  assert.equal(isStale({ review_by: '2027-01-31' }, '2026-08-01'), false);
  assert.equal(isStale({ review_by: '2027-01-31' }, '2027-02-01'), true);
});
