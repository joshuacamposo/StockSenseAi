# StockSense AI — Automation Workflow

**Version:** 1.0.0 · **Date:** 3 November 2026

This document explains exactly how the automated behaviour works, with formulas, decision tables, and worked examples using the seeded catalog. Nothing here depends on a server, a scheduled job, or an external AI service.

---

## 1. Automation at a glance

```text
Stock-in / Stock-out (validated)
        │
        ├── update product balance
        ├── write transaction record
        ├── write audit entry
        ├── reconcile pending reorder recommendations
        │      ├── sufficient stock → supersede pending
        │      ├── low/out + qty > 0 → create or update pending
        │      └── inactive product → supersede pending
        └── re-render pages
               ├── alerts are re-derived from balances
               ├── dashboard stats recompute
               └── assistant reads the same new state

Reorder decision (approve / reject)
        │
        ├── change recommendation status only
        ├── record reviewer, time, note
        ├── write audit entry
        └── stock is NOT touched
```

There are **six automation rules**:

| # | Rule | Trigger | Effect |
| --- | --- | --- | --- |
| A1 | Status classification | Any read / movement | Computes out / low / sufficient |
| A2 | Alert derivation | Any state change | Builds one alert per unhealthy active product |
| A3 | Recommendation creation | Reconciliation | Pending record with `Max(target − stock, 0)` |
| A4 | Recommendation update | Reconciliation | Keeps quantity and stock snapshot current |
| A5 | Recommendation supersede | Reconciliation | Closes pending records when stock is healthy or product inactive |
| A6 | Forecast projection | User opens forecasting | Moving-average demand and coverage |

---

## 2. Rule A1 — Stock status

```text
if stock <= 0            → Out of Stock   (severity rank 0)
else if stock <= reorder → Low Stock      (severity rank 1)
else                     → Sufficient     (severity rank 2)
```

The boundary is **inclusive**: a product with stock exactly equal to its reorder level is **Low Stock**, not sufficient. This is deliberate and is verified by test `status-boundaries`.

### Decision table

| Stock | Reorder level | Status |
| ---: | ---: | --- |
| 0 | 50 | Out of Stock |
| 1 | 50 | Low Stock |
| 49 | 50 | Low Stock |
| **50** | **50** | **Low Stock** |
| 51 | 50 | Sufficient Stock |
| 120 | 50 | Sufficient Stock |

### Seed status

| Product | Stock | Reorder | Status |
| --- | ---: | ---: | --- |
| Bond Paper | 20 | 50 | Low Stock |
| Ballpen | 150 | 30 | Sufficient Stock |
| USB Flash Drive | 8 | 20 | Low Stock |
| Notebook | 80 | 40 | Sufficient Stock |
| Stapler | 0 | 10 | Out of Stock |
| Whiteboard Marker | 60 | 25 | Sufficient Stock |
| Printer Toner | 12 | 15 | Low Stock |

Result: **4 alerts** (Bond Paper, USB Flash Drive, Stapler, Printer Toner).

---

## 3. Rule A2 — Alerts are derived, never stored

```text
alerts = activeProducts
  .filter(status !== sufficient)
  .map(one alert per product)
  .sort(out before low, then lowest stock first)
```

Why derived?

- A stored alert needs a second “resolve” routine; if that routine is missed, the UI shows stale alerts.
- Derivation means **stock-in automatically clears the alert** on the next render.
- There can never be duplicate active alerts for the same product.

> The Alerts page, sidebar badge, dashboard attention list, and notification bell all read the same derived array.

---

## 4. Rule A3–A5 — Recommendation reconciliation

### Formula

```text
recommendedQty = Max(targetStock − currentStock, 0)
```

### Reconciliation algorithm (runs after every valid movement)

```text
for each active product:
    pending = existing recommendation with status "pending"
    status  = statusOf(product)

    if status == sufficient:
        if pending exists:
            pending.status = "superseded"
            note = "Closed automatically — stock is now above the reorder level."
        continue

    qty = Max(target − stock, 0)
    if qty == 0: continue

    if pending exists:
        if qty or stock snapshot changed:
            keep previousQuantity / previousStock
            update qty and currentStock
        continue

    create pending recommendation (source = automated-rule)

for each remaining pending recommendation:
    if its product is missing or inactive:
        supersede with "product is no longer active"
```

### What reconciliation never does

- It never changes `product.stock`.
- It never modifies approved or rejected recommendations.
- It never creates a recommendation for a healthy product.
- It never creates a second pending record for the same product.

### Seed recommendations

| Product | Target | Stock | Calculation | Quantity |
| --- | ---: | ---: | --- | ---: |
| Bond Paper | 100 | 20 | `Max(100 − 20, 0)` | **80** |
| USB Flash Drive | 50 | 8 | `Max(50 − 8, 0)` | **42** |
| Stapler | 40 | 0 | `Max(40 − 0, 0)` | **40** |
| Printer Toner | 30 | 12 | `Max(30 − 12, 0)` | **18** |
| Ballpen | 200 | 150 | healthy → no recommendation | — |

Result: **4 pending recommendations**.

---

## 5. Stock movement validation

### Quantity rules

| Input | Result | Message |
| --- | --- | --- |
| `30` | Accepted | — |
| `0` | Rejected | Quantity must be greater than zero. |
| `-5` | Rejected | Quantity must be greater than zero. |
| `2.5` | Rejected | Quantity must be a whole number. |
| `""` | Rejected | Quantity is required. |
| `"abc"` | Rejected | Quantity must be a valid number. |
| `21` out when stock is 20 | Rejected | Cannot stock out more than the available stock (20 units). |
| Movement on inactive product | Rejected | This product is deactivated and cannot be transacted. |

### Resulting balance

```text
Stock-In : updated = previous + quantity
Stock-Out: updated = previous − quantity   (quantity <= previous)
```

Every accepted movement records the previous and updated balance, so the history is reconstructable.

---

## 6. Rule A6 — Demand forecasting

### Model

```text
windowStart   = start of day (today − (periodDays − 1))
windowEnd     = end of today

matching      = stock-out transactions for the product inside the window
totalStockOut = sum(matching.quantity)

averageDailyDemand = totalStockOut / periodDays
projectedDemand    = averageDailyDemand * horizonDays
daysOfCoverage     = currentStock / averageDailyDemand   (null if average = 0)
```

If `totalStockOut == 0`, the forecast returns:

```text
ok: false
reason: "insufficient-history"
message: "Insufficient sales history for a reliable forecast."
```

It does **not** display a fabricated zero-confidence prediction.

### Chart

- One bucket per calendar day in the window.
- Bars show actual stock-out units per day.
- A **3-day moving average** line smooths the series for readability.
- The exact transactions used are listed below the chart.

### Seeded 30-day examples

| Product | Stock-out units (30 days) | Average/day | Projected demand (30 days) | Days of coverage |
| --- | ---: | ---: | ---: | ---: |
| Bond Paper | 80 | 2.67 | 80 | 7.5 days |
| Ballpen | 147 | 4.90 | 147 | 30.6 days |
| USB Flash Drive | 19 | 0.63 | 19 | 12.6 days |

These are arithmetic results from the seeded transactions, not model accuracy claims.

---

## 7. Reorder decision workflow

```text
Pending recommendation
   │
   ├── Approve
   │      status = approved
   │      decidedBy = current reviewer
   │      decisionNote = note or default
   │      stock UNCHANGED
   │      audit: "Reorder Approved" with explicit no-stock-change note
   │
   └── Reject
          status = rejected
          decidedBy = current reviewer
          decisionNote = note or default
          stock UNCHANGED
          audit: "Reorder Rejected"
```

### Why approval must not add stock

A recommendation is a **purchasing decision**, not a delivery. Stock is only real when a validated stock-in is recorded. This prevents phantom inventory and keeps the transaction history truthful.

### After approval, what happens?

- The recommendation remains in history with status `approved`.
- The alert remains if the product is still at/below its reorder level.
- When the delivery arrives, a stock-in is recorded.
- Reconciliation **supersedes pending** records only; the approved record stays as history.
- If stock is still at/below the reorder level after the delivery (for example, 50 when the reorder level is 50), a new pending recommendation is correctly generated for the remaining gap.

---

## 8. End-to-end worked example (defense scenario)

Start: Bond Paper 20 / reorder 50 / target 100, recommendation 80 pending.

| Step | Action | Stock | Alert | Recommendation | Audit |
| --- | --- | ---: | --- | --- | --- |
| 1 | Approve 80 | 20 | Low | `approved` (80) | Reorder Approved — stock not changed |
| 2 | Stock-in 40 | **60** | **Resolved** | no pending | Stock-In 20 → 60 |
| 3 | Ask assistant “How many Bond Paper are left?” | 60 | — | — | — |
| 4 | Ask “What is its reorder level?” | 60 | — | — | — |

Why 60 and not 50? Because `50 <= 50` is still **Low Stock**. To demonstrate alert resolution, the receipt must push stock **above** the reorder level. A receipt to exactly 50 would leave the product low and generate a new pending recommendation for 50 more.

---

## 9. Audit automation

Each of these actions writes an audit entry automatically:

| Area | Example action label |
| --- | --- |
| Session | Login, Logout |
| Products | Product Created, Product Updated, Product Reactivated / Deactivated |
| Suppliers | Supplier Added, Supplier Updated, Supplier Deleted |
| Stock | Stock-In, Stock-Out |
| Reorder | Reorder Approved, Reorder Rejected |
| Settings | Settings Updated |
| Demo | Demo Reset |

Audit entries are capped at the most recent **500** records.

---

## 10. Failure handling

| Failure | Behaviour |
| --- | --- |
| Corrupt `localStorage` JSON | Warning logged; seed state recreated and persisted |
| Wrong storage version | Seed state recreated |
| Invalid session user | Session dropped; route guard redirects to login |
| Invalid quantity | Action returns `{ ok: false, error }`; no state change |
| Over-issue | Rejected with available quantity; no state change |
| Assigned supplier delete | Rejected with assignment count; no state change |
| Non-pending decision | Rejected; record unchanged |
| Assistant cannot classify | Helpful fallback with suggested questions; no state change |
| Tour selector missing | Overlay reports that the element is unavailable instead of hanging |
| No forecast history | Explicit “insufficient history”; no invented number |

---

## 11. Test coverage of automation

| Automation | Tests |
| --- | --- |
| Status boundaries | `status-boundaries` |
| Reorder formula | `reorder-formula` |
| Recommendation creation | `recommendation-generated` |
| Recommendation resolution | `recommendation-resolved` |
| Approval without stock change | `approval-no-stock-change` |
| Rejection without stock change | `rejection-no-stock-change` |
| Valid stock-in / stock-out | `stock-in-valid`, `stock-out-valid` |
| Invalid quantities / over-issue | `stock-in-invalid`, `stock-out-over-issue` |
| Seed contract | `seed-requirements` |
| Assistant shared state and safety | `chatbot-shared-state`, `chatbot-safety` |

See [TEST_CASES.md](TEST_CASES.md) for inputs, expectations, and actual results.
