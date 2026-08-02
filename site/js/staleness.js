// ISO date strings compare lexicographically — no Date parsing needed.
export const isStale = (cfg, todayISO) => todayISO > cfg.review_by;
