# StockSense AI — Security Model and Limitations

**Version:** 1.0.0 · **Date:** 3 November 2026
**Status:** Academic prototype — **not** a production security boundary.

This document is deliberately candid. The system demonstrates how role-based access control, centralized rules, and safe assistant behaviour *would* be structured; it does not claim production-grade security.

---

## 1. Security model in one paragraph

Authentication is a local comparison against four hardcoded demo accounts. The resulting user id is stored in `localStorage` and used by a **centralized permission matrix**. Routes, navigation, buttons, state-changing actions, and assistant actions all consult that matrix. Authorization checks are repeated inside the state layer (`AppProvider`) rather than relying on hidden buttons. There is no server, token, cookie, password hash, session expiry, or trusted authority — a technical user with DevTools can change anything.

---

## 2. Role and permission matrix

Roles: **A** = Administrator, **O** = Business Owner, **S** = Inventory Staff, **V** = Inventory Viewer.

| Permission | A | O | S | V | Used by |
| --- | :-: | :-: | :-: | :-: | --- |
| `dashboard.view` | ✓ | ✓ | ✓ | ✓ | Dashboard |
| `products.view` | ✓ | ✓ | ✓ | ✓ | Products page |
| `products.create` | ✓ | ✓ | ✓ | — | Add product |
| `products.edit` | ✓ | ✓ | ✓ | — | Edit product |
| `products.deactivate` | ✓ | ✓ | — | — | Deactivate / reactivate |
| `suppliers.view` | ✓ | ✓ | ✓ | — | Suppliers page |
| `suppliers.manage` | ✓ | ✓ | — | — | Add / edit / delete supplier |
| `stock.in` | ✓ | ✓ | ✓ | — | Stock-In |
| `stock.out` | ✓ | ✓ | ✓ | — | Stock-Out |
| `alerts.view` | ✓ | ✓ | ✓ | ✓ | Alerts |
| `recommendations.view` | ✓ | ✓ | ✓ | ✓ | Recommendations |
| `recommendations.decide` | ✓ | ✓ | — | — | Approve / reject |
| `forecasting.view` | ✓ | ✓ | — | — | Forecasting |
| `reports.view` | ✓ | ✓ | ✓ | ✓ | Reports + CSV |
| `transactions.view` | ✓ | ✓ | ✓ | — | Transaction history |
| `audit.view` | ✓ | — | — | — | Audit logs |
| `demo.view` | ✓ | ✓ | ✓ | ✓ | Demo & Testing Center |
| `demo.reset` | ✓ | — | — | — | Reset demo data |
| `settings.view` | ✓ | — | — | — | Settings |
| `settings.manage` | ✓ | — | — | — | Save settings |
| `security.view` | ✓ | ✓ | ✓ | ✓ | Security page |

### Route guards

| Route | Required permission |
| --- | --- |
| `/dashboard` | `dashboard.view` |
| `/products` | `products.view` |
| `/suppliers` | `suppliers.view` |
| `/stock-in` | `stock.in` |
| `/stock-out` | `stock.out` |
| `/alerts` | `alerts.view` |
| `/recommendations` | `recommendations.view` |
| `/forecasting` | `forecasting.view` |
| `/reports` | `reports.view` |
| `/transactions` | `transactions.view` |
| `/audit-logs` | `audit.view` |
| `/demo-testing` | `demo.view` |
| `/settings` | `settings.view` |
| `/security` | `security.view` |

`AppShell` resolves the current pathname through `getRoutePermission()` and renders `AccessDeniedState` when the role lacks the permission. Sidebar items are filtered with the same `canDo()` helper, so unauthorized pages are not advertised.

---

## 3. Enforcement points

| Layer | What it enforces | Example |
| --- | --- | --- |
| Navigation | Hidden items | Viewer never sees Stock-In |
| Route | Page replacement | Staff opening `/forecasting` sees Access Denied |
| UI controls | Disabled/hidden actions | Staff sees disabled reorder buttons |
| State actions | Hard denial + toast | `recordStockIn` checks `stock.in` again |
| Assistant | Same matrix | Viewer asking to open Settings is refused |
| Walkthroughs | Tour permission | Viewer cannot start the stock-in tour |
| Demo reset | Admin-only + confirmation | No reset button action for other roles |
| Settings | Admin-only | Non-admin cannot save |

The state layer uses `userRef.current` so an action invoked from a stale callback still checks the **current** user.

---

## 4. Demo authentication details

- Credentials are defined in `data/demoAccounts.js` and displayed on the login page by design.
- Passwords are compared as plain strings in the browser.
- No password hashing, salting, rate limiting, lockout, MFA, OAuth, or recovery.
- The session is `{ userId }` inside the local state; there is no signed token or expiry.
- Signing out clears the session and writes an audit entry.
- Anyone can set `session.userId` in DevTools to impersonate another demo role.

**This is intentional for a classroom demonstration.** It must never be reused for real accounts.

---

## 5. Data protection and privacy

| Item | Reality |
| --- | --- |
| Storage location | Browser `localStorage` for the current profile and origin |
| Server transmission | None |
| External services | None (no analytics, fonts, CDNs, or AI APIs at runtime) |
| Cross-device access | None; another browser sees separate data |
| Cross-user access | None enforced; anyone with the device/profile can read the data |
| Encryption | None at rest or in transit (there is no transit) |
| Backups | None; clearing site data destroys the demo |
| Seed data | Fictional names, demo phone numbers, demo emails |
| Chat history | Stored locally under `stocksense-ai:chat:v1` |
| Export | CSV is generated and downloaded entirely in the browser |

**Privacy guidance:** do not enter real supplier contacts, real prices, or personal data into the prototype. Use the seeded fictional records.

---

## 6. Known limitations and risks

### L1 — Client-side authorization can be bypassed

The permission matrix ships in the JavaScript bundle. A user can edit `localStorage`, call store functions from the console, or alter the role in memory. **Impact:** demonstration controls only, no real protection.

**Production fix:** enforce authorization on a server for every request; treat the client as untrusted; use short-lived sessions and server-side policy checks.

### L2 — Public hardcoded credentials

Credentials are visible in source and on the login screen. **Impact:** anyone can sign in as Administrator in the demo.

**Production fix:** real identity provider, password hashing (Argon2/bcrypt), MFA, lockout, secure reset, and secret management.

### L3 — No real session management

No signed cookie, token rotation, expiry, revocation, or CSRF protection. **Impact:** a session persists until sign-out or storage clear.

**Production fix:** HttpOnly/Secure/SameSite cookies, server session store, idle/absolute expiry, CSRF tokens for state-changing requests.

### L4 — Mutable, unsigned audit trail

Audit entries are ordinary JSON in `localStorage`. They can be edited or deleted with DevTools. **Impact:** the trail demonstrates intent and traceability but is not tamper-evident.

**Production fix:** append-only server log, write-once storage, hash chaining, external log sink, and access controls.

### L5 — No multi-user consistency

Two tabs or two people do not share state. Last write wins inside a single browser profile. **Impact:** no concurrency control, conflict detection, or real-time updates.

**Production fix:** database transactions, optimistic locking/version columns, server push, and conflict resolution.

### L6 — No backup or recovery

Clearing browser data, private browsing, or changing browsers removes everything. **Impact:** demo data is disposable by design.

**Production fix:** managed database backups, point-in-time recovery, export history, and documented retention.

### L7 — User-entered text and CSV

React escapes rendered text, so entered product/supplier names are not executed as HTML in the app. However, exported CSV cells are only quote-escaped, not sanitized against spreadsheet formula injection (`=`, `+`, `-`, `@`). **Impact:** opening a crafted export in a spreadsheet could evaluate a formula. Only demo data should be used.

**Production fix:** neutralize leading formula characters, validate input, and scan exports.

### L8 — Assistant is not a security control

The assistant refuses unsafe requests by pattern matching. It is not an LLM guardrail and can be confused by unusual phrasing. It never has mutating tools, which is the real protection.

**Production fix:** keep assistant capabilities read-only unless a separately authorized, audited action-confirmation flow exists.

### L9 — No dependency or supply-chain hardening

Dependencies are pinned but not audited in this prototype. There is no CSP, SRI, or automated vulnerability scanning.

**Production fix:** dependency scanning, lockfile review, CSP, security headers, and regular patching.

### L10 — Physical/shared-device exposure

Anyone with access to the unlocked browser profile can view all local inventory, contacts, and chat history.

**Production fix:** OS-level access control, device encryption, screen lock, and real user accounts.

---

## 7. Threat model (prototype scope)

| Threat | Likelihood | Impact | Mitigation in v1.0 | Residual risk |
| --- | --- | --- | --- | --- |
| Curious user opens another role via DevTools | High | Demo integrity | None (explicitly out of scope) | Accepted |
| Viewer tries restricted route | Medium | None | Route guard + Access Denied | Low |
| Staff clicks disabled approve | Medium | None | Disabled control + action denial | Low |
| Invalid stock input | High | Data integrity | Pure validation before mutation | Low |
| Over-issue stock | Medium | Negative stock | Rejected with available quantity | Low |
| Duplicate SKU | Medium | Ambiguous records | Case-insensitive uniqueness | Low |
| Delete assigned supplier | Medium | Broken references | Delete guard with assignment count | Low |
| Stale alert after restock | High | Wrong decisions | Alerts derived from stock | Low |
| Stock changes on approval | High | Phantom inventory | Decision helper never touches stock | Low |
| Malicious HTML in product name | Low | XSS | React text escaping | Low |
| CSV formula injection | Low | Spreadsheet risk | Quote escaping only | Medium |
| Lost data after clearing site data | Medium | Demo loss | Documented + reset to seed | Accepted |

---

## 8. What is genuinely well-controlled

- **One permission matrix** rather than scattered role checks.
- **Defense in depth for UX:** hidden nav + route guard + disabled controls + action denial.
- **Shared rules** mean the assistant and tests cannot drift from the UI.
- **No mutating assistant tools**, so prompt-like text cannot change inventory.
- **Derived alerts** eliminate a common inventory bug.
- **Approval isolation** prevents phantom stock.
- **Validation before mutation** for quantities, products, suppliers, and decisions.
- **Honest UI copy** stating that the controls are client-side.

---

## 9. Production readiness gap

To become production-ready, the system would need at minimum:

1. Server/API layer with database constraints and transactions.
2. Real authentication and server-side authorization on every endpoint.
3. Tenant isolation if multiple businesses are supported.
4. Immutable audit logging and monitoring/alerting.
5. Backups, recovery drills, and retention policy.
6. Input sanitization and secure CSV generation.
7. Security headers, CSP, dependency scanning, and penetration testing.
8. Privacy impact assessment and consent for personal data.
9. Accessibility and performance testing at scale.
10. Operational runbooks and incident response.

---

## 10. Defense talking points

Use these exact sentences if asked “is this secure?”:

> “No — and the system says so. Authentication and role checks are client-side demonstrations. The value of the prototype is the centralized permission model and the fact that every action, route, and assistant request uses the same matrix. In production, that matrix would be enforced on a server, with real sessions and an append-only audit log.”

> “The assistant cannot change inventory. It only has two actions: navigate and start a tour. Requests to add stock or approve a recommendation are classified as safety actions and refused with a pointer to the validated workflow.”

> “Approval records a purchasing decision. Stock only changes through a stock-in transaction, so the numbers cannot become phantom inventory.”
