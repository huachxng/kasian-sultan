// Scroll choreography: IntersectionObserver marks the active chapter,
// CSS does the actual animating. Native scroll is never hijacked.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initChoreography() {
  const chapters = document.querySelectorAll('section.chapter');
  const rail = document.querySelectorAll('#rail a');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-active');
        const n = e.target.dataset.chapter;
        rail.forEach(a => a.setAttribute('aria-current', a.hash === `#ch-${n}` ? 'true' : 'false'));
      }
    }
  }, { threshold: 0.35 });
  chapters.forEach(c => io.observe(c));
}

const D = 700;
let gen = 0;

export function animateCount(el, to, { format = (v) => String(Math.round(v)) } = {}) {
  const final = format(to);
  const from = Number(el.dataset.from ?? 0);
  el.dataset.from = to;

  if (reduced) { el.textContent = final; return; }

  const mine = ++gen;
  el.dataset.gen = mine;
  const t0 = performance.now();
  const tick = (t) => {
    if (el.dataset.gen != mine) return;              // superseded by a newer value
    const k = Math.min(1, (t - t0) / D), e = 1 - (1 - k) ** 3;
    el.textContent = k < 1 ? format(from + (to - from) * e) : final;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // rAF is frozen in background/hidden tabs. Never leave a stale placeholder
  // on screen — if the animation did not land, write the real number.
  setTimeout(() => {
    if (el.dataset.gen == mine && el.textContent !== final) el.textContent = final;
  }, D + 250);
}

export function seedParticles(host, count = 26) {
  if (reduced) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    // deterministic scatter — no Math.random, so the field is stable across reloads
    const x = (i * 37) % 100, y = (i * 61) % 100;
    p.style.left = `${x}%`;
    p.style.top = `${y}%`;
    p.style.animationDuration = `${9 + (i % 7) * 2.5}s`;
    p.style.animationDelay = `${-(i % 11) * 1.7}s`;
    frag.appendChild(p);
  }
  host.appendChild(frag);
}
