import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { personalMilestones } from '../js/engine/milestones.js';
import { buildICS } from '../js/ics.js';

test('calendar config sane and dated', () => {
  const cal = JSON.parse(readFileSync(new URL('../config/calendar/th/2026.json', import.meta.url)));
  assert.equal(cal.events.length, 5);
  for (const e of cal.events) assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(cal.events.some(e => e.id === 'esgSunset' && e.date === '2026-12-31'));
});

test('personal milestones from birth year', () => {
  const m = personalMilestones(1990, 2026);
  assert.deepEqual(m, [
    { id: 'rmf55', age: 55, year: 2045 },
    { id: 'nsf60', age: 60, year: 2050 },
    { id: 'exempt65', age: 65, year: 2055 },
  ]);
});

test('ICS structure, CRLF, escaping', () => {
  const ics = buildICS([{ uid: 'a@kasian', dateISO: '2027-03-31', summary: 'File PND90/91; do not be late', description: 'Line1\nLine2, with; chars' }]);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('BEGIN:VEVENT\r\n'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20270331'));
  assert.ok(ics.includes('SUMMARY:File PND90/91\\; do not be late'));
  assert.ok(ics.includes('DESCRIPTION:Line1\\nLine2\\, with\\; chars'));
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
  assert.ok(!/(^|[^\r])\n/.test(ics), 'every LF must be preceded by CR');
});
