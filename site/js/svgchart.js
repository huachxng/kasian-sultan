// Hand-rolled SVG area chart. No library, no colors beyond gold + neutrals.
const W = 1000, H = 520, PAD_L = 8, PAD_R = 8, TOP = 30, BOT = 470;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function renderAreaChart(host, { years, contributed, balance, band, yFmt, ariaLabel }) {
  const n = years.length;
  const maxV = Math.max(
    ...balance,
    ...(band ? band.p95 : []),
    1,
  );
  const x = (i) => PAD_L + (W - PAD_L - PAD_R) * (n === 1 ? 0 : i / (n - 1));
  const y = (v) => BOT - (BOT - TOP) * (v / maxV);

  const line = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = (arr) => `${line(arr)} L${x(n - 1).toFixed(1)} ${BOT} L${x(0).toFixed(1)} ${BOT} Z`;

  let bandPath = '';
  if (band) {
    const fwd = band.p95.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const back = band.p5.map((v, i) => ({ v, i })).reverse()
      .map(({ v, i }) => `L${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    bandPath = `${fwd} ${back} Z`;
  }

  // gridlines at 4 levels
  const grid = [0.25, 0.5, 0.75, 1].map(f => {
    const gv = maxV * f, gy = y(gv);
    return `<line x1="${PAD_L}" y1="${gy.toFixed(1)}" x2="${W - PAD_R}" y2="${gy.toFixed(1)}"
              stroke="currentColor" stroke-opacity=".12"/>
            <text x="${PAD_L + 4}" y="${(gy - 6).toFixed(1)}" font-size="13"
              fill="currentColor" fill-opacity=".5">${yFmt(gv)}</text>`;
  }).join('');

  // x labels every 5 years plus the last
  const xlabels = years.map((yr, i) => {
    if (i !== n - 1 && (yr % 5 !== 0 || i === 0)) return '';
    const anchor = i === n - 1 ? 'end' : 'middle';
    return `<text x="${x(i).toFixed(1)}" y="${H - 12}" font-size="13" text-anchor="${anchor}"
              fill="currentColor" fill-opacity=".5">${yr}</text>`;
  }).join('');

  const len = 3200; // generous dash length for the draw-in
  host.innerHTML = `
<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ariaLabel}" preserveAspectRatio="xMidYMid meet">
  ${grid}
  ${band ? `<path d="${bandPath}" fill="var(--gold)" fill-opacity=".12"/>` : ''}
  <path d="${area(contributed)}" fill="currentColor" fill-opacity=".16"/>
  <path d="${line(contributed)}" fill="none" stroke="currentColor" stroke-opacity=".45"
        stroke-width="1.5" stroke-dasharray="4 4"/>
  <path d="${line(balance)}" fill="none" stroke="var(--gold)" stroke-width="3"
        stroke-linecap="round" stroke-linejoin="round"
        ${reduced ? '' : `stroke-dasharray="${len}" stroke-dashoffset="${len}"`}>
    ${reduced ? '' : `<animate attributeName="stroke-dashoffset" from="${len}" to="0"
       dur="1.1s" fill="freeze" calcMode="spline" keySplines="0.22 0.8 0.24 1" keyTimes="0;1"/>`}
  </path>
  <line x1="${PAD_L}" y1="${BOT}" x2="${W - PAD_R}" y2="${BOT}" stroke="currentColor" stroke-opacity=".3"/>
  ${xlabels}
</svg>`;
}
