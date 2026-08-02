# Kasian Sultan — Design Spec v2 (static cinematic site)
**Date:** 2026-08-01 · **Status:** Supersedes [v1 (accounts PWA)](2026-08-01-kasian-design.md) after owner pivot: free of charge, no accounts, no database, no reminders backend, non-commercial, educational for all audiences.

**Kasian Sultan** (เกษียณ "retire" + sultan) — a free, bilingual (EN/TH), scroll-driven educational website that teaches retirement planning and Thai tax literacy through a cinematic chapter narrative with live, in-browser calculators. Nothing is collected, stored, or sent anywhere: every computation runs in the visitor's browser and vanishes when the tab closes.

**Foundation:** [`docs/research/2026-08-01-research-brief.md`](../../research/2026-08-01-research-brief.md) remains the single source of truth for all figures. UNVERIFIED items are never computed — explainer text only. Inherited unchanged from v1: engine math conventions (§4 there), year-versioned tax config with staleness banner, education-only guardrails, EN/TH bilingual, integer satang / basis-point arithmetic.

---

## 1. What changed vs v1

| | v1 | v2 (this spec) |
|---|---|---|
| Cost | ~$311/yr | **$0** (free hosting; domain optional later) |
| Accounts / DB / sync | Supabase Pro | **None. Zero data collection** — the strongest possible privacy posture; PDPA surface shrinks to a one-paragraph "we collect nothing" notice |
| Reminders | Push + email backend | **Cut.** Dates chapter + downloadable `.ics` calendar file (static, generated client-side) |
| Spending tracker | Full module | **Cut** (needs storage). Its key idea — essential vs discretionary spending — survives as an interactive teaching moment in Chapter 02 |
| Form | App with nav | **Scroll-driven chapter narrative** (the race-day structure) with a chapter index for direct access |
| Monetization | Free, counsel before any change | **Non-commercial, permanently for this version** |

SEC posture improves: free + general education + user-editable assumptions + no personalization stored = cleanly outside "investment advisory for remuneration." Disclaimer still mandatory (§6).

## 2. Design language

**References decoded:** On Race Day (Immersive Garden) → numbered full-viewport chapters, scroll-driven progression, stats that animate in, one idea per slide. Lando Norris site → editorial scale typography, floating annotation cards, light↔dark scene swings, contour-line background texture. Orano → near-black + gold particles, hairline 1px grid, tracked-out uppercase microlabels, EN/FR toggle pattern (ours: EN/ไทย).

**Palette (design tokens):**

```
--ink:        #0B0B0C   near-black (dark scenes)
--paper:      #F6F4EF   warm off-white (light scenes)
--gold:       #C6A15B   champagne gold — accents, key numbers, active states
--gold-hi:    #E9CD8F   hover/glow variant
--line-dark:  rgba(246,244,239,.14)   hairlines on ink
--line-light: rgba(11,11,12,.12)      hairlines on paper
--muted-dark: rgba(246,244,239,.55)   secondary text on ink
--muted-light:rgba(11,11,12,.55)      secondary text on paper
```

Black, white, gold only. No other hues anywhere — charts included (gold + neutrals; distinctions via weight, dash, and opacity, which also solves color-blind safety). Chapters alternate ink/paper scenes; the wipe between them is part of the choreography.

**Typography (self-hosted OFL, subset):**
- Display EN: **Fraunces** (variable) — editorial luxury, used huge (clamp 3rem–9rem), tight leading.
- UI/body EN: **Inter** — tabular numerals for all figures.
- Thai: **IBM Plex Sans Thai Looped** (looped forms read better across ages) for both display and body in TH locale; display weight/scale mirrors Fraunces hierarchy.
- Microlabels: uppercase, +0.18em tracking, small — the Orano signature.

**Motion system:**
- Scroll-driven chapters: full-viewport sections; CSS `scroll-snap` (proximity) + IntersectionObserver choreography. Entering a chapter triggers its sequence: hairlines draw in, headline reveals by masked lines, stats count up (rAF, once per visit), chart paths draw (SVG `stroke-dashoffset`).
- Transitions: clean vertical wipes; a thin gold progress rail at the viewport edge shows chapter position (00–08) and doubles as clickable navigation.
- Texture: drifting fine contour lines (SVG, slow CSS transform loops) in hero/breather slides; subtle gold particle drift on ink scenes (small DOM/canvas count, capped).
- **No WebGL, no scroll-jacking libraries, no framework.** Native scroll always wins (the Norris site froze our renderer — that is the cautionary tale). `prefers-reduced-motion: reduce` ⇒ all animation becomes instant-state; counters render final values; site fully usable.

**Performance budget (hard):** ≤ 200KB gz total JS+CSS; fonts ≤ 250KB total via aggressive subsetting (`font-display: swap`); no images required by the design (type, lines, SVG only); Lighthouse mobile ≥ 90 across the board; interactive < 2s on a mid-range phone.

## 3. The chapters (content = the original ask, restructured as narrative)

Persistent chrome: wordmark top-left · EN/ไทย toggle top-right · gold progress rail with chapter numbers · footer disclaimer link on every chapter.

| # | Chapter (EN / TH working titles) | One idea | Interactive core |
|---|---|---|---|
| 00 | **Kasian Sultan** — "Retire like a sultan / เกษียณอย่างสุลต่าน" | Brand hero: ink scene, gold particles, headline, scroll cue. States plainly: free · educational · nothing you type leaves this page | — |
| 01 | **Time / เวลา** | Compounding: your biggest asset is years, not baht | Age dial (15–70). Sets `yearsLeft` used by later chapters (in-memory only). Live stat: "money invested at your age doubles ~N times by 65" (rule-of-72 illustration, geometric math underneath) |
| 02 | **The Number / ตัวเลขของคุณ** | What retirement costs; 25× heuristic honestly framed (assumptions, not magic) | Monthly-spending slider with essential/discretionary split control → real-terms target range via withdrawal-rule range (3.9%–5.7% as config), net of an SSO-pension toggle |
| 03 | **The Climb / DCA** | Dollar-cost averaging + growth vs contributions; uncertainty as a band, not a promise | The centerpiece chart: monthly amount + return + horizon sliders → SVG area chart splitting "you put in" vs "growth added," deterministic central line + seeded Monte Carlo 5th–95th band (1,000 paths, Web Worker). Sequence-risk mini-explainer with the brief's ฿1M worked demo |
| 04 | **The Rules of the Game / ภาษี** | How progressive tax actually works; marginal ≠ effective (the #1 misconception, verified bracket table) | Income slider → animated bracket staircase filling with gold; three readouts: marginal, effective, "tax on your next ฿1,000." Toggle: TH 2026 (ปีภาษี 2569) / generic demo brackets |
| 05 | **The Cheat Codes / ลดหย่อน** | Legal deductions: RMF, Thai ESG, PVD, insurance — caps, shared ฿500k ceiling, holding clocks; SSF closed; Thai ESG enhanced ends 31 Dec 2026 | Deduction simulator: sliders per vehicle with live ceiling meters (500k shared / 300k separate / 100k insurance group) → watch the staircase from Ch.04 shrink; "tax saved" counter. %-of-income tests enforced |
| 06 | **The Calendar / ปฏิทิน** | The dates that matter yearly + age milestones | Horizontal timeline (the Orano-slider moment): 31 Mar filing (e-file window note), mid-Dec fund cutoff, 15 Feb 50 ทวิ, Thai ESG sunset; age milestones RMF@55 · NSF@60 · 190k exemption@65; SSO 180-month rule explained. **Download `.ics`** (client-generated, localized) |
| 07 | **The Instruments / เครื่องมือ** | What you can actually buy in Thailand — savings, deposits, PVD, GPF, RMF, Thai ESG, index funds, SET stocks, bonds, gold — what/risk/liquidity/tax/minimum for each | Card gallery with flip/expand; illustrative age-based allocation *examples* clearly labelled "illustration, not advice"; DCA-vs-windfall evidence note scoped to windfalls |
| 08 | **Begin / เริ่ม** | Honest close: what this site is and isn't; the full disclaimer; sources; "show a licensed advisor" pointer; link back to Ch.01 | Sources list (every figure → brief URL + as-of date), config `verified_on/review_by` surfaced, GitHub-style "last reviewed" stamp |

Chapter index (hamburger) lists 00–08 for direct jumps — narrative by default, reference-card on demand.

## 4. Architecture

```
site/
├── index.html            one page, 9 <section> chapters
├── css/kasian.css        tokens, scenes, choreography (all motion CSS-first)
├── js/
│   ├── engine/           REUSED FROM V1 SPEC UNCHANGED: projection, montecarlo,
│   │                     tax_th, spending-floor, milestones — pure, node-testable
│   ├── chapters/         one module per chapter's interactivity
│   ├── choreography.js   IntersectionObserver sequences, counters, progress rail
│   ├── mc.worker.js      Monte Carlo off-main-thread
│   ├── ics.js            client-side .ics generation
│   └── i18n.js           locale loader, <html lang>, localStorage ONLY for locale pref
├── locales/en.json · th.json
├── config/tax/th/2026.json · config/calendar/th/2026.json · config/app.json (SWR range, MC params)
├── fonts/  (subset woff2)
└── tests/  (node --test: engine goldens identical to v1 §8 list + ics validity + locale parity)
```

State: a single in-memory `session` object (age, spending, sliders) threading chapters together. No persistence, no cookies, no analytics, no external requests at runtime (self-hosted everything; CSP `default-src 'self'`). Sole exception: locale preference in `localStorage` (a UI courtesy, disclosed in the privacy note).

**Error handling:** engine guards as v1 (typed errors → localized friendly messages, never NaN on screen); sliders clamp to sane ranges; Worker fallback = deterministic band note if Workers unavailable; config `review_by` past-due ⇒ staleness banner on Ch.04–06; JS-disabled ⇒ full text content + static SVG fallbacks render (calculators show "enable JavaScript" note — content never blank).

**Accessibility:** every chapter also readable as plain document flow (semantic h2/p under the choreography); sliders are real `<input type="range">` with visible values and keyboard steps; counters have `aria-live="polite"` final announcements; contrast AA on both scenes (gold on ink passes at display sizes; body text never gold); Thai line-breaking reviewed; BE years alongside CE in TH locale ("ปีภาษี 2569 (2026)").

## 5. Deployment (free)

1. **Now:** Claude Artifact publish (private link, shareable by owner) for review and sharing.
2. **Public, still $0:** GitHub Pages (owner's GitHub account; repo push → Pages; site is static, non-commercial, fully compliant with Pages terms) or Cloudflare Pages free tier. Owner performs account/deploy steps; repo ships with a one-page DEPLOY.md.
3. **Later, optional:** ~$11/yr Porkbun domain pointed at either host. Nothing in the build changes.

## 6. Disclaimer & integrity copy (verbatim, both languages)

Footer of every chapter (short form): *"Educational only — not financial advice. / เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน"*

Chapter 08 (full form, EN; TH translation mirrors):

> **Kasian Sultan is a free educational project.** It is not investment, tax, or legal advice, and no part of it is a recommendation to buy or sell any fund, security, or product. It is not operated by a licensed securities professional, financial advisor, or tax preparer, and is not affiliated with any financial institution or government agency. The calculators are illustrations driven entirely by assumptions **you** choose; projections are mathematical scenarios, not predictions or guarantees — real markets rise, fall, and misbehave, and past or assumed returns do not determine future results. Tax rules shown are for tax year 2026 (ปีภาษี 2569), verified against the sources listed below on the date shown, and **change often** — confirm current rules with the Revenue Department (rd.go.th) before acting. Before making investment, tax, or retirement decisions, consult a licensed professional: an SEC-licensed investment advisor for investments, or a qualified tax advisor for your filing. **Nothing you enter here is collected, stored, or transmitted — all calculations run and remain in your browser** (your language choice is saved on your own device only).

Guardrails inherited: no fund/ticker suggestions anywhere; "example," "illustration," "scenario" vocabulary enforced; every figure traceable to the sources list.

## 7. Out of scope (v2)

Accounts/sync · reminders delivery · spending tracker · generic-country regime *builder* (generic mode = demo brackets in Ch.04 only) · foreign-remittance computation (explainer card in Ch.07) · dividend-credit computation · app-store wrap · CMS (content lives in locales/config JSON).

## 8. Build order

B1 scaffold + tokens + type + scenes/wipes + progress rail → B2 engine port + full test suite green → B3 Ch.01–03 (time, number, DCA chart + worker) → B4 Ch.04–05 (tax staircase, deductions) → B5 Ch.06 timeline + .ics → B6 Ch.07–08 + full disclaimer → B7 TH locale complete pass → B8 polish: reduced-motion, a11y sweep, perf budget audit, cross-device manual checklist → B9 Artifact publish + DEPLOY.md.

Definition of done per chapter: works by keyboard · works in TH · works with reduced motion · engine numbers match a hand-checked golden test.
