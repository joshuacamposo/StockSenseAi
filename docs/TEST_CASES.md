# StockSense AI — Test Cases and Results

**Date of verified run:** 3 November 2026
**Suite:** 16 automated tests, **90 individual checks**
**Actual result:** ✅ **16 passed, 0 failed, 0 not run — 90/90 checks passed**

---

## 1. How the tests are designed

| Principle | Implementation |
| --- | --- |
| Isolated | Every test calls `createFixtureState()`; live `localStorage` is never read or written |
| Honest | Results exist only after execution; the UI starts at “Not run” and never pre-marks PASS |
| Shared rules | Tests import the same `inventoryRules`, `recommendations`, `supplierRules`, and chatbot engine used by the app |
| Deterministic | Fixed fixture dates (`FIXTURE_NOW`) and fixed actors |
| Transparent | Each result lists every check label, pass state, and detail |
| Safe | Admin-only reset is separate from tests; tests cannot damage the demo |

### Running them

1. Sign in as Administrator, Owner, Staff, or Viewer.
2. Open **Demo & Testing Center** (`/demo-testing/`).
3. Run one test with its **Run** button, or click **Run All**.
4. Read the summary: executed count, passed, failed, checks passed / total.
5. Use **Clear results** to return to “Not run”.

> The in-app center is the canonical runner. The results below were also reproduced in a Node ESM harness against the same `TEST_CASES`/`runAllTests()` exports. The harness is a developer verification tool and is not required by the shipped app.

---

## 2. Summary by category

| Category | Tests | Checks |
| --- | ---: | ---: |
| Seed data | 1 | 7 |
| Stock movement | 4 | 20 |
| Automation | 5 | 27 |
| Validation | 2 | 9 |
| Assistant | 3 | 21 |
| **Total** | **16** | **90** |

---

## 3. Detailed test cases and actual results

### TC-01 · `seed-requirements` — Seed inventory matches the required starting values

**Category:** Seed data · **Checks:** 7 · **Actual:** ✅ PASS (7/7)

| Check | Expected | Actual |
| --- | --- | --- |
| Bond Paper exists | Present | ✅ |
| Bond Paper stock / reorder / target | 20 / 50 / 100 | ✅ 20 / 50 / 100 |
| Ballpen exists | Present | ✅ |
| Ballpen stock / reorder / target | 150 / 30 / 200 | ✅ 150 / 30 / 200 |
| USB Flash Drive exists | Present | ✅ |
| USB stock / reorder / target | 8 / 20 / 50 | ✅ 8 / 20 / 50 |
| Four demo roles | admin, owner, staff, viewer | ✅ all four |

### TC-02 · `stock-in-valid` — A valid stock-in increases stock and records a transaction

**Category:** Stock movement · **Checks:** 5 · **Actual:** ✅ PASS (5/5)

Input: receive **30** reams of Bond Paper as Administrator.

| Check | Expected | Actual |
| --- | --- | --- |
| Stock-in accepted | `ok` | ✅ |
| Balance | 50 | ✅ |
| Transaction count | exactly 1 | ✅ |
| Balance history | 20 → 50 | ✅ |
| Recorded fields | SKU, type, quantity, actor | ✅ BP-001 / in / 30 / admin |

### TC-03 · `stock-in-invalid` — Invalid quantities are rejected without changing stock

**Category:** Stock movement · **Checks:** 7 · **Actual:** ✅ PASS (7/7)

Inputs: `0`, `-5`, `2.5`, `""`, `"abc"`.

| Check | Expected | Actual |
| --- | --- | --- |
| `0` rejected | Yes | ✅ |
| `-5` rejected | Yes | ✅ |
| `2.5` rejected | Yes | ✅ |
| `""` rejected | Yes | ✅ |
| `"abc"` rejected | Yes | ✅ |
| No transaction written | 0 | ✅ |
| Stock unchanged | 20 | ✅ |

### TC-04 · `stock-out-valid` — A valid stock-out decreases stock and records a transaction

**Category:** Stock movement · **Checks:** 4 · **Actual:** ✅ PASS (4/4)

Input: issue **40** pieces of Ballpen as Staff.

| Check | Expected | Actual |
| --- | --- | --- |
| Stock-out accepted | `ok` | ✅ |
| Balance | 110 | ✅ |
| Transaction | type out, qty 40 | ✅ |
| Balance history | 150 → 110 | ✅ |

### TC-05 · `stock-out-over-issue` — A stock-out larger than available stock is rejected

**Category:** Stock movement · **Checks:** 4 · **Actual:** ✅ PASS (4/4)

Input: issue **21** reams of Bond Paper when stock is 20.

| Check | Expected | Actual |
| --- | --- | --- |
| Rejected | Yes | ✅ |
| Error explains available stock | “available stock (20 units)” | ✅ |
| No transaction | 0 | ✅ |
| Stock never negative | 20 | ✅ |

### TC-06 · `status-boundaries` — Stock status boundaries are applied exactly

**Category:** Automation · **Checks:** 4 · **Actual:** ✅ PASS (4/4)

| Input (stock / reorder) | Expected | Actual |
| --- | --- | --- |
| 0 / 50 | out | ✅ |
| 1 / 50 | low | ✅ |
| 50 / 50 | low | ✅ |
| 51 / 50 | sufficient | ✅ |

### TC-07 · `reorder-formula` — Reorder quantity uses Max(Target − Current, 0)

**Category:** Automation · **Checks:** 4 · **Actual:** ✅ PASS (4/4)

| Product | Calculation | Expected | Actual |
| --- | --- | ---: | ---: |
| Bond Paper | Max(100 − 20, 0) | 80 | ✅ 80 |
| Ballpen | Max(200 − 150, 0) | 50 | ✅ 50 |
| USB Flash Drive | Max(50 − 8, 0) | 42 | ✅ 42 |
| Over-target product | Max(100 − 120, 0) | 0 | ✅ 0 |

> Ballpen is healthy so it has no **pending** recommendation in the seed; the formula test still verifies its arithmetic in isolation.

### TC-08 · `recommendation-generated` — Low/out-of-stock products generate pending recommendations

**Category:** Automation · **Checks:** 8 · **Actual:** ✅ PASS (8/8)

| Check | Expected | Actual |
| --- | --- | --- |
| Bond Paper generated | Yes | ✅ |
| Bond Paper quantity | 80 | ✅ |
| USB generated | Yes | ✅ |
| USB quantity | 42 | ✅ |
| Stapler (0 stock) generated | Yes | ✅ |
| Printer Toner generated | Yes | ✅ |
| Healthy Ballpen has no recommendation | none | ✅ |
| Exactly four created | 4 | ✅ |

### TC-09 · `recommendation-resolved` — Recommendations resolve when stock becomes healthy

**Category:** Automation · **Checks:** 4 · **Actual:** ✅ PASS (4/4)

Setup: reconcile seed, raise Bond Paper to **60**, reconcile again.

| Check | Expected | Actual |
| --- | --- | --- |
| Bond Paper recommendation | superseded | ✅ |
| Closure explained | “above the reorder level” | ✅ |
| USB still pending | pending | ✅ |
| Stock unchanged by reconciliation | 60 | ✅ |

### TC-10 · `approval-no-stock-change` — Approving a recommendation never adds stock

**Category:** Automation · **Checks:** 7 · **Actual:** ✅ PASS (7/7)

| Check | Expected | Actual |
| --- | --- | --- |
| Decision accepted | `ok` | ✅ |
| Status | approved | ✅ |
| Reviewer recorded | System Administrator | ✅ |
| Note preserved | “PO-2026-001 approved for supplier delivery.” | ✅ |
| Helper reports no stock change | `stockChanged: false` | ✅ |
| Bond Paper stock | 20 | ✅ |
| Product snapshot untouched | identical | ✅ |

### TC-11 · `rejection-no-stock-change` — Rejecting a recommendation never changes stock

**Category:** Automation · **Checks:** 6 · **Actual:** ✅ PASS (6/6)

| Check | Expected | Actual |
| --- | --- | --- |
| Rejection accepted | `ok` | ✅ |
| Status | rejected | ✅ |
| Reason preserved | “Deferred until next quarter.” | ✅ |
| USB stock | 8 | ✅ |
| Fixture unchanged | identical | ✅ |
| Re-deciding a decided record | rejected | ✅ |

### TC-12 · `duplicate-sku` — Duplicate SKUs are rejected, case-insensitively

**Category:** Validation · **Checks:** 4 · **Actual:** ✅ PASS (4/4)

| Check | Expected | Actual |
| --- | --- | --- |
| `bp-001` rejected | Yes | ✅ |
| Error names existing SKU/product | “BP-001 … already used” | ✅ |
| `NEW-001` accepted | Yes | ✅ |
| SKU normalized | `NEW-001` | ✅ |

### TC-13 · `supplier-delete-guard` — Assigned suppliers cannot be deleted

**Category:** Validation · **Checks:** 5 · **Actual:** ✅ PASS (5/5)

| Check | Expected | Actual |
| --- | --- | --- |
| Northwind deletion blocked | Yes | ✅ |
| Message reports assignment count | “assigned to N product(s)” | ✅ |
| Referencing SKUs listed | BP-001 etc. | ✅ |
| Unassigned supplier deletion allowed | Yes | ✅ |
| Unassigned supplier has zero assignments | 0 | ✅ |

### TC-14 · `chatbot-shared-state` — The chatbot reads the shared inventory state

**Category:** Assistant · **Checks:** 5 · **Actual:** ✅ PASS (5/5)

Question: *“How many Bond Paper are left?”* — fixture at 20, then 37.

| Check | Expected | Actual |
| --- | --- | --- |
| Intent | `product_stock` | ✅ |
| First answer contains 20 | Yes | ✅ |
| Identifies BP-001 | Yes | ✅ |
| Second answer follows changed value 37 | Yes | ✅ |
| State not mutated | identical | ✅ |

### TC-15 · `chatbot-multilingual` — The chatbot answers in Tagalog and Cebuano

**Category:** Assistant · **Checks:** 8 · **Actual:** ✅ PASS (8/8)

| Question | Check | Actual |
| --- | --- | --- |
| “Ilan ang natitirang Bond Paper?” | language `tl` | ✅ |
| | resolves BP-001 | ✅ |
| | contains stock 20 | ✅ |
| | “Ang Bond Paper …” wording | ✅ |
| “Pila ang nahabilin nga USB Flash Drive?” | language `ceb` | ✅ |
| | resolves USB-001 | ✅ |
| | contains stock 8 | ✅ |
| | “Ang USB Flash Drive …” wording | ✅ |

### TC-16 · `chatbot-safety` — The chatbot refuses direct inventory changes

**Category:** Assistant · **Checks:** 8 · **Actual:** ✅ PASS (8/8)

Requests: *“Add 50 stock to Bond Paper right now”* and *“Approve the reorder recommendation now”*.

| Check | Expected | Actual |
| --- | --- | --- |
| Add-stock intent | `safety_action` | ✅ |
| Refusal text | “can’t change inventory directly” | ✅ |
| Safe path offered | tour `stock-in` | ✅ |
| Approval intent | `safety_action` | ✅ |
| Refusal text | “can’t approve or reject” | ✅ |
| State unchanged | identical | ✅ |
| Bond Paper stock | 20 | ✅ |
| Staff lacks decision permission | role `staff` | ✅ |

---

## 4. Actual execution log (Node harness, 3 November 2026)

```text
Registered tests: 16
Executed: 16

PASS  seed-requirements            (7/7 checks)
PASS  stock-in-valid               (5/5 checks)
PASS  stock-in-invalid             (7/7 checks)
PASS  stock-out-valid              (4/4 checks)
PASS  stock-out-over-issue         (4/4 checks)
PASS  status-boundaries            (4/4 checks)
PASS  reorder-formula              (4/4 checks)
PASS  recommendation-generated     (8/8 checks)
PASS  recommendation-resolved      (4/4 checks)
PASS  approval-no-stock-change     (7/7 checks)
PASS  rejection-no-stock-change    (6/6 checks)
PASS  duplicate-sku                (4/4 checks)
PASS  supplier-delete-guard        (5/5 checks)
PASS  chatbot-shared-state         (5/5 checks)
PASS  chatbot-multilingual         (8/8 checks)
PASS  chatbot-safety               (8/8 checks)

Summary: 16 passed, 0 failed, 0 not run; 90/90 individual checks passed.
```

Timings are intentionally omitted here because they vary by machine. The in-app center shows the actual duration for each run.

---

## 5. Supplemental browser verification (not part of the shipped suite)

A headless Chrome QA pass was run against the development server on the same date, using a dedicated temporary browser profile. It exercised the real UI, not just pure functions. **Result: 33/33 checks passed.**

| Area | Checks | Result |
| --- | ---: | --- |
| Admin login, dashboard seed display, admin navigation | 3 | ✅ |
| Assistant: live stock, follow-up, Tagalog, Cebuano, language switch, two safety refusals, navigation, alert list | 9 | ✅ |
| Guided walkthrough: start from assistant, navigate, highlight, Escape close | 2 | ✅ |
| Recommendations: four pending items, approve without stock change | 2 | ✅ |
| Stock-in 20 → 60, approved recommendation history, alert resolution | 3 | ✅ |
| Demo & Testing Center: 16/16, 90/90 | 1 | ✅ |
| Admin demo reset to seed | 1 | ✅ |
| Viewer: navigation restrictions, route block, no Add Product, reports export, assistant permission refusals | 6 | ✅ |
| Staff: forecasting block, disabled approvals, hidden audit/settings | 3 | ✅ |
| Owner: forecasting + approval allowed, settings blocked | 1 | ✅ |
| **Total** | **33** | ✅ |

This pass found and confirmed three real defects that were fixed before the final run:

1. **Walkthrough sign-in bug** — the walkthrough context memoized its value without the `startTour` dependency, so consumers kept a closure created before login. Fixed by including `startTour` in the memo dependencies.
2. **Tour cancellation race** — a 250 ms route-cancel timer could fire before `router.push` completed. Fixed by waiting for the expected route and only cancelling after arrival/leave.
3. **Viewer dashboard link** — the Demand Forecast shortcut was visible to Viewer. Fixed with a `forecasting.view` permission check.

---

## 6. What the automated tests do not cover

Be explicit during defense:

- **React rendering and layout** — pure rule tests do not mount components.
- **Browser storage failures** (quota, disabled storage) — handled defensively but not unit-tested.
- **Accessibility** — labels and keyboard support exist; no automated a11y audit is included.
- **Visual regression** — no screenshot diffing in the shipped suite.
- **Security** — the permission matrix is exercised indirectly; the prototype makes no security guarantee.
- **Assistant paraphrase breadth** — tests cover representative questions, not every phrasing.
- **Forecast accuracy** — arithmetic is verified by inspection; there is no accuracy claim.

---

## 7. Reproducing a failing result honestly

If a test fails during defense:

1. Open the failing test row and read each check’s **detail**.
2. Do not edit live data to force a pass.
3. Use **Clear results** and re-run to confirm reproducibility.
4. If the failure is due to modified demo data (for example, a changed product), **Reset Demo Data** as Administrator, then re-run.
5. Report the failure as observed. The suite is designed to expose drift, not to hide it.
