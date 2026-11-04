// Localized explanations for the rule-based assistant.
// These are hand-written keyword-era translations for the demonstration questions, not a
// machine translation model. Product data, numbers, and formulas always come from shared state.

export const KB_TRANSLATIONS = {
  tl: {
    about:
      'Ang StockSense AI ay isang prototype ng inventory at stock management automation. Tinutulungan nitong subaybayan ang produkto, pamahalaan ang stock-in at stock-out, awtomatikong matukoy ang mababang stock, gumawa ng reorder recommendations, at suriin ang historical demand. Academic prototype ito para sa SA101, hindi isang production system.',
    inventory:
      'Saklaw ng inventory management sa StockSense AI ang product registration, supplier assignment, reorder levels, target stock, stock-in at stock-out transactions, automated low-stock detection, transaction history, at audit records. Iisang centralized local state ang pinagmumulan ng lahat ng numero.',
    productRegistration:
      'Ang produkto ay nakarehistro gamit ang unique SKU, pangalan, kategorya, unit, unit price, optional na supplier, reorder level, at target stock. Nagsisimula sa 0 stock ang bagong produkto — ang stock ay nagbabago lamang sa validated stock-in at stock-out transactions.',
    sku:
      'Ang SKU (Stock Keeping Unit) ay ang natatanging code na tumutukoy sa isang produkto, halimbawa BP-001 para sa Bond Paper. Tinatanggihan ng StockSense AI ang duplicate na SKU para ang bawat transaction, alert, recommendation, at report ay tumutukoy sa isang produkto lamang.',
    stockIn:
      'Ang Stock-In ay validated transaction na nagdadagdag ng stock. Pumili ng produkto, maglagay ng positibong buong quantity, at i-submit. Tataas ang balance, gagawa ng transaction record, muling kalkulahin ang status, awtomatikong maaayos ang alert, at magdadagdag ng audit entry.',
    stockOut:
      'Ang Stock-Out ay validated transaction na nagbabawas ng stock. Dapat positibong buong numero ang quantity at hindi dapat lumampas sa available stock. Ang reject na stock-out ay hindi nagbabago ng inventory at hindi gumagawa ng successful transaction record. Ang stock-out din ang pinagmumulan ng demand forecast.',
    lowStock:
      'Rule-based at automatic ang low-stock detection: ang stock na 0 ay Out of Stock; ang stock na katumbas o mas mababa sa reorder level ay Low Stock; ang mas mataas ay Sufficient Stock. Muling kinakalkula ang status pagkatapos ng bawat transaction, at awtomatikong nawawala ang alert — walang duplicate na active alert.',
    reorderLevel:
      'Ang reorder level ay ang threshold na nagti-trigger ng low-stock detection at reorder recommendation. Kung ang reorder level ay 50 units, ang stock na 50 o mas mababa ay ituturing na Low Stock.',
    targetStock:
      'Ang target stock ay ang gustong stock level para sa reorder formula. Dapat itong mas mataas sa reorder level. Ginagamit ito ng recommendation para itaas muli ang stock, ngunit isang hiwalay na stock-in transaction lamang ang aktwal na nagdadagdag ng units.',
    reorderFormula:
      'Ginagamit ng StockSense AI ang rule-based na formula: Recommended Quantity = Max(Target Stock − Current Stock, 0). Halimbawa, kung target 100 at current stock 20, ang recommended reorder quantity ay 80 units. Deterministic ang rule — walang machine learning dito.',
    approval:
      'Tanging Administrator at Business Owner ang makaka-approve o makaka-reject ng reorder recommendations. Ang approval ay nagtatala ng purchasing decision at nagse-save nito sa history. HINDI ito awtomatikong nagdadagdag ng stock. Tataas lamang ang inventory kapag may hiwalay at validated na stock-in transaction.',
    forecasting:
      'Gumagamit ang prototype na ito ng historical stock-out transactions at moving-average calculation. Average Daily Demand = Total Stock-Out Units ÷ Historical Calendar Days. Projected Demand = Average Daily Demand × Forecast Days. Days of Stock Coverage = Current Stock ÷ Average Daily Demand. Hindi ito trained machine-learning model at walang confidence score.',
    suppliers:
      'Ang supplier directory ay naglalaman ng supplier name, contact person, phone, email, address, at notes. Maaaring i-assign ang supplier sa produkto. Hindi maaaring tanggalin ang supplier na may naka-assign na produkto hanggang ma-reassign ang mga ito. Ang chatbot ay nag-uulat lamang ng supplier data na nasa local state.',
    reports:
      'Ang Reports page ay may inventory, low-stock, stock-in, stock-out, at reorder recommendation reports na may search, filters, summary statistics, at CSV export. Ginagawa ang CSV sa browser mula sa local application state — walang server. Demonstration data ang lahat ng record.',
    audit:
      'Ang audit log ay nagtatala ng demonstration events tulad ng login, logout, product creation at update, stock-in, stock-out, reorder approval o rejection, settings changes, at demo data reset. May date/time, user, action, entity, at description ang bawat entry. Simulated local records ito at hindi tamper-proof security logs.',
    roles:
      'May apat na demo roles. Administrator: buong access kasama ang settings, audit logs, at demo reset. Business Owner: inventory management, forecasting, reports, at reorder approvals. Inventory Staff: products, stock-in, stock-out, alerts, at transaction history — pero walang approvals o settings. Inventory Viewer: read-only dashboard, products, alerts, at reports. Iisang centralized permission matrix ang sinusuri ng bawat action at ng assistant.',
    limitations:
      'Static browser prototype ang StockSense AI. Simulated login, client-side role checks, localStorage persistence, rule-based automation, historical moving-average calculations, at rule-based chatbot ang mayroon ito. Wala itong secure server authentication, backend database, tamper-proof audit logs, multiuser synchronization, production backups, totoong machine-learning inference, o cloud AI services. Ang hardcoded demo passwords at localStorage ay hindi production-grade security.',
    transactions:
      'Naglilista ang transaction history ng bawat successful stock-in at stock-out kasama ang transaction ID, product, SKU, type, quantity, previous at updated stock, user, timestamp, at remarks. Ang rejected transactions ay hindi tinatanggap bilang successful records.',
    alerts:
      'Ang stock alerts ay hinango mula sa kasalukuyang stock at reorder level ng bawat produkto — hindi sila duplicate na nakaimbak na record. Agad nawawala ang low-stock alert kapag ang stock-in ay nagtaas sa produkto lampas sa reorder level. Hindi nag-o-order ng stock ang alerts; ang authorized reviewer ang humahawak sa reorder recommendation.',
    demoTesting:
      'Ang Demo / Testing page ay nagpapatakbo ng 16 na inventory at chatbot scenarios sa isolated test fixtures, kaya hindi nagbabago ang live demonstration data. PASS lamang ang lumalabas pagkatapos aktwal na maisagawa ang test. Ang Administrator ay may hiwalay na Reset Demo Data action.',
    navigation:
      'Gamitin ang sidebar para buksan ang Dashboard, Products, Suppliers, Stock-In, Stock-Out, Alerts, Reorder Recommendations, Forecasting, Reports, Transactions, Audit Logs, Demo / Testing, Security, at Settings. Role-aware ang menu, at sinusuri ng assistant ang parehong route permissions bago mag-alok ng navigation.',
    helper:
      'Maaari kong tingnan ang stock, presyo, supplier, reorder level, target stock, kategorya, at recommended quantity mula sa live inventory. Maaari kong ipaliwanag ang alerts, reorder recommendations, approvals, forecasting, reports, audit logs, at roles. Maaari rin akong magbukas ng page na pinapayagan ng iyong role at magsimula ng interactive walkthrough.',
  },
  ceb: {
    about:
      'Ang StockSense AI usa ka prototype sa inventory ug stock management automation. Makatabang kini sa pagsubaybay sa produkto, pagdumala sa stock-in ug stock-out, awtomatikong pag-ila sa ubos nga stock, paghimo og reorder recommendations, ug pag-analisar sa historical demand. Academic prototype kini para sa SA101, dili production system.',
    inventory:
      'Ang inventory management sa StockSense AI naglakip sa product registration, supplier assignment, reorder levels, target stock, stock-in ug stock-out transactions, automated low-stock detection, transaction history, ug audit records. Usa ra ka centralized local state ang gigikanan sa tanang numero.',
    productRegistration:
      'Ang produkto morehistro pinaagi sa unique SKU, ngalan, kategorya, unit, unit price, optional nga supplier, reorder level, ug target stock. Magsugod sa 0 stock ang bag-ong produkto — mobag-o lamang ang stock pinaagi sa validated stock-in ug stock-out transactions.',
    sku:
      'Ang SKU (Stock Keeping Unit) mao ang talagsaon nga code nga nagpaila sa usa ka produkto, sama sa BP-001 para sa Bond Paper. Gisalikway sa StockSense AI ang duplicate nga SKU aron ang matag transaction, alert, recommendation, ug report motumong sa usa ra ka produkto.',
    stockIn:
      'Ang Stock-In validated transaction nga nagdugang og stock. Pagpili og produkto, ibutang ang positibong tibuok nga quantity, ug i-submit. Modaghan ang balance, mohimo og transaction record, makalkulo pag-usab ang status, ma-resolve ang alert, ug makadugang og audit entry.',
    stockOut:
      'Ang Stock-Out validated transaction nga nagbawas og stock. Kinahanglan positibong tibuok nga numero ang quantity ug dili molapas sa available stock. Ang rejected stock-out dili mobag-o sa inventory ug dili mohimo og successful transaction record. Ang stock-out usab ang gigikanan sa demand forecast.',
    lowStock:
      'Rule-based ug automatic ang low-stock detection: ang stock nga 0 kay Out of Stock; ang stock nga katumbas o ubos sa reorder level kay Low Stock; ang mas taas kay Sufficient Stock. Makalkulo pag-usab ang status human sa matag transaction, ug automatic nga mawala ang alert — walay duplicate nga active alert.',
    reorderLevel:
      'Ang reorder level mao ang threshold nga nag-trigger sa low-stock detection ug reorder recommendation. Kung ang reorder level 50 units, ang stock nga 50 o ubos kay ituring nga Low Stock.',
    targetStock:
      'Ang target stock mao ang gustong stock level alang sa reorder formula. Kinahanglan mas taas kini sa reorder level. Gigamit kini sa recommendation aron mapataas pag-usab ang stock, apan usa ka lahi nga stock-in transaction lamang ang aktwal nga nagdugang og units.',
    reorderFormula:
      'Gigamit sa StockSense AI ang rule-based formula: Recommended Quantity = Max(Target Stock − Current Stock, 0). Pananglitan, kung target 100 ug current stock 20, ang recommended reorder quantity kay 80 units. Deterministic ang rule — walay machine learning dinhi.',
    approval:
      'Ang Administrator ug Business Owner lamang ang makaka-approve o makaka-reject sa reorder recommendations. Ang approval nagtala sa purchasing decision ug nagtipig niini sa history. DILI kini automatic nga nagdugang og stock. Modaghan lamang ang inventory kung naay lahi ug validated nga stock-in transaction.',
    forecasting:
      'Gigamit niini nga prototype ang historical stock-out transactions ug moving-average calculation. Average Daily Demand = Total Stock-Out Units ÷ Historical Calendar Days. Projected Demand = Average Daily Demand × Forecast Days. Days of Stock Coverage = Current Stock ÷ Average Daily Demand. Dili kini trained machine-learning model ug walay confidence score.',
    suppliers:
      'Ang supplier directory naglakip sa supplier name, contact person, phone, email, address, ug notes. Mahimong i-assign ang supplier sa produkto. Dili mahimong tangtangon ang supplier nga naay naka-assign nga produkto hangtod ma-reassign kini. Ang chatbot nagreport lamang sa supplier data nga naa sa local state.',
    reports:
      'Ang Reports page naay inventory, low-stock, stock-in, stock-out, ug reorder recommendation reports nga naay search, filters, summary statistics, ug CSV export. Himoon ang CSV sa browser gikan sa local application state — walay server. Demonstration data ang tanang record.',
    audit:
      'Ang audit log nagtala sa demonstration events sama sa login, logout, product creation ug update, stock-in, stock-out, reorder approval o rejection, settings changes, ug demo data reset. Naa kini date/time, user, action, entity, ug description. Simulated local records kini ug dili tamper-proof security logs.',
    roles:
      'Naay upat ka demo roles. Administrator: tibuok access apil ang settings, audit logs, ug demo reset. Business Owner: inventory management, forecasting, reports, ug reorder approvals. Inventory Staff: products, stock-in, stock-out, alerts, ug transaction history — pero walay approvals o settings. Inventory Viewer: read-only dashboard, products, alerts, ug reports. Usa ra ka centralized permission matrix ang gisusi sa matag action ug sa assistant.',
    limitations:
      'Static browser prototype ang StockSense AI. Simulated login, client-side role checks, localStorage persistence, rule-based automation, historical moving-average calculations, ug rule-based chatbot ang naa niini. Wala kini secure server authentication, backend database, tamper-proof audit logs, multiuser synchronization, production backups, tinuod nga machine-learning inference, o cloud AI services. Ang hardcoded demo passwords ug localStorage dili production-grade security.',
    transactions:
      'Ang transaction history naglista sa matag successful stock-in ug stock-out apil ang transaction ID, product, SKU, type, quantity, previous ug updated stock, user, timestamp, ug remarks. Ang rejected transactions dili isipon nga successful records.',
    alerts:
      'Ang stock alerts gihimo gikan sa kasamtangang stock ug reorder level sa matag produkto — dili sila duplicate nga gitipigan nga record. Dali mawala ang low-stock alert kung ang stock-in makapataas sa produkto labaw sa reorder level. Dili mag-order og stock ang alerts; ang authorized reviewer ang modumala sa reorder recommendation.',
    demoTesting:
      'Ang Demo / Testing page nagpadagan og 16 ka inventory ug chatbot scenarios sa isolated test fixtures, busa dili mobag-o ang live demonstration data. PASS lamang ang mogawas human aktwal nga mahimo ang test. Ang Administrator naay lahi nga Reset Demo Data action.',
    navigation:
      'Gamita ang sidebar aron ablihan ang Dashboard, Products, Suppliers, Stock-In, Stock-Out, Alerts, Reorder Recommendations, Forecasting, Reports, Transactions, Audit Logs, Demo / Testing, Security, ug Settings. Role-aware ang menu, ug gisusi sa assistant ang parehas nga route permissions antes mag-offer og navigation.',
    helper:
      'Makatabang ko sa pagtan-aw sa stock, presyo, supplier, reorder level, target stock, kategorya, ug recommended quantity gikan sa live inventory. Makatabang usab ko sa pagpasabot sa alerts, reorder recommendations, approvals, forecasting, reports, audit logs, ug roles. Makapabukas usab ko sa page nga gitugotan sa imong role ug makasugod og interactive walkthrough.',
  },
};

export function localizedKnowledge(language, key, fallback) {
  if (language === 'tl' || language === 'ceb') {
    return KB_TRANSLATIONS[language]?.[key] || fallback;
  }
  return fallback;
}
