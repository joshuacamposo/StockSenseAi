# StockSense AI — User Manual

**Version:** 1.0.0 · **Last updated:** 3 November 2026
**Audience:** presenters, demonstrators, evaluators, and anyone operating the prototype

This manual explains how to install, sign in, use every page, ask the assistant, run the tests, and recover from common problems. It describes the system **as built**, including its limits.

---

## 1. What you need

| Item | Requirement |
| --- | --- |
| Operating system | Windows, macOS, or Linux |
| Node.js | 20 or newer (verified with 24.21.0) |
| npm | 10 or newer (verified with 11.19.0) |
| Browser | Current Chrome, Edge, Firefox, or Safari |
| Internet | Only for the initial `npm install` |
| Disk | The project plus `node_modules` |
| Server/database | **None** |

---

## 2. Install and start

Open a terminal in the project folder:

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

To stop the server, press `Ctrl + C` in the terminal.

### Build the static site

```bash
npm run build
```

The exported site is written to **`out/`**. Because the app uses `output: 'export'`, there is no Node server in production; `out/` can be served by any static file host. The development server is the supported way to demonstrate interactively.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build and export the static site to `out/` |
| `npm run export` | Alias for `npm run build` |

> If port 3000 is already in use, stop the other process or run `npm run dev -- --port 3001` and open that port instead.

---

## 3. Sign in

The app opens on `/login/`. You can:

- type an email and password, or
- click **Fill** on an account card, then **Sign in**.

| Role | Email | Password | Summary |
| --- | --- | --- | --- |
| Administrator | `admin@stocksense.demo` | `Admin123!` | Full access, settings, audit logs, demo reset |
| Business Owner | `owner@stocksense.demo` | `Owner123!` | Reorder decisions, forecasting, reports, stock |
| Inventory Staff | `staff@stocksense.demo` | `Staff123!` | Products, suppliers (view), stock-in/out, reports |
| Inventory Viewer | `viewer@stocksense.demo` | `Viewer123!` | Read-only dashboard, products, alerts, recommendations, reports |

**Passwords are public by design.** This is a classroom demonstration, not real authentication. Never reuse these credentials anywhere.

To sign out: click the **account menu** at the top-right → **Sign out**.

---

## 4. Interface map

```text
┌────────────────────────────────────────────────────────────────────┐
│ Sidebar                 Topbar                                     │
│  Overview               Business / page title  Date  Alerts  Menu  │
│   Dashboard                                                        │
│  Inventory             ┌─────────────────────────────────────────┐ │
│   Products             │                                         │ │
│   Suppliers            │   Page content                          │ │
│   Stock-In             │   (cards, tables, forms, charts)        │ │
│   Stock-Out            │                                         │ │
│  Automation            │                                         │ │
│   Alerts               └─────────────────────────────────────────┘ │
│   Reorder Recommendations                                          │
│   Forecasting          Assistant button (bottom-right)             │
│  Insights                                                          │
│   Reports                                                          │
│   Transactions                                                     │
│   Audit Logs                                                       │
│  System                                                            │
│   Demo / Testing                                                   │
│   Security & Limits                                                │
│   Settings                                                         │
└────────────────────────────────────────────────────────────────────┘
```

| Element | Purpose |
| --- | --- |
| Sidebar | Navigation, filtered by role; shows alert and pending-reorder badges |
| Topbar | Mobile menu, page context, notification bell, account menu |
| Alert bell | Quick view of active alerts; “View all alerts” |
| Account menu | Current role, security page link, sign out |
| Assistant button | Opens the rule-based assistant on any workspace page |
| Toasts | Success or error feedback after actions |
| Page header | Title, context, role badge, primary actions |

On mobile, the sidebar becomes a drawer opened by the **menu** button.

---

## 5. First 10 minutes (recommended path)

1. Sign in as **Administrator**.
2. Open **Demo & Testing Center** → **Reset demo data**. This restores the exact seed.
3. Return to **Dashboard**. Confirm:
   - Bond Paper 20 reams, Low Stock
   - Ballpen 150, Sufficient
   - USB Flash Drive 8, Low Stock
   - Four active alerts
4. Open **Products** and confirm the three required SKUs.
5. Open **Recommendations** and confirm four pending items: 80, 42, 40, 18.
6. Approve Bond Paper, then confirm stock is **still 20**.
7. Open **Stock-In**, receive **40** Bond Paper, confirm stock is **60** and the alert is gone.
8. Ask the assistant: “How many Bond Paper are left?” → **60**.
9. Open **Demo & Testing Center** → **Run all tests** → **16/16, 90/90 checks**.
10. Sign out and try the **Viewer** account to see the restrictions.

---

## 6. Page-by-page tasks

### 6.1 Dashboard

**What it shows:** total products, low/out counts, inventory value, units on hand, alerts, stock movement chart, recent transactions, and quick actions.

**To use it:**

1. Click **Dashboard** in the sidebar.
2. Read the stat cards. They are computed from the shared state, not typed in.
3. Use **Products**, **Record stock-in**, **Stock-out**, **Reorder recommendations**, or **Demand forecast** shortcuts if your role permits.
4. Click an alert to open the product or restock.

**Expected:** figures change immediately after a stock movement. If they do not, reload once.

---

### 6.2 Products

**What it shows:** SKU, name, category, stock, reorder level, target stock, status, supplier, and actions.

**Search and filter:**

- Type in the search box to match SKU, name, or category.
- Filter by **category** or **stock status** (including Deactivated).
- Clear filters to see everything.

#### Add a product

1. Click **Add product**.
2. Fill in:
   - **SKU** — unique, e.g. `NOTE-002` (normalized to uppercase)
   - **Product name**
   - **Category**
   - **Unit of measure**
   - **Unit price** — zero or positive
   - **Assigned supplier** — optional
   - **Reorder level** — whole number
   - **Target stock level** — whole number, must be greater than the reorder level
   - **Description** — optional
3. Click **Save**.
4. The new product starts at **stock 0**. Record a stock-in to add units.

**Errors you may see:** duplicate SKU (case-insensitive), empty required fields, target not greater than reorder level, negative price.

#### Edit a product

1. Click the pencil icon on the row.
2. Change the allowed fields.
3. Save.

Stock is **not** editable here. Use Stock-In or Stock-Out.

#### Deactivate or reactivate

1. Click the archive/rotate icon.
2. Confirm.

Deactivation hides the product from active lists and blocks stock movements, but **keeps history**. Reactivation restores it. Only Administrator and Owner can do this.

#### View details

Click the eye icon to see full details, status, pricing, supplier, and recent movement.

---

### 6.3 Suppliers

**What it shows:** supplier name, contact person, phone, email, address, notes, and the number of assigned products.

#### Add or edit a supplier

1. Click **Add supplier** or the edit icon.
2. Fill in **Supplier name**, **Contact person**, and **Phone** (required). Email is optional but must look valid if entered.
3. Add address and notes if useful.
4. Save.

#### Delete a supplier

1. Click the delete icon.
2. If the supplier is assigned to any product, deletion is **blocked** and the message lists the assignment count and SKUs.
3. Reassign those products to another supplier first, then delete.

Only Administrator and Owner can manage suppliers. Staff and Viewer can view if their role allows the page.

---

### 6.4 Stock-In

Use this when a delivery arrives.

1. Open **Stock-In**.
2. Select the product.
3. Enter a **positive whole number** quantity. Decimals, zero, negatives, and text are rejected.
4. Add optional remarks (delivery reference, supplier).
5. Check the preview: current stock, resulting stock, resulting status.
6. Click **Record stock-in**.
7. A success toast appears (“Stock-in recorded”).
8. Alerts and recommendations recalculate automatically.

**Notes:**

- Stock-in is the **only** way to increase stock.
- A product at or below its reorder level appears in the restock queue.
- Inactive products cannot receive stock.
- A transaction record and audit entry are written.

**Defense example:** Bond Paper 20 + 40 = 60. The alert resolves because 60 > 50.

---

### 6.5 Stock-Out

Use this when stock is issued, consumed, or transferred out.

1. Open **Stock-Out**.
2. Select the product.
3. Enter a positive whole number.
4. Add optional remarks (department, purpose).
5. Check the preview.
6. Click **Record stock-out**.

**Rules:**

- You cannot issue more than the available balance. The error states the available quantity (e.g. “available stock (20 units)”).
- A rejected stock-out writes no transaction and does not change stock.
- A valid stock-out may create a low-stock alert and a pending recommendation automatically.

**Defense example:** try to issue 21 Bond Paper when only 20 exist → rejected, stock remains 20.

---

### 6.6 Alerts

**What it shows:** active low and out-of-stock products, derived from the stock rule.

1. Open **Alerts**.
2. Filter by **Low stock** or **Out of stock**.
3. Click **Restock** to jump to Stock-In.

**Important:** alerts are not stored records. They cannot be “acknowledged” or manually resolved. They disappear when the balance rises **above** the reorder level.

- Stock 50 with reorder 50 = **Low** (inclusive boundary)
- Stock 60 with reorder 50 = **Sufficient**

---

### 6.7 Reorder Recommendations

**What it shows:** pending recommendations, decision statistics, and history.

**Formula:** `Max(target stock − current stock, 0)`.

#### Approve or reject

1. Open **Recommendations**.
2. Find a pending card.
3. Click **Approve** or **Reject**.
4. Add a note (optional but useful; a default is recorded if blank).
5. Confirm.

**Result:**

- Status becomes **Approved** or **Rejected**.
- Reviewer, role, note, and timestamp are recorded.
- **Stock does not change.** Approval is a purchasing decision, not a delivery.
- The alert remains if the product is still low.
- The record moves to history; it is immutable.

Only Administrator and Owner can decide. Staff and Viewer see disabled controls and an explanatory notice.

#### What “superseded” means

If a pending recommendation is no longer needed — stock became sufficient or the product was deactivated — the system marks it **superseded** with an explanation. It is closed automatically, not approved.

---

### 6.8 Forecasting

**What it shows:** a moving-average demand projection from actual stock-out transactions.

1. Open **Forecasting**.
2. Select a product.
3. Choose **Historical period**: last 14, 30, 60, or 90 days.
4. Choose **Forecast horizon**: next 7, 14, or 30 days.
5. Read:
   - Stock-out units in period
   - Average daily demand
   - Projected demand for the horizon
   - Days of coverage
   - Daily chart with a 3-day moving average

**Formula:**

```text
average daily demand = stock-out units in period / period days
projected demand     = average daily demand × horizon days
days of coverage     = current stock / average daily demand
```

**If there is no stock-out history**, the page states that a forecast cannot be generated. It does **not** invent a number.

**Seeded examples (30 days):**

| Product | Stock-out | Average/day | Coverage at seed |
| --- | ---: | ---: | ---: |
| Bond Paper | 80 | 2.67 | 7.5 days |
| Ballpen | 147 | 4.90 | 30.6 days |
| USB Flash Drive | 19 | 0.63 | 12.6 days |

Only Administrator and Owner can open Forecasting.

---

### 6.9 Reports

**What it shows:** five reports, with a preview and CSV export.

1. Open **Reports**.
2. Choose a tab:
   - **Inventory**
   - **Low stock**
   - **Stock-In**
   - **Stock-Out**
   - **Reorders**
3. Search within the report if needed.
4. Click **Export CSV**.

**Notes:**

- The CSV is generated **in the browser**. No server is contacted.
- Commas, quotes, and newlines are escaped.
- Exporting an empty report shows an error instead of downloading a blank file.
- CSV is for demonstration data only. Do not open untrusted exports in a spreadsheet without care.

---

### 6.10 Transactions

**What it shows:** every successful stock movement, newest first, with type, quantity, previous/updated balance, actor, remarks, and time.

- Search by product, SKU, user, or remark.
- Filter by **Stock-In** or **Stock-Out**.
- Read-only. Delete and edit are intentionally absent.

Rejected transactions never appear as successful records.

---

### 6.11 Audit Logs

Administrator only.

- Shows login/logout, product and supplier changes, stock movements, decisions, settings changes, and demo resets.
- Search by action, user, entity, or description.
- Filter by category.
- Capped at the most recent 500 events.

**Honest note:** the audit trail is local JSON and can be edited with developer tools. It is not tamper-evident.

---

### 6.12 Settings

Administrator only.

1. Open **Settings**.
2. Edit:
   - Business name
   - Currency symbol
   - Default forecast history (14/30/60/90)
   - Default forecast horizon (7/14/30)
   - Show demonstration notice
   - Prefer compact tables
   - Low-stock email alerts (**simulation only**)
3. Click **Save settings**.
4. Use **Reset form** to discard unsaved changes.

**No email is sent.** The toggle demonstrates where a notification integration would live.

---

### 6.13 Demo & Testing Center

**What it shows:** 16 automated tests, a summary, per-check details, and the admin reset.

#### Run one test

1. Open **Demo / Testing**.
2. Click **Run** on a test row.
3. Expand the row to see each check, pass state, and detail.

#### Run all tests

1. Click **Run all tests**.
2. Wait for the summary.
3. Expected on a clean install: **Executed 16/16**, **Passed 16**, **Failed 0**, **90/90 individual checks**.

#### Clear results

Click **Clear results**. Every row returns to **Not run**. Nothing is pre-marked PASS.

#### Reset demo data

Administrator only.

1. Click **Reset demo data**.
2. Confirm.
3. Products, transactions, recommendations, audit logs, settings, and test results are restored to the seed. The current session is preserved.

**Tests never touch live inventory.** They run on isolated fixtures built inside the runner.

---

### 6.14 Security & Limits

Open **Security & Limits** to see:

- The four roles
- The permission matrix
- Route guards
- Honest prototype limitations
- What is and is not protected

Use this page when a panel asks “is this secure?”

---

## 7. Using the assistant

### Open it

Click the floating assistant button at the bottom-right. It is available on every workspace page after sign-in.

### Ask a question

Type in the composer and press **Enter**. Use **Shift + Enter** for a new line (if supported by the browser). The assistant shows a typing indicator for about 420 ms, then answers.

### Suggested questions

The welcome screen and the latest answer show quick suggestions:

- Check Product Stock
- How to Add a Product
- Record Stock-In
- Record Stock-Out
- View Low-Stock Items
- Explain Reorder Recommendations
- Guide Me Through the System

Click one to send it.

### Languages

Use the **EN / TL / CEB** buttons in the panel header, or type:

- “Switch to English”
- “Tagalog please”
- “Sa Bisaya”

You can also ask directly in Tagalog or Cebuano:

| Language | Example | Expected |
| --- | --- | --- |
| English | “How many Bond Paper are left?” | 20 reams at seed |
| Tagalog | “Ilan ang natitirang Bond Paper?” | 20 ream |
| Cebuano | “Pila ang nahabilin nga USB Flash Drive?” | 8 piece |

### Follow-up questions

After a product answer, you can omit the product name:

```text
You: How many Bond Paper are left?
Bot: Bond Paper (BP-001) currently has 20 reams…
You: What is its reorder level?
Bot: The reorder level for Bond Paper is 50…
```

### Actions

Some answers include a button:

- **Open …** — navigates to a permitted page.
- **Start walkthrough** — opens a guided tour.

The assistant checks your role before showing or running an action. If you lack permission, it refuses and names what you *can* access.

### What it refuses

The assistant will refuse:

- adding, reducing, or setting stock
- approving or rejecting a recommendation
- deleting or deactivating a product
- editing prices or product details
- bypassing a role restriction

It offers the correct page or walkthrough instead. It cannot change data.

### Clear the conversation

Click the **trash** icon in the panel header. This resets the conversation and product context but keeps the current language.

### Tips for a reliable demo

1. Use the exact suggested questions or the script in `FIVE_REPORTER_DEMO_SCRIPT.md`.
2. Include the SKU when a name is ambiguous: “How many BP-001 are left?”
3. Ask about one product at a time.
4. Wait for the answer before sending the next message.
5. Use the language buttons rather than relying on detection if the room is noisy.
6. If an answer is wrong, rephrase; do not repeat the same wording.

---

## 8. Guided walkthroughs

There are **15 walkthroughs** with **53 steps**. They highlight real rendered elements using `data-tour` selectors.

### Start a tour

The supported entry point is the assistant:

```text
“Start the stock-in walkthrough.”
“Guide me through adding a product.”
“Show me the reorder recommendations.”
“Teach me the dashboard.”
```

The assistant navigates to the correct page, opens the overlay, and highlights the first target.

### Tour controls

| Control | Action |
| --- | --- |
| **Next** | Advance one step |
| **Back** | Return one step |
| **Skip / Close** | End the tour |
| **Escape** | End the tour |
| **→ / ←** | Next / previous step |

Some steps use **advanceOnClick**: click the highlighted control to continue.

### Available tours

Dashboard Overview · Inventory Overview · Add a New Product · Edit Product Details · Record a Stock-In · Record a Stock-Out · Low-Stock Alerts · Reorder Recommendations · Approve a Reorder Recommendation · Demand Forecasting · Supplier Directory · Reports and CSV Export · Transaction History · Use the AI Assistant · Roles and Security Limits.

Tours respect role permissions. A Viewer cannot start the stock-in tour.

### If a tour does not start

- Confirm you are signed in.
- Confirm your role has the tour’s permission.
- Make sure the page is fully loaded.
- Press Escape and ask again.
- Reload the page and retry.

---

## 9. Roles quick reference

| Task | Admin | Owner | Staff | Viewer |
| --- | :-: | :-: | :-: | :-: |
| View dashboard, products, alerts, recommendations, reports | ✓ | ✓ | ✓ | ✓ |
| Add/edit products | ✓ | ✓ | ✓ | — |
| Deactivate/reactivate products | ✓ | ✓ | — | — |
| View suppliers | ✓ | ✓ | ✓ | — |
| Manage suppliers | ✓ | ✓ | — | — |
| Stock-in / stock-out | ✓ | ✓ | ✓ | — |
| Approve/reject recommendations | ✓ | ✓ | — | — |
| Forecasting | ✓ | ✓ | — | — |
| Transaction history | ✓ | ✓ | ✓ | — |
| Audit logs | ✓ | — | — | — |
| Demo & Testing Center | ✓ | ✓ | ✓ | ✓ |
| Reset demo data | ✓ | — | — | — |
| Settings | ✓ | — | — | — |
| Security & Limits | ✓ | ✓ | ✓ | ✓ |

If a page is not permitted, the route shows **Access Denied** even if you type the URL directly.

---

## 10. Data, storage, and reset

| Question | Answer |
| --- | --- |
| Where is data stored? | Browser `localStorage` for this origin and profile |
| Inventory key | `stocksense-ai:state:v1` |
| Chat key | `stocksense-ai:chat:v1` |
| Is data sent anywhere? | No |
| Is data shared between browsers? | No |
| Is data shared between devices? | No |
| Does reload lose data? | No |
| Does sign-out lose data? | No |
| What clears data? | Admin reset, browser site-data clear, private browsing close |
| Is there a backup? | Only manual CSV reports; there is no full-state import |
| Can two tabs edit at once? | They can, but last write wins; there is no merge |

### Reset vs clear site data

| Action | Result |
| --- | --- |
| **Reset demo data** (Administrator) | Restores the seed, keeps you signed in, clears test results |
| **Clear site data** (browser settings) | Removes everything, including session and chat; next load re-seeds |

For a defense, always use **Reset demo data**, not “clear site data,” unless you intentionally want a fresh login.

---

## 11. Keyboard and accessibility

| Key | Where | Action |
| --- | --- | --- |
| `Tab` / `Shift + Tab` | Everywhere | Move focus |
| `Enter` | Forms | Submit |
| `Enter` | Assistant composer | Send message |
| `Shift + Enter` | Assistant composer | New line |
| `Escape` | Tour overlay | Close the tour |
| `→` / `←` | Tour overlay | Next / previous step |

The UI includes labels, `aria-label`s on icon buttons, visible focus styles, and text alternatives. It has **not** been through a formal accessibility audit; see `TEST_CASES.md`.

---

## 12. Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| `npm install` fails | Network, proxy, or Node version | Use Node 20+, check the connection, retry |
| `npm run dev` fails | Port in use or broken install | Stop the other process, or use `--port 3001`; reinstall |
| Blank page | Build/dev error or stale cache | Check the terminal; hard reload; restart `npm run dev` |
| Login rejected | Typo or wrong password | Click **Fill** on the account card; passwords are case-sensitive |
| Redirected to login repeatedly | Session cleared or storage blocked | Allow site storage; sign in again |
| Data looks different from the script | Previous demo actions | Administrator → Demo & Testing → **Reset demo data** |
| Alert does not disappear | Stock is still at/below the reorder level | Receive enough to go **above** the level (20 → 60) |
| Approval did not add stock | This is by design | Record a stock-in when the delivery arrives |
| Reorder quantity seems wrong | Formula uses target − current | Check both values; `Max(target − current, 0)` |
| Stock-out rejected | Quantity exceeds available | Read the available quantity in the error |
| Duplicate SKU rejected | SKUs are case-insensitive unique | Choose a different SKU |
| Cannot delete supplier | Supplier is assigned to products | Reassign the products first |
| Page says Access Denied | Role lacks permission | Switch to Admin/Owner, or use a permitted page |
| Assistant does not answer | Empty message, still typing, or engine error | Wait, type a full question, click Send |
| Assistant misunderstands | Keyword mismatch | Include the SKU or use a suggested question |
| Assistant answers in the wrong language | Detection ambiguity | Click EN/TL/CEB |
| Tour will not start | Not signed in, missing permission, or page still loading | Sign in, check role, reload, retry |
| Tour highlight missing | Target element is not rendered | Escape, put the page in the expected state, retry |
| CSV does not download | Empty report or download blocked | Add rows, allow downloads, retry |
| Tests not all passing | Live data drift is not the cause (tests use fixtures) | Clear results and re-run; read the check detail |
| Test results disappear | You clicked Clear or Reset | Run again |
| App feels slow | Dev compilation or many rows | Wait for the first compile; production build is faster |
| `localStorage` quota error | Browser storage full | Clear site data (loses demo data) or free space |
| Nothing persists after reload | Private mode or storage disabled | Use a normal window with storage allowed |

### Emergency recovery before a demo

1. Stop the dev server (`Ctrl + C`).
2. Start it again: `npm run dev`.
3. Sign in as Administrator.
4. **Demo & Testing Center** → **Reset demo data**.
5. Confirm Bond Paper 20, four alerts, four pending recommendations.
6. Run all tests once; confirm 16/16 and 90/90.
7. Clear results if you want the panel to see the “Not run” initial state.

---

## 13. FAQ

**Does it need internet?**
No, after `npm install`. There are no runtime API calls, fonts, analytics, or external AI services.

**Does it use a real AI model?**
No. The assistant is a deterministic rule engine with keyword/phrase matching, product resolution, and localized templates. It is described as “rule-based” in the UI.

**Can the assistant change stock?**
No. It only navigates and starts tours. Stock changes require validated Stock-In or Stock-Out transactions.

**Why doesn’t approval add stock?**
Because approval is a purchasing decision, not a delivery. Adding stock automatically would create phantom inventory.

**Why is stock 50 still Low when the reorder level is 50?**
The rule is inclusive: `stock <= reorderLevel` is Low. Receive above 50 to resolve the alert.

**Can I add my own products?**
Yes. New products start at 0 and need a stock-in. For a defense, reset afterward to restore the seed.

**Can I edit the seed?**
The seed lives in `data/` and `lib/seed.js`. Editing it changes the demonstration contract; if persisted data exists, reset or bump the storage version. Do not change it during defense week.

**Is my data private?**
It never leaves the browser. But anyone with access to the browser profile can read it. Do not enter real personal or business data.

**Can I export everything?**
Reports export CSV per report. There is no full-state backup/import in v1.0.

**Can two people use it together?**
Not with shared data. Each browser profile is independent.

**How do I clear the chat?**
Trash icon in the assistant header, or type “clear chat.”

**How do I reset the demo?**
Administrator → Demo & Testing Center → Reset demo data. This keeps you signed in.

**Where are the tests?**
`/demo-testing/`, available to all four roles. Reset is Administrator-only.

**Why 16 tests and 90 checks?**
Each test verifies several assertions. The count is fixed so results are comparable between runs.

**What is not covered by tests?**
React rendering, layout, accessibility, browser storage failures, visual regression, and forecast accuracy. See `TEST_CASES.md`.

---

## 14. Glossary

| Term | Meaning |
| --- | --- |
| **SKU** | Stock Keeping Unit — a unique product code, normalized to uppercase |
| **Reorder level** | The threshold at or below which a product is Low Stock |
| **Target stock** | The desired balance used in the reorder formula |
| **Low Stock** | `0 < stock <= reorderLevel` |
| **Out of Stock** | `stock <= 0` |
| **Sufficient Stock** | `stock > reorderLevel` |
| **Alert** | A derived warning for a low/out-of-stock active product; not stored |
| **Recommendation** | A rule-generated proposal to reorder `Max(target − current, 0)` units |
| **Pending** | A recommendation awaiting a decision |
| **Approved / Rejected** | An immutable decision; stock is unchanged |
| **Superseded** | A pending recommendation closed automatically because it is no longer needed |
| **Stock-In** | A validated receipt that increases stock |
| **Stock-Out** | A validated issue that decreases stock |
| **Transaction** | A recorded stock movement with before/after balances |
| **Audit log** | A local record of state-changing actions |
| **Moving average** | Arithmetic average of stock-out demand over a window |
| **Rule-based** | Behaviour defined by explicit conditions, not a trained model |
| **RBAC** | Role-Based Access Control |
| **Static export** | A pre-built site with no server runtime |
| **`localStorage`** | Browser key/value storage for this origin |
| **Fixture** | An isolated, deterministic test state |

---

## 15. Where to go next

| Need | Document |
| --- | --- |
| Quick start, accounts, routes, rubric map | `README.md` |
| Problem, objectives, scope | `docs/PROJECT_OVERVIEW.md` |
| Requirements and acceptance criteria | `docs/SYSTEM_REQUIREMENTS.md` |
| Layers, data flow, module map | `docs/SYSTEM_ARCHITECTURE.md` |
| Rules, formulas, worked examples | `docs/AUTOMATION_WORKFLOW.md` |
| Permissions, threats, honest limits | `docs/SECURITY_LIMITATIONS.md` |
| All 16 tests and actual results | `docs/TEST_CASES.md` |
| Five-presenter English/Bisaya script | `docs/FIVE_REPORTER_DEMO_SCRIPT.md` |
| Version history, fixes, roadmap | `docs/REVISION_PLAN.md` |
| Assistant architecture and intents | `docs/CHATBOT_DOCUMENTATION.md` |

---

**Safety reminder:** this is an academic prototype. Do not use it for real inventory, real supplier contacts, or real personal data. See `docs/SECURITY_LIMITATIONS.md` before extending or demonstrating it outside the classroom.
