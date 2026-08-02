// In-memory only. Nothing here is persisted, sent, or stored.
// The tab closes, the numbers are gone — that is the whole point.
export const session = {
  age: 30,
  retireAge: 60,
  monthlyTHB: 5000,
  essentialTHB: 15000,
  discretionaryTHB: 8000,
  guaranteedTHB: 0,
  incomeTHB: 480000,
  scenario: 'base',
};

export function update(patch) {
  Object.assign(session, patch);
  document.dispatchEvent(new CustomEvent('session:change', { detail: patch }));
}
