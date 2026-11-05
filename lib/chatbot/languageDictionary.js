// Lightweight, maintainable multilingual support for the rule-based assistant.
// This is keyword/phrase based — it is NOT a translation model and does not claim perfect
// understanding. English is the base language; Filipino/Tagalog and Cebuano/Bisaya cover the
// common demonstration questions used in the SA101 defense.

import { normalizeText } from './text';

export const SUPPORTED_LANGUAGES = ['en', 'tl', 'ceb'];

export const LANGUAGE_LABELS = {
  en: 'English',
  tl: 'Filipino/Tagalog',
  ceb: 'Cebuano/Bisaya',
};

// Markers are matched with word boundaries. Longer stems also match common affixes
// (e.g. "natitira" matches "natitirang", "nahabilin" matches "nahabilin").
// The second value is a small weight. Distinctive words score higher than shared function words,
// which keeps mixed-language sentences from being decided by a single ambiguous token.
const LANGUAGE_MARKERS = {
  tl: [
    ['ilan', 2],
    ['ilang', 2],
    ['paano', 2],
    ['magkano', 2],
    ['nasaan', 2],
    ['saan', 2],
    ['natitira', 2],
    ['natitirang', 2],
    ['makikita', 2],
    ['makita', 2],
    ['matatagpuan', 2],
    ['ipaliwanag', 2],
    ['paliwanag', 1.5],
    ['ipakita', 1.5],
    ['pakita', 1.5],
    ['tingnan', 1.5],
    ['tulungan', 1.5],
    ['idagdag', 1.5],
    ['magdagdag', 1.5],
    ['bakit', 1.5],
    ['kailan', 2],
    ['gabayan', 2],
    ['iyong', 1.5],
    ['ating', 1.5],
    ['natin', 1.5],
    ['namin', 1.5],
    ['meron', 1.5],
    ['wala', 1.5],
    ['hindi', 1.5],
    ['dito', 1.5],
    ['gusto', 1],
    ['pwede', 1],
    ['puwede', 1],
    ['ano', 1.5],
    ['salamat', 2],
    ['imbentaryo', 1],
    ['rekomendasyon', 1],
    ['rekumendasyon', 1],
    ['kategorya', 1],
    ['presyo', 1],
    ['ulat', 1],
    ['babala', 1],
    ['mga', 0.5],
    ['ang', 0.5],
    ['ng', 0.5],
    ['sa', 0.5],
    ['ako', 1],
    ['mo', 0.75],
  ],
  ceb: [
    ['pila', 2],
    ['unsaon', 2],
    ['unsa', 2],
    ['asa', 2],
    ['hain', 2],
    ['diin', 2],
    ['ngano', 2],
    ['nahabilin', 2],
    ['makita', 2],
    ['tan awa', 2],
    ['tabangi', 2],
    ['giyahan', 2],
    ['gabayan', 2],
    ['kanus a', 2],
    ['idugang', 1.5],
    ['pagdugang', 1.5],
    ['ipakita', 1.5],
    ['karon', 1.5],
    ['dinhi', 1.5],
    ['didto', 1.5],
    ['kini', 1.5],
    ['kana', 1.5],
    ['mao', 1.5],
    ['imong', 1.5],
    ['kami', 1.5],
    ['adunay', 1.5],
    ['buhaton', 1.5],
    ['naa', 1.5],
    ['dili', 1.5],
    ['wala', 1.5],
    ['salamat', 2],
    ['gusto', 1],
    ['pwede', 1],
    ['puwede', 1],
    ['imbentaryo', 1],
    ['rekomendasyon', 1],
    ['kategorya', 1],
    ['presyo', 1],
    ['report', 1],
    ['pasidaan', 1],
    ['kay', 1],
    ['ako', 1],
    ['kita', 0.75],
    ['ko', 0.75],
    ['mo', 0.75],
    ['mga', 0.5],
    ['ang', 0.5],
    ['ug', 0.5],
    ['sa', 0.5],
  ],
};

export function detectLanguageWithScore(rawText) {
  const normalized = normalizeText(rawText);
  const scores = { en: 0, tl: 0, ceb: 0 };

  if (!normalized) return { language: 'en', scores, hasMarkers: false, confidence: 0 };

  for (const language of ['tl', 'ceb']) {
    for (const [marker, weight] of LANGUAGE_MARKERS[language]) {
      const target = normalizeText(marker);
      if (!target) continue;
      if (target.includes(' ')) {
        if (normalized.includes(target)) scores[language] += weight;
        continue;
      }
      const pattern = new RegExp(`\\b${target}\\b`);
      if (pattern.test(normalized)) scores[language] += weight;
      else if (target.length >= 5 && normalized.includes(target)) scores[language] += weight * 0.5;
    }
  }

  const hasMarkers = scores.tl > 0 || scores.ceb > 0;
  const total = scores.tl + scores.ceb;
  const confidence = total > 0 ? Math.abs(scores.tl - scores.ceb) / total : 0;
  if (!hasMarkers) return { language: 'en', scores, hasMarkers, confidence: 0 };

  if (scores.ceb > scores.tl) return { language: 'ceb', scores, hasMarkers, confidence };
  if (scores.tl > scores.ceb) return { language: 'tl', scores, hasMarkers, confidence };
  // Tagalog and Cebuano share several markers. Prefer Cebuano when a distinctive Cebuano marker
  // appears, otherwise Tagalog for the remaining shared cases.
  return /\b(pila|unsaon|asa|hain|diin|nahabilin|tan awa)\b/.test(normalized)
    ? { language: 'ceb', scores, hasMarkers, confidence }
    : { language: 'tl', scores, hasMarkers, confidence };
}

export function detectLanguage(rawText) {
  return detectLanguageWithScore(rawText).language;
}

export function detectExplicitLanguageRequest(rawText) {
  const normalized = normalizeText(rawText);
  if (!normalized) return null;
  const asksLanguage =
    /\b(speak|talk|use|switch|language|wika|sinultian|salita)\b/.test(normalized);
  if (!asksLanguage) return null;
  if (/\b(tagalog|filipino)\b/.test(normalized)) return 'tl';
  if (/\b(bisaya|cebuano|cebu)\b/.test(normalized)) return 'ceb';
  if (/\benglish\b/.test(normalized)) return 'en';
  return null;
}

export const UI_TEXT = {
  en: {
    title: 'StockSense AI Assistant',
    subtitle: 'Rule-based · Offline',
    welcome:
      "Hello! I'm your StockSense AI Assistant. I can help you manage inventory, check product information, understand stock alerts, and guide you through the system. What would you like to do today?",
    placeholder: 'Ask about stock, alerts, reports, or a walkthrough…',
    clear: 'Clear conversation',
    minimize: 'Minimize assistant',
    close: 'Close assistant',
    maximize: 'Expand assistant',
    restore: 'Restore assistant',
    send: 'Send message',
    suggestionsLabel: 'Suggested questions',
    typing: 'StockSense AI is typing',
    disclaimer:
      'Rule-based assistant simulation · Reads the same local inventory state as the app · No external AI service.',
    welcomeSuggestions: [
      'Check Product Stock',
      'How to Add a Product',
      'Record Stock-In',
      'Record Stock-Out',
      'View Low-Stock Items',
      'Explain Reorder Recommendations',
      'Guide Me Through the System',
    ],
  },
  tl: {
    title: 'StockSense AI Assistant',
    subtitle: 'Rule-based · Offline',
    welcome:
      "Kumusta! Ako ang iyong StockSense AI Assistant. Makakatulong ako sa pamamahala ng imbentaryo, pagtingin ng impormasyon ng produkto, pag-unawa sa stock alerts, at paggabay sa sistema. Ano ang gusto mong gawin ngayon?",
    placeholder: 'Magtanong tungkol sa stock, alerts, reports, o walkthrough…',
    clear: 'I-clear ang usapan',
    minimize: 'I-minimize ang assistant',
    close: 'Isara ang assistant',
    maximize: 'Palakihin ang assistant',
    restore: 'Ibalik ang assistant',
    send: 'Ipadala',
    suggestionsLabel: 'Mga mungkahing tanong',
    typing: 'Nagta-type ang StockSense AI',
    disclaimer:
      'Rule-based assistant simulation · Gumagamit ng parehong local inventory state · Walang external AI service.',
    welcomeSuggestions: [
      'Ilan ang natitirang Bond Paper?',
      'Paano mag-add ng product?',
      'Paano mag-stock in?',
      'Paano mag-stock out?',
      'Ipakita ang low-stock items',
      'Ipaliwanag ang reorder recommendations',
      'Gabayan mo ako sa sistema',
    ],
  },
  ceb: {
    title: 'StockSense AI Assistant',
    subtitle: 'Rule-based · Offline',
    welcome:
      "Kumusta! Ako ang imong StockSense AI Assistant. Makatabang ko sa pagdumala sa imbentaryo, pagtan-aw sa impormasyon sa produkto, pagsabot sa stock alerts, ug paggiya sa sistema. Unsa ang gusto nimong buhaton karon?",
    placeholder: 'Pangutana bahin sa stock, alerts, reports, o walkthrough…',
    clear: 'Limpyohi ang panag-istoryahanay',
    minimize: 'I-minimize ang assistant',
    close: 'Isira ang assistant',
    maximize: 'Padak-a ang assistant',
    restore: 'Ibalik ang assistant',
    send: 'Ipadala',
    suggestionsLabel: 'Mga gisugyot nga pangutana',
    typing: 'Nag-type ang StockSense AI',
    disclaimer:
      'Rule-based assistant simulation · Parehas nga local inventory state · Wala external AI service.',
    welcomeSuggestions: [
      'Pila ang nahabilin nga Bond Paper?',
      'Unsaon pag add ug product?',
      'Unsaon pag stock in?',
      'Unsaon pag stock out?',
      'Ipakita ang low-stock items',
      'Ipaliwanag ang reorder recommendations',
      'Giyahan ko sa sistema',
    ],
  },
};

export const STATUS_TEXT = {
  en: { low: 'Low Stock', out: 'Out of Stock', sufficient: 'Sufficient Stock' },
  tl: { low: 'Mababa ang Stock', out: 'Wala nang Stock', sufficient: 'Sapat ang Stock' },
  ceb: { low: 'Ubos ang Stock', out: 'Wala nay Stock', sufficient: 'Sakto ang Stock' },
};

export const RESPONSE_TEXT = {
  en: {
    unknownProduct:
      "I couldn't find that product in the inventory. Please check the product name or SKU.",
    permissionDenied:
      'Your current role does not have permission to perform this action. Only the Administrator and Business Owner can approve or reject reorder recommendations.',
    navigationDenied:
      'Your current demo role does not have permission to open that page. The assistant cannot bypass the same role restrictions used across StockSense AI.',
    unclear:
      "I'm not sure I understood your question. You can ask about product stock, inventory transactions, alerts, reports, or system navigation.",
    thanks: "You're welcome! Ask me anytime about stock, alerts, recommendations, reports, or a guided walkthrough.",
    greeting:
      "Hello! I'm the StockSense AI Assistant. I read the same live inventory state as the dashboard. Ask me about a product, stock alerts, reorder recommendations, reports, or a guided walkthrough.",
    noLowStock: 'All active products are above their reorder levels — there are no low-stock items right now.',
    noOutOfStock: 'No active product is currently out of stock.',
    noPendingRecommendations:
      'There are no pending reorder recommendations right now. A new one is generated automatically when a product falls to or below its reorder level.',
    safetyAdd:
      "I can't change inventory directly from chat. Stock balances only change through validated Stock-In or Stock-Out transactions, which also create a transaction record and an audit entry. To add stock, open Stock-In, select the product, enter a positive whole quantity, and submit the form. Would you like me to guide you?",
  },
  tl: {
    unknownProduct:
      'Hindi ko mahanap ang produktong iyon sa inventory. Pakisuri ang pangalan o SKU ng produkto.',
    permissionDenied:
      'Ang iyong demo role ay walang pahintulot na gawin ang aksyong ito. Tanging Administrator at Business Owner lamang ang makaka-approve o makaka-reject ng reorder recommendations.',
    navigationDenied:
      'Ang iyong demo role ay walang pahintulot na buksan ang page na iyon. Hindi maaaring laktawan ng assistant ang parehong role restrictions ng StockSense AI.',
    unclear:
      'Hindi ko sigurado kung naintindihan ko ang tanong. Maaari kang magtanong tungkol sa stock ng produkto, stock transactions, alerts, reports, o navigation sa sistema.',
    thanks: 'Walang anuman! Magtanong lang anumang oras tungkol sa stock, alerts, recommendations, reports, o guided walkthrough.',
    greeting:
      'Kumusta! Ako ang StockSense AI Assistant. Ginagamit ko ang parehong live inventory state ng dashboard. Magtanong tungkol sa produkto, stock alerts, reorder recommendations, reports, o guided walkthrough.',
    noLowStock: 'Lahat ng active products ay mataas sa reorder level — walang low-stock items ngayon.',
    noOutOfStock: 'Walang active product na out of stock ngayon.',
    noPendingRecommendations:
      'Walang pending reorder recommendations ngayon. Awtomatikong gumagawa ng bago kapag ang stock ay bumaba sa o mas mababa sa reorder level.',
    safetyAdd:
      'Hindi ako makakabago ng inventory nang direkta mula sa chat. Ang stock ay nagbabago lamang sa pamamagitan ng validated Stock-In o Stock-Out transactions, na gumagawa din ng transaction record at audit entry. Para magdagdag ng stock, buksan ang Stock-In, piliin ang produkto, maglagay ng positibong buong quantity, at i-submit ang form. Gusto mo bang gabayan kita?',
  },
  ceb: {
    unknownProduct:
      'Wala nako makit-an ang maong produkto sa inventory. Palihug susiha ang ngalan o SKU sa produkto.',
    permissionDenied:
      'Ang imong demo role walay permiso sa pagbuhat niini nga aksyon. Ang Administrator ug Business Owner lamang ang makaka-approve o makaka-reject sa reorder recommendations.',
    navigationDenied:
      'Ang imong demo role walay permiso sa pag-abli niadtong page. Dili malikayan sa assistant ang parehas nga role restrictions sa StockSense AI.',
    unclear:
      'Dili ko sigurado kung nasabtan nako ang pangutana. Mahimo kang mangutana bahin sa stock sa produkto, stock transactions, alerts, reports, o navigation sa sistema.',
    thanks: 'Walay sapayan! Pangutana lang bisan kanus-a bahin sa stock, alerts, recommendations, reports, o guided walkthrough.',
    greeting:
      'Kumusta! Ako ang StockSense AI Assistant. Gigamit nako ang parehas nga live inventory state sa dashboard. Pangutana bahin sa produkto, stock alerts, reorder recommendations, reports, o guided walkthrough.',
    noLowStock: 'Tanan active products kay naa sa ibabaw sa reorder level — walay low-stock items karon.',
    noOutOfStock: 'Walay active product nga out of stock karon.',
    noPendingRecommendations:
      'Wala pending reorder recommendations karon. Awtomatikong mohimo og bago kung ang stock munaog sa o ubos sa reorder level.',
    safetyAdd:
      'Dili ko makabag-o sa inventory direkta gikan sa chat. Ang stock mobag-o lamang pinaagi sa validated Stock-In o Stock-Out transactions, nga mohimo usab og transaction record ug audit entry. Para makadugang og stock, ablihi ang Stock-In, pilia ang produkto, ibutang ang positibong tibuok nga quantity, ug i-submit ang form. Gusto ba nimong giyahan tika?',
  },
};

export function t(language, key) {
  return (
    RESPONSE_TEXT[language]?.[key] ||
    RESPONSE_TEXT.en[key] ||
    ''
  );
}

export function uiText(language) {
  return UI_TEXT[language] || UI_TEXT.en;
}

export function statusText(language, statusKey) {
  return STATUS_TEXT[language]?.[statusKey] || STATUS_TEXT.en[statusKey] || statusKey;
}

// ---------------------------------------------------------------------------
// Visual guide copy
// ---------------------------------------------------------------------------
// The assistant can open a page and highlight a real element. Tooltips are localized, but product
// names, SKUs, suppliers, quantities, dates, prices, and transaction IDs are always inserted
// verbatim and never translated.

const ELEMENT_LABELS_EN = {
  'add-product-button': 'Add product button',
  'products-search': 'product search box',
  'product-status-filter': 'stock status filter',
  'products-table': 'product catalog table',
  'add-supplier-button': 'Add supplier button',
  'supplier-list': 'supplier list',
  'stock-in-form': 'stock-in form',
  'stock-in-product': 'product selector',
  'stock-in-quantity': 'quantity field',
  'stock-in-remarks': 'remarks field',
  'stock-in-button': 'Record Stock-In button',
  'stock-out-form': 'stock-out form',
  'stock-out-product': 'product selector',
  'stock-out-quantity': 'quantity field',
  'stock-out-remarks': 'remarks field',
  'stock-out-button': 'Record Stock-Out button',
  'alerts-list': 'active alerts list',
  'recommendations-list': 'pending recommendations list',
  'approve-reorder': 'Approve button',
  'forecasting-product': 'forecast product selector',
  'forecasting-results': 'forecast results',
  'forecasting-chart': 'forecast chart',
  'reports-tabs': 'report tabs',
  'reports-table': 'report table',
  'export-csv': 'Export CSV button',
  'transactions-filter': 'transaction filters',
  'transactions-table': 'transaction table',
  'audit-table': 'audit log table',
  'dashboard-stats': 'dashboard statistics',
  'dashboard-chart': 'stock movement chart',
  'dashboard-alerts': 'alerts panel',
  'dashboard-recent': 'recent transactions list',
  'chatbot-input': 'assistant message box',
  'run-all-tests': 'Run all tests button',
  'reset-demo': 'Reset demo data button',
  'settings-form': 'business settings form',
  'security-rbac': 'roles and permissions section',
  'security-limits': 'security limitations section',
  'notifications-bell': 'notification bell',
  navigation: 'navigation menu',
};

const ELEMENT_LABELS_TL = {
  'add-product-button': 'Add product button',
  'products-search': 'search box ng produkto',
  'product-status-filter': 'filter ng stock status',
  'products-table': 'talahanayan ng produkto',
  'add-supplier-button': 'Add supplier button',
  'supplier-list': 'listahan ng supplier',
  'stock-in-form': 'stock-in form',
  'stock-in-product': 'product selector',
  'stock-in-quantity': 'field ng quantity',
  'stock-in-remarks': 'field ng remarks',
  'stock-in-button': 'Record Stock-In button',
  'stock-out-form': 'stock-out form',
  'stock-out-product': 'product selector',
  'stock-out-quantity': 'field ng quantity',
  'stock-out-remarks': 'field ng remarks',
  'stock-out-button': 'Record Stock-Out button',
  'alerts-list': 'listahan ng active alerts',
  'recommendations-list': 'listahan ng pending recommendations',
  'approve-reorder': 'Approve button',
  'forecasting-product': 'product selector ng forecast',
  'forecasting-results': 'resulta ng forecast',
  'forecasting-chart': 'chart ng forecast',
  'reports-tabs': 'mga tab ng report',
  'reports-table': 'talahanayan ng report',
  'export-csv': 'Export CSV button',
  'transactions-filter': 'mga filter ng transaksyon',
  'transactions-table': 'talahanayan ng transaksyon',
  'audit-table': 'talahanayan ng audit log',
  'dashboard-stats': 'mga statistics ng dashboard',
  'dashboard-chart': 'chart ng stock movement',
  'dashboard-alerts': 'panel ng alerts',
  'dashboard-recent': 'listahan ng recent transactions',
  'chatbot-input': 'message box ng assistant',
  'run-all-tests': 'Run all tests button',
  'reset-demo': 'Reset demo data button',
  'settings-form': 'form ng business settings',
  'security-rbac': 'seksyon ng roles at permissions',
  'security-limits': 'seksyon ng limitations',
  'notifications-bell': 'notification bell',
  navigation: 'navigation menu',
};

const ELEMENT_LABELS_CEB = {
  'add-product-button': 'Add product button',
  'products-search': 'search box sa produkto',
  'product-status-filter': 'filter sa stock status',
  'products-table': 'talaan sa produkto',
  'add-supplier-button': 'Add supplier button',
  'supplier-list': 'lista sa supplier',
  'stock-in-form': 'stock-in form',
  'stock-in-product': 'product selector',
  'stock-in-quantity': 'field sa quantity',
  'stock-in-remarks': 'field sa remarks',
  'stock-in-button': 'Record Stock-In button',
  'stock-out-form': 'stock-out form',
  'stock-out-product': 'product selector',
  'stock-out-quantity': 'field sa quantity',
  'stock-out-remarks': 'field sa remarks',
  'stock-out-button': 'Record Stock-Out button',
  'alerts-list': 'lista sa active alerts',
  'recommendations-list': 'lista sa pending recommendations',
  'approve-reorder': 'Approve button',
  'forecasting-product': 'product selector sa forecast',
  'forecasting-results': 'resulta sa forecast',
  'forecasting-chart': 'chart sa forecast',
  'reports-tabs': 'mga tab sa report',
  'reports-table': 'talaan sa report',
  'export-csv': 'Export CSV button',
  'transactions-filter': 'mga filter sa transaksyon',
  'transactions-table': 'talaan sa transaksyon',
  'audit-table': 'talaan sa audit log',
  'dashboard-stats': 'mga statistics sa dashboard',
  'dashboard-chart': 'chart sa stock movement',
  'dashboard-alerts': 'panel sa alerts',
  'dashboard-recent': 'lista sa recent transactions',
  'chatbot-input': 'message box sa assistant',
  'run-all-tests': 'Run all tests button',
  'reset-demo': 'Reset demo data button',
  'settings-form': 'form sa business settings',
  'security-rbac': 'seksyon sa roles ug permissions',
  'security-limits': 'seksyon sa limitations',
  'notifications-bell': 'notification bell',
  navigation: 'navigation menu',
};

export const VISUAL_TEXT = {
  en: {
    indicator: 'EN',
    locating: 'Opening the page and locating the element…',
    notFound:
      "I couldn't find that element on this page. It may be hidden by your role, a filter, or a modal that is not open. Nothing was changed.",
    dismiss: 'Dismiss',
    done: 'Got it',
    highlightAgain: 'Highlight again',
    permissionDenied:
      'Your current role does not permit that element. The assistant follows the same permissions as the interface.',
    productRowTitle: ({ name }) => `Product row: ${name}`,
    productRowBody: () => 'This is the live row from the shared inventory table.',
    stockCellTitle: ({ name }) => `Stock on hand: ${name}`,
    stockCellBody: ({ stock, unit, target }) => `${stock} ${unit} on hand · target stock ${target}.`,
    statusCellTitle: ({ name }) => `Status: ${name}`,
    statusCellBody: () => 'The status is derived automatically from current stock and the reorder level.',
    priceCellTitle: ({ name }) => `Unit price: ${name}`,
    priceCellBody: ({ price }) => `The current recorded unit price is ${price}.`,
    supplierCellTitle: ({ name }) => `Supplier: ${name}`,
    supplierCellBody: () => 'The supplier comes from the centralized supplier directory.',
    reorderCellTitle: ({ name }) => `Reorder level: ${name}`,
    reorderCellBody: ({ reorderLevel }) =>
      `When stock reaches ${reorderLevel}, the product is marked low and a recommendation is generated.`,
    historyTitle: ({ name }) => `Movement history: ${name}`,
    historyBody: () => 'The table below is filtered to this product. Every successful movement is recorded here.',
    recommendationTitle: ({ name }) => `Pending recommendation: ${name}`,
    recommendationBody: () => 'Approval is a purchasing decision only. It never adds stock directly.',
    alertsTitle: () => 'Active stock alerts',
    alertsBody: () => 'Alerts resolve automatically when stock rises above the reorder level.',
    recommendationsListTitle: () => 'Pending reorder recommendations',
    recommendationsListBody: () =>
      'The recommended quantity is Max(Target Stock − Current Stock, 0). Only an Administrator or Business Owner can decide.',
    dashboardStatsTitle: () => 'Live inventory statistics',
    dashboardStatsBody: () => 'These cards read the same centralized state as every other page.',
    forecastTitle: () => 'Forecast results',
    forecastBody: () => 'This is a transparent historical moving average, not a trained model.',
    navigationTitle: ({ label }) => `${label} page`,
    navigationBody: () => 'You are now on the requested page. Your role was checked before navigating.',
    elementTitle: ({ label }) => `Here: ${label}`,
    elementBody: () => 'Use this element to continue. The assistant only highlights it — it never clicks or submits for you.',
    historySummaryTitle: ({ name }) => `Transactions for ${name}`,
    historySummaryBody: () => 'The Transactions page shows every recorded movement for this product.',
    pageDeniedTitle: () => 'Restricted page',
    pageDeniedBody: () => 'Your role cannot open this page, so the assistant will not highlight it.',
    elements: ELEMENT_LABELS_EN,
  },
  tl: {
    indicator: 'TL',
    locating: 'Binubuksan ang page at hinahanap ang element…',
    notFound:
      'Hindi ko mahanap ang element na iyon sa page na ito. Maaaring nakatago dahil sa role, filter, o modal na hindi pa bukas. Walang nabago.',
    dismiss: 'Isara',
    done: 'Nakuha ko',
    highlightAgain: 'I-highlight muli',
    permissionDenied:
      'Walang pahintulot ang role mo para sa element na iyon. Pareho ang sinusunod na permissions ng assistant at ng interface.',
    productRowTitle: ({ name }) => `Row ng produkto: ${name}`,
    productRowBody: () => 'Ito ang live na row mula sa shared inventory table.',
    stockCellTitle: ({ name }) => `Stock sa kamay: ${name}`,
    stockCellBody: ({ stock, unit, target }) => `${stock} ${unit} ang stock · target stock ${target}.`,
    statusCellTitle: ({ name }) => `Status: ${name}`,
    statusCellBody: 'Awtomatikong kinukuha ang status mula sa stock at reorder level.',
    priceCellTitle: ({ name }) => `Unit price: ${name}`,
    priceCellBody: ({ price }) => `Ang nakatalang unit price ay ${price}.`,
    supplierCellTitle: ({ name }) => `Supplier: ${name}`,
    supplierCellBody: 'Galing ang supplier sa centralized supplier directory.',
    reorderCellTitle: ({ name }) => `Reorder level: ${name}`,
    reorderCellBody: ({ reorderLevel }) =>
      `Kapag umabot sa ${reorderLevel} ang stock, maitatanda itong low at gagawa ng recommendation.`,
    historyTitle: ({ name }) => `History ng movement: ${name}`,
    historyBody: 'Naka-filter ang table sa produktong ito. Nakatala dito ang bawat matagumpay na movement.',
    recommendationTitle: ({ name }) => `Pending recommendation: ${name}`,
    recommendationBody: 'Ang approval ay purchasing decision lamang. Hindi ito direktang nagdadagdag ng stock.',
    alertsTitle: 'Mga active stock alert',
    alertsBody: 'Awtomatikong nawawala ang alert kapag tumaas ang stock sa reorder level.',
    recommendationsListTitle: 'Mga pending reorder recommendation',
    recommendationsListBody:
      'Ang recommended quantity ay Max(Target Stock − Current Stock, 0). Administrator o Business Owner lamang ang makakapagdesisyon.',
    dashboardStatsTitle: 'Live na statistics ng inventory',
    dashboardStatsBody: 'Pareho ang binabasa ng mga card na ito at ng ibang page.',
    forecastTitle: 'Resulta ng forecast',
    forecastBody: 'Ito ay transparent historical moving average, hindi trained model.',
    navigationTitle: ({ label }) => `Page ng ${label}`,
    navigationBody: () => 'Nasa hiniling na page ka na. Sinuri muna ang role mo bago mag-navigate.',
    elementTitle: ({ label }) => `Narito: ${label}`,
    elementBody: 'Gamitin ang element na ito para magpatuloy. Ini-highlight lamang ito ng assistant — hindi ito nagki-click o nagsu-submit.',
    historySummaryTitle: ({ name }) => `Mga transaksyon para sa ${name}`,
    historySummaryBody: 'Makikita sa Transactions page ang bawat nakatalang movement ng produktong ito.',
    pageDeniedTitle: 'Restricted na page',
    pageDeniedBody: 'Walang access ang role mo sa page na ito, kaya hindi ito i-highlight ng assistant.',
    elements: ELEMENT_LABELS_TL,
  },
  ceb: {
    indicator: 'BIS',
    locating: 'Gibuksan ang page ug gipangita ang element…',
    notFound:
      'Wala nako makit-i ang element sa page nga kini. Tingali natago kini tungod sa role, filter, o modal nga wala pa maabli. Wala gayoy nabag-o.',
    dismiss: 'Isira',
    done: 'Sige',
    highlightAgain: 'I-highlight pag-usab',
    permissionDenied:
      'Wala kay permiso sa imong role para niadtong element. Parehas ang gisunod sa assistant ug sa interface.',
    productRowTitle: ({ name }) => `Row sa produkto: ${name}`,
    productRowBody: () => 'Kini ang live nga row gikan sa shared inventory table.',
    stockCellTitle: ({ name }) => `Stock sa kamot: ${name}`,
    stockCellBody: ({ stock, unit, target }) => `${stock} ${unit} ang stock · target stock ${target}.`,
    statusCellTitle: ({ name }) => `Status: ${name}`,
    statusCellBody: 'Awtomatikong kuhaon ang status gikan sa stock ug reorder level.',
    priceCellTitle: ({ name }) => `Unit price: ${name}`,
    priceCellBody: ({ price }) => `Ang natala nga unit price kay ${price}.`,
    supplierCellTitle: ({ name }) => `Supplier: ${name}`,
    supplierCellBody: 'Gikan ang supplier sa centralized supplier directory.',
    reorderCellTitle: ({ name }) => `Reorder level: ${name}`,
    reorderCellBody: ({ reorderLevel }) =>
      `Kung moabot sa ${reorderLevel} ang stock, markahan kini nga low ug mohimo og recommendation.`,
    historyTitle: ({ name }) => `History sa movement: ${name}`,
    historyBody: 'Na-filter ang table niini nga produkto. Natala dinhi ang matag malampuson nga movement.',
    recommendationTitle: ({ name }) => `Pending recommendation: ${name}`,
    recommendationBody: 'Ang approval purchasing decision lamang. Dili kini direktang magdugang og stock.',
    alertsTitle: 'Mga active stock alert',
    alertsBody: 'Awtomatikong mawala ang alert kung motaas ang stock ibabaw sa reorder level.',
    recommendationsListTitle: 'Mga pending reorder recommendation',
    recommendationsListBody:
      'Ang recommended quantity kay Max(Target Stock − Current Stock, 0). Administrator o Business Owner lamang ang makadesisyon.',
    dashboardStatsTitle: 'Live nga statistics sa inventory',
    dashboardStatsBody: 'Parehas ang gibasa niini nga mga card ug sa ubang page.',
    forecastTitle: 'Resulta sa forecast',
    forecastBody: 'Kini transparent historical moving average, dili trained model.',
    navigationTitle: ({ label }) => `Page sa ${label}`,
    navigationBody: () => 'Naa na ka sa gipangayo nga page. Gisusi una ang imong role sa wala pa mo-navigate.',
    elementTitle: ({ label }) => `Ania: ${label}`,
    elementBody: 'Gamita kini nga element para magpadayon. Gi-highlight lamang kini sa assistant — dili kini mo-click o mo-submit.',
    historySummaryTitle: ({ name }) => `Mga transaksyon para sa ${name}`,
    historySummaryBody: 'Makita sa Transactions page ang matag natala nga movement niini nga produkto.',
    pageDeniedTitle: 'Restricted nga page',
    pageDeniedBody: 'Wala kay access sa page nga kini, busa dili kini i-highlight sa assistant.',
    elements: ELEMENT_LABELS_CEB,
  },
};

export function visualText(language) {
  const base = VISUAL_TEXT.en;
  const localized = VISUAL_TEXT[language];
  if (!localized) return base;
  return {
    ...base,
    ...localized,
    elements: { ...base.elements, ...localized.elements },
  };
}

export function elementLabel(language, id) {
  const copy = visualText(language);
  return copy.elements[id] || copy.elements.navigation || id;
}

