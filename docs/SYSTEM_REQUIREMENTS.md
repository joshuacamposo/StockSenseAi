# StockSense AI — System Requirements

**Version:** 1.0.0
**Date:** 3 November 2026
**Reference:** SA101 AI Automation System — prefinal prototype

This document states what the system must do, how it must behave, and what is intentionally excluded. Requirements are written so they can be checked during defense.

---

## 1. Operating environment

| Item | Requirement |
| --- | --- |
| Runtime | Node.js 20 or newer (verified: Node 24.21.0) |
| Package manager | npm 10 or newer (verified: npm 11.19.0) |
| Framework | Next.js 16.4.4 (App Router) |
| UI | React 19.3.1, Tailwind CSS 4.3.4, Lucide React, Recharts, React Hot Toast |
| Language | JavaScript (`.js` / `.jsx`), no TypeScript source |
| Storage | Browser `localStorage` only |
| Network | None required at runtime; no API calls, no external services |
| Build output | Static export (`output: 'export'`, `trailingSlash: true`) |
| Browser | Modern evergreen browser with ES2020 support |

## 2. Functional requirements

### FR-1 — Demo authentication

| ID | Requirement |
| --- | --- |
| FR-1.1 | The system provides exactly four hardcoded demo accounts: Administrator, Business Owner, Inventory Staff, Inventory Viewer. |
| FR-1.2 | Credentials are `admin@stocksense.demo / Admin123!`, `owner@stocksense.demo / Owner123!`, `staff@stocksense.demo / Staff123!`, `viewer@stocksense.demo / Viewer123!`. |
| FR-1.3 | Invalid credentials show a clear error and do not create a session. |
| FR-1.4 | The active demo identity is persisted in `localStorage` and restored on reload. |
| FR-1.5 | Signing out clears the session and redirects to `/login/`. |
| FR-1.6 | The login page exposes one-click account fill buttons and states that credentials are public by design. |

### FR-2 — Authorization

| ID | Requirement |
| --- | --- |
| FR-2.1 | A single permission matrix maps permissions to roles. |
| FR-2.2 | Every route with restricted content is guarded; unauthorized visits show an Access Denied state. |
| FR-2.3 | Navigation items are hidden when the role lacks the route permission. |
| FR-2.4 | State-changing actions re-check permission inside the state layer, not only in the UI. |
| FR-2.5 | The assistant uses the same permission matrix for navigation and walkthroughs. |
| FR-2.6 | Audit logs, settings, and demo reset are Administrator-only. |
| FR-2.7 | Reorder decisions and forecasting are limited to Administrator and Business Owner. |

### FR-3 — Products

| ID | Requirement |
| --- | --- |
| FR-3.1 | Products have SKU, name, category, unit, unit price, optional supplier, reorder level, target stock, and active flag. |
| FR-3.2 | SKUs are normalized to uppercase and must be unique, case-insensitively. |
| FR-3.3 | Reorder level and target stock must be whole numbers; target stock must be greater than the reorder level. |
| FR-3.4 | New products start at zero stock. |
| FR-3.5 | Products can be edited; deactivation requires `products.deactivate`. |
| FR-3.6 | Inactive products cannot receive stock movements. |
| FR-3.7 | Required seed products must exist exactly: BP-001 20/50/100, PEN-001 150/30/200, USB-001 8/20/50. |

### FR-4 — Suppliers

| ID | Requirement |
| --- | --- |
| FR-4.1 | Suppliers store name, contact person, phone, email, address, and notes. |
| FR-4.2 | Supplier name, contact person, and phone are required; email format is validated when provided. |
| FR-4.3 | A supplier assigned to one or more products cannot be deleted. |
| FR-4.4 | Unassigned suppliers can be deleted after confirmation. |
| FR-4.5 | Supplier changes are audited. |

### FR-5 — Stock-in and stock-out

| ID | Requirement |
| --- | --- |
| FR-5.1 | Stock can change only through a validated transaction. |
| FR-5.2 | Quantity must be a positive whole number; empty, zero, negative, decimal, and non-numeric values are rejected. |
| FR-5.3 | A stock-out greater than the available balance is rejected with the available quantity in the message. |
| FR-5.4 | A valid movement records product, type, quantity, previous stock, updated stock, actor, role, remarks, and timestamp. |
| FR-5.5 | The transaction preview shows current stock, resulting stock, and resulting status before submission. |
| FR-5.6 | After a movement, alerts and recommendations must recalculate automatically. |

### FR-6 — Low-stock detection and alerts

| ID | Requirement |
| --- | --- |
| FR-6.1 | `stock <= 0` is Out of Stock. |
| FR-6.2 | `stock > 0` and `stock <= reorderLevel` is Low Stock. |
| FR-6.3 | `stock > reorderLevel` is Sufficient Stock. |
| FR-6.4 | Alerts are derived, not duplicated in storage. |
| FR-6.5 | Exactly one alert is visible per unhealthy product. |
| FR-6.6 | An alert resolves automatically when stock rises above the reorder level. |
| FR-6.7 | Alerts are ordered by severity (out before low). |

### FR-7 — Reorder recommendations

| ID | Requirement |
| --- | --- |
| FR-7.1 | Recommended quantity is `Max(targetStock − currentStock, 0)`. |
| FR-7.2 | An active product at or below its reorder level receives a pending recommendation when the quantity is greater than zero. |
| FR-7.3 | Reconciliation creates, updates, or supersedes pending recommendations. |
| FR-7.4 | Decided recommendations (approved/rejected) are immutable history. |
| FR-7.5 | Approval/rejection records reviewer, timestamp, and note. |
| FR-7.6 | **Approval or rejection must never change stock.** |
| FR-7.7 | A pending recommendation is superseded automatically when stock becomes sufficient or the product is deactivated. |
| FR-7.8 | Only pending recommendations can be decided. |

### FR-8 — Forecasting

| ID | Requirement |
| --- | --- |
| FR-8.1 | The forecast uses only local stock-out transactions in a chosen historical window. |
| FR-8.2 | Average daily demand = total stock-out units ÷ period days. |
| FR-8.3 | Projected demand = average daily demand × horizon days. |
| FR-8.4 | Days of coverage = current stock ÷ average daily demand. |
| FR-8.5 | With no stock-outs in the window, the system reports insufficient history instead of inventing a number. |
| FR-8.6 | The UI must state that this is arithmetic, not a trained model. |
| FR-8.7 | The chart may include a 3-day moving-average overlay for readability. |

### FR-9 — Reports and export

| ID | Requirement |
| --- | --- |
| FR-9.1 | Reports cover inventory, low stock, stock-in, stock-out, and reorders. |
| FR-9.2 | Rows are derived from the shared local state. |
| FR-9.3 | CSV export happens in the browser; no data leaves the device. |
| FR-9.4 | CSV values containing commas, quotes, or newlines are escaped. |
| FR-9.5 | Exporting an empty report shows an explanatory error instead of an empty file. |

### FR-10 — Audit trail

| ID | Requirement |
| --- | --- |
| FR-10.1 | Logins, logouts, product changes, supplier changes, stock movements, decisions, settings changes, and demo resets are audited. |
| FR-10.2 | Each entry stores action, target, description, actor name/role, and timestamp. |
| FR-10.3 | The audit log is visible to Administrators only. |
| FR-10.4 | Demo reset restores seed data but preserves the current session. |

### FR-11 — Assistant

| ID | Requirement |
| --- | --- |
| FR-11.1 | The assistant reads the same shared inventory state as the pages. |
| FR-11.2 | It supports English, Tagalog, and Cebuano, with explicit language switching. |
| FR-11.3 | It resolves products by name, SKU, and aliases. |
| FR-11.4 | It keeps the last discussed product for follow-up questions. |
| FR-11.5 | It answers stock, status, reorder level, target stock, price, supplier, recommendation, and forecast questions. |
| FR-11.6 | It explains system concepts, roles, reports, audits, and limitations. |
| FR-11.7 | It can navigate to pages the current role may access. |
| FR-11.8 | It can start permitted guided walkthroughs. |
| FR-11.9 | It refuses to change stock, approve/reject recommendations, or bypass permissions. |
| FR-11.10 | Conversation state is persisted locally and can be cleared. |
| FR-11.11 | No message is sent to any external service. |

### FR-12 — Guided walkthroughs

| ID | Requirement |
| --- | --- |
| FR-12.1 | Exactly 15 walkthroughs are available. |
| FR-12.2 | Each tour navigates to its page and highlights real rendered elements using `data-tour` selectors. |
| FR-12.3 | Tours respect role permissions. |
| FR-12.4 | The overlay supports next, previous, skip/close, and Escape; arrow keys are supported. |
| FR-12.5 | Starting a tour from the assistant navigates and opens the overlay. |
| FR-12.6 | A tour ends when the user leaves its page. |

### FR-13 — Demonstration tests

| ID | Requirement |
| --- | --- |
| FR-13.1 | Exactly 16 automated tests are available. |
| FR-13.2 | Tests run on fresh isolated fixtures, never on live inventory. |
| FR-13.3 | No test shows PASS before it is executed. |
| FR-13.4 | Each test reports individual check labels and details. |
| FR-13.5 | Run All executes every test and summarizes totals. |
| FR-13.6 | Results can be cleared. |
| FR-13.7 | Demo reset is Administrator-only and requires confirmation. |

### FR-14 — Settings

| ID | Requirement |
| --- | --- |
| FR-14.1 | Settings include business name, currency symbol, default forecast history, default horizon, demo banner, compact tables, and a simulated low-stock email toggle. |
| FR-14.2 | Settings are persisted locally and audited. |
| FR-14.3 | The email toggle is explicitly a simulation; no email is sent. |
| FR-14.4 | Settings are Administrator-only. |

## 3. Non-functional requirements

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-1 | Fully static; no backend or API route | `output: 'export'`; build has no server routes |
| NFR-2 | Works offline after install | No runtime fetch/XHR to external hosts |
| NFR-3 | Responsive layout | Sidebar collapses; grids adapt; tables scroll |
| NFR-4 | Centralized rules | UI, assistant, and tests import the same pure modules |
| NFR-5 | Defensive storage | JSON parse/write failures are caught and logged, never crash the app |
| NFR-6 | Deterministic tests | Fixed fixture dates and isolated state |
| NFR-7 | Explainability | Formulas and limitations are visible in the UI and docs |
| NFR-8 | Performance | 16 tests complete in well under a second in Node; pages prerender statically |
| NFR-9 | Accessibility basics | Labels, `aria-label`s, keyboard Escape/arrow support, visible focus styles |
| NFR-10 | Maintainability | Small modules, consistent naming, documented responsibilities |

## 4. Acceptance criteria

1. `npm run build` completes and writes `out/`.
2. All 16 automated tests pass with **90/90** checks.
3. Seed values match the brief exactly.
4. Approving a recommendation leaves Bond Paper at 20.
5. A stock-in of 40 raises Bond Paper to 60 and removes its alert.
6. The assistant returns 20/60 correctly before/after the stock-in.
7. Tagalog and Cebuano questions return localized, accurate answers.
8. A viewer cannot open stock-in, settings, audit logs, or forecasting.
9. Staff cannot approve recommendations or forecast.
10. Owner can approve and forecast but cannot open settings.
11. Demo reset is available only to Administrator.
12. The walkthrough starts from the assistant and highlights a real element.

## 5. Out-of-scope constraints (must remain true)

- No Supabase, Firebase, Prisma, database, ORM, or server action.
- No Next.js API routes or middleware-based auth.
- No OpenAI/Anthropic/Google AI or any external NLP service.
- No Docker or container requirement.
- No real personal data in seeds.
- No claim of production security or prediction accuracy.

## 6. Data requirements

| Entity | Required fields |
| --- | --- |
| Account | id, name, email, password (demo), role, title, initials, color |
| Product | id, SKU, name, category, unit, unit price, supplier id, reorder level, target stock, stock, active, aliases |
| Supplier | id, name, contact person, phone, email, address, notes |
| Transaction | id, product id/name/SKU, type, quantity, previous stock, updated stock, user id/name/role, remarks, timestamp |
| Recommendation | id, product id/name/SKU/unit, current stock, reorder level, target stock, recommended qty, status, source, timestamps, reviewer, decision note |
| Audit entry | id, action, target, description, actor name/role, timestamp |
| Settings | business name, currency, forecast defaults, banner/table/email preferences |
| Session | current user id |
| Chat | language, messages, last product id |

The local store key is `stocksense-ai:state:v1`; the chat key is `stocksense-ai:chat:v1`.
