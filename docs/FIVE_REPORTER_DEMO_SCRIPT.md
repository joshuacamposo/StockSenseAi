# StockSense AI — Five-Reporter Demo Script

**Defense run time:** about 18 minutes + Q&A
**Languages:** English and Bisaya (Cebuano) scripts for every presenter
**Verified baseline:** 3 November 2026 — build passes, **16/16 tests**, **90/90 checks**, **33/33 browser QA checks**

> Read the **Presenter rules** and **Verified facts** first. Every number in this script was produced by the actual seed and the actual test run. Do not improvise a different number.

---

## 1. Presenter rules

1. **One person drives the mouse.** The five reporters speak in order, but only the current reporter clicks.
2. **Say what the system is, and what it is not.** It is a rule-based academic prototype. It is not a trained AI model and not production-secure.
3. **Never say “the AI decided.”** Say “the rule computed” or “the assistant read the shared state.”
4. **If a number looks wrong, stop and reset.** Do not explain away an inconsistent screen.
5. **If a step fails, follow the recovery table** at the end. Never fake a result.

## 2. Pre-flight checklist (10 minutes before)

| Check | Command / action | Expected |
| --- | --- | --- |
| Dependencies installed | `npm install` | Completes without errors |
| App running | `npm run dev` | `http://localhost:3000` responds |
| Clean seed | Sign in as Administrator → **Demo & Testing Center** → **Reset demo data** | Toasts “Demonstration data reset…” |
| Seed values | Dashboard / Products | Bond Paper 20, Ballpen 150, USB 8 |
| Alerts | Sidebar or `/alerts` | **4 alerts** |
| Recommendations | `/recommendations` | **4 pending** |
| Browser | One window, one tab, 100% zoom | No other demo tabs open |
| Distractions | Notifications off, full screen | — |
| Backup plan | `docs/TEST_CASES.md` open on a second device | Results available if asked |

**Reset immediately before the presentation.** A previous rehearsal changes stock and test results. The reset restores the seed and keeps the Administrator signed in.

## 3. Verified facts (do not contradict)

| Fact | Value |
| --- | --- |
| Bond Paper seed | 20 stock / 50 reorder / 100 target / ream |
| Ballpen seed | 150 / 30 / 200 / piece |
| USB Flash Drive seed | 8 / 20 / 50 / piece |
| Seeded alerts | **4** — Bond Paper, USB Flash Drive, Stapler, Printer Toner |
| Seeded pending recommendations | **4** — Bond Paper 80, USB 42, Stapler 40, Toner 18 |
| Reorder formula | `Max(Target − Current, 0)` |
| Approving Bond Paper 80 | Status **Approved**, stock **stays 20** |
| Stock-in 40 after approval | Stock **60**, alert **resolved**, pending recommendation **closed** |
| Why 40, not 30 | 50 is still **Low** because the rule is inclusive (`stock <= reorder` = Low) |
| Bond Paper forecast at seed | 80 units / 30 days = 2.67/day, **7.5 days** coverage |
| Test result | **16/16 tests, 90/90 individual checks** |
| Browser QA | **33/33 checks** |

## 4. Cast and timing

| Reporter | Section | Time | Main screen |
| --- | --- | ---: | --- |
| 1 | Problem, objectives, scope | 3 min | Login / title |
| 2 | Living inventory and validation | 4 min | Dashboard → Products → Stock-Out |
| 3 | Automation and decision separation | 4 min | Recommendations → Forecasting → Stock-In |
| 4 | Assistant, walkthroughs, evidence | 4 min | Chatbot → Demo & Testing |
| 5 | Roles, limits, conclusion | 3 min | Role switching → Security & Limits |

---

# Reporter 1 — Problem, objectives, scope

### Screen setup

Stay on the login page. Do not sign in yet. The login page itself is part of the story because it shows the four demo roles.

### English script

> Good morning, everyone. We are **[Group Name]**, and today we present **StockSense AI**, an AI Inventory and Stock Management Automation System.
>
> Small offices and school units still track supplies in spreadsheets or notebooks. Four problems follow. First, **low stock is noticed too late**. Second, **reorder quantities are computed differently** by different people. Third, an **approved reorder is often mistaken for delivered stock**. Fourth, **knowledge stays with one person**.
>
> StockSense AI demonstrates a small automation layer that addresses those four problems. Our objectives are: one source of inventory truth, automatic low-stock detection, a transparent reorder formula, decisions that never silently change stock, and an assistant that explains the same live data in **English, Tagalog, and Bisaya**.
>
> This is a **static Next.js application**. There is no server, no database, and no external AI service. Everything runs in the browser, so we can demonstrate it even without internet.
>
> On this login screen you can see the four demonstration accounts. Each role sees a different system. **[Point to the account cards.]** Reporter 2 will now sign in as the Administrator and show the live inventory.

### Bisaya script

> Maayong buntag kaninyong tanan. Kami ang **[Ngalan sa Grupo]**, ug karon among ipresentar ang **StockSense AI**, usa ka AI Inventory and Stock Management Automation System.
>
> Ang gagmayng opisina ug eskwelahan naggamit pa og spreadsheet o notebook sa pagrekord sa mga supply. Tungod niini, upat ka problema ang mogawas. Una, **ulahi na nila mahibaw-an nga kulang na ang stock**. Ikaduha, **lain-lain ang pag-compute sa reorder quantity**. Ikatulo, ang **aprubadong reorder usahay sayop nga gihunahuna nga naabot na ang stock**. Ikaupat, **ang kahibalo naa lang sa usa ka tawo**.
>
> Ang StockSense AI nagpakita og gamay nga automation layer nga mosulbad niining upat ka problema. Ang among mga tumong: usa ra ka tinubdan sa tinuod nga inventory data, automatic nga pag-ila sa low stock, klaro nga reorder formula, desisyon nga dili mo-usab sa stock nga walay stock-in, ug assistant nga mo-explain sa parehas nga live data sa **English, Tagalog, ug Bisaya**.
>
> **Static Next.js application** kini. Wala kini server, wala database, ug wala external AI service. Tanan modagan sa browser, busa mapakita namo kini bisan walay internet.
>
> Niining login screen, makita ninyo ang upat ka demonstration accounts. Lain-lain ang makita sa matag role. **[Itudlo ang account cards.]** Si Reporter 2 ang mo-sign in isip Administrator ug mopakita sa buhing inventory.

### Handoff

> “Reporter 2, please show us the inventory.”

---

# Reporter 2 — Living inventory and validation

### Steps and exact targets

| # | Action | Expected on screen |
| --- | --- | --- |
| 1 | Click **Fill** on the Administrator card → **Sign in** | Redirect to `/dashboard/` |
| 2 | Point to the four stat cards and the attention list | Bond Paper low, USB low, Stapler out, Toner low |
| 3 | Open **Products** | Seven products, three required products visible |
| 4 | Point to BP-001 / PEN-001 / USB-001 rows | 20/50/100, 150/30/200, 8/20/50 |
| 5 | Open **Stock-Out** | Form with product, quantity, remarks, preview |
| 6 | Choose **Bond Paper**, enter **21**, submit | Rejected: cannot issue more than 20 available |
| 7 | Point to the preview or product page | Bond Paper still **20** |

> Do **not** submit a valid stock-out here. Reporter 3 needs the seed at 20 for the reorder story.

### English script

> Thank you. I am signed in as the **Administrator**. The dashboard is computed from one shared state — not from separate page data.
>
> On screen we have **four active alerts**: Bond Paper at **20 reams** against a reorder level of **50**; USB Flash Drive at **8** against **20**; Stapler at **0** against **10**; and Printer Toner at **12** against **15**.
>
> The three required products are exactly as specified: **BP-001 Bond Paper, 20 / 50 / 100**; **PEN-001 Ballpen, 150 / 30 / 200**; and **USB-001 USB Flash Drive, 8 / 20 / 50**.
>
> Notice that alerts are **not stored**. They are derived from the current stock and the reorder level. That means an alert cannot remain stale after a delivery — it disappears on the next render.
>
> **[Open Products.]** Every balance can only change through a validated stock-in or stock-out. Let me prove the guard. I will try to issue **21 reams** of Bond Paper even though only **20** exist.
>
> **[Submit 21.]** The system rejects it and states that only **20 units** are available. No transaction is written, and the balance stays at **20**. Validation happens before any mutation.

### Bisaya script

> Salamat. Naka-sign in ko isip **Administrator**. Ang dashboard gi-compute gikan sa usa ra ka shared state — dili gikan sa lain-laing page data.
>
> Sa screen, naa ang **upat ka active alerts**: Bond Paper, **20 ka ream** kontra 50 ka reorder level; USB Flash Drive, **8** kontra **20**; Stapler, **0** kontra **10**; ug Printer Toner, **12** kontra **15**.
>
> Ang tulo ka required products husto sa specification: **BP-001 Bond Paper, 20 / 50 / 100**; **PEN-001 Ballpen, 150 / 30 / 200**; ug **USB-001 USB Flash Drive, 8 / 20 / 50**.
>
> Matikdi nga ang alerts **wala gi-store**. Gi-derive kini gikan sa kasamtangang stock ug reorder level. Busa dili kini mahimong daan o stale human sa delivery — mawala kini sa sunod nga render.
>
> **[Ablihi ang Products.]** Ang matag balance mausab lamang pinaagi sa validated stock-in o stock-out. Pamatud-an nako ang guard. Sulayan nako pagpagawas og **21 ka ream** nga Bond Paper bisan **20** ra ang naa.
>
> **[I-submit ang 21.]** Gisalikway kini sa sistema ug gisulti nga **20 units** ra ang available. Wala transaction nga na-rekord, ug nagpabilin sa **20** ang balance. Ang validation mahitabo sa dili pa mausab ang data.

### Handoff

> “Reporter 3 will show what happens automatically after this.”

---

# Reporter 3 — Automation and decision separation

### Steps and exact targets

| # | Action | Expected on screen |
| --- | --- | --- |
| 1 | Open **Reorder Recommendations** | 4 pending: 80 / 42 / 40 / 18 |
| 2 | Point to the Bond Paper card and formula text | `Max(100 − 20, 0) = 80` |
| 3 | Open **Forecasting**, select Bond Paper | 80 units / 30 days, 2.67/day, 7.5 days |
| 4 | Return to **Recommendations** | 4 pending still there |
| 5 | Click **Approve** on Bond Paper, add a short note, confirm | Status **Approved** |
| 6 | Point to Bond Paper stock | **Still 20** |
| 7 | Open **Stock-In**, choose Bond Paper, quantity **40**, submit | Success toast; stock **60** |
| 8 | Open **Alerts** | Bond Paper alert is **gone** |
| 9 | Return to **Recommendations** | No pending Bond Paper; approved record remains in history |

### English script

> Reporter 3 will show the automation and the most important design rule in the system.
>
> On the Recommendations page there are **four pending items**. For Bond Paper the calculation is visible: **Max(100 − 20, 0) = 80**. USB Flash Drive is **42**, Stapler is **40**, and Printer Toner is **18**. These are generated by the same rule after every stock movement.
>
> **[Open Forecasting.]** The forecast is transparent arithmetic. Using seeded stock-out history, Bond Paper issued **80 units in 30 days** — **2.67 per day** — which gives **7.5 days of coverage** at the seeded balance of 20. This is a moving average, not machine learning. If there is no history, the system says so instead of inventing a number.
>
> **[Return to Recommendations and approve Bond Paper.]** I approve the 80-unit recommendation and add a note. The status becomes **Approved**, and the reviewer and timestamp are recorded.
>
> Now look carefully at the stock. It is **still 20**. **Approval is a purchasing decision, not a delivery.** The system deliberately refuses to create phantom inventory. Stock becomes real only when a validated stock-in is recorded.
>
> **[Open Stock-In and receive 40.]** I receive **40 reams**. Stock goes from **20 to 60**.
>
> Why 40 and not 30? Because the rule is inclusive: **50 is still Low Stock** when the reorder level is 50. To clear the alert, we must go **above** 50. That is why the receipt is 40.
>
> **[Open Alerts.]** The Bond Paper alert is gone automatically — we did not click “resolve.” **[Return to Recommendations.]** The pending recommendation has closed itself, while the approved record remains in history for traceability.

### Bisaya script

> Reporter 3 ang mopakita sa automation ug sa pinakaimportante nga design rule sa sistema.
>
> Sa Recommendations page, naa ang **upat ka pending items**. Para sa Bond Paper, makita ang calculation: **Max(100 − 20, 0) = 80**. Ang USB Flash Drive **42**, Stapler **40**, ug Printer Toner **18**. Kini ma-generate sa parehas nga rule human sa matag stock movement.
>
> **[Ablihi ang Forecasting.]** Ang forecast kay transparent nga aritmetika. Gamit ang seeded stock-out history, ang Bond Paper nigawas og **80 units sa 30 ka adlaw** — **2.67 kada adlaw** — nga naghatag og **7.5 ka adlaw nga coverage** sa seeded balance nga 20. Moving average kini, dili machine learning. Kung walay history, moingon ang sistema nga insufficient — dili kini mag-imbento og numero.
>
> **[Balik sa Recommendations ug aprobahan ang Bond Paper.]** Aprobahan nako ang 80-unit recommendation ug magdugang og note. Mahimong **Approved** ang status, ug ma-rekord ang reviewer ug timestamp.
>
> Karon tan-awa pag-ayo ang stock. **20 gihapon.** **Ang approval desisyon sa pagpalit, dili delivery.** Gituyo sa sistema nga dili maghimo og phantom inventory. Mahimong tinuod ang stock lamang kung adunay validated stock-in.
>
> **[Ablihi ang Stock-In ug dawata ang 40.]** Modawat ko og **40 ka ream**. Ang stock mahimong **20 ngadto sa 60**.
>
> Ngano 40 ug dili 30? Kay inclusive ang rule: **Low Stock gihapon ang 50** kung ang reorder level 50. Para mawala ang alert, kinahanglan molabaw sa 50. Mao nga 40 ang among gidawat.
>
> **[Ablihi ang Alerts.]** Nawala automatically ang Bond Paper alert — wala namo gi-click ang “resolve.” **[Balik sa Recommendations.]** Ang pending recommendation mismo ang nagsira, samtang ang approved record nagpabilin sa history para sa traceability.

### Handoff

> “Reporter 4 will ask the assistant the same questions and then run the evidence.”

---

# Reporter 4 — Assistant, walkthroughs, evidence

### Steps and exact targets

| # | Action | Expected answer |
| --- | --- | --- |
| 1 | Open the assistant (bottom-right sparkle button) | Welcome message and suggested questions |
| 2 | Ask **“How many Bond Paper are left?”** | **60 reams**, with status |
| 3 | Ask **“What is its reorder level?”** | **50** — product context retained |
| 4 | Ask **“Ilan ang natitirang Bond Paper?”** | Tagalog answer, **60** |
| 5 | Ask **“Pila ang nahabilin nga Bond Paper?”** | Bisaya answer, **60** |
| 6 | Ask **“Open the Alerts page.”** | Navigates to `/alerts/` |
| 7 | Ask **“Start the stock-in walkthrough.”** | Navigates to `/stock-in/`, overlay highlights the product field |
| 8 | Press **Escape** | Overlay closes |
| 9 | Ask **“Add 50 stock to Bond Paper right now.”** | Refusal + offer to open the stock-in tour |
| 10 | Ask **“Approve the reorder now.”** | Refusal + permission-safe path |
| 11 | Open **Demo & Testing Center** → **Run all tests** | **16/16**, **90/90 individual checks** |

### English script

> Reporter 4 will show the assistant and the evidence.
>
> The assistant is **rule-based**. It does not call any external AI service. It reads the same shared inventory state as every page.
>
> **[Ask in English.]** “How many Bond Paper are left?” It answers **60 reams**, because Reporter 3 received 40. **[Ask the follow-up.]** “What is its reorder level?” It answers **50** — it kept the product context instead of forgetting the subject.
>
> **[Ask in Tagalog.]** “Ilan ang natitirang Bond Paper?” It answers in Tagalog with the same **60**.
> **[Ask in Bisaya.]** “Pila ang nahabilin nga Bond Paper?” It answers in Bisaya with the same **60**.
>
> The assistant can also act safely. **[Ask to open Alerts.]** It navigates, but it checks the role first. If the role lacks permission, it refuses and explains instead of bypassing the guard.
>
> **[Ask for the stock-in walkthrough.]** It opens the page and highlights a real interface element. We have **15 walkthroughs** covering the dashboard, products, stock, alerts, recommendations, forecasting, suppliers, reports, transactions, the assistant, and security. **[Press Escape.]**
>
> Now safety. **[Ask to add 50 stock.]** It refuses. It has **no mutating tools** — only navigation and tour actions. It offers the validated stock-in workflow instead. **[Ask to approve the reorder.]** It refuses again, because the assistant cannot make decisions.
>
> Finally, the evidence. **[Open Demo & Testing Center and run all.]** The result is **16 out of 16 tests**, with **90 out of 90 individual checks**. The tests run on isolated fixtures, so they never read or modify our live inventory. Results appear only after execution — the page starts at “Not run,” and nothing is pre-marked PASS.

### Bisaya script

> Reporter 4 ang mopakita sa assistant ug sa ebidensya.
>
> **Rule-based** ang assistant. Wala kini nagtawag og external AI service. Nagbasa kini sa parehas nga shared inventory state sa tanang page.
>
> **[Pangutana sa English.]** “How many Bond Paper are left?” Motubag kini og **60 ka ream**, kay si Reporter 3 nagdawat og 40. **[Follow-up.]** “What is its reorder level?” Motubag kini og **50** — gipabilin ang product context imbes kalimtan ang subject.
>
> **[Pangutana sa Tagalog.]** “Ilan ang natitirang Bond Paper?” Motubag kini sa Tagalog nga adunay **60**.
> **[Pangutana sa Bisaya.]** “Pila ang nahabilin nga Bond Paper?” Motubag kini sa Bisaya nga adunay **60**.
>
> Makahimo usab ang assistant og luwas nga aksyon. **[Pangayo nga ablihan ang Alerts.]** Moadto kini, pero gisusi una ang role. Kung walay permission ang role, mosalikway kini ug mo-explain — dili mo-bypass sa guard.
>
> **[Pangayo sa stock-in walkthrough.]** Maablihan niini ang page ug ma-highlight ang tinuod nga interface element. Aduna kitay **15 walkthroughs** nga naglakip sa dashboard, products, stock, alerts, recommendations, forecasting, suppliers, reports, transactions, assistant, ug security. **[Pindota ang Escape.]**
>
> Karon safety. **[Pangayo nga magdugang og 50 stock.]** Mosalikway kini. Wala kini **mutating tools** — navigation ug tour actions lamang. Gitanyag niini ang validated stock-in workflow. **[Pangayo nga aprobahan ang reorder.]** Mosalikway usab kini, kay dili makahimo og desisyon ang assistant.
>
> Sa katapusan, ang ebidensya. **[Ablihi ang Demo & Testing Center ug run all.]** Ang resulta **16 sa 16 ka tests**, nga adunay **90 sa 90 ka individual checks**. Ang tests nagdagan sa isolated fixtures, busa wala nila basaha o usba ang live inventory. Ang resulta mogawas lamang human sa execution — “Not run” ang initial state, ug walay PASS nga gi-pre-mark.

### Handoff

> “Reporter 5 will close with the roles and the honest limits.”

---

# Reporter 5 — Roles, limits, conclusion

### Steps and exact targets

| # | Action | Expected on screen |
| --- | --- | --- |
| 1 | Sign out → sign in as **Viewer** | Reduced sidebar |
| 2 | Point to missing Stock-In / Forecasting / Settings / Audit | Not advertised |
| 3 | Try `/forecasting/` directly | **Access Denied**, not the page |
| 4 | Sign out → **Staff** | Stock-In visible, approve disabled |
| 5 | Sign out → **Owner** | Forecasting and approve available; Settings blocked |
| 6 | Sign out → **Administrator** | Full sidebar returns |
| 7 | Open **Security & Limits** | Permission matrix and limitation text |
| 8 | Optionally reset demo data | Seed restored, session preserved |

### English script

> Reporter 5 will close with **roles**, **honest limits**, and the conclusion.
>
> StockSense AI has four demonstration accounts: **Administrator, Business Owner, Inventory Staff, and Inventory Viewer**. One permission matrix controls the sidebar, the routes, the buttons, the state-changing actions, and the assistant.
>
> **[Sign in as Viewer.]** The Viewer is read-only. There is no Stock-In, no Forecasting, no Settings, and no Audit Logs in the sidebar. **[Open `/forecasting/` directly.]** The route itself is guarded: the page is replaced by **Access Denied**. Hiding a link is not the protection; the route check is.
>
> **[Sign in as Staff.]** Staff can receive and issue stock, but the approve buttons are disabled, and Forecasting is blocked. **[Sign in as Owner.]** The Owner can approve reorders and use Forecasting, but cannot open Settings. **[Sign in as Administrator.]** The Administrator gets everything, including the audit log and the demo reset.
>
> Now the honest part. **This is a prototype.** Authentication is local and hardcoded. Role checks are client-side. Data lives in `localStorage`. The audit trail is ordinary JSON and can be edited with developer tools. There is **no server, no real security boundary, and no machine-learning model**. We document these limits in the app on this **Security & Limits** page and in `docs/SECURITY_LIMITATIONS.md`.
>
> What we do control well: **one permission matrix**, **one set of rules** shared by the UI, assistant, and tests, **derived alerts** that cannot go stale, **approval isolation** that prevents phantom stock, **validation before mutation**, and an **assistant with no write access**.
>
> The next revision would add a server, real authentication, a database, immutable audit logs, and backups.
>
> To conclude: StockSense AI demonstrates automatic low-stock detection, transparent reorder recommendations, decision and delivery separation, a multilingual rule-based assistant, 15 guided walkthroughs, and 16 automated tests with 90 checks. **Thank you. We are ready for your questions.**

### Bisaya script

> Reporter 5 ang motapos sa **mga role**, **matinud-anong limitasyon**, ug conclusion.
>
> Ang StockSense AI adunay upat ka demonstration accounts: **Administrator, Business Owner, Inventory Staff, ug Inventory Viewer**. Usa ra ka permission matrix ang nagkontrol sa sidebar, routes, buttons, state-changing actions, ug assistant.
>
> **[Sign in isip Viewer.]** Read-only ang Viewer. Wala Stock-In, wala Forecasting, wala Settings, ug wala Audit Logs sa sidebar. **[Ablihi ang `/forecasting/` direkta.]** Guarded ang route: mapuli ang page sa **Access Denied**. Ang pagtago sa link dili ang protection; ang route check ang protection.
>
> **[Sign in isip Staff.]** Makadawat ug makagawas og stock ang Staff, pero disabled ang approve buttons, ug blocked ang Forecasting. **[Sign in isip Owner.]** Makapangaprubahan ug makagamit sa Forecasting ang Owner, pero dili makasulod sa Settings. **[Sign in isip Administrator.]** Makakuha ang Administrator sa tanan, apil ang audit log ug demo reset.
>
> Karon ang matinud-anong bahin. **Prototype kini.** Local ug hardcoded ang authentication. Client-side ang role checks. Naa sa `localStorage` ang data. Ang audit trail ordinaryong JSON ug mabag-o pinaagi sa developer tools. **Wala server, wala tinuod nga security boundary, ug wala machine-learning model.** Gidokumento namo kini sa **Security & Limits** page ug sa `docs/SECURITY_LIMITATIONS.md`.
>
> Ang among maayo nga kontrolado: **usa ka permission matrix**, **usa ka set sa rules** nga gigamit sa UI, assistant, ug tests, **derived alerts** nga dili mahimong stale, **approval isolation** nga makapugong sa phantom stock, **validation sa dili pa mausab ang data**, ug **assistant nga walay write access**.
>
> Sa sunod nga revision, among idugang ang server, tinuod nga authentication, database, immutable audit logs, ug backups.
>
> Sa pagtapos: ang StockSense AI nagpakita sa automatic low-stock detection, transparent reorder recommendations, separation sa decision ug delivery, multilingual rule-based assistant, 15 guided walkthroughs, ug 16 automated tests nga adunay 90 checks. **Salamat. Andam kami sa inyong mga pangutana.**

---

## 5. Q&A bank

| Question | Suggested answer |
| --- | --- |
| “Is this really AI?” | “It is a **rule-based assistant**, not a trained model. We call it AI-style because it understands product references, keeps context, switches language, and performs safe actions. The intelligence is explicit rules, and we show the rules.” |
| “Why not use OpenAI?” | “The brief requires a static, offline prototype with no external services. A local rule engine is deterministic, free, and defensible. We document it honestly instead of implying a model we did not train.” |
| “How accurate is the forecast?” | “We make **no accuracy claim**. It is a moving average over actual stock-out records. With no history it says ‘insufficient history.’ Accuracy would require backtesting, which is future work.” |
| “What happens if two staff edit at once?” | “They do not share data. Each browser profile has its own `localStorage`, so there is no real concurrency. A production version needs a database and conflict control.” |
| “Can approval add stock?” | “No. Approval changes only the recommendation record. Stock changes only through stock-in. This is verified by the `approval-no-stock-change` test.” |
| “Why did you receive 40 and not 30?” | “Because `stock <= reorder` is Low. 50 is still Low when the reorder level is 50. We receive 40 to reach 60, which is above the boundary.” |
| “Can the chatbot be tricked into changing stock?” | “It has no mutating tools at all. Even if the text classifier is confused, the only possible actions are navigate and start a tour. The `chatbot-safety` test verifies the refusals.” |
| “Is this secure?” | “No — and the system says so. Client-side roles are demonstration controls. In production the matrix must be enforced on a server, with real sessions and an append-only audit log.” |
| “What are the limitations?” | “No backend, no real auth, browser-only data, editable audit log, no ML, no email delivery, no barcode, and no multi-user sync.” |
| “What would you build next?” | “A server API with database constraints, real authentication, server-side authorization, immutable audit logs, backups, and component/end-to-end tests in CI.” |
| “Why 15 walkthroughs?” | “They cover every major workflow, including product creation, stock movement, alerts, reorders, forecasting, reports, suppliers, transactions, the assistant, and security.” |
| “How do you know the tests are honest?” | “They run only on isolated fixtures, never on live data. The page starts at ‘Not run,’ each check is printed, and we can clear and re-run in front of you.” |

### Three answers in Bisaya

| Question | Bisaya answer |
| --- | --- |
| “Tinuod ba ni nga AI?” | “**Rule-based assistant** kini, dili trained model. AI-style among tawag kay makasabot sa product references, makapadayon sa context, makabalhin og language, ug makahimo og luwas nga actions. Klaro ang rules, ug gipakita namo ang rules.” |
| “Ngano wala mo mogamit og OpenAI?” | “Kinahanglan sa brief ang static, offline prototype nga walay external services. Deterministic, libre, ug depensable ang local rule engine. Gidokumento namo kini sa tinuod instead nga magpakita og model nga wala namo ma-train.” |
| “Luwas ba ni?” | “Dili — ug ang sistema mismo nagsulti niana. Demonstration controls lamang ang client-side roles. Sa production, kinahanglan i-enforce ang matrix sa server, uban sa tinuod nga sessions ug append-only audit log.” |

---

## 6. Recovery table

| Problem | Recovery |
| --- | --- |
| Stock or recommendations differ from the script | Sign in as Administrator → Demo & Testing Center → **Reset demo data**. Restart from Reporter 2. |
| Wrong role signed in | Top-right account menu → **Sign out** → use **Fill** on the correct card. |
| Chatbot mishears a question | Use the exact wording in this script, or include the SKU: “How many BP-001 are left?” |
| Chatbot answers in the wrong language | Click the **EN / TL / CEB** language buttons, or type “Switch to English.” |
| Walkthrough does not start | Confirm you are signed in. Use the **Help / walkthrough** menu or ask “Start the stock-in walkthrough.” Press Escape and retry. |
| Walkthrough highlight is missing | Press Escape, reload the page, start the tour again. Selectors are real; a missing element means the page is not in the expected state. |
| Tests are not 16/16 | Open the failing row, read the check detail, click **Clear results**, then **Run all** again. If it still fails, report it honestly and reset. |
| Page looks stale | Hard reload (`Ctrl + R` / `Cmd + R`). Data is local, so a reload does not lose the seed. |
| Projector hides the assistant button | Use the sidebar **Help** entry or start the tour from the assistant before mirroring, or zoom to 90%. |
| Demo freezes | Close the tab, reopen `http://localhost:3000`, sign in again. Do not clear site data unless you intend to reset. |

## 7. Do not say

Avoid these claims; they are false or unsupported:

- “The AI learns from our data.”
- “The forecast is 95% accurate.”
- “The system is secure / production-ready.”
- “The database stores…” — there is no database.
- “The chatbot can update stock for you.”
- “Approval automatically orders the items.”
- “The audit log cannot be changed.”

## 8. Closing checklist

- [ ] Signed back in as Administrator
- [ ] Demo data reset (if the next session needs the seed)
- [ ] Test results cleared or left visible intentionally
- [ ] Browser zoom restored
- [ ] `docs/` open for reference
- [ ] Thank the panel and invite questions
