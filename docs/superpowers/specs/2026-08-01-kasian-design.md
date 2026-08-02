# Kasian — Design Spec
**Date:** 2026-08-01 · **Status:** Approved design, pre-implementation
**Working name:** *Kasian* (เกษียณ, "retire") — final product name and domain are the owner's choice before launch; implementation does not block on it.

A bilingual (EN/TH) progressive web app that helps people of any age in Thailand plan retirement, track spending, and become tax-literate. Grew out of the owner's Excel model (`Retirement_plan_for_sharing_v.2.xlsx`); replaces it with a correct, adaptive, installable application.

**Foundation document:** [`docs/research/2026-08-01-research-brief.md`](../../research/2026-08-01-research-brief.md) — verified Thai tax data, engine math conventions, costs, PDPA duties. The brief is the single source of truth for every number; this spec references it rather than restating it. Items the brief marks **UNVERIFIED** are never computed by the app — they are either excluded or presented as explainer text with a "confirm with the Revenue Department" note.

---

## 1. Product decisions (locked)

| Decision | Choice |
|---|---|
| Form factor | PWA — installable, offline-first, no app store required (Capacitor wrap possible later) |
| Accounts | Yes — Supabase Auth, magic-link email + Google OAuth. No passwords ever stored. No SMS OTP (cost, brief §7) |
| Backend | Supabase **Pro from day one** (owner's choice): Postgres, RLS, backups, no project pausing. Region: `ap-southeast-1` (Singapore) — documented in the privacy notice per PDPA cross-border practice (brief §8) |
| Language | Bilingual EN/TH from v1, runtime toggle, persisted per user |
| Jurisdiction | Thailand-first; generic country mode via user-defined bracket schema (brief §6) |
| Monetization | **Free.** Thai SEC "investment advisory for remuneration" is licensable only by companies — a paid app run by an individual has no compliant path. Any future monetization requires Thai counsel review first (brief §8) |
| Advice posture | Education only: mechanics, calculators, user-editable assumptions, scenarios. Never names a fund/ticker as a suggestion; never consumes risk tolerance to output an allocation |
| Tech | Plain HTML/CSS/JS ES modules. No framework, no build step, no chart library (hand-drawn SVG). Engine is pure, dependency-free JS runnable in Node for tests |
| Tax/calendar data | **Year-versioned JSON config, never code.** Manual review each tax year (brief §9: TISA, remittance relaxation, Thai ESG sunset, e-filing +8d lapse are live watch items) |

**Costs accepted by owner:** ~$311/yr now (domain $11 + Supabase Pro $300); email at scale via AWS SES; +$99/yr Apple / +$25 Google only if store wrap happens later.

---

## 2. Architecture

```
┌─────────────────────────── Browser (PWA) ────────────────────────────┐
│  UI modules (js/app/*)         i18n (js/i18n/ + locales/{en,th}.json)│
│        │                                                             │
│  Engine (js/engine/*) ── pure functions, no I/O, no DOM              │
│        │                                                             │
│  Store (js/store/*) ── IndexedDB = local source of truth             │
│        │              sync queue → push/pull ↔ Supabase              │
│  Service worker (sw.js): precache app shell, offline, update flow    │
└──────────────────────────────────────────────────────────────────────┘
                     │ HTTPS (Supabase JS client)
┌────────────────────▼─────────────────────────────────────────────────┐
│ Supabase Pro (ap-southeast-1): Auth · Postgres+RLS · Edge Functions  │
│  edge fn `reminders-daily` (cron): due reminders → email (SES) +     │
│  Web Push (VAPID). No other server code.                             │
└──────────────────────────────────────────────────────────────────────┘
```

**Offline-first contract:** every feature except sign-in, sync, and server-sent reminders works with no network. IndexedDB is authoritative locally; server is the sync/backup target. Signed-out use is allowed (local-only "guest" profile) with a visible "not backed up" badge; signing in adopts the local data.

**Sync policy:** per-record last-write-wins on `updated_at` (server clock on push). Single-user data, low conflict risk; LWW is acceptable and documented in-app ("last saved device wins"). Deletions are hard deletes replicated via tombstone rows purged after 30 days.

**Repo layout:**

```
retirement-app/
├── index.html  manifest.webmanifest  sw.js
├── css/                      # app.css, theme via custom properties, prefers-color-scheme
├── js/
│   ├── app/                  # one module per UI feature (wizard, dashboard, …)
│   ├── engine/               # projection.js, montecarlo.js, tax_th.js, tax_generic.js,
│   │                         #   spending.js, withdrawal.js, milestones.js
│   ├── store/                # db.js (IndexedDB), sync.js, export.js
│   └── i18n/                 # t() helper, locale loader
├── locales/en.json  locales/th.json
├── config/
│   ├── tax/th/2026.json      # brackets, allowances, vehicle caps (verified values only)
│   ├── tax/samples/us-2026.json
│   ├── calendar/th/2026.json # date rules + Thai public holidays
│   └── content/              # learn cards, per-locale metadata
├── supabase/
│   ├── migrations/*.sql      # schema + RLS policies
│   └── functions/reminders-daily/
├── tests/                    # node --test; golden + property tests
└── docs/                     # research brief, this spec, PDPA docs, breach runbook
```

---

## 3. Data model

Postgres tables (all with `id uuid`, `user_id uuid → auth.users`, `created_at`, `updated_at`; RLS: `user_id = auth.uid()` for all four operations). IndexedDB mirrors the same shapes.

| Table | Purpose / key fields |
|---|---|
| `profiles` | birth_year, target_retirement_age, planning_age, employment_status, locale, life_stage (derived, cached), marital/dependents info for allowances (children's birth years — the ฿60k rule is birth-year-conditional, brief §1) |
| `holdings` | asset_class enum (cash, deposit, PVD, GPF, RMF, SSF_legacy, thai_esg, mutual_fund, th_stock, foreign, bond, gold, other), balance, **lots** for clock-bearing vehicles: `{purchase_year, amount}` → holding-period countdowns; `acquired_year` on foreign assets (remittance explainer only, no computation) |
| `transactions` | date, amount (int, satang), category_id, essential flag, note |
| `categories` | COICOP-aligned division + user label, default essential flag, locale labels |
| `income_sources` | type (sso_pension, company_pension, rental, dividend, consulting, other), start_age, annual_amount_today, sso_months_contributed (for the 180-month tracker) |
| `special_costs` | age, label, amount_today |
| `scenarios` | named assumption sets: nominal_return_pre/post, inflation, healthcare_inflation, contribution, contribution_growth (real), salary_growth; three seeded defaults (bear/base/bull) editable per user; `active_scenario_id` on profile |
| `reminders` | source (statutory \| milestone \| custom), date_rule ref or explicit date, channels {inapp, push, email}, enabled |
| `consents` | policy_version, consented_at, purposes (unbundled booleans) |
| `sensitive_ops_log` | append-only: export, delete-request, consent change, sign-in method change |

Money is stored as **integer satang**; rates as **basis points** (brief §6 engineering rules). Engine works in integers/bp end to end.

---

## 4. Engine (js/engine/) — the load-bearing module

Pure functions: `(inputs, config) → results`. No Date.now() inside computations (year passed in), no I/O, deterministic. Every convention below is from brief §5 and is a hard requirement:

1. **Real (today's-baht) display by default**; nominal is a labelled toggle. Real rate via exact Fisher: `(1+r_nom)/(1+i) − 1`.
2. **True monthly compounding**: monthly rate `(1+r)^(1/12) − 1`; contributions month-end.
3. **Closed form for slider responsiveness** (annuity-with-growth FV, `r = g` guard), verified in tests against the iterative loop to the satang.
4. **Geometric-mean seeding** for deterministic lines; never arithmetic means.
5. **Monte Carlo band**: lognormal annual returns, fixed seed per scenario (mulberry32), 1,000 paths interactive / 2,500 on final screens; report 5th–95th band + success % rounded to whole points (±2pp sampling error honesty note in UI).
6. **Withdrawal module**: fixed-real-rate rule (default 3.9%, config `swr_th_2026` with visible as-of note) and guardrails option; 25× heuristic taught as `1/rate`, applied only to portfolio-funded spending after netting guaranteed income.
7. **Spending model**: essential-vs-discretionary floor from tracker data; phases default flat-real with optional labelled declining curve; healthcare category inflates at healthcare rate; **negative inflation must not break anything**.
8. **SSO pension**: benefit formula + the gazetted wage-ceiling schedule (17,500 → 20,000 → 23,000) from config; 180-month cliff surfaced as a milestone.
9. **Thai tax engine** (`tax_th.js`): allowances → net income → bracket fold, all from `config/tax/th/2026.json`. Computes: PIT for a salary; marginal + effective + "tax on next ฿1,000"; deduction simulation (RMF/Thai ESG/insurance amounts → new tax, enforcing the ฿500k shared ceiling vs separate stacks and %-of-income tests); interest include-vs-exclude comparison (15% WHT election). **Not computed:** dividend credit (voucher-dependent fraction), treaty credits, remittance amounts — explainer cards only.
10. **Generic tax engine** (`tax_generic.js`): brief §6 minimum schema exactly (TaxRegime, integer minor units, bp rates, 0% bracket subsumes allowance, refuse to compute on unknown tax year). Ships with US-2026 sample + a "build your country" custom regime editor.

Config files carry `{tax_year, sources: [urls], verified_on, review_by}` headers. If today > `review_by`, the app shows a staleness banner on tax screens — the "annual human review" requirement made visible.

---

## 5. UI modules (js/app/)

Life stage derived from age/employment (student <20, early 20–34, mid 35–49, pre-retirement 50+, retired) reorders module emphasis and wizard defaults only — every module is always reachable.

1. **Wizard** — 5 inputs (birth year, income, current savings, monthly saving, retirement age) → working dashboard in under a minute; everything else defaulted, editable later. Guest mode allowed; sign-in offered at the end ("back up & sync").
2. **Dashboard** — the number (portfolio at retirement, real), the gap (need vs projected, from withdrawal rule net of guaranteed income), readiness status, next deadline, vehicle-clock countdowns (RMF years-to-55, Thai ESG lot maturity), staleness banner slot.
3. **Projection & DCA lab** — SVG chart: contributions vs growth split, deterministic central line + MC band; sliders (monthly amount, retirement age, return, inflation) driving closed-form instantly; sequence-of-returns explainer with the brief's worked ฿1M demo; DCA-vs-lump-sum card scoped to windfalls only (never calls salary DCA suboptimal); bear/base/bull via scenario switch.
4. **Spending tracker** — fast entry (amount, category, essential toggle), monthly rollups by category, essential-floor trend, "your data replaces the guess" panel: seeds retirement budget from trailing-12-month essential+chosen-discretionary spend, one tap to adopt into projection.
5. **Tax lab** — bracket staircase visualization of *your* income; marginal vs effective vs next-฿1,000 (the misconception, front and center); deduction simulator with live ceiling meters (500k shared / 300k Thai ESG / 100k insurance group / 15k parents) and tax-saved readout; interest WHT election comparison; generic-mode switch.
6. **Calendar & reminders** — statutory dates from config (31 Mar / e-file window, 30 Sep PND94 when relevant, 15 Feb 50 ทวิ, mid-Dec fund cutoff with "confirm exact date" wording, Thai ESG sunset 31 Dec 2026); personal milestones (RMF@55, age-60 NSF, age-65 exemption, SSO 180-month progress); channels: in-app, Web Push, email; **.ics export** of everything; weekend/holiday roll-forward from holiday config.
7. **Learn** — card library (EN/TH): every vehicle (what/risk/liquidity/tax/minimums/status incl. "SSF closed 2024", "Thai ESG enhanced ends 2026"), remittance rule explainer, filing-≠-owing, illustrative age-based allocation *examples* labelled education, marginal-rate myth, sequence risk, 4%-rule-as-assumptions. Cards carry source links from the brief.
8. **Account & data (PDPA surface)** — privacy notice (EN/TH, s.23-complete incl. rights), unbundled consent at signup + re-consent on version bump, one-tap JSON export, hard delete (cascade + edge-function purge + "backups age out in 7 days" statement), retention statement, sensitive-ops log view.

Accessibility & localization details: semantic HTML, keyboard navigable, WCAG AA contrast both themes, Thai line-breaking handled (`wbr`/CSS `line-break: loose` review). Arabic numerals throughout (no Thai-digit rendering); in the Thai locale, years show Buddhist Era with CE alongside — "ปีภาษี 2569 (2026)" — since Thai tax years are communicated in พ.ศ.

---

## 6. Reminders backend

Edge function `reminders-daily` (Supabase cron, 07:00 Asia/Bangkok): query due reminders → send email (AWS SES; Resend free tier acceptable until volume) + Web Push (VAPID; iOS requires installed PWA — surfaced in UI). Failures logged; function is idempotent per (reminder, date). LINE channel: **out of scope v1**, noted as the researched-open question for v2.

---

## 7. Error handling

- **Engine guards:** age ordering, bounded rates (−10%…+30%), r=g branch, empty-data fallbacks; engine throws typed errors → UI shows friendly localized messages, never NaN on screen.
- **Unknown tax year:** refuse computation, show "rules for {year} not loaded" (schema mandate).
- **Sync:** offline queue with exponential backoff; conflict = LWW with a toast when a record was superseded; full-resync recovery path.
- **Auth:** magic-link expiry and OAuth cancel paths; guest→account merge conflict prompt (keep local / keep server / keep newest).
- **Service worker:** versioned precache, "update available" prompt, config files network-first with cache fallback.
- **Reminder function:** per-item try/catch, dead-letter log table, daily summary log line.

---

## 8. Testing

- **Engine (node --test, no browser):**
  - Golden tax cases from the brief: ฿310,000 salary → ฿0 tax; ฿320,000 → ฿500; bracket boundary sweep; ceiling interactions (pension insurance inside 500k, Thai ESG outside).
  - Closed-form FV ≡ monthly loop to the satang across a parameter grid incl. r=g.
  - Fisher-vs-subtraction difference reproduces the brief's ~฿104k/1.2% example within tolerance.
  - MC determinism (seeded), success-% rounding, negative-inflation paths.
  - SSO formula against hand-computed cases across the ceiling schedule.
  - Generic engine vs US-2026 sample hand calcs; unknown-year refusal.
- **Config validation script:** JSON schema check + `review_by` presence + locale key parity (en/th identical key sets).
- **Store:** IndexedDB round-trip, export completeness (every user table represented), delete-cascade check.
- **RLS:** SQL tests in migrations (user A cannot read user B) run against local Supabase before deploy.
- **Manual checklist per release:** PWA install (Android/iOS), offline cold start, sync after airplane mode, magic-link flow, .ics import into Google/Apple Calendar, TH/EN toggle on every screen.

---

## 9. Out of scope (v1) — explicit

Foreign-remittance *computation* (explainer only) · dividend-credit computation · PND94 tax computation (calendar mention only) · LINE reminders · bank-feed import (would trigger PDPA s.25 + credit-info law review) · multi-user/household · monetization · app-store wrap · TISA (config-flagged watch item).

## 10. Launch gates (owner actions, not code)

1. Buy domain (Porkbun, ~$11) · create Supabase Pro project (ap-southeast-1) · SES or Resend account. Env values into `config/app.env.json` (client-safe keys only).
2. **Before public (stranger) signups:** Thai data-protection lawyer pass (notice, ROPA, retention), Thai counsel confirm SEC education perimeter (brief §8 citations ready), breach runbook contact details filled in.
3. Each January: tax-config annual review against the new RD filing-guide PDF, from a Thai IP; bump `review_by`.

## 11. Build order (for the implementation plan)

M1 engine + tests → M2 shell/wizard/dashboard (guest, local-only) → M3 projection lab → M4 spending tracker → M5 tax lab → M6 calendar (.ics, local notifications) → M7 Supabase (auth, sync, PDPA surface, RLS tests) → M8 reminders edge function + push/email → M9 Thai locale full pass → M10 beta hardening (a11y, perf, manual checklist).

Each milestone lands runnable and tested; the app is usable (local-only) from M2 onward.
