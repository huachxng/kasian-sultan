// Minimal RFC 5545 all-day-event calendar builder. CRLF line endings, escaped text.
const esc = (s) => String(s)
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

export function buildICS(events) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kasian Sultan//EN', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    const d = e.dateISO.replaceAll('-', '');
    L.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${d}T000000Z`,
      `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${esc(e.summary)}`);
    if (e.description) L.push(`DESCRIPTION:${esc(e.description)}`);
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n') + '\r\n';
}
