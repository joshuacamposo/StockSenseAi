# StockSense AI — Revision Plan

**Current release:** 1.0.0
**Baseline date:** 3 November 2026
**Baseline status:** build passes · **16/16 tests** · **90/90 checks** · **33/33 browser QA checks**
**Repository note:** this folder is not a Git repository. The milestones below describe development order; they are not commit tags.

---

## 1. Release scope of v1.0.0

v1.0.0 is the **prefinal defense baseline**. It is feature-complete for the SA101 brief and frozen except for defects that block the demonstration.

| Area | Included in v1.0.0 |
| --- | --- |
| Platform | Next.js 16.4.4 App Router, React 19.3.1, Tailwind 4.3.4, static export |
| Data | Hardcoded seed + browser `localStorage`, versioned schema |
| Identity | Four hardcoded demo accounts, client-side permission matrix |
| Inventory | Products, suppliers, stock-in, stock-out, transaction history |
| Automation | Derived alerts, reorder recommendations, reconciliation, decisions |
| Analytics | Moving-average demand forecasting, five reports, CSV export |
| Assistance | Rule-based assistant in English, Tagalog, Cebuano; navigation; tours; safety refusals |
| Guidance | 15 walkthroughs, 53 steps, real `data-tour` selectors |
| Evidence | 16 in-app tests on isolated fixtures, 90 checks, admin reset |
| Documentation | README + 10 defense documents |

### Explicitly frozen out of scope

No backend, database, OAuth, password hashing, server sessions, external AI, email/SMS, barcode, Docker, multi-user sync, or payment features. These are not “missing”; they are boundary decisions documented in `SECURITY_LIMITATIONS.md`.

---

## 2. Development milestones

The project was built in the following order. Each milestone was usable before the next began.

| Milestone | Scope | Exit condition |
| --- | --- | --- |
| M1 — Scaffold | Next.js static export, Tailwind theme, folder structure, UI kit | `npm run dev` renders a styled shell |
| M2 — Domain rules | `inventoryRules`, `recommendations`, `forecasting`, `supplierRules`, `permissions` | Pure functions return expected values |
| M3 — State | `lib/store.js`, `lib/storage.js`, `AppProvider`, seed data | Reload preserves state; corrupt state recovers |
| M4 — Core UI | Login, dashboard, products, suppliers, stock-in, stock-out, alerts, transactions | Full manual workflow works |
| M5 — Automation UI | Recommendations, forecasting, reports, audit logs, settings | Decisions and exports work end to end |
| M6 — Assistant | Language detection, intents, product resolver, response engine, chat UI | EN/TL/CEB answers read live state |
| M7 — Guidance | 15 walkthroughs, overlay, context, permission checks | Tours highlight real elements |
| M8 — Evidence | Fixtures, 16 tests, Demo & Testing Center, admin reset | 16/16 tests pass on fixtures |
| M9 — Hardening | Browser QA, defect fixes, build verification | 33/33 browser checks pass |
| M10 — Documentation | README + all `docs/` files | Every claim traceable to code or a run |

---

## 3. Defect log (actual fixes)

These are the three real product defects found during browser QA, plus one verification-tool correction that is **not** a product defect.

### FIX-001 — Walkthrough refused to start after login

| Field | Detail |
| --- | --- |
| Symptom | Starting a tour from the assistant showed “Sign in to start a guided walkthrough” even though the user was signed in. Direct tour buttons could also use a stale session. |
| Root cause | `WalkthroughProvider` memoized its context value **without `startTour` in the dependency array**. Consumers kept the first `startTour` closure, created before login when `user` was `null`. |
| Fix | Added `startTour` to the context memo dependencies in `context/WalkthroughContext.js`. |
| Verification | Assistant-started tour navigates and highlights a real element; included in the 33 browser checks. |
| Regression risk | Low. The memo now updates when the callback identity changes. |
| Status | Fixed in 1.0.0 |

### FIX-002 — Tour cancelled while its navigation was still in flight

| Field | Detail |
| --- | --- |
| Symptom | A tour started from another page could close itself before `router.push` completed, leaving no overlay on the destination. |
| Root cause | A 250 ms “left the page” timer treated the **old** pathname as a cancellation, not a transition. `router.push` is asynchronous. |
| Fix | Replaced the start-route ref with `pendingRouteRef`. If a route change is pending, wait for the expected path (up to 6 s); only cancel 250 ms after actually leaving a tour’s page. |
| Verification | Assistant → stock-in tour opens reliably from `/alerts/`; Escape closes it. |
| Regression risk | Medium-low. Covered by the browser QA tour checks. |
| Status | Fixed in 1.0.0 |

### FIX-003 — Viewer saw the Demand Forecast shortcut

| Field | Detail |
| --- | --- |
| Symptom | The dashboard quick-action “Demand forecast” was visible to the read-only Viewer even though `/forecasting/` is route-guarded. |
| Root cause | The shortcut was rendered unconditionally while other actions used `canDo(...)`. |
| Fix | Wrapped the link in `canDo('forecasting.view')` in `app/(app)/dashboard/page.js`. |
| Verification | Viewer sidebar and dashboard no longer advertise forecasting; direct route still shows Access Denied. |
| Regression risk | Low. |
| Status | Fixed in 1.0.0 |

### QA-001 — Verification harness expectations, not product behaviour

| Field | Detail |
| --- | --- |
| Symptom | The headless QA script timed out on stock-in and on the test summary. |
| Root cause | The **script** expected the toast text “Stock received” (actual UI: “Stock-in recorded”) and assumed a stock-in of 30 would clear Bond Paper. Since `50 <= 50` is still Low, 30 was the wrong demonstration value. |
| Fix | Updated the temporary harness to expect the real toast and to receive **40** (20 → 60). No product code changed for this item. |
| Status | Harness-only correction; the shipped app is unchanged by QA-001 |

> The temporary browser harness lives outside the deliverable and is **not** part of the shipped test suite. The canonical evidence is the 16-test Demo & Testing Center.

---

## 4. Verification record

| Check | Command / method | Result |
| --- | --- | --- |
| Production build | `npm run build` | ✅ Compiled, 17 static route entries exported to `out/` |
| Automated suite | In-app **Run all** and a Node ESM harness over the same runner | ✅ **16 passed, 0 failed, 0 not run; 90/90 checks** |
| Seed contract | `seed-requirements` test | ✅ BP-001 20/50/100, PEN-001 150/30/200, USB-001 8/20/50 |
| Approval isolation | `approval-no-stock-change` + browser | ✅ Approved, stock remains 20 |
| Stock-in resolution | Browser | ✅ 20 → 60, alert resolves, pending record closes |
| Roles | Browser | ✅ Viewer, Staff, Owner, Admin restrictions hold |
| Assistant | Automated + browser | ✅ Live state, follow-up, EN/TL/CEB, navigation, safety refusals |
| Walkthroughs | Browser | ✅ Starts from assistant, navigates, highlights, Escape closes |
| Responsive layout | Manual | ✅ Sidebar collapses, grids reflow, tables scroll |

**Not verified:** accessibility audit, visual regression, load/performance at scale, cross-browser matrix, storage quota failure, CSV formula injection handling.

---

## 5. Known limitations carried into v1.1 planning

| ID | Limitation | Impact | Owner area |
| --- | --- | --- | --- |
| K1 | Client-side authorization can be bypassed | Demo controls only | Security |
| K2 | Public hardcoded passwords | Anyone can impersonate a demo role | Security |
| K3 | No real session/token/expiry | Session persists until sign-out or storage clear | Security |
| K4 | Audit trail is mutable JSON | Not tamper-evident | Audit |
| K5 | Data is per browser profile | No sync, no backup, no recovery | Data |
| K6 | No multi-tab conflict handling | Last write wins | Data |
| K7 | CSV only quote-escaped | Spreadsheet formula injection possible with crafted input | Reporting |
| K8 | Assistant is keyword-based | Limited paraphrase coverage; can miss unusual phrasing | Assistant |
| K9 | Forecast is a moving average | No seasonality, no accuracy claim | Analytics |
| K10 | No email/SMS delivery | “Low-stock email” is a simulation toggle | Notifications |
| K11 | No component/E2E suite in the shipped repo | UI regressions rely on manual/QA passes | Testing |
| K12 | English-first UI | Assistant is multilingual, the rest of the UI is not | UX |

Full analysis: `SECURITY_LIMITATIONS.md`. Test boundaries: `TEST_CASES.md`.

---

## 6. Prioritized roadmap

Priority is based on **defensibility first, then data safety, then capability**. Effort: S ≈ 1–2 days, M ≈ 3–5 days, L ≈ 1–2 weeks for one developer.

### P0 — Production boundary (must happen before any real use)

| Item | Why | Effort | Risk |
| --- | --- | --- | --- |
| Server API + relational database | Real persistence, constraints, transactions | L | High |
| Real authentication + hashed passwords + MFA | Remove public credentials | L | High |
| Server-side authorization on every endpoint | Client checks are not a boundary | M | High |
| Immutable/append-only audit log | Tamper evidence | M | Medium |
| Backups + restore drill | Data loss prevention | M | Medium |
| Security headers, CSP, dependency scanning | Basic hardening | S | Low |

**Exit criteria:** no authorization decision is made only in the browser; audit entries cannot be edited by the user; a restore has been tested.

### P1 — Data safety and continuity

| Item | Why | Effort |
| --- | --- | --- |
| JSON export/import of the full local state | User-controlled backup before reset | S |
| Storage quota and write-failure UX | Avoid silent data loss | S |
| Cross-tab synchronization (`storage` event) | Reduce last-write-wins surprises | M |
| Schema migration registry | Upgrade without discarding data | M |
| Seed version stamp visible in the UI | Reproducible demos | S |

### P2 — Assistant quality (still offline)

| Item | Why | Effort |
| --- | --- | --- |
| Expand paraphrase and typo coverage | Fewer “I’m not sure” answers | M |
| Add Cebuano/Tagalog synonyms per intent | Better local-language recall | M |
| Conversation regression corpus | Measure intent accuracy honestly | M |
| “Why did you answer that?” explanation | Show matched intent and rule | S |
| Optional local embedding fallback | Semantic matching without a network | L |
| Voice input via browser API (optional) | Accessibility | M |

**Constraint:** any improvement must remain deterministic and offline. No external model calls.

### P3 — Inventory capability

| Item | Why | Effort |
| --- | --- | --- |
| Purchase orders and partial receipts | Real procurement flow | L |
| Supplier price history | Better reorder cost estimates | M |
| Barcode/QR input | Faster stock movement | M |
| Unit conversions (box → piece) | Real-world packaging | M |
| Stock adjustment with reason codes | Controlled corrections | S |
| Batch/lot and expiry tracking | Regulated inventory | L |

### P4 — UX and accessibility

| Item | Why | Effort |
| --- | --- | --- |
| Automated accessibility tests (axe) | Verify labels, contrast, focus | M |
| Reduced-motion support | Comfort and compliance | S |
| Mobile table alternatives (cards) | Usability on small screens | M |
| Full UI localization (EN/TL/CEB) | Match the assistant’s language support | L |
| Saved filters and page size | Daily efficiency | S |

### P5 — Testing and operations

| Item | Why | Effort |
| --- | --- | --- |
| Component tests (React Testing Library) | Catch UI regressions | M |
| End-to-end suite (Playwright) in CI | Protect critical flows | M |
| Visual regression snapshots | Catch layout drift | M |
| Performance budget and Lighthouse check | Prevent bloat | S |
| Error boundary + local diagnostics page | Better failure reporting | S |

---

## 7. Risk register

| Risk | Likelihood | Impact | Mitigation now | Mitigation next |
| --- | --- | --- | --- | --- |
| Demo data changed before defense | High | Wrong numbers on screen | Admin reset; pre-flight checklist | Seed stamp in UI |
| Browser storage cleared | Medium | Total demo loss | Seed regenerates on load | JSON backup/import |
| Panel asks “is this secure?” | High | Credibility risk | Security page + honest script | P0 server boundary |
| Assistant misses a phrasing | Medium | Awkward pause | Exact demo script + quick replies | P2 corpus |
| Test expectation drifts from rules | Low | False failure | Tests import shared rules | CI gate |
| Dependency upgrade breaks build | Medium | No demo | Pinned versions | Upgrade branch + build gate |
| CSV opened in Excel evaluates a formula | Low | Local device risk | Demo data only | Sanitize leading `= + - @` |
| Two presenters click at once | Medium | Inconsistent state | One driver rule | Rehearsal |

---

## 8. Change control for future revisions

1. **Branch per change.** Create `feature/<name>` or `fix/<name>`; never edit the demo baseline directly during defense week.
2. **Semantic versioning.** MAJOR for storage-breaking changes, MINOR for features, PATCH for fixes.
3. **Storage version rule.** Any change to the persisted shape must bump `STORAGE_VERSION` in `lib/storage.js` and include a migration or a deliberate reset path.
4. **Rule changes require tests.** Modify the pure module and update `lib/testing/testRunner.js` in the same change. A rule change without a test is incomplete.
5. **Assistant changes require language coverage.** Every new intent needs EN, TL, and CEB copy, plus at least one regression question in the test corpus.
6. **Tour changes require selectors.** Add the `data-tour` attribute in the same change; verify the overlay finds it.
7. **Docs travel with code.** Update the affected `docs/` file in the same commit.
8. **Release gate.** Build + all tests + manual role pass + doc link check before tagging.

---

## 9. Release checklist (v1.1 template)

- [ ] `npm install` clean
- [ ] `npm run build` succeeds and `out/` is generated
- [ ] 16/16 tests pass, 90/90 checks
- [ ] New/changed tests reviewed for honesty (no pre-marked PASS)
- [ ] All four roles exercised
- [ ] Assistant EN/TL/CEB and safety refusals exercised
- [ ] All 15 tours start and close
- [ ] Seed values unchanged or migration documented
- [ ] Storage version reviewed
- [ ] README, TEST_CASES, SECURITY_LIMITATIONS, CHATBOT_DOCUMENTATION updated
- [ ] `docs/` links resolve
- [ ] Demo reset works and preserves the session
- [ ] No new external network calls
- [ ] Limitations section still accurate

---

## 10. Decision log

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Static export, no server | Next.js API routes, Supabase | Brief requires offline, no backend; static is easiest to defend and demo |
| Module-level store + React adapter | Redux, Zustand, Context-only | One state for UI and assistant, pure testable engine, minimal dependencies |
| Derived alerts | Stored alert records | Eliminates stale/duplicate alerts without a resolve routine |
| Approval never changes stock | Auto-add stock on approval | Prevents phantom inventory; keeps decision and delivery separate |
| Rule-based assistant | External LLM | Offline, deterministic, free, explainable; honest positioning |
| Isolated fixtures for tests | Test against live state | Repeatable and non-destructive |
| Fixed seed with history | Empty demo | Forecasting and alerts are visible immediately |
| Client-side roles | Mock server | No backend allowed; matrix still demonstrates the architecture |
| 15 tours as data | Hardcoded per page | One config, permission checks, assistant reuse |
| Docs in Markdown | PDF only | Reviewable, versionable, linkable |

---

## 11. Next action (recommended)

Before the defense, do **not** add features. Do only this:

1. Run the pre-flight checklist in `FIVE_REPORTER_DEMO_SCRIPT.md`.
2. Rehearse the exact 18-minute sequence twice with five speakers.
3. Freeze the tree and record the verified results on the day of the defense.
4. After the defense, start P0 as a separate project; do not retrofit production security into the prototype.

**Revision plan owner:** project lead
**Last updated:** 3 November 2026
