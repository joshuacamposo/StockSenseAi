# StockSense AI — Assistant Documentation

**Component:** StockSense AI Assistant
**Version:** 1.0.0 · **Engine version:** 1.0.0
**Type:** Deterministic, offline, rule-based assistant
**Languages:** English (`en`), Filipino/Tagalog (`tl`), Cebuano/Bisaya (`ceb`)

> **Positioning:** this is **not** a language model, not a translation model, and not an external AI service. It is a local intent classifier, a product resolver, and localized response templates filled with live values from the shared inventory state. It has **no ability to modify data**.

---

## 1. What it can do

| Capability | Example |
| --- | --- |
| Answer product questions from live state | “How many Bond Paper are left?” → 20 reams |
| Explain status with the exact rule | “Why is Bond Paper low?” → 20 ≤ 50 |
| Explain reorder and target stock | “What is its target stock?” → 100 |
| Explain the reorder recommendation | “What should we order?” → 80 units |
| Show price, supplier, and full details | “Who supplies USB Flash Drive?” |
| List low stock, out of stock, and pending recommendations | “Show low-stock items” |
| Summarize inventory | “Inventory summary” |
| Explain the forecast for a product | “Forecast Ballpen” |
| Explain system concepts | SKU, reorder level, approval, reports, audit, roles, limitations |
| Navigate to permitted pages | “Open the Alerts page” |
| Start permitted walkthroughs | “Start the stock-in walkthrough” |
| Keep product context for follow-ups | “What is its reorder level?” |
| Answer in three languages and switch explicitly | “Switch to Bisaya” |
| Refuse unsafe requests and offer the safe path | “Add 50 stock now” → refused + stock-in tour |
| Clear the conversation | “Clear chat” / trash button |
| Persist locally | Reload keeps the conversation |

It cannot create, edit, delete, approve, reject, or move inventory. Those are deliberate constraints, not missing features.

---

## 2. File map

| File | Responsibility |
| --- | --- |
| `lib/chatbot/text.js` | Normalization, tokenization, phrase matching, regex escaping |
| `lib/chatbot/languageDictionary.js` | Language markers, explicit language requests, UI text, status words, response copy |
| `lib/chatbot/intentRecognizer.js` | Safety/tour/navigation/explanation/product intent classification |
| `lib/chatbot/productResolver.js` | SKU/name/alias scoring, ambiguity, suggestions |
| `lib/chatbot/knowledgeBase.js` | Concept explanations and topic routing |
| `lib/chatbot/kbTranslations.js` | Tagalog/Cebuano knowledge-base copy |
| `lib/chatbot/navigationHandler.js` | 14 navigable pages, aliases, permission metadata |
| `lib/chatbot/walkthroughConfig.js` | 15 tours, steps, selectors, permissions, keywords |
| `lib/chatbot/responseEngine.js` | Response composition, live data, actions, quick replies, safety copy |
| `context/ChatbotContext.js` | React state, persistence, typing delay, action execution |
| `components/chatbot/ChatbotWidget.jsx` | Floating launcher |
| `components/chatbot/ChatbotPanel.jsx` | Conversation UI, language buttons, quick replies, action buttons |

The engine has **no React dependency**. `respond()` can be imported in Node and tested directly, which is how the chatbot tests run.

---

## 3. Request lifecycle

```text
User types a message
   │
   ├─ ChatbotContext.sendMessage(rawText)
   │     ├─ trims; ignores empty; blocks while typing
   │     ├─ appends the user message
   │     ├─ sets typing = true
   │     └─ calls respond({ text, state, user, language, lastProductId })
   │
   ├─ respond()
   │     ├─ classifyIntent(text, { products, lastProductId })
   │     │     ├─ normalize text
   │     │     ├─ detect language markers + explicit language
   │     │     ├─ greeting / thanks / clear / empty
   │     │     ├─ navigation (wins over mutation words)
   │     │     ├─ walkthrough request
   │     │     ├─ mutation request → safety_action
   │     │     ├─ explanation topics → explain_*
   │     │     ├─ product resolution → product_*
   │     │     └─ lists / summary / forecast
   │     ├─ choose language (current, detected, or explicit)
   │     ├─ resolve product (explicit or lastProductId)
   │     ├─ fill localized template from live `state`
   │     ├─ permission-check navigation and tour actions
   │     └─ return { ok, language, text, quickReplies, action, intent, lastProductId, meta }
   │
   └─ ChatbotContext (after a 420 ms typing delay)
         ├─ updates language if the answer used another language
         ├─ appends the assistant message with action and quick replies
         ├─ updates lastProductId when a product was resolved
         ├─ handles clear_chat by resetting to the welcome message
         └─ persists to localStorage
```

A failed engine call is caught. The user sees: “The local assistant hit an unexpected problem. No inventory data was changed…” — and the app keeps working.

---

## 4. Intent catalog

The classifier can return the following intents. `INTENT_LABELS` in `intentRecognizer.js` maps them to readable names for diagnostics.

### Conversation and control

| Intent | Trigger examples | Behaviour |
| --- | --- | --- |
| `greeting` | “hello”, “hi”, “good morning” | Greets; adds the user’s role if signed in |
| `thanks` | “thanks”, “thank you” | Short acknowledgement |
| `help` | “help”, “what can you do” | Capabilities + suggested questions + dashboard action |
| `language` | “switch to Bisaya”, “Tagalog please” | Confirms and changes language |
| `clear_chat` | “clear chat”, “start over” | Resets conversation and product context |
| `empty` | whitespace only | Asks which product, lists active names |
| `unknown` | unmatched text | Helpful fallback + product suggestions if close |

### Navigation and guidance

| Intent | Trigger examples | Behaviour |
| --- | --- | --- |
| `navigate` | “open alerts”, “go to reports” | Permission-checked page action |
| `tour` | “start the stock-in walkthrough” | Permission-checked walkthrough action |
| `tour_list` | “show me the walkthroughs” | Lists up to 8 tours the role can start |
| `safety_action` | “add 50 stock now”, “approve it” | Refusal + safe action (tour or page) |

### Product answers

| Intent | Trigger examples | Data used |
| --- | --- | --- |
| `product_stock` | “how many Bond Paper are left” | Stock, status, reorder, target, pending recommendation |
| `product_status` | “is USB low?” | Status + rule explanation |
| `product_details` | “tell me about BP-001” | Category, status, stock, levels, price, supplier |
| `product_price` | “how much is Ballpen” | Unit price, stock value |
| `product_supplier` | “who supplies toner” | Supplier contact details |
| `product_reorder_level` | “what is its reorder level” | Reorder level + status |
| `product_target` | “target stock of Bond Paper” | Target + formula |
| `product_recommendation` | “what should we order for USB” | Pending recommendation or rule calculation |
| `forecast` | “forecast Ballpen” | Moving-average forecast + forecasting page action |
| `product_lookup` | a bare product name | Product summary |
| `product_ambiguous` | a name matching multiple products | Asks for a SKU or full name |
| `product_unknown` / `unknown` | unknown product | Suggests close matches |

### Lists and summary

| Intent | Trigger examples | Behaviour |
| --- | --- | --- |
| `list_low_stock` | “show low-stock items” | Lists active products at/below reorder level |
| `list_out_of_stock` | “what is out of stock” | Lists active products at zero |
| `list_recommendations` | “pending reorders” | Lists pending recommendations |
| `inventory_summary` | “inventory summary” | Products, units, value, low/out counts, pending, health % |

### Explanations (`explain_*`)

| Intent | Topic |
| --- | --- |
| `explain_about` | What StockSense AI is |
| `explain_alerts` | How alerts are derived |
| `explain_approval` | Approval vs delivery |
| `explain_audit` | Audit trail |
| `explain_demo` | Demo/testing center |
| `explain_forecast` | Moving-average forecasting |
| `explain_inventory` | Inventory concepts |
| `explain_limitations` | Prototype limits |
| `explain_low_stock` | Low-stock rule |
| `explain_navigation` | Where pages live |
| `explain_product_registration` | Adding products |
| `explain_reorder` | Reorder recommendations |
| `explain_reorder_level` | Reorder level |
| `explain_reports` | Reports and CSV |
| `explain_roles` | Permission matrix |
| `explain_sku` | SKU meaning and uniqueness |
| `explain_stock_in` | Receiving stock |
| `explain_stock_out` | Issuing stock |
| `explain_suppliers` | Supplier directory |
| `explain_target_stock` | Target stock |
| `explain_transactions` | Transaction history |

Explanation answers come from `knowledgeBase.js` and are localized where a translation exists; otherwise the English answer is returned with the correct page action.

---

## 5. Language handling

### Supported languages

| Code | Label | UI button |
| --- | --- | --- |
| `en` | English | EN |
| `tl` | Filipino/Tagalog | TL |
| `ceb` | Cebuano/Bisaya | CEB |

### Detection

- `normalizeText` lowercases, trims, and collapses punctuation/whitespace.
- `detectLanguageWithScore` counts **word-boundary language markers**.
- Tagalog markers include *ilan, paano, magkano, ano, saan, natitira, kulang, gusto, pwede, rekomendasyon, presyo, imbentaryo, mga, ang, ng*.
- Cebuano markers include *pila, unsaon, unsa, asa, ngano, nahabilin, kulang, gusto, pwede, tabangi, palihug, karon, among, imong*.
- If no marker is found, the current conversation language is kept.
- An explicit request (“switch to English”, “sa Bisaya”, “Tagalog please”) overrides detection.

### Localization coverage

- Response templates, status labels, units, safety refusals, navigation notices, tour notices, and quick replies exist in all three languages.
- The knowledge base has translated entries for the main topics; some concepts deliberately fall back to English rather than risk a poor translation.
- **The rest of the application UI is English.** Only the assistant is multilingual.

### Honest limitation

This is keyword/phrase matching, not natural-language understanding. Unusual word order, heavy code-switching, or unrelated slang can produce an `unknown` or the wrong intent. The UI offers suggested questions to keep the demonstration reliable.

---

## 6. Product resolution

`resolveProduct(rawText, products)` scores every product:

| Match | Score |
| --- | ---: |
| Exact alias match | 120 |
| Multi-word alias contained in the query | 90 + alias length (max 30) |
| Single-word alias with word boundary | 85 + alias length (max 20) |
| Exact name token | 70 |
| Singular/plural name token | 62 |

Then:

- The highest score wins if it is clearly above the next score.
- A close tie returns **ambiguous** with the matching names and SKUs.
- No match returns **unknown** with up to three suggestions from token-prefix similarity.
- SKU variants are normalized: `BP-001`, `bp 001`, and `bp-001` all resolve.

### Aliases

Products carry an `aliases` array. Examples:

- Bond Paper: *bond paper, bond papers, bondpaper, papel, a4 paper, paper*
- Ballpen: *ballpen, ballpens, ball pen, ball pens, bolpen, pen, pens*
- USB Flash Drive: *usb, flash drive, thumb drive, usb drive*
- Notebook: *notebook, kwaderno, notebook paper*
- Stapler: *stapler, stapler machine, pang-staple*
- Whiteboard Marker: *marker, whiteboard marker, board marker, pentel pen*
- Printer Toner: *toner, printer toner, ink, cartridge*

Add aliases in `data/demoProducts.js` (or in the product form) to improve recall.

---

## 7. Context and conversation state

| State | Stored where | Lifetime |
| --- | --- | --- |
| `language` | Chat context + `stocksense-ai:chat:v1` | Until changed or storage cleared |
| `messages` | Chat context + localStorage | Until cleared |
| `lastProductId` | Chat context + localStorage | Until clear or a new product is resolved |
| Current inventory | Shared app store (`stocksense-ai:state:v1`) | Until reset/storage clear |

### Follow-up behaviour

After a product answer, `lastProductId` is set. The next question can omit the product name:

```text
You:  How many Bond Paper are left?
Bot:  Bond Paper (BP-001) currently has 20 reams on hand — Low Stock…
You:  What is its reorder level?
Bot:  The reorder level for Bond Paper is 50…
```

If the follow-up resolves a different product, the context switches to that product. Ambiguous and unknown product results do **not** overwrite the last valid product.

### Persistence details

- Key: `stocksense-ai:chat:v1`
- Stored shape: `{ language, messages, lastProductId }`
- Messages are validated on read; malformed entries are dropped.
- The conversation survives reloads and sign-outs within the same browser profile.
- **Clear conversation** resets to the welcome message and clears `lastProductId`; it keeps the current language.
- Clearing site data removes the conversation.

---

## 8. Navigation and permissions

`navigationHandler.js` defines **14 pages**: dashboard, products, suppliers, stock-in, stock-out, alerts, recommendations, forecasting, reports, transactions, audit logs, demo/testing, settings, and security.

Every page has:

```js
{ key, label, href, permission, aliases }
```

`navigateAction()` calls `canAccessPage(user, page.key)`, which uses the **same centralized permission matrix** as the sidebar and route guards.

| Situation | Behaviour |
| --- | --- |
| Role can access the page | Message + “Open …” action button |
| Role cannot access the page | Refusal naming the pages the role *can* access; **no action** |
| No page resolved | Fallback asking for clarification |
| User not signed in | No permitted pages; actions are withheld |

Example: a Viewer asking to open Settings is refused, because `settings.view` is Administrator-only. The assistant does not navigate and does not leak the page content.

---

## 9. Walkthrough integration

The assistant and the UI share `startTour()` from `WalkthroughContext`. When the assistant starts a tour:

1. It checks the tour’s permission against the current role.
2. It sets the active tour and step 0.
3. If the tour belongs to another route, it navigates and marks the route as pending.
4. The overlay waits for the destination, finds the `data-tour` selector, scrolls it into view, and highlights it.
5. If the user leaves the tour’s page, the tour ends after a short grace period.

### The 15 tours

| ID | Title | Route | Permission | Steps |
| --- | --- | --- | --- | ---: |
| `dashboard-overview` | Dashboard Overview | `/dashboard` | `dashboard.view` | 4 |
| `inventory-overview` | Inventory Overview | `/products` | `products.view` | 4 |
| `add-product` | Add a New Product | `/products` | `products.create` | 7 |
| `edit-product` | Edit Product Details | `/products` | `products.edit` | 4 |
| `stock-in` | Record a Stock-In | `/stock-in` | `stock.in` | 6 |
| `stock-out` | Record a Stock-Out | `/stock-out` | `stock.out` | 5 |
| `low-stock-alerts` | Low-Stock Alerts | `/alerts` | `alerts.view` | 2 |
| `reorder-recommendations` | Reorder Recommendations | `/recommendations` | `recommendations.view` | 2 |
| `approve-reorder` | Approve a Reorder Recommendation | `/recommendations` | `recommendations.decide` | 4 |
| `demand-forecasting` | Demand Forecasting | `/forecasting` | `forecasting.view` | 3 |
| `suppliers` | Supplier Directory | `/suppliers` | `suppliers.view` | 2 |
| `reports-export` | Reports and CSV Export | `/reports` | `reports.view` | 3 |
| `transactions` | Transaction History | `/transactions` | `transactions.view` | 2 |
| `chatbot-assistant` | Use the AI Assistant | any (no route) | — | 3 |
| `rbac-security` | Roles and Security Limits | `/security` | `security.view` | 2 |

**Total:** 53 steps. All selectors are real `data-tour` attributes in rendered components. The overlay reports a missing element instead of hanging.

---

## 10. Safety model

### No mutating tools

The assistant returns only two action types:

```js
{ type: 'navigate', href, label }
{ type: 'tour', tourId, label }
```

There is no `addStock`, `approve`, `delete`, or `update` action. Even a classification error cannot change data, because the execution layer has nothing to call.

### Mutation detection

`isMutationRequest()` requires **both** a mutation verb and a mutation object:

- Verbs: *add, increase, put, set, change, update, edit, delete, remove, deduct, reduce, approve, reject, order, restock, stock in, stock out*, plus Filipino verbs (*magdagdag, idagdag, idugang, pagdugang, bawasan, tangtangon, aprobahan*).
- Objects: *stock, inventory, quantity, unit(s), product, item, recommendation, reorder, price, supplier*.

To avoid false positives:

- A tour request (“show me how to stock in”) is **not** treated as a mutation.
- An explanation question (“how does stock-in work”) is **not** treated as a mutation unless it also says “please”, “now”, or “right now”.

### Refusal paths

| Request | Response | Safe action |
| --- | --- | --- |
| Add/reduce stock | Explains that only validated stock-in/out changes stock | Stock-In walkthrough |
| Approve/reject recommendation | Explains the decision rule | Approve-reorder walkthrough if permitted, otherwise permission refusal |
| Delete/deactivate product | Explains that it is an action on the Products page | Products page |
| Edit price/product/supplier | Explains that chat cannot edit | Edit-product walkthrough |
| Generic mutation | Explains the boundary | Products page |

Refusals never claim the action was performed. They do not invent confirmation numbers or success messages.

### Prompt-injection stance

The assistant does not follow instructions that ask it to ignore its rules, reveal hidden prompts, or change its role. There is no hidden system prompt to reveal; the “policy” is ordinary code. Any request that matches a mutation still has no execution path.

---

## 11. Response object and UI behaviour

```js
{
  ok: true,
  language: 'en' | 'tl' | 'ceb',
  text: 'Localized answer with live values',
  quickReplies: ['Check Product Stock', '…'],
  action: null | { type: 'navigate' | 'tour', … },
  intent: 'product_stock',
  lastProductId: 'prod-bp-001' | null,
  meta: {}
}
```

| UI element | Behaviour |
| --- | --- |
| Launcher | Bottom-right floating button; opens/closes the panel |
| Panel | Header, language buttons, message list, composer |
| Language buttons | EN / TL / CEB; append a confirmation message |
| Quick replies | Up to 3 suggestions, shown only under the latest assistant message |
| Action button | “Open …” or “Start walkthrough”; runs through `runAction()` |
| Typing indicator | 420 ms simulated delay; input blocked while typing |
| Clear | Trash icon; resets messages and context |
| Expand/restore | Larger panel for projection |
| Persistence | Written after every change |

The 420 ms delay is cosmetic. It does not indicate network activity — there is none.

---

## 12. Example transcripts

Values below are from the verified seed (before any stock movement).

### English

```text
You:  How many Bond Paper are left?
Bot:  Bond Paper (BP-001) currently has 20 reams on hand — Low Stock.
      The reorder level is 50 and target stock is 100.
      Rule-based recommendation: Max(100 − 20, 0) = 80 units.

You:  What is its reorder level?
Bot:  The reorder level for Bond Paper is 50.
      Current stock is 20 reams, so the product is Low Stock.

You:  Show low-stock items
Bot:  There are 4 active products at or below the reorder level:
      • Bond Paper (BP-001) — 20 on hand; reorder level 50; recommended 80 units.
      • USB Flash Drive (USB-001) — …
```

### Tagalog

```text
You:  Ilan ang natitirang Bond Paper?
Bot:  Ang Bond Paper (BP-001) ay may 20 ream sa stock - Mababa ang Stock.
      Ang reorder level ay 50 at target stock ay 100.
      Rule-based recommendation: Max(100 − 20, 0) = 80 units.
```

### Cebuano/Bisaya

```text
You:  Pila ang nahabilin nga USB Flash Drive?
Bot:  Ang USB Flash Drive (USB-001) naay 8 piece sa stock - Ubos ang Stock.
      Ang reorder level 20 ug target stock 50.
      Rule-based recommendation: Max(50 − 8, 0) = 42 units.
```

### Safety refusal

```text
You:  Add 50 stock to Bond Paper right now.
Bot:  I can't change inventory directly from chat. Stock balances only change
      through validated Stock-In or Stock-Out transactions…
      [Start walkthrough: Record a Stock-In]
```

### Permission refusal

```text
You (Viewer): Open Settings.
Bot:  Your current demo role does not have permission to open that page.
      The assistant cannot bypass the same role restrictions used across
      StockSense AI.
```

---

## 13. Extension guide

### Add a product alias

1. Edit `data/demoProducts.js` and add the alias to the product’s `aliases` array.
2. Keep aliases lowercase and specific. Avoid one-letter tokens.
3. Add a regression question to the chatbot tests if the alias is important.
4. Re-run the suite.

### Add a navigation target

1. Add an entry to `PAGES` in `navigationHandler.js` with `href`, `permission`, and aliases.
2. Confirm the route exists and is guarded in `lib/permissions.js`.
3. Test as each role. Unauthorized roles must receive a refusal, not a link.

### Add an intent

1. Add patterns to `intentRecognizer.js` (English + Filipino markers).
2. Add the intent label to `INTENT_LABELS`.
3. Add localized response copy in `responseEngine.js` for `en`, `tl`, and `ceb`.
4. Handle the intent in `respond()` using live state only.
5. Add at least one question per language to the test corpus.
6. Confirm the intent cannot bypass permissions or mutate data.

### Add a knowledge-base topic

1. Add an entry in `knowledgeBase.js` with a stable key and answer.
2. Add the translation in `kbTranslations.js`.
3. Add an `explain_<topic>` pattern group and route it.
4. Add the page action if the topic maps to a page.

### Add a walkthrough

1. Add the tour to `walkthroughConfig.js` with `id`, `title`, `route`, `permission`, `keywords`, and steps.
2. Add a `data-tour="…"` attribute to every target element.
3. Test start → next → previous → Escape → route leave.
4. Confirm the assistant can start it with a natural phrase.

### Add a test

1. Build a fixture with `createFixtureState()`.
2. Call `respond()` or a pure rule.
3. Assert both the answer and the fact that state did not change.
4. Add it to the test registry; keep the suite honest (no pre-marked results).

---

## 14. Testing and evidence

| Test | Checks | What it proves |
| --- | ---: | --- |
| `chatbot-shared-state` | 5 | Reads live state; follows a changed value; does not mutate |
| `chatbot-multilingual` | 8 | Tagalog and Cebuano language detection, product resolution, values, wording |
| `chatbot-safety` | 8 | Refuses add-stock and approval; state unchanged; staff permission |
| **Total** | **21** | — |

The browser QA pass added checks for:

- English stock lookup reading live state
- Product follow-up context
- Tagalog and Cebuano answers
- Switching back to English
- Refusing a direct stock mutation
- Refusing approval from chat
- Navigation to a permitted page
- Starting a walkthrough and closing it with Escape

All of these passed in the 33/33 browser run recorded in `TEST_CASES.md`.

---

## 15. Limitations

| Limitation | Consequence | Mitigation |
| --- | --- | --- |
| Keyword/phrase matching | Unusual phrasing may be missed | Suggested questions; aliases; clear fallback |
| No semantic embeddings | No true synonym understanding | Curated aliases and patterns |
| Mixed-language sentences | Language may be misdetected | Explicit EN/TL/CEB buttons |
| Large catalogs | Product scoring is linear | Fine for demo size; add indexing at scale |
| No dialogue memory beyond one product | Cannot track several products at once | Ask one product per turn |
| No streaming or generation | Answers are templates | Templates are deterministic and explainable |
| No external knowledge | Cannot answer general questions | Scope is the inventory domain |
| Chat history is local | Another browser has no history | By design; no backend |
| UI is English-first | Assistant is multilingual, UI is not | Full localization is future work |
| Simulated typing | May look like network latency | Label says rule-based/offline |

---

## 16. Defense talking points

> “The assistant is a **local rule engine**, not an LLM. It classifies intent, resolves a product by SKU or alias, fills a localized template from the shared state, and returns at most a navigation or walkthrough action.”

> “It **cannot change inventory**. The only actions it can return are `navigate` and `tour`. Requests to add stock, approve a recommendation, or edit a product are classified as safety actions and refused with the correct human workflow.”

> “It reads **the same state** as the dashboard. That is why the answer changed from 20 to 60 after the stock-in without any special synchronization.”

> “Language support is **phrase-based**, not a translation model. We cover the common defense questions in English, Tagalog, and Cebuano, and the user can switch explicitly.”

> “The assistant uses the **same permission matrix** as the sidebar and routes. A Viewer cannot use chat to open Settings.”

---

**Maintenance note:** if you change a product, permission, tour selector, or inventory rule, update the assistant copy and tests in the same change. The assistant must never drift from the shared state or the permission model.
