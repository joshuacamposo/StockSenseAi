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
const LANGUAGE_MARKERS = {
  tl: [
    'ilan',
    'paano',
    'magkano',
    'ano',
    'saan',
    'natitira',
    'natitirang',
    'kulang',
    'bakit',
    'gusto',
    'pwede',
    'puwede',
    'ako',
    'mo',
    'iyong',
    'ating',
    'tingnan',
    'pakita',
    'ipakita',
    'tulungan',
    'idagdag',
    'magdagdag',
    'mag add',
    'idagdag',
    'i record',
    'rekumendasyon',
    'rekomendasyon',
    'ulat',
    'babala',
    'presyo',
    'kategorya',
    'imbentaryo',
    'mga',
    'ang',
    'ng',
  ],
  ceb: [
    'pila',
    'unsaon',
    'unsa',
    'asa',
    'ngano',
    'nahabilin',
    'kulang',
    'gusto',
    'pwede',
    'puwede',
    'ko',
    'imong',
    'tan awa',
    'ipakita',
    'tabangi',
    'idugang',
    'pagdugang',
    'mag add',
    'i record',
    'rekomendasyon',
    'report',
    'pasidaan',
    'presyo',
    'kategorya',
    'imbentaryo',
    'mga',
    'ang',
    'ug',
    'sa',
  ],
};

export function detectLanguageWithScore(rawText) {
  const normalized = normalizeText(rawText);
  const scores = { en: 0, tl: 0, ceb: 0 };

  if (!normalized) return { language: 'en', scores, hasMarkers: false };

  for (const language of ['tl', 'ceb']) {
    for (const marker of LANGUAGE_MARKERS[language]) {
      const target = normalizeText(marker);
      if (!target) continue;
      const pattern = new RegExp(`\\b${target}\\b`);
      if (pattern.test(normalized)) scores[language] += 1;
      else if (target.length >= 5 && normalized.includes(target)) scores[language] += 0.5;
    }
  }

  const hasMarkers = scores.tl > 0 || scores.ceb > 0;
  if (!hasMarkers) return { language: 'en', scores, hasMarkers };

  if (scores.ceb > scores.tl) return { language: 'ceb', scores, hasMarkers };
  if (scores.tl > scores.ceb) return { language: 'tl', scores, hasMarkers };
  // Tagalog and Cebuano share several markers. Prefer Cebuano when "pila"/"unsaon" appear,
  // otherwise Tagalog for the remaining shared cases.
  return normalized.includes('pila') || normalized.includes('unsaon')
    ? { language: 'ceb', scores, hasMarkers }
    : { language: 'tl', scores, hasMarkers };
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
