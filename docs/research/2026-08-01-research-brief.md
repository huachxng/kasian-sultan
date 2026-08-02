# Research Brief: Thai Retirement + Spending-Tracking + Tax-Literacy PWA
**Compiled 1 August 2026. Current Thai tax year: 2026 (B.E. 2569); most recent completed filing season: tax year 2025.** All figures carry as-of dates and sources. Items marked **UNVERIFIED** survived research but failed adversarial verification against a primary text — do not hard-code them as fact. Streams 5 (projection math) and 6 (generic mode) received no adversarial pass; their researchers' own confidence labels are carried through.

---

## 1. Thai PIT brackets & allowances

### Bracket table (ready to hard-code, verified verbatim against RD's own filing-guide PDF)

| Net income band (THB) | Rate | Cumulative tax at band floor |
|---|---|---|
| 0 – 150,000 | 0% | 0 |
| 150,001 – 300,000 | 5% | 0 |
| 300,001 – 500,000 | 10% | 7,500 |
| 500,001 – 750,000 | 15% | 27,500 |
| 750,001 – 1,000,000 | 20% | 65,000 |
| 1,000,001 – 2,000,000 | 25% | 115,000 |
| 2,000,001 – 5,000,000 | 30% | 365,000 |
| > 5,000,000 | 35% | 1,265,000 |

Tax = cumulative figure + rate × amount over band floor. As-of: tax year 2024 RD guide, rates stable since 2017, confirmed current by PwC (reviewed 2 Feb 2026). Sources: https://www.rd.go.th/fileadmin/download/english_form/2024/GUIDE_91_67_Complete.pdf ; https://taxsummaries.pwc.com/thailand/individual/taxes-on-personal-income

### Deductions & allowances (tax year 2024 rules, confirmed current Feb 2026, same sources)

| Item | Amount | Notes |
|---|---|---|
| Employment expense deduction | 50% of income, cap THB 100,000 | Cap combined across s.40(1)+40(2) income (combined-cap detail per PwC; not verified in the 91 guide, which covers employment-only filers) |
| Personal allowance | 60,000 | |
| Spouse allowance (no income / not filing separately) | 60,000 | |
| Child allowance | 30,000 first child; 60,000 for 2nd+ children **born in or after 2018** | Condition is birth-year, not just birth order — store each child's birth year |
| Parental care | 30,000 per parent | Conditions (parent >60, income <30,000) appear only on the stale RD page — re-verify before coding eligibility gates |
| Disabled/incapacitated dependent | 60,000 per person | PwC, reviewed 2 Feb 2026 |
| Age-65+ / disabled income exemption | up to 190,000 off total income, before expense deduction | Once only if both 65+ and disabled; a jointly-filing 65+/disabled spouse gets their own 190,000. Verbatim in RD guide — critical for this app's target users |

### Derived thresholds (arithmetic, verified)
- Tax-free gross salary, single filer, no other allowances: **THB 310,000/yr** (310,000 − 100,000 − 60,000 = 150,000 = top of 0% band). Checked at 320,000 → tax THB 500.
- **Filing ≠ owing**: annual return required above THB **60,000** income (single) / **120,000** (married) for general income, or **120,000 / 220,000** where income is employment-only 40(1) — Revenue Code s.56, read directly at https://www.rd.go.th/5937.html. Many users must file while owing zero; message this clearly.

### Form scope & scrape warnings
- Employment-only filers use **ภ.ง.ด.91**; anyone with investment/rental/foreign income (i.e., most of this app's users) files **ภ.ง.ด.90**. Reminder engine and any guide-PDF ingestion must target the right form.
- **Do not scrape rd.go.th/english/6045.html** — confirmed serving the pre-2017 table (top band >4,000,000; 30,000 allowances; 15,000/child capped at 3 children). Truth lives in the annual filing-guide PDFs under rd.go.th/fileadmin/download/english_form/. Thai-language allowance pages publish figures as JPEG. Plan a manual annual review.
- **PwC is also stale on the remittance rule** (below) despite a Feb-2026 review stamp. No single secondary source is safe as sole cross-check.

### Foreign-remittance rule (the app's single most important rule)
- **In force, confirmed verbatim from the RD guide**: a Thai tax resident (180+ days in the year) is taxed on foreign-sourced income earned from 1 Jan 2024 onward if remitted to Thailand **in the same or any later tax year**. Pre-2024 income/gains are grandfathered and remittable tax-free indefinitely (attributed to Por.161/2566 and Por.162/2566 — instrument numbers/dates consistent across secondary sources but **UNVERIFIED** against primary text). Source: RD guide PDF above.
- App consequences: (1) track tax-year-of-origin of each foreign pot, not just balances; (2) a non-resident year breaks the chain — income earned while non-resident is outside the charge even if remitted later.
- **The proposed relaxation (exempt if remitted in year earned or the following year) is a DRAFT, not law, as of 1 Aug 2026.** It missed its intended 1 Jan 2026 start; Thailand dissolved the House, held general elections 8 Feb 2026, and no enactment has been reported since (14 Jul 2026 reporting). If enacted it may apply retroactively to 2024+ income, forcing recomputation. Build to current law; make the two-year window a configurable future rule. Sources: https://www.forvismazars.com/th/en/insights/doing-business-in-thailand/tax/tax-rules-on-foreign-sourced-income ; https://aimbangkok.com/thailand-foreign-income-tax-relaxation-2025/. Trap: Royal Decree 743 is the separate LTR-visa exemption, easily confused in search results.
- Foreign capital gains follow the same remittance test; Thailand has no standalone CGT — remitted foreign gains are ordinary income at up to 35%. **Cite the RD guide, not PwC, for remittance timing** — PwC's income-determination page (reviewed 2 Feb 2026) still states the obsolete pre-2024 "year of receipt" rule.

---

## 2. Thai investment-income tax treatment

| Income type | Treatment | Status |
|---|---|---|
| Bank/deposit interest | 15% WHT; elect final by excluding from return, OR include at progressive rates and credit the WHT. Savings-deposit interest up to 20,000 THB/yr separately exempt. Optimal logic: exclude if marginal rate >15%; include-and-credit in 0/5/10% bands (refund). | Confirmed. https://taxsummaries.pwc.com/thailand/individual/income-determination (reviewed 2 Feb 2026) |
| Dividends (Thai) | 10% WHT; elect to exclude (final, forfeits credit/refund) or gross up and claim the dividend tax credit. | Confirmed. https://www.rd.go.th/english/6045.html (fetched 1 Aug 2026) |
| — all-or-nothing election across all dividends in the year | **UNVERIFIED** — asserted by researcher, absent from both texts as read. Needs Revenue Code check before coding. | |
| — dividend credit fraction | **DO NOT HARD-CODE.** RD page's 3/7 implies a 30% CIT rate and is stale; headline CIT is 20% (implying 1/4) per https://taxsummaries.pwc.com/thailand/corporate/taxes-on-corporate-income, but BOI/SME payers bear 0/15/20% rates so the credit legitimately varies per dividend. Read the rate off the dividend voucher; verify Revenue Code s.47 bis. | |
| Capital gains, SET-listed shares | Exempt from PIT. | Confirmed (PwC, 2 Feb 2026). **The on-exchange-venue condition (off-market transfers of listed shares not covered) is UNVERIFIED** — PwC's phrasing is ambiguous between listing status and sale venue; needs Ministerial Regulation No. 126 check. |
| Capital gains, mutual fund units | Exempt on redemption. | Confirmed per PwC; governing provision not read. Treatment of fund **distributions** (vs redemption gains): **open question, unresolved by both passes.** |
| Foreign investment income/gains | No Thai tax while offshore; taxed as ordinary income (up to 35%) on remittance per Section 1 rules. Key planning asymmetry vs SET-exempt domestic trades — model explicitly. Foreign tax may be treaty-creditable — flag, don't compute. | Confirmed (remittance timing per RD guide, not PwC) |

---

## 3. Thai tax-advantaged vehicles (tax year 2026)

**Core rule (confirmed):** one combined **THB 500,000/yr ceiling** across RMF + PVD + GPF + teacher's welfare fund + NSF + pension life insurance (+ legacy SSF nominally). Sub-caps are not additive. Thai ESG, the 100,000 life/health group, and 15,000 parents' health each stack separately. Sources: https://taxsummaries.pwc.com/thailand/individual/deductions (2 Feb 2026); https://sherrings.com/personal-tax-deductions-allowances-thailand.html; https://www.krungsriasset.com/EN/news/news-notice/QA-THAIESGX/

| Vehicle | % cap | THB cap | Shares 500k ceiling? | Holding period | Min age | Open 2026? |
|---|---|---|---|---|---|---|
| RMF | 30% of assessable income | 500,000 | Yes | 5 yrs from **first** purchase (**UNVERIFIED** first-purchase-vs-per-lot mechanic) + must not skip >1 consecutive yr; min annual purchase lesser of 3% of income or 5,000 (per RD guide) | 55 at redemption | Yes |
| SSF | 30% (historic) | 200,000 (historic) | Yes (legacy) | 10 yrs per purchase lot, no age test | — | **NO — expired; last deductible year 2024.** Model as read-only legacy type with clocks running to ~2034. https://www.itax.in.th/pedia/ssf/ |
| Thai ESG (enhanced, 1 Jan 2024–**31 Dec 2026**) | 30% | 300,000 | **No — separate stack** | 5 yrs (**per-lot day-count UNVERIFIED** — one source says from initial purchase; check MR 390/395) | — | Yes — **2026 is the last enhanced year; reverts to 100,000 / 8-yr from 1 Jan 2027 unless extended.** https://sherrings.com/esg-mutual-fund-tax-incentive-thailand.html |
| Thai ESGX new money | 30% | 300,000 | No | 5 yrs | — | **NO — window was 1 May–30 Jun 2025 only (MR 398).** Whether ESGX funds take 2026 money under ordinary Thai ESG terms is unresolved — do not grant a separate ESGX allowance. |
| Thai ESGX LTF-switch tranche | — | **CORRECTED: (conversion value − 300,000) ÷ 4, capped at 50,000/yr**, tax years 2026–2029; full 50,000 only if LTF conversion ≥ 500,000 | No | 5 yrs from switch-order date | — | Yes (switchers only; required converting ALL LTF units held 11 Mar 2025). Computed field, not a checkbox. https://www.krungsriasset.com/EN/news/news-notice/QA-THAIESGX/ ; https://www.hlbthai.com/thai-esgx-fund-tax-measures-approved/ |
| Provident Fund (PVD) | 15% of wages | 500,000 | Yes | per fund rules | — | Yes. (10,000 allowance + 490,000 exemption two-line split on the form: plausible, unverified) |
| GPF (กบข.) | contribution up to 30% of salary (**UNVERIFIED** — secondary source only) | 500,000 deduction | Yes | — | — | Yes |
| NSF (กอช.) | tax rule 15%/500,000, but fund's own cap binds | **30,000/yr contribution cap** (confirmed on nsf.or.th; raised from 13,200 eff. 1 Jan 2023); state match ≤1,800/yr by age | Yes | pension from 60 | 60 for pension | Yes |
| Pension/annuity life insurance | 15% | 200,000 | **Yes** (not the 100k insurance group — most-misfiled item) | policy terms | — | Yes |
| Ordinary life insurance | — | 100,000 (10-yr min term); +10,000 no-income spouse | No — own group | — | — | Yes |
| Own health insurance | — | 25,000, but **life + health ≤ 100,000 combined** | No (inside 100k group) | — | — | Yes |
| Parents' health insurance | — | 15,000 (fully independent; multi-child apportionment mechanic unverified) | No | — | — | Yes |

- Max theoretical 2026 stack: 500,000 + 300,000 + up to 50,000 (qualifying switchers) + 100,000 + 15,000 (+10,000 spouse life) = **THB 965,000–975,000**, before the %-of-income tests, which bind first for most incomes. Compute per-user; don't show the headline.
- RMF/SSF breach penalty (repay last 5 years' relief; gains taxable if <5 yrs held; amended return by March following, 1.5%/mo surcharge after): substance confirmed in the RD guide for the surcharge/clawback; full mechanics **UNVERIFIED**.
- Unverified-and-omitted by design: pension premiums absorbing unused headroom in the 100k life group.
- **TISA (Thailand Individual Savings Account) — the big watch item.** Approved in principle (Dec 2025–Jan 2026 coverage): would create an **800,000 combined ceiling applied cumulatively with RMF/SSF/Thai ESG**, eligible SET/mai shares, bonds, funds, ~1-yr holding, exempt gains/dividends, possible 1.2x ESG multiplier; one report cited a 1 Jul 2026 start, rules were being resubmitted to Cabinet. **No royal decree found in force as of 1 Aug 2026 — status for tax year 2026 genuinely open.** If enacted it restructures this entire table. https://www.bgloballaw.com/2026/01/21/new-tax-incentivized-thailand-individual-savings-account-tisa-for-thai-equities/ ; https://www.nationthailand.com/news/policy/40059420 ; https://www.bangkokpost.com/business/general/3152735/cabinet-gives-green-light-to-retirement-savings-scheme
- Also deductible, missing from the vehicle list: **Social Security (SSO) contributions** (actual amount contributed, per Sherrings/PwC).
- **Version the whole cap table by tax year** — annual stimulus deductions (Easy E-Receipt, tourism, etc.) change every year, and the Finance Ministry is actively restructuring (TISA + a mooted general deduction cap).

---

## 4. Thai tax & finance calendar

| Event | Date rule | Status & source |
|---|---|---|
| Annual PIT return ภ.ง.ด.90/91 (paper) | 31 March of year Y+1 for tax year Y | Confirmed verbatim, https://www.rd.go.th/english/6045.html |
| Annual PIT e-filing (D-MyTax) | 31 March + 8 days = 8 April | 8-day mechanism confirmed in RD's own PND94 guide (https://www.rd.go.th/fileadmin/download/english_form/080966Ins94.pdf). Applies only if original AND any amended return are filed online. |
| **8-day extension expiry** | MOF announcement valid 1 Feb 2024 – **31 Jan 2027** — i.e., it lapses BEFORE the March 2027 season | Window corroborated by multiple Thai sources incl. a Royal Gazette news report (https://tax-ez.info/Update/View/pD7xi0Ug/); the numbered announcement itself was never opened by either pass. **Do not hard-code "+8 days" beyond the 2026 season; generate dates from year-keyed config.** |
| Installments | If tax ≥ 3,000: 3 equal parts due 31 Mar / 30 Apr / 31 May; missing one forfeits and accelerates | Confirmed verbatim, RD guide |
| Half-year return ภ.ง.ด.94 | 30 September (paper) / 8 October (e-file) of the same tax year; covers s.40(5)–(8) income earned Jan–Jun only; 40(1) never triggers it; tax paid credits against the annual return. **Next deadline: 30 Sep / 8 Oct 2026.** | Confirmed, rd.go.th/english/6045.html + PND94 guide |
| ภ.ง.ด.94 filing threshold | **CORRECTED: THB 60,000 single / 120,000 with spouse** (Revenue Code s.56/56 bis, read at https://www.rd.go.th/5937.html). The 30,000/60,000 figures circulating in expat advisories are pre-2017 and wrong. | |
| 50 ทวิ withholding certificate | Employer must issue by **15 February** of the following year, or within 1 month of leaving (Revenue Code s.50 bis, verbatim). Reminder ~15 Feb: "chase your employer." | Confirmed, https://www.rd.go.th/5937.html |
| RMF/Thai ESG year-end purchase cut-off | Last fund-dealing day of December (typically 30 Dec; 31 Dec is a SET holiday). **UNVERIFIED for 2026** — neither pass could open SET's 2569 calendar. Fire the reminder mid-December; confirm the exact date annually. https://www.set.or.th/th/about/event-calendar/holiday | |
| Thai ESG enhanced-regime sunset | **31 December 2026** — one-off, high-value alert | Confirmed (Sherrings, MR 390/395) |
| Late filing/payment | Surcharge 1.5%/month, fraction = full month (confirmed, RD guide / RC s.27); cap at tax payable and the ~2,000 THB fine (s.35) **UNVERIFIED from primary** — show mechanic, don't quote the fine | |
| Weekend/holiday roll-forward | Deadlines roll to next business day — consistent with CCC s.193/8 practice, **UNVERIFIED** for tax specifically; apply holiday-aware date math anyway | |
| SSO old-age pension | 180 months' contributions + age 55 + terminated insured status → pension = 20% of avg wage over final 60 months + 1.5pp per extra 12 months beyond 180. <180 months → lump sum. Heirs get 10× monthly pension if death within 60 months of pension start. **Track months-contributed; surface the 180-month cliff.** | Confirmed verbatim on sso.go.th service page |
| SSO wage ceiling schedule | **CORRECTED to gazetted law** (Royal Gazette 12 Dec 2025): ceiling 17,500 (max 875/mo) for 2026–2028; 20,000 (1,000) 2029–2031; 23,000 (1,150) from 2032. Benefit bases rise immediately (e.g. 8,750/mo sickness/unemployment base). Pension projections must model the schedule, not a flat 15,000. https://flowaccount.com/blog/new-social-security-ceiling-2026/ | |
| Age-55 (RMF) and age-60 (NSF), age-65 (190k exemption) | Per-user milestone reminders | Confirmed (RD guide / NSF) |
| Unverified by both passes, still belongs in the calendar | Employer PND1 (monthly, ~7th), PND1 Kor (end Feb), SSO remittance (15th), Land & Building Tax (~Feb notices / ~Apr payment, often extended) | Verify before shipping |

---

## 5. Projection, DCA & spending-tracker math
*(No adversarial pass ran on this stream; researcher's own confidence labels apply. "Own calculation" items are deterministic arithmetic with the working shown.)*

**Engine conventions (hard requirements):**
1. **Display in real (today's-baht) terms**; nominal as a labelled secondary toggle. Precedent: UK AS TM1 has mandated real-terms DC pension illustrations since 2003 (v5.2 published 6 Feb 2026, effective 6 Apr 2026). https://www.frc.org.uk/library/standards-codes-policy/actuarial/actuarial-standard-technical-memorandum-as-tm1/
2. **Exact Fisher relation**: r_real = (1+r_nom)/(1+i) − 1. Subtraction overstates a 25-yr THB 20,000/mo DCA by ~THB 104,487 (1.2%) at 6%/3%. In a real-terms engine, a "flat" contribution must escalate nominally with inflation.
3. **Compounding convention**: run true monthly compounding (monthly rate = (1+r)^(1/12) − 1). If aggregating annually, mid-year contribution timing errs only +0.16–0.30% (horizon-independent); end-of-year (−1.8 to −3.5%) and start-of-year (+2.1 to +4.2%) are not acceptable.
4. **Closed form for sliders** (verified to the baht vs loop): FV = C₀·s₁₂·[(1+r)ⁿ − (1+g)ⁿ]/(r − g), s₁₂ = [(1+m)¹² − 1]/m, m = (1+r)^(1/12) − 1. Guard r = g with FV = n·C₀·s₁₂·(1+r)^(n−1). g is the contribution **escalation** rate — real raise rate in a real engine, must include inflation in a nominal engine; conflating these is the classic bug. s₁₂ assumes month-end contributions.
5. **Never seed a deterministic projection with an arithmetic mean** — use geometric/CAGR. Worked sequence-risk demo (shippable as an explainer): same ten returns (arith. mean exactly 5%), THB 1M start, 50,000/yr withdrawals → best-first ends 1,037,519; worst-first 558,039 (46% spread); flat-5% shows 968,555.
6. **Monte Carlo**: 1,000 paths matches Morningstar's published method (90% success = ≥900/1,000 positive-ending trials); binomial SE at p=0.9, n=1,000 is ±1.86pp (95% CI) → report "90%", never "89.7%". 1,000 paths for slider drags, 2,000–5,000 for final screens; fix the RNG seed per scenario. Vanguard's own robustness check used 10,000. Sources: https://static.twentyoverten.com/5b5730126af0247efe4f2066/zT8sbuFanVR/Morningstar-2025-State-of-Retirement-Income.pdf (3 Dec 2025; third-party-hosted copy of Morningstar's own doc); https://corporate.vanguard.com/content/dam/corp/research/pdf/cost_averaging_invest_now_or_temporarily_hold_your_cash.pdf (Feb 2023)
7. **Uncertainty display**: headline = one deterministic real-terms geometric-mean line labelled a central estimate; shaded 5th–95th percentile MC band; one or two named plain-language stress scenarios ("markets fall in your first five years") — ~70% of Morningstar's failed trials had lost value by end of year 5 of retirement. Bear/base/bull with different flat averages reproduces the sequence-risk error; different sequences or don't bother.
8. **Withdrawal rates — model the RULE, not a number.** Morningstar base-case safe starting rate: **3.9% for 2026** (30-yr horizon, 90% success, 1,000 trials, 30–50% equity, excludes state pensions); series 3.3/3.8/4.0/3.7/3.9 across 2021–26. Flexible methods (guardrails etc.) lift it to 5.7%. Bengen's revised 4.7% (book, Aug 2025 — secondary reporting, medium confidence) is a backward-looking worst-case; do not blend the statistics. Historical rolling 30-yr safe rates ranged 3.9%–10.5% — show a range, not a point. 25x heuristic = 1/rate → 25.6x / 21.3x / 17.5x depending on rule; derived from US data, unvalidated for THB or 40-yr horizons; apply only to **portfolio-funded** spending after netting SSO/state pensions/rent.
9. **Tracker → projection link**: the load-bearing split is **essential vs discretionary**, not category. Compute the irreducible monthly floor, net off guaranteed income, and apply withdrawal rules only to the residual; dynamic strategies only work if the user can actually cut the discretionary share.
10. **Category taxonomy**: use COICOP divisions so spending maps to official CPI sub-indices (per-category personal inflation). COICOP 2018 endorsed by UNSC March 2018 (https://unstats.un.org/unsd/classifications/coicop); exact division count (12 vs 13) unconfirmed — download the final structure before building.
11. **Thai CPI weights** (TPSO, Ministry of Commerce): ~ food & non-alc. beverages 36%, transport & communication 24%, housing 23%, medical & personal care 6%, recreation & education 6%, apparel 3%, tobacco/alcohol 1% — **LOW confidence, from an aggregator (https://tradingeconomics.com/thailand/consumer-price-index-cpi); TPSO's own PDF is a scanned image. Re-verify before hard-coding.** Do not reuse US/UK templates: the Thai basket is food-heavy and a retiree's is health-heavy.
12. **Inflation default**: BOT target 1.0–3.0% for 2026 (cabinet-approved 30 Dec 2025, announced 5 Jan 2026) — centre 2%, bound 1–3%, label as target not forecast. **Engine must handle negative inflation** (Thailand ran 12 months of deflation into early 2026). https://www.bot.or.th/en/our-roles/monetary-policy/monetary-policy-target.html
13. **DCA vs lump sum — scope correctly**: the literature covers deploying a windfall, NOT paycheck investing. Vanguard: LS beat 3-month CA 68% of the time (MSCI World 1976–2022); median give-up $504 (3-mo) / $1,491 (6-mo) per $100k. Default windfalls (bonus, PVD payout, inheritance) to invest-now; offer CA as a labelled anti-regret option. Monthly salary DCA is simply not addressed by this research and must not be called suboptimal.
14. **Spending smile** (Blanchett): real spending declines ~1%/yr, ~26% through age ~84, then rises with health costs — **secondary summaries only (paywalled original); medium confidence.** Default to flat real spending (conservative); offer the declining curve as a labelled option. https://www.kitces.com/blog/estimating-changes-in-retirement-expenditures-and-the-retirement-spending-smile/

**Honest caveats to surface to users**: the deterministic line is a central tendency, not a floor; experts disagree 3.9%–5.7% depending on method and flexibility — show what each assumption does rather than resolving the disagreement; success probabilities carry ±2pp of sampling error at 1,000 paths; US-derived heuristics are unvalidated for Thailand; Morningstar refreshes every December — store the rate as config with a visible as-of date.

---

## 6. Generic mode
*(No adversarial pass; researcher confidence labels carried through.)*

**Concepts to teach** (all sources retrieved 1 Aug 2026):
1. **Marginal ≠ effective** — the #1 misconception: crossing a bracket taxes only the excess; a raise can't reduce after-tax income absent benefit cliffs. Always render marginal + effective + "tax on your next 1,000 units" together. https://taxfoundation.org/taxedu/glossary/marginal-tax-rate/
2. **Deferred vs exempt accounts are algebraically identical when t_now = t_withdrawal**: C(1+r)ⁿ(1−t_w) = C(1−t_c)(1+r)ⁿ iff t_c = t_w. No "compounding advantage" either way — debunk explicitly. Real tie-breakers: nominal limits make exempt money economically bigger for maxers; forced withdrawals; asymmetric rule risk.
3. **Tax drag** on taxable accounts: ~1–2%/yr tax-cost ratio; avg US equity fund gave up 1.48%/yr (10 yrs to 31 Oct 2020, Morningstar — medium confidence, secondary summaries). Derived illustration (label as such): 1.5pp drag on 7% over 30 yrs → ~53% less terminal wealth. Lever is behavioural: turnover, holding period, asset location. https://www.morningstar.com/content/dam/marketing/shared/research/methodology/678272-TaxCostRatioMethodology.pdf
4. **Realisation-based taxation** — unrealised gains compound untaxed (the biggest free tax advantage); holding-period boundaries; the cap-gains-vs-income gap as a per-country flag (US 2025 LTCG 0/15/20%, 0% band to $48,350 single — 2025 figures; 2026 must be re-pulled). https://www.irs.gov/taxtopics/tc409
5. **Loss harvesting = deferral, not forgiveness** (basis reduction repays most of it); US $3,000/yr ordinary-income offset, unindexed; wash-sale-type anti-abuse rules everywhere (model as per-country window_days + basis-adjustment boolean; never green-light a specific substitute security). https://www.investor.gov/introduction-investing/investing-basics/glossary/wash-sales
6. **Worked example: US tax year 2026** (Rev. Proc. 2025-32, 9 Oct 2025): rates 10/12/22/24/32/35/37%, single thresholds $12,400/$50,400/$105,700/$201,775/$256,225/$640,600; standard deduction $16,100 single / $32,200 MFJ. 401(k) limit $24,500, catch-up $8,000 (50+), $11,250 (60–63), IRA $7,500 (Notice 2025-67, 13 Nov 2025). https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill ; https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500
7. **Country contrasts as four enums** — relief mechanism (marginal/flat/credit), cap structure (per-account/combined/nested), withdrawal treatment (taxed/exempt/fixed taxable fraction), clawback (taper/surcharge): US = marginal-or-none, per-account caps, symmetric Roth choice; UK = marginal relief, £60,000 annual allowance tapered above £200k/£260k threshold/adjusted income (gov.uk page confirmed but did not name its tax year; £268,275 lump-sum allowance is secondary commentary — verify); Australia = flat 15% in-fund, combined cap A$32,500 (2026-27, from atotaxrates.info, **ATO page 403'd — re-verify**), Division 293 +15% above unindexed A$250,000; Singapore = SRS S$15,300/S$35,700 caps by residency, **50% taxable fraction** on retirement withdrawal, 10-yr spreading, nested under an S$80,000 overall relief cap. https://www.gov.uk/tax-on-your-private-pension/annual-allowance ; https://www.ato.gov.au/... (Division 293) ; https://www.mof.gov.sg/news-resources/supplementary-retirement-scheme/

**Minimum schema** (computes correct progressive tax for most countries):

```
TaxRegime {
  country_code, tax_year_label,          // MANDATORY — refuse to compute on unknown year
  currency_code, minor_units_per_major,  // 2 for THB/USD, 0 for JPY
  filing_statuses: [{id, label}],        // "individual" only, for TH/UK/AU/SG
  schedules: { filing_status_id -> [ {lower_bound_minor:int, rate_bp:int} ] }
}                                        // 0% first bracket subsumes the personal allowance
UserTaxInput { gross_income_minor:int, filing_status_id, pre_tax_deductions_minor:int }
tax = Σ max(0, min(taxable, upper_i) − lower_i) × rate_i   // ascending, last bracket unbounded
```

Engineering rules: integers in minor units, rates in basis points, never floats; model the allowance as a literal 0% bracket. Declared extension points (not in the minimum): taper {applies_to, start_income, numerator/denominator, floor}; surcharges [{base_definition, threshold, rate_bp}] (base ≠ taxable income, per Div 293); capital_schedules keyed by income_type; social-insurance contribution schedules kept SEPARATE (they cap out — folding them in corrupts the marginal rate); nested sub-national regime; family-quotient divisor; taxable_fraction on withdrawals (0.0 exempt / 1.0 deferred / 0.5 Singapore). Ship the minimum as the contract with a per-country override hook; do not make the schema Turing-complete.

---

## 7. Cost model — annual USD, PWA with accounts (all prices as-of 1 Aug 2026)

**Recommended stack**: Porkbun .com $11.08/yr (register = renew = transfer, confirmed on porkbun.com/products/domains) + Cloudflare Pages static hosting $0 (no egress charges — confirmed on Cloudflare's pricing page; specific build/file limits unverified this pass) + Supabase Pro $25/mo (all figures confirmed on supabase.com/pricing) + email per scale + Web Push $0 (VAPID; iOS requires Home-Screen install — WebKit claim consistent but unverified this pass) + $0 app-store fees (PWA; Apple $99/yr and Google $25 once apply only if later wrapped — long-stable but unverified this pass).

| Annual cost | 100 users | 1,000 users | 10,000 users |
|---|---|---|---|
| Domain (.com, Porkbun) | $11 | $11 | $11 |
| Static hosting (CF Pages) | $0 | $0 | $0 |
| Backend+auth+DB (Supabase Pro: 8 GB DB, 100k MAU, 250 GB egress, 7-day backups, no pausing) | $300 | $300 | $300 (+$0–240 possible egress/DB overage at $0.09/GB, $0.125/GB) |
| Email | $0 (Resend free: 3,000/mo but 100/day cap) | $6 (AWS SES Essentials $0.16/1,000 — confirmed) or $240 (Resend Pro) | $58 (SES) or $240 (Resend Pro) |
| **Total** | **~$311** | **~$317–551** | **~$370–800** |

Lean alternative: Cloudflare Workers Paid $5/mo + D1 (every rate confirmed exactly: $5/mo incl. 10M requests; D1 free 5 GB / 5M reads/day) = ~$71/yr — but you hand-roll auth, real risk for a financial app. Absolute floor ~$11/yr on all-free tiers is **not viable**: Supabase Free pauses after 1 week idle and has no backups (confirmed).

Disqualified/cautions: **Vercel Hobby is contractually non-commercial** (confirmed verbatim, docs updated 16 Jun 2026) — Pro $20/user/mo; the "100 GB fast transfer" figure no longer appears in the Hobby doc. **GitHub Pages** prohibits SaaS/passwords (unverified this pass, long-standing terms). **Netlify** now credit-based: Free 300 credits/mo at 20 credits/GB bandwidth ≈ 15 GB (all rates confirmed); legacy-plan grandfathering undocumented — don't plan on it. **Firebase Spark**'s 50k reads/day binds at ~10k users; Blaze has no default spend cap (confirmed) — Supabase's spend-cap toggle (on by default) is a point in its favor. Clerk free covers 50k users (confirmed; note: the 100 free orgs actually belong to the $100/mo B2B add-on). Postmark ($15/mo basic) and SendGrid (free tier now a 60-day trial) unverified this pass.

Missed-and-material: **LINE Official Account messaging is likely the right reminder channel for Thai retirees** (own free tier + per-message THB pricing) — a bigger product/cost decision than Resend-vs-SES, unresearched. **SMS OTP login costs are NOT in any auth tier** and could exceed the whole infra budget — prefer email/passkey auth. Budget ~4–7%/yr .com escalation (Verisign). Supabase's $25 includes only Micro compute — the flat-cost claim assumes Micro suffices. Sentry has a free developer tier for error monitoring. Excluded: developer time, business registration, PDPA/legal costs — these will dwarf the $300–800/yr infra bill. Supabase backup encryption-at-rest: **UNVERIFIED — get it in writing before making PDPA-facing security claims.**

---

## 8. PDPA & security obligations

**Classification (confirmed against the Government Gazette English translation of the Act — https://www.dataguidance.com/sites/default/files/entranslation_of_the_personal_data_protection_act_0.pdf):** financial data is **NOT** Section 26 sensitive data; the closed list (race, ethnicity, political opinion, cult/religious/philosophical beliefs, sexual behaviour, criminal records, health, disability, trade union, genetic, biometric) omits it, and the catch-all operates only "as prescribed by the Committee" — financial data cannot drift in without a PDPC notification. Vendor guides claiming otherwise are wrong on the statutory text. Consequences: contract-necessity/consent both available as lawful bases; no automatic DPO trigger; Section 79 criminal exposure (tied to s.26 data) not realistically reachable. Engineer to sensitive-data standard anyway, but don't claim s.26 processing in the notice.

**MUST-DO list (with corrected penalty tiers):**
- **Breach notification** (s.37(4), confirmed verbatim): PDPC without delay, where feasible within 72h of awareness; high-risk breaches also to data subjects with remedial measures; late-report explanation to PDPC within 15 days. Fine up to THB 3M (s.83). Pre-draft an incident runbook; build detection (auth anomaly alerts, DB audit logs) — the clock starts at awareness and no-detection is not an excuse.
- **DPO**: not required below the triggers — not a public authority, <100,000 data subjects (PDPC notification 14 Sep 2023, effective 13 Dec 2023, confirmed via Tilleke), no s.26 core activity. Behavioural profiling for projections is arguably "regular monitoring", so headcount is the only shield — set an internal tripwire ~50,000 users. Fine for failure: THB 1M (s.82).
- **Cross-border** (ss.28–29): no adequacy whitelist exists as of Aug 2026 (Baker McKenzie, Apr 2026). Practical path: provider DPA with SCCs annexed (ASEAN MCCs or EU SCCs accepted), destination country disclosed in the notice; prefer an ap-southeast region and document it. Consent-as-derogation is fragile (withdrawable). **CORRECTED fine tier: ordinary-data cross-border violations cap at THB 3M (s.83)**; the 5M ceiling (ss.84/87) is s.26-only. BCR regime is now operational (PDPC Regulation B.E. 2568, published 17 Feb 2026; ~6-month approval) but irrelevant to a solo operator. https://www.bakermckenzie.com/en/insight/publications/2026/04/thailand-pdpc-approved-bcrs-for-cross-border-transfers
- **Data-subject rights**: **CORRECTED — the statutory 30-day clock applies only to access/copy (s.30)**; portability (s.31), objection (s.32), erasure (s.33), restriction (s.34), rectification (s.35–36) carry no fixed deadline in the Act. Use 30 days as the engineering SLA anyway. Build day-one: machine-readable export; hard-delete cascading to derived tables/backups/analytics; restriction flag; a stated retention period in years (never "as long as necessary") with a defensible basis to retain tax records past an erasure request.
- **Privacy notice** (s.23, confirmed): purposes; mandatory-vs-optional data and the effect of not providing; data types + retention period; categories of recipients (name your host and processors by category, and destination country); controller/DPO contacts; **and the data subject's rights (s.23(6) — commonly missed)**. Unbundle consent from signup; separate legitimate-interest processing explicitly. QR/electronic delivery acceptable (guidance-level, low stakes).
- **ROPA (s.39)** — missed by research: records of processing required; the small-org exemption does NOT apply where processing is "likely to result in a risk to rights and freedoms" — a financial-data app plausibly fails the exemption. Keep a written ROPA.
- **Indirect collection (s.25)**: notification/consent within 30 days if you ever ingest bank-feed or employer data rather than user-typed figures.
- **Security measures**: statutory hook is s.37(1) ("appropriate security measures" per Committee minimum standard, reviewed on necessity/tech change). The PDPC Security Notification B.E. 2565's specific enumeration (identity proofing, least-privilege, privileged-access management, annual review) is **UNVERIFIED against the notification's own text** — but actively enforced (see below). Concrete stack mapping: TLS 1.2+/HSTS; provider volume encryption + optional column-level for hot fields; Postgres RLS keyed to auth user id; low-privilege app DB roles; Argon2id/bcrypt; TOTP MFA; audit logging of financial-record access; documented annual review. No law mandates a named cipher — distrust sources saying "PDPA requires AES-256."
- **Enforcement is real** (missed by research): PDPC's first fine, 21 Aug 2024 — **THB 7M total** against an online retailer: 1M (no DPO) + 3M (inadequate security) + 3M (missed 72h notification); further multi-million-baht fines in 2025. The fined violations map one-to-one onto this checklist. No solo-developer enforcement on record. Other confirmed exposure: s.79 criminal (s.26 data only, up to 1 yr / 1M); s.80 disclosure offence; **s.81 personal liability for the responsible director/manager — in a one-person company, you**; s.78 punitive damages up to 2× actual loss (real tail risk when leaked income data enables fraud).

**Education vs licensed advice (SEC):**
- SEA licensing (confirmed via Tilleke — https://www.tilleke.com/insights/regulation-investment-advisors-thailand/): "investment advisory service" = advice to the public on the value of securities or suitability of investing in them, **for a fee or other remuneration** (a paid subscription counts); licence available **only to companies and financial institutions — an individual cannot hold it**. Design constraint: stay outside the definition; there is no licence-later path for a solo operator.
- The operative "general vs specific advice" test (general = advice WITHOUT considering the individual's suitability, objectives, financial position or needs) and the 15-investor exemption are **UNVERIFIED** — sec.or.th 403'd both passes and the attributed Tilleke pages didn't contain the wording. Probable instruments: SEC Notifications Kor. Jor. 4/2560 and Kor. Thor. 1/2560 (as amended by Kor. Thor. 8/2560) — give Thai counsel these citations.
- Safe side: explaining RMF/ESG mechanics, historical return ranges, compound/drawdown calculators, the user's own spending patterns, "at a 5% assumed return you reach X" with user-adjustable assumptions. Licensed side: anything consuming the user's risk tolerance/goals/position and returning an allocation or named product. Guardrails: user-editable return assumptions, never name a fund/ticker as a suggestion, scenarios not recommendations, prominent not-investment-advice disclaimer. Licensed robo-advisers exist (Robowealth) — automation does not exempt.
- Out of scope but potentially applicable: Credit Information Business Act (if bank data ingested), BOT payment licensing (if money moves), Cybersecurity Act B.E. 2562.

---

## 9. RISKS AND UNKNOWNS

**Likely to change under you:**
1. **Foreign-remittance relaxation** — draft, stalled by dissolution + 8 Feb 2026 elections; may pass retroactively to 2024+ income, forcing recomputation of filed years. Monitor continuously; the highest-stakes single item for this app's users.
2. **TISA** — would restructure the entire deduction-cap architecture (800,000 combined ceiling); status for tax year 2026 genuinely open. Second-highest-stakes item.
3. **Thai ESG enhanced regime dies 31 Dec 2026** (reverts to 100,000/8-yr); Q4-2026 extension plausible per the annual budget-cycle pattern. Treat 2027 parameters as provisional.
4. **8-day e-filing extension lapses 31 Jan 2027** — before the March 2027 season. Never hard-code "+8 days."
5. A general cap on total PIT deductions is in live policy discussion. Version every cap/rate/date by tax year, in config, never in code.
6. Annually revised regardless: RD stimulus deductions, Morningstar SWR (each December), BOT inflation target (each December), US/UK/AU/SG figures (all inflation-indexed), .com registry fee, SET holiday calendar.

**UNVERIFIED items retained (never present as fact):**
- Dividend credit fraction (3/7 stale vs 1/4 implied — read the voucher; check RC s.47 bis); dividend exclusion election all-or-nothing across the year; SET exemption's on-exchange-venue condition; mutual fund **distribution** taxation (fully open); Por.161/162 instrument numbers/dates from primary text.
- RMF 5-yr clock from-first-purchase-vs-per-lot; RMF breach-penalty mechanics; Thai ESG per-lot day-count (sources conflict); GPF 30%-of-salary ceiling; PVD 10,000/490,000 split; parents'-health apportionment; pension-premium absorption of life-group headroom; whether ESGX funds take 2026 money under ordinary ESG terms.
- December fund cut-off date (30 Dec 2026 inferred, SET calendar unopened); weekend/holiday roll-forward for tax deadlines specifically; the fixed late-filing fine amount; surcharge cap at tax payable; PND1/PND1 Kor/SSO remittance dates; Land & Building Tax cycle.
- PDPC Security Notification's specific control list; SEC "general advice" definition and 15-investor exemption; Supabase backup encryption; Cloudflare Registrar prices; Namecheap prices; Netlify legacy grandfathering; GitHub Pages current terms wording; Apple $99/Google $25 (stable, unconfirmed this pass); Postmark/SendGrid 2026 pricing; WebKit push claims (consistent, unconfirmed this pass).
- Thai CPI category weights and base year (aggregator-sourced, LOW confidence); COICOP 2018 division count; Bengen 4.7% and Blanchett smile figures (secondary sources); UK £268,275 lump-sum allowance and the gov.uk page's unnamed tax year; Australian caps (ATO 403'd).

**Structural risks:**
- **Official sources cannot be scraped**: rd.go.th English pages serve pre-2017 data; Thai allowance pages are JPEGs; the RD allowances PDF wouldn't text-extract; TPSO CPI is a scanned image; SET calendar is a PDF; sec.or.th/pdpc.or.th/gcc.go.th/ato.gov.au/namecheap 403 automated fetches. **Even PwC (reviewed Feb 2026) carries the obsolete remittance rule.** The only reliable channel is the annual RD filing-guide PDF + manual review — budget a human verification pass per tax year, and one from a Thai IP.
- **Known conflicts, stated**: RD English site vs RD guide PDFs (guide wins); PwC vs RD guide on remittance timing (RD wins); Sherrings (ESGX window May–Jun 2025 only) vs fund-house material (ESGX open in 2026 under ESG terms) — unresolved; Netlify launch blog vs current pricing page (credits model is current); aggregators disagree on Namecheap pricing; sources conflict on Thai ESG hold counting (per-lot vs first purchase).
- **Sections 5 & 6 had no adversarial verification pass** — the math is deterministic and double-checked by the researcher, but external figures there carry only single-pass sourcing.
- Two paid-professional checkpoints before launch: a Thai data-protection lawyer on the s.26/lawful-basis/ROPA posture, and Thai counsel on the SEC general-advice perimeter (citing Kor. Jor. 4/2560 / Kor. Thor. 1/2560). This brief is research on published rules, not tax or legal advice; the app should route users to licensed Thai advisers for their own positions, especially on remittance.