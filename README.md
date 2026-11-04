# StockSense AI

**AI Inventory and Stock Management Automation System** — an academic prototype for **SA101 Prefinal Defense**.

StockSense AI is a fully static, offline-capable Next.js application that demonstrates inventory tracking, automated low-stock detection, rule-based reorder recommendations, historical demand forecasting, role-based demonstration accounts, 15 guided walkthroughs, and a built-in multilingual rule-based assistant — all with **no backend, no database, no external AI service, and no network calls at runtime**.

> **Honest positioning:** this is a teaching prototype. Authentication and role checks are client-side demonstrations, data lives in `localStorage`, and the “AI” is a deterministic rule engine — not a trained machine-learning model. See [docs/SECURITY_LIMITATIONS.md](docs/SECURITY_LIMITATIONS.md).

---

## 1. Requirements

- **Node.js 20+** (verified with Node 24.21.0)
- **npm 10+** (verified with npm 11.19.0)
- A modern browser (Chrome, Edge, Firefox, or Safari)
- No internet connection required after `npm install`

## 2. Install and run

```bash
# from the project root
npm install
npm run dev
```

Open **http://localhost:3000** and sign in with one of the demo accounts below.

### Production-style static build

```bash
npm run build
```

The static export is written to **`out/`** (configured with `output: 'export'` and `trailingSlash: true`). Because every page is prerendered, `out/` can be served by any static file server. Next.js's own `npm start` is not used for an `output: 'export'` build.

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server on port 3000 |
| `npm run build` | Build and export the static site to `out/` |
| `npm run export` | Alias of `npm run build` |

## 3. Demo accounts

Passwords are hardcoded and public **by design**. The login screen also has one-click “Fill” buttons for each account.

| Role | Email | Password | What it can do |
| --- | --- | --- | --- |
| Administrator | `admin@stocksense.demo` | `Admin123!` | Everything: products, suppliers, stock, reorder decisions, forecasting, reports, audit logs, settings, demo reset |
| Business Owner | `owner@stocksense.demo` | `Owner123!` | Reorder approvals/rejections, forecasting, reports, stock, suppliers — no audit logs or settings |
| Inventory Staff | `staff@stocksense.demo` | `Staff123!` | Products, suppliers (view), stock-in, stock-out, alerts, reports — cannot approve reorders or forecast |
| Inventory Viewer | `viewer@stocksense.demo` | `Viewer123!` | Read-only dashboard, products, alerts, recommendations, reports, demo/security pages |

## 4. Routes

All generated routes use a trailing slash because of `trailingSlash: true`.

| Route | Page | Permission |
| --- | --- | --- |
| `/` | Redirects to `/dashboard` or `/login` | — |
| `/login/` | Demo sign-in | Public |
| `/dashboard/` | Inventory overview and recent movement | `dashboard.view` |
| `/products/` | Product catalog, add/edit/deactivate | `products.view` |
| `/suppliers/` | Supplier directory | `suppliers.view` |
| `/stock-in/` | Validated stock receiving | `stock.in` |
| `/stock-out/` | Validated stock issuing | `stock.out` |
| `/alerts/` | Derived low/out-of-stock alerts | `alerts.view` |
| `/recommendations/` | Reorder review and decision history | `recommendations.view` |
| `/forecasting/` | Moving-average demand forecast | `forecasting.view` |
| `/reports/` | Report preview and CSV export | `reports.view` |
| `/transactions/` | Full transaction history | `transactions.view` |
| `/audit-logs/` | Audit trail | `audit.view` |
| `/demo-testing/` | 16-test demonstration center | `demo.view` |
| `/settings/` | Local workspace settings | `settings.view` |
| `/security/` | Security model and limitations | `security.view` |

## 5. Seed data (verified by test `seed-requirements`)

| SKU | Product | Stock | Reorder level | Target stock | Unit |
| --- | --- | ---: | ---: | ---: | --- |
| `BP-001` | Bond Paper | **20** | **50** | **100** | ream |
| `PEN-001` | Ballpen | **150** | **30** | **200** | piece |
| `USB-001` | USB Flash Drive | **8** | **20** | **50** | piece |
| `NB-001` | Notebook | 80 | 40 | 150 | piece |
| `STP-001` | Stapler | 0 | 10 | 40 | piece |
| `MKR-001` | Whiteboard Marker | 60 | 25 | 100 | piece |
| `TON-001` | Printer Toner | 12 | 15 | 30 | cartridge |

Seeded automation state:

- **4 active alerts:** Bond Paper (low), USB Flash Drive (low), Stapler (out), Printer Toner (low)
- **4 pending recommendations:** Bond Paper 80, USB Flash Drive 42, Stapler 40, Printer Toner 18
- **30 days** of consistent historical stock movements ending at each product's seeded balance

## 6. Core rules

```text
Status:        stock <= 0                 -> Out of Stock
               stock <= reorderLevel       -> Low Stock
               otherwise                   -> Sufficient Stock

Reorder qty:   Max(targetStock - stock, 0)

Forecast:      total stock-out units in window / periodDays = average daily demand
               average daily demand * horizonDays          = projected demand
               current stock / average daily demand        = days of coverage
```

- Alerts are **derived** from the current balance and reorder level; they resolve automatically when stock rises above the reorder level.
- Recommendations are **reconciled** after every stock movement. Pending recommendations are created, updated, or superseded by rule.
- **Approving or rejecting a recommendation never changes stock.** A separate stock-in is required when a delivery arrives.
- Stock can only change through a validated stock-in or stock-out transaction (positive whole numbers; stock-out cannot exceed available stock).

## 7. Verification status (3 November 2026)

| Verification | Result |
| --- | --- |
| `npm run build` | ✅ Success — static export in `out/` |
| Automated demonstration tests (16) | ✅ **16 passed, 0 failed, 0 not run; 90/90 checks** |
| Supplemental headless-browser QA | ✅ **33/33 checks passed** (login, roles, chatbot EN/TL/Bisaya, walkthrough, approval, stock-in, alert resolution, demo reset) |

The 16 automated tests are shipped inside the app at **Demo & Testing Center** (`/demo-testing/`). They run on isolated fixtures and never read or write live inventory. Full case-by-case results are in [docs/TEST_CASES.md](docs/TEST_CASES.md).

## 8. Documentation

| Document | Contents |
| --- | --- |
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Problem, objectives, users, scope, deliverables |
| [docs/SYSTEM_REQUIREMENTS.md](docs/SYSTEM_REQUIREMENTS.md) | Functional/non-functional requirements and acceptance criteria |
| [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | Layers, folders, state model, data flow, module map |
| [docs/AUTOMATION_WORKFLOW.md](docs/AUTOMATION_WORKFLOW.md) | Rules, reconciliation, forecasting, worked examples |
| [docs/SECURITY_LIMITATIONS.md](docs/SECURITY_LIMITATIONS.md) | Permission matrix, enforcement points, honest limits |
| [docs/TEST_CASES.md](docs/TEST_CASES.md) | All 16 tests with inputs, expectations, actual results |
| [docs/FIVE_REPORTER_DEMO_SCRIPT.md](docs/FIVE_REPORTER_DEMO_SCRIPT.md) | Five-presenter script in English and Bisaya |
| [docs/REVISION_PLAN.md](docs/REVISION_PLAN.md) | Version history, fixes, roadmap, risks |
| [docs/CHATBOT_DOCUMENTATION.md](docs/CHATBOT_DOCUMENTATION.md) | Assistant architecture, intents, safety, extension guide |
| [docs/USER_MANUAL.md](docs/USER_MANUAL.md) | Step-by-step operating guide and troubleshooting |

## 9. Project structure

```text
app/                    App Router pages (login, workspace, testing, security)
components/             UI kit, layout, inventory, suppliers, charts, chatbot, walkthrough
context/                AppProvider (state), ChatbotProvider, WalkthroughProvider
data/                   Hardcoded demo accounts, products, suppliers
hooks/                  useAuth, useInventory, useChatbot, useWalkthrough
lib/                    Pure rules, seed, storage, reports, forecasting, testing
lib/chatbot/            Language detection, intents, knowledge base, responses, tours
docs/                   Defense and operating documentation
out/                    Generated static export (after npm run build)
```

## 10. Key limitations

- No backend, database, server session, OAuth, or password hashing.
- Role checks ship to the browser and can be bypassed by a technical user.
- All data is per-browser `localStorage`; there is no synchronization, backup, or recovery.
- The assistant is a local rule engine with keyword/phrase matching in English, Tagalog, and Cebuano — not a translation or language model. It cannot change inventory or make decisions.
- Forecasting is transparent arithmetic (moving average), not machine learning, and returns “insufficient history” when there are no stock-outs in the window.
- CSV export is generated locally; there is no scheduled report or email delivery.

## 11. Rubric mapping (typical SA101 prefinal criteria)

| Criterion | Where to demonstrate |
| --- | --- |
| Working system / core functionality | Dashboard → Products → Stock-In/Out → Alerts → Recommendations |
| Automation | Low-stock rule, derived alerts, recommendation reconciliation, automatic resolution |
| AI / assistant component | Chatbot in English, Tagalog, Cebuano; live state answers; navigation and tours; safety refusals |
| Data management | Seed data, transaction history, audit trail, CSV export, localStorage persistence |
| Validation and negative paths | Invalid quantities, over-issue, duplicate SKU, supplier delete guard |
| Security / roles | Four accounts, centralized permission matrix, route guards, chatbot enforcement, `/security/` |
| Testing | 16 in-app tests (90 checks), isolated fixtures, honest “Not run” state, admin-only reset |
| UX and guidance | 15 guided walkthroughs with real `data-tour` targets, responsive layout, toasts |
| Documentation | This README plus all ten documents in `docs/` |
| Defensibility | Formula-first explanations, visible limitations, no fabricated accuracy claims |

---

**Academic note:** StockSense AI is submitted as an interactive prototype. It must not be used to manage real inventory or real personal data. See [docs/SECURITY_LIMITATIONS.md](docs/SECURITY_LIMITATIONS.md) before demonstrating or extending it.
#   S t o c k S e n s e A i  
 