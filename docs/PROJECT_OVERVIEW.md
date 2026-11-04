# StockSense AI — Project Overview

**System:** StockSense AI — AI Inventory and Stock Management Automation System
**Course:** SA101 — AI Automation System
**Deliverable:** Prefinal defense prototype (v1.0)
**Last verified:** 3 November 2026
**Runtime:** Static Next.js application, browser-only data

---

## 1. The problem

Small offices and school units usually track supplies in spreadsheets or notebooks. That creates four recurring failures:

1. **Stock is counted late.** Low stock is discovered after an item has already run out.
2. **Reordering is manual and inconsistent.** Different staff compute reorder quantities differently.
3. **Decisions are confused with deliveries.** A “reorder approved” note is often mistaken for “stock added”.
4. **Knowledge is trapped in one person.** Staff cannot easily find product rules, page locations, or the meaning of alerts.

StockSense AI demonstrates a small, coherent automation layer that addresses those failures without pretending to be a production ERP.

## 2. Objectives

| # | Objective | How v1.0 demonstrates it |
| --- | --- | --- |
| O1 | Centralize inventory records | One shared local store for products, suppliers, transactions, recommendations, settings, and audit logs |
| O2 | Automate low-stock detection | Derived status rule with inclusive boundaries; no duplicate active alerts |
| O3 | Automate reorder recommendations | `Max(targetStock − stock, 0)` with reconciliation after every movement |
| O4 | Keep decisions separate from stock | Approval/rejection changes only the recommendation record; stock never increases automatically |
| O5 | Preserve traceability | Every validated movement, product/supplier change, decision, settings change, login/logout, and reset writes an audit entry |
| O6 | Add a usable AI-style assistant | Rule-based assistant over the same state, with English/Tagalog/Cebuano answers, follow-up context, navigation, tours, and safety refusals |
| O7 | Demonstrate role-based access | Four demo accounts, centralized matrix, route guards, disabled actions, permission-aware assistant |
| O8 | Make the system teachable | 15 guided walkthroughs and a manual |
| O9 | Prove the rules work | 16 automated checks on isolated fixtures (90 individual assertions) |
| O10 | Stay honest and reproducible | No backend, no external AI, no fabricated confidence, documented limitations |

## 3. Intended users

| User | Primary need | Demonstration role |
| --- | --- | --- |
| Business owner / manager | Decide what to reorder and when | `owner` |
| Inventory staff | Receive and issue stock accurately | `staff` |
| System administrator | Maintain the demo, audit activity, configure settings | `admin` |
| Auditor / observer | Read-only visibility | `viewer` |
| Student presenter | Show the whole workflow in minutes | `admin` |

## 4. Scope

### In scope

- Product registration with unique SKU, category, unit, price, supplier, reorder level, and target stock.
- Supplier directory with assignment rules and a delete guard.
- Validated stock-in and stock-out transactions with preview and balance history.
- Automated status calculation, alerts, and reorder recommendations.
- Reorder decision workflow (approve/reject) with notes and history.
- Historical demand forecasting using a transparent moving average.
- Inventory, low-stock, movement, and reorder reports with client-side CSV export.
- Transaction history and audit trail.
- Four hardcoded demo accounts with centralized client-side permissions.
- Rule-based multilingual assistant (English, Tagalog, Cebuano), navigation, tours, and safety refusals.
- 15 guided walkthroughs anchored to real interface elements.
- Demo & Testing Center with 16 isolated automated tests and admin-only reset.
- Documentation for defense, operation, and future revision.

### Out of scope (deliberate)

- Real authentication, password hashing, sessions, cookies, or OAuth.
- Server/database persistence, multi-user sync, or conflict resolution.
- Payment, accounting, purchase orders, or delivery tracking.
- Barcode/QR scanning, hardware integration, or email/SMS delivery.
- Machine-learning training, model accuracy metrics, or external AI APIs.
- Production security, backups, disaster recovery, or regulatory compliance.

## 5. What “AI” means here

The assistant is an **explainable rule engine**, not a language model:

- Text is normalized (case, punctuation, whitespace) and matched against keyword/phrase rules.
- A product resolver maps names, SKUs, and aliases (including Filipino terms such as *papel*, *bolpen*, *kwaderno*) to catalog records.
- Language detection uses phrase markers for Tagalog and Cebuano; the user can also switch explicitly.
- Responses are localized templates filled with **live values from the shared state**.
- Intent handlers can navigate to permitted pages or start guided tours.
- Safety handlers refuse requests to change stock or decide recommendations.

This is intentionally described as a **rule-based assistant** everywhere in the UI and documentation.

## 6. Signature workflow (the 60-second story)

1. Sign in as **Administrator**.
2. The dashboard shows **Bond Paper at 20 reams**, reorder level 50 — therefore **Low Stock**.
3. The alert list shows four products derived from the same rule.
4. The recommendation list shows **Bond Paper needs 80** (`100 − 20`).
5. Approve the recommendation. The status becomes **Approved**, but stock **stays 20**.
6. Record a stock-in of **40**. Stock becomes **60**, the alert disappears, and the pending recommendation closes automatically.
7. Ask the assistant: *“How many Bond Paper are left?”* → it answers **60 reams** from the same state.
8. Ask in Tagalog or Cebuano and receive a localized answer.
9. Open **Demo & Testing Center** and run all tests → **16/16 tests, 90/90 checks**.
10. As Administrator only, reset the demo to restore the exact seed data.

## 7. Deliverables

| Deliverable | Location |
| --- | --- |
| Working static application | Project root; `npm run dev` / `npm run build` |
| Seed catalog and accounts | `data/` |
| Rule engine and tests | `lib/`, `lib/testing/` |
| Assistant and walkthroughs | `lib/chatbot/`, `context/ChatbotContext.js`, `components/chatbot/`, `components/walkthrough/` |
| Defense documents | `docs/` |
| Quick-start and rubric map | `README.md` |
| Static export | `out/` after `npm run build` |

## 8. Success criteria

The prototype is considered successful when all of the following are true:

- [x] The three required products exist with exact seed values.
- [x] Low stock is detected automatically at the inclusive boundary.
- [x] Reorder quantity always equals `Max(target − current, 0)`.
- [x] Approval/rejection never changes stock.
- [x] Stock-in above the reorder level resolves the alert and closes the pending recommendation.
- [x] Invalid quantities and over-issues are rejected without state changes.
- [x] Duplicate SKUs (case-insensitive) are rejected.
- [x] Assigned suppliers cannot be deleted.
- [x] The assistant answers from live shared state in three languages and refuses unsafe actions.
- [x] All 15 walkthroughs point at real rendered elements.
- [x] All 16 automated tests pass on isolated fixtures (90/90 checks).
- [x] Role restrictions are enforced by routes, UI, actions, and the assistant.
- [x] The app builds as a static export and runs offline after install.
