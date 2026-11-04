# StockSense AI — System Architecture

**Version:** 1.0.0 · **Date:** 3 November 2026
**Shape:** Static Next.js App Router site, client-side state, `localStorage` persistence, no server.

---

## 1. Architectural goals

1. **One source of truth.** Products, transactions, recommendations, suppliers, settings, audit logs, and session data must never be duplicated between pages or between the UI and the assistant.
2. **Rules in one place.** Status, quantity validation, reorder calculation, and recommendation reconciliation are pure functions shared by the UI, the assistant, and the tests.
3. **Static by construction.** No API routes, no middleware auth, no database, no external calls.
4. **Explainable behaviour.** Every automated number can be traced to a formula and to local records.
5. **Demonstration honesty.** Security and AI limits are visible in the product and in the docs.

## 2. High-level diagram

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (single origin)                      │
│                                                                      │
│  Next.js App Router (static export, client components)               │
│                                                                      │
│   app/layout.js                                                      │
│     └── AppProvider  ───────────────┐                                │
│           └── WalkthroughProvider   │  shared snapshot + actions     │
│                └── ChatbotProvider  │                                │
│                     └── app/(app)/layout.js → AppShell              │
│                          ├── Sidebar / Topbar                        │
│                          ├── Page content (15 workspace routes)      │
│                          ├── WalkthroughOverlay                      │
│                          └── ChatbotWidget                           │
│                                                                      │
│  Pure rule modules                 Persistence                        │
│   inventoryRules.js                 lib/store.js                     │
│   recommendations.js   <──────────> module-level state               │
│   forecasting.js                    lib/storage.js                   │
│   supplierRules.js                  localStorage                     │
│   permissions.js                    ├─ stocksense-ai:state:v1        │
│   reportGenerator.js                └─ stocksense-ai:chat:v1         │
│                                                                      │
│  Assistant                          Tests                            │
│   intentRecognizer.js               lib/testing/fixtures.js          │
│   responseEngine.js                 lib/testing/testRunner.js        │
│   knowledgeBase.js                  app/(app)/demo-testing/page.js   │
│   languageDictionary.js / kbTranslations.js                          │
│   navigationHandler.js / walkthroughConfig.js                        │
└──────────────────────────────────────────────────────────────────────┘
        No network traffic. No server process. No external AI.
```

## 3. Layer responsibilities

| Layer | Files | Responsibility |
| --- | --- | --- |
| Routing / pages | `app/**` | Static routes, page composition, route-level UI |
| Shared state | `lib/store.js`, `context/AppProvider.js` | Initialize, persist, mutate, subscribe; expose permissions and derived data |
| Domain rules | `lib/inventoryRules.js`, `recommendations.js`, `forecasting.js`, `supplierRules.js`, `permissions.js` | Pure, testable business logic |
| Seed data | `data/*.js`, `lib/seed.js` | Deterministic demo catalog, suppliers, accounts, transactions, recommendations |
| Persistence | `lib/storage.js`, `lib/store.js` | Guarded JSON read/write with version normalization |
| UI system | `components/ui/index.jsx` | Buttons, inputs, cards, tables, badges, modals, stats, empty/denied states |
| Layout | `components/layout/*` | App shell, sidebar navigation, topbar, account menu, alert bell |
| Domain UI | `components/inventory/*`, `components/suppliers/*`, `components/charts/*` | Product forms, transaction form, supplier form, charts |
| Assistant | `lib/chatbot/*`, `context/ChatbotContext.js`, `components/chatbot/*` | Recognition, product resolution, localized responses, navigation, tours, safety, chat UI |
| Walkthroughs | `lib/chatbot/walkthroughConfig.js`, `context/WalkthroughContext.js`, `components/walkthrough/*` | 15 tours, overlay, step navigation, permission and route handling |
| Testing | `lib/testing/*`, `app/(app)/demo-testing/page.js` | 16 isolated tests, runner, results UI, admin reset |
| Reports | `lib/reportGenerator.js`, `app/(app)/reports/page.js` | Report builders, CSV escaping, local download |

## 4. State lifecycle

```text
1. Browser loads app/layout.js
2. AppProvider mounts → initStore()
3. initStore():
     a. readLocal('stocksense-ai:state:v1')
     b. normalizeState(parsed)
          - reject wrong version / missing products → createInitialState()
          - clamp numeric fields, validate session against demo accounts
     c. write normalized state back once
4. AppProvider subscribes to store changes; snapshot stored in React state
5. Any action calls setStore(updater)
6. setStore writes localStorage, emits to subscribers
7. React re-renders; derived alerts/stats recompute
8. Chatbot reads the same snapshot through AppProvider
```

### Why a module-level store?

- The assistant engine is a **pure function** that accepts `state`. It can be called from React or from Node tests without a browser.
- The app never has two copies of inventory (for example, page state versus chatbot state).
- `AppProvider` is a thin React adapter: subscriptions, derived selectors, permission-aware action wrappers.

### Store API

| Function | Purpose |
| --- | --- |
| `initStore()` | Load and normalize once; persist repaired state |
| `getStore()` | Read current state synchronously |
| `setStore(updater)` | Apply a functional update, persist, emit |
| `subscribeStore(listener)` | Subscribe to changes (used by `AppProvider`) |
| `resetStore(session)` | Restore seed state, optionally preserving the signed-in session |

## 5. Data model

```text
Account           id, name, email, password(demo), role, title, initials, color
Product           id, sku, name, category, unit, unitPrice, supplierId,
                  reorderLevel, targetStock, stock, active, aliases, description
Supplier          id, name, contactPerson, phone, email, address, notes
Transaction       id, productId, productName, sku, type(in|out), quantity,
                  previousStock, updatedStock, userId, userName, role,
                  remarks, timestamp, seeded?
Recommendation    id, productId, sku, productName, unit, currentStock,
                  reorderLevel, targetStock, recommendedQty, status
                  (pending|approved|rejected|superseded), source,
                  createdBy, createdAt, updatedAt, decidedAt, decidedBy,
                  decidedById, decisionNote, previousQuantity?, previousStock?
AuditEntry        id, action, target, description, userName, role, timestamp
Settings          businessName, currency, forecastPeriodDays,
                  forecastHorizonDays, lowStockEmailAlerts, demoBanner,
                  compactTables
Session           userId
Meta              seededAt, appVersion, environment
```

### Derived data (not stored)

| Derived value | Derivation |
| --- | --- |
| Product status | `getStatusForStock(stock, reorderLevel)` |
| Alerts | Active products whose status is `out` or `low`, one per product |
| Status counts | `stockStatusCounts(products)` |
| Pending recommendations | Recommendation records with `status === 'pending'` |
| Today’s movement totals | Transactions with today’s date key |
| Forecast | Computed on demand from product + transactions + windows |

Alerts are intentionally **not persisted**. This removes the classic bug where a stale alert remains after stock is replenished.

## 6. Route map

```text
/                       client redirect → /dashboard or /login
/login                  public demo sign-in
/(app)                  AppShell guard (requires a session)
  /dashboard            overview, stats, alerts, recent movement
  /products             catalog, add/edit/deactivate, details
  /suppliers            directory, add/edit/delete guard
  /stock-in             receive stock + recent stock-ins
  /stock-out            issue stock + recent stock-outs
  /alerts               derived active alerts
  /recommendations      pending decisions + history
  /forecasting          moving-average forecast and records
  /reports              5 report tabs + CSV export
  /transactions         full movement history
  /audit-logs           administrator audit trail
  /demo-testing         16 tests + reset
  /settings             local preferences
  /security             security model and limits
/not-found              static not-found page
```

`AppShell` checks `ready`, `user`, and `getRoutePermission(pathname)`. A missing permission renders `AccessDeniedState` instead of the page.

## 7. Action pipeline (state-changing example: stock-in)

```text
StockTransactionForm.handleSubmit
  → onSubmit({ productId, quantity, remarks })
  → AppProvider.recordStockIn(payload)
       1. actor = userRef.current
       2. can(actor, 'stock.in') ? continue : deny + toast
       3. product = getStore().products.find(...)
       4. plan = planStockMovement(product, 'in', quantity)
            - validates positive whole number
            - computes previousStock / updatedStock / new status
       5. build transaction record
       6. reconcileRecommendations(products, recommendations, now)
            - create / update / supersede pending records
       7. build audit entry
       8. setStore(...) → persist + emit
       9. return { ok, transaction }
  → form shows toast and clears quantity/remarks
  → subscribers re-render; alerts/stats/recommendations recompute
```

The same permission + rule checks apply to product, supplier, decision, settings, and reset actions. The UI never mutates the store directly.

## 8. Assistant architecture

```text
User text
  → text.normalizeText
  → intentRecognizer.recognize(...)
       ├─ explicit language / language markers
       ├─ safety patterns (change stock, approve, bypass)
       ├─ navigation and tour patterns
       ├─ concept questions → knowledge base
       └─ product questions → productResolver
  → responseEngine.respond({ text, state, user, language, lastProductId })
       ├─ localized copy (en / tl / ceb)
       ├─ fills live numbers from `state`
       ├─ permission-checks navigation and tour actions
       └─ returns { text, action, intent, lastProductId, quickReplies }
  → ChatbotContext
       ├─ persists conversation
       ├─ updates language
       ├─ runs navigation or startTour
       └─ renders message with optional action button
```

Key property: the assistant **cannot call store mutators**. Its only actions are `navigate` and `tour`. Any request to change stock or decide a recommendation is classified as `safety_action` and refused with a safe path.

## 9. Walkthrough architecture

- `walkthroughConfig.js` defines 15 tours: `id`, title, route, permission, keywords, and steps.
- Each step has a **real** `data-tour` selector, a title, and body text. Some steps use `advanceOnClick` for modal flows.
- `WalkthroughContext` owns `activeId`, `stepIndex`, `completedIds`, start/next/previous/end, and route cancellation.
- `WalkthroughOverlay` polls for the selector, scrolls it into view, draws a highlight and tooltip, and supports Escape and arrow keys.
- Starting a tour from the assistant uses the same `startTour` as the UI; it navigates first, waits for arrival, and does not cancel while navigation is in flight.

## 10. Persistence and build

| Concern | Decision |
| --- | --- |
| Render mode | Static export; all interactive pages are client components under client providers |
| URLs | Trailing slashes (`trailingSlash: true`) so exported folders resolve |
| Images | `unoptimized: true`; no `next/image` usage |
| Storage failures | Caught; app continues with in-memory state |
| Schema changes | `STORAGE_VERSION`; mismatched payloads reset to a clean seed |
| Data ownership | Per browser profile; no synchronization |
| Export | `npm run build` → `out/` |

## 11. Key design decisions and trade-offs

| Decision | Benefit | Trade-off |
| --- | --- | --- |
| Module-level store + React adapter | One dataset for pages and assistant; pure testable engine | No server sync; one tab’s writes can overwrite another’s |
| Derived alerts | No stale or duplicate alerts | Alerts cannot carry acknowledgement history |
| Pure recommendation reconciler | Deterministic, testable, history-preserving | Recomputed on every movement; no background job |
| Client-side permissions | Easy to demonstrate four roles | Not a security boundary |
| Rule-based assistant | Offline, deterministic, explainable, free | Limited paraphrase coverage; not generative |
| Moving-average forecast | Transparent arithmetic | Not seasonal/ML; needs stock-out history |
| Isolated test fixtures | Tests never damage live demo | Tests validate rules, not React rendering |

## 12. Extension points

- Add a product rule → `lib/inventoryRules.js` + a test in `testRunner.js`.
- Add a report → `lib/reportGenerator.js` + a tab in the reports page.
- Add an assistant intent → `intentRecognizer.js`, localized copies, handler in `responseEngine.js`.
- Add a tour → `walkthroughConfig.js`, ensure selectors exist, optionally a `data-tour` attribute.
- Replace persistence → implement a storage adapter and keep the same store API.
- Move to production → add a server, real auth, database constraints, and server-side authorization; see `SECURITY_LIMITATIONS.md`.
