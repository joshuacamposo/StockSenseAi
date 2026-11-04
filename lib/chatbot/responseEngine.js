// The deterministic response engine used by both the chat widget and the automated test center.
// It never mutates state. It only reads the shared inventory snapshot and returns text plus an
// optional permitted navigation / walkthrough action.

import { classifyIntent } from './intentRecognizer';
import { getKnowledgeEntry, knowledgeKeyForIntent } from './knowledgeBase';
import { localizedKnowledge } from './kbTranslations';
import {
  RESPONSE_TEXT,
  STATUS_TEXT,
  statusText,
  t,
  uiText,
} from './languageDictionary';
import { getPage, canAccessPage, accessiblePages, PAGES } from './navigationHandler';
import { WALKTHROUGHS, getWalkthrough } from './walkthroughConfig';
import { calculateRecommendedQty, getStockStatus } from '../inventoryRules';
import { buildForecast, formatCoverage } from '../forecasting';
import { formatMoney, formatNumber } from '../format';

function unitLabel(language, product, value) {
  const unit = product?.unit || 'unit';
  const amount = formatNumber(value);
  if (language === 'en') return `${amount} ${unit}${Number(value) === 1 ? '' : 's'}`;
  return `${amount} ${unit}`;
}

function statusOf(product) {
  return getStockStatus(product);
}

function activeProducts(state) {
  return (state.products || []).filter((product) => product.active !== false);
}

function pendingRecommendationFor(state, productId) {
  return (
    (state.recommendations || []).find(
      (recommendation) =>
        recommendation.productId === productId && recommendation.status === 'pending'
    ) || null
  );
}

function formatSupplier(supplier) {
  if (!supplier) return null;
  return [supplier.contactPerson, supplier.phone, supplier.email].filter(Boolean).join(' · ');
}

const COPY = {
  en: {
    languageSet: "Okay — I'll continue in English.",
    stock: ({ name, sku, units, status, reorderLevel, targetStock, extra }) =>
      `${name} (${sku}) currently has ${units} on hand — ${status}. The reorder level is ${reorderLevel} and target stock is ${targetStock}. ${extra}`,
    stockExtra: ({ targetStock, stock, recommendedQty, isLow }) =>
      isLow
        ? `Rule-based recommendation: Max(${targetStock} − ${stock}, 0) = ${recommendedQty} units.`
        : 'No reorder is recommended while stock remains above the reorder level.',
    price: ({ name, price, unit, stock, value }) =>
      `${name} costs ${price} per ${unit}. The current stock of ${stock} ${unit}${stock === 1 ? '' : 's'} has an estimated value of ${value}.`,
    supplier: ({ name, supplier, details }) =>
      supplier
        ? `${name} is supplied by ${supplier}. Contact: ${details}.`
        : `${name} has no supplier assigned in the current local state.`,
    reorderLevel: ({ name, reorderLevel, units, status }) =>
      `The reorder level for ${name} is ${reorderLevel}. Current stock is ${units}, so the product is ${status}.`,
    targetStock: ({ name, targetStock, stock, recommendedQty }) =>
      `The target stock for ${name} is ${targetStock}. Recommended quantity = Max(${targetStock} − ${stock}, 0) = ${recommendedQty} units.`,
    productRecommendation: ({ name, recommendedQty, currentStock, targetStock, isPending }) =>
      isPending
        ? `There is a pending reorder recommendation for ${name}: ${recommendedQty} units. It uses Max(Target ${targetStock} − Current ${currentStock}, 0). Approval records a purchasing decision only — it does not add stock.`
        : `There is no pending reorder recommendation for ${name} right now. The rule would calculate Max(${targetStock} − ${currentStock}, 0) = ${recommendedQty} units, but a recommendation is only generated when stock is at or below the reorder level.`,
    productStatus: ({ name, status, stock, units, reorderLevel, rule, extra }) =>
      `${name} is currently ${status}. Current stock is ${units}. The status rule is: ${rule}. ${extra}`,
    statusRuleLow: ({ stock, reorderLevel }) =>
      `${stock} is at or below the reorder level of ${reorderLevel}`,
    statusRuleOut: () => 'stock is zero',
    statusRuleSufficient: ({ reorderLevel }) => `stock is above the reorder level of ${reorderLevel}`,
    details: ({ name, sku, category, status, units, reorderLevel, targetStock, price, unit, supplier }) =>
      [
        `${name} (${sku})`,
        `• Category: ${category}`,
        `• Status: ${status}`,
        `• Current stock: ${units}`,
        `• Reorder level: ${reorderLevel}`,
        `• Target stock: ${targetStock}`,
        `• Unit price: ${price} per ${unit}`,
        `• Supplier: ${supplier || 'Unassigned'}`,
      ].join('\n'),
    lowStockTitle: ({ count }) =>
      `There ${count === 1 ? 'is' : 'are'} ${count} active product${count === 1 ? '' : 's'} at or below the reorder level:`,
    lowStockItem: ({ name, sku, units, reorderLevel, recommendedQty }) =>
      `• ${name} (${sku}) — ${units} on hand; reorder level ${reorderLevel}; recommended ${recommendedQty} units.`,
    noLowStock: () => t('en', 'noLowStock'),
    outTitle: ({ count }) =>
      `There ${count === 1 ? 'is' : 'are'} ${count} active product${count === 1 ? '' : 's'} with zero stock:`,
    outItem: ({ name, sku, reorderLevel, recommendedQty }) =>
      `• ${name} (${sku}) — 0 units; reorder level ${reorderLevel}; recommended ${recommendedQty} units.`,
    noOut: () => t('en', 'noOutOfStock'),
    recTitle: ({ count }) =>
      `There ${count === 1 ? 'is' : 'are'} ${count} pending reorder recommendation${count === 1 ? '' : 's'}:`,
    recItem: ({ name, sku, currentStock, targetStock, recommendedQty }) =>
      `• ${name} (${sku}) — Max(${targetStock} − ${currentStock}, 0) = ${recommendedQty} units.`,
    noPending: () => t('en', 'noPendingRecommendations'),
    summary: ({ totalProducts, totalUnits, inventoryValue, low, out, pending, health }) =>
      [
        'Current inventory summary from the shared local state:',
        `• Active products: ${totalProducts}`,
        `• Total units on hand: ${totalUnits}`,
        `• Estimated inventory value: ${inventoryValue}`,
        `• Low stock: ${low}`,
        `• Out of stock: ${out}`,
        `• Pending reorder recommendations: ${pending}`,
        `• Stock health: ${health}% of active products are above their reorder levels.`,
      ].join('\n'),
    forecastOk: ({ name, periodDays, horizonDays, total, average, projected, coverage }) =>
      `Historical forecast for ${name} using the last ${periodDays} days: ${total} stock-out units, average daily demand ${average} units/day. Projected demand for the next ${horizonDays} days is about ${projected} units. Days of stock coverage: ${coverage}. This is a transparent historical moving average, not a trained machine-learning model.`,
    forecastNone: ({ name, periodDays }) =>
      `There are no stock-out transactions for ${name} in the last ${periodDays} days, so a historical forecast cannot be generated. Record stock-out transactions or choose a longer period on the Forecasting page.`,
    navigate: ({ label }) => `Opening the ${label} page now.`,
    navigateDenied: ({ pages }) =>
      `${t('en', 'navigationDenied')} Pages available to your role: ${pages}.`,
    tourStart: ({ title }) =>
      `Starting the “${title}” walkthrough. I will highlight the real interface elements — follow each step at your own pace.`,
    tourDenied: () => t('en', 'permissionDenied'),
    tourList: ({ tours }) =>
      `I can guide you through these real workflows:\n${tours.map((tour) => `• ${tour.title}`).join('\n')}\nAsk, for example, “guide me through stock-in” or “how do I add a product”.`,
    permissionDenied: () => t('en', 'permissionDenied'),
    safetyApprove:
      "I can't approve or reject recommendations from chat. Open Reorder Recommendations and use the Approve or Reject button — only the Administrator and Business Owner can decide. Approval records a purchase decision and never adds stock.",
    safetyDelete:
      "I can't delete or deactivate products from chat. Administrators and Business Owners can deactivate a product from the Products page; stock history is preserved and deactivation is not deletion.",
    safetyEdit:
      "I can't edit product details, prices, or stock balances from chat. Use the Products page for product information and Stock-In / Stock-Out for every stock change.",
    safetyGeneric:
      "I can't change inventory directly from chat. Stock balances only change through validated Stock-In or Stock-Out transactions, and every product or supplier change goes through the same role-checked interface.",
    helpIntro: () =>
      `${localizedKnowledge('en', 'helper', getKnowledgeEntry('help')?.answer || '')}\n\nTry asking:\n• Check Product Stock\n• View Low-Stock Items\n• Explain Reorder Recommendations\n• Open the Reports page\n• Guide me through stock-in`,
    unknown: ({ suggestions }) =>
      `${t('en', 'unclear')}${suggestions ? ` Did you mean: ${suggestions}?` : ''}`,
    clear: 'Conversation cleared. The assistant still reads the same live local inventory state.',
    askProduct: ({ products }) =>
      `Which product do you mean? Active products include: ${products}.`,
    ambiguous: ({ matches }) =>
      `I found more than one possible product: ${matches}. Please include the SKU or the full product name.`,
    unknownProduct: ({ suggestions }) =>
      `${t('en', 'unknownProduct')}${suggestions ? ` Did you mean: ${suggestions}?` : ''}`,
    roleNote: ({ role }) => `Your demo role is ${role}. The assistant checks the same permissions as the interface.`,
  },
  tl: {
    languageSet: 'Sige — magpapatuloy tayo sa Tagalog.',
    stock: ({ name, sku, units, status, reorderLevel, targetStock, extra }) =>
      `Ang ${name} (${sku}) ay may ${units} sa stock — ${status}. Ang reorder level ay ${reorderLevel} at target stock ay ${targetStock}. ${extra}`,
    stockExtra: ({ targetStock, stock, recommendedQty, isLow }) =>
      isLow
        ? `Rekomendasyon batay sa rule: Max(${targetStock} − ${stock}, 0) = ${recommendedQty} units.`
        : 'Walang reorder na inirerekomenda habang mataas pa sa reorder level ang stock.',
    price: ({ name, price, unit, stock, value }) =>
      `Ang ${name} ay nagkakahalaga ng ${price} bawat ${unit}. Ang kasalukuyang ${stock} ${unit} ay may tinatayang halaga na ${value}.`,
    supplier: ({ name, supplier, details }) =>
      supplier
        ? `Ang supplier ng ${name} ay ${supplier}. Contact: ${details}.`
        : `Walang naka-assign na supplier ang ${name} sa kasalukuyang local state.`,
    reorderLevel: ({ name, reorderLevel, units, status }) =>
      `Ang reorder level ng ${name} ay ${reorderLevel}. Ang kasalukuyang stock ay ${units}, kaya ang status ay ${status}.`,
    targetStock: ({ name, targetStock, stock, recommendedQty }) =>
      `Ang target stock ng ${name} ay ${targetStock}. Recommended quantity = Max(${targetStock} − ${stock}, 0) = ${recommendedQty} units.`,
    productRecommendation: ({ name, recommendedQty, currentStock, targetStock, isPending }) =>
      isPending
        ? `May pending reorder recommendation para sa ${name}: ${recommendedQty} units. Ginagamit nito ang Max(Target ${targetStock} − Current ${currentStock}, 0). Ang approval ay purchasing decision lamang — hindi ito nagdadagdag ng stock.`
        : `Walang pending reorder recommendation para sa ${name} ngayon. Ang rule ay magbibigay ng Max(${targetStock} − ${currentStock}, 0) = ${recommendedQty} units, ngunit gumagawa lamang ng recommendation kapag ang stock ay nasa o mas mababa sa reorder level.`,
    productStatus: ({ name, status, stock, units, reorderLevel, rule, extra }) =>
      `Ang ${name} ay kasalukuyang ${status}. Ang stock ay ${units}. Ang status rule: ${rule}. ${extra}`,
    statusRuleLow: ({ stock, reorderLevel }) =>
      `ang ${stock} ay katumbas o mas mababa sa reorder level na ${reorderLevel}`,
    statusRuleOut: () => 'zero ang stock',
    statusRuleSufficient: ({ reorderLevel }) =>
      `ang stock ay mas mataas sa reorder level na ${reorderLevel}`,
    details: ({ name, sku, category, status, units, reorderLevel, targetStock, price, unit, supplier }) =>
      [
        `${name} (${sku})`,
        `• Kategorya: ${category}`,
        `• Status: ${status}`,
        `• Kasalukuyang stock: ${units}`,
        `• Reorder level: ${reorderLevel}`,
        `• Target stock: ${targetStock}`,
        `• Unit price: ${price} bawat ${unit}`,
        `• Supplier: ${supplier || 'Walang naka-assign'}`,
      ].join('\n'),
    lowStockTitle: ({ count }) =>
      `May ${count} active product${count === 1 ? '' : 's'} na nasa o mas mababa sa reorder level:`,
    lowStockItem: ({ name, sku, units, reorderLevel, recommendedQty }) =>
      `• ${name} (${sku}) — ${units} ang natitira; reorder level ${reorderLevel}; rekomendadong ${recommendedQty} units.`,
    noLowStock: () => t('tl', 'noLowStock'),
    outTitle: ({ count }) =>
      `May ${count} active product${count === 1 ? '' : 's'} na zero ang stock:`,
    outItem: ({ name, sku, reorderLevel, recommendedQty }) =>
      `• ${name} (${sku}) — 0 units; reorder level ${reorderLevel}; rekomendadong ${recommendedQty} units.`,
    noOut: () => t('tl', 'noOutOfStock'),
    recTitle: ({ count }) =>
      `May ${count} pending reorder recommendation${count === 1 ? '' : 's'}:`,
    recItem: ({ name, sku, currentStock, targetStock, recommendedQty }) =>
      `• ${name} (${sku}) — Max(${targetStock} − ${currentStock}, 0) = ${recommendedQty} units.`,
    noPending: () => t('tl', 'noPendingRecommendations'),
    summary: ({ totalProducts, totalUnits, inventoryValue, low, out, pending, health }) =>
      [
        'Kasalukuyang inventory summary mula sa shared local state:',
        `• Active products: ${totalProducts}`,
        `• Kabuuang units: ${totalUnits}`,
        `• Tinatayang inventory value: ${inventoryValue}`,
        `• Low stock: ${low}`,
        `• Out of stock: ${out}`,
        `• Pending reorder recommendations: ${pending}`,
        `• Stock health: ${health}% ng active products ang mataas sa reorder level.`,
      ].join('\n'),
    forecastOk: ({ name, periodDays, horizonDays, total, average, projected, coverage }) =>
      `Historical forecast para sa ${name} gamit ang huling ${periodDays} araw: ${total} stock-out units, average daily demand ${average} units/araw. Ang projected demand sa susunod na ${horizonDays} araw ay humigit-kumulang ${projected} units. Days of stock coverage: ${coverage}. Ito ay transparent historical moving average, hindi trained machine-learning model.`,
    forecastNone: ({ name, periodDays }) =>
      `Walang stock-out transactions para sa ${name} sa huling ${periodDays} araw, kaya walang historical forecast. Mag-record ng stock-out o pumili ng mas mahabang period sa Forecasting page.`,
    navigate: ({ label }) => `Binubuksan na ang ${label} page.`,
    navigateDenied: ({ pages }) =>
      `${t('tl', 'navigationDenied')} Mga page na available sa iyong role: ${pages}.`,
    tourStart: ({ title }) =>
      `Sinisimulan ang “${title}” walkthrough. Iha-highlight ko ang totoong interface elements — sundan ang bawat step sa sariling bilis.`,
    tourDenied: () => t('tl', 'permissionDenied'),
    tourList: ({ tours }) =>
      `Magagawa kong gabayan ka sa mga workflow na ito:\n${tours.map((tour) => `• ${tour.title}`).join('\n')}\nHalimbawa, subukan ang “gabayan mo ako sa stock-in” o “paano mag-add ng product”.`,
    permissionDenied: () => t('tl', 'permissionDenied'),
    safetyApprove:
      'Hindi ako makaka-approve o makaka-reject ng recommendations mula sa chat. Buksan ang Reorder Recommendations at gamitin ang Approve o Reject button — Administrator at Business Owner lamang ang makakapagdesisyon. Ang approval ay purchase decision lamang at hindi nagdadagdag ng stock.',
    safetyDelete:
      'Hindi ako makakapag-delete o makakapag-deactivate ng produkto mula sa chat. Ang Administrator at Business Owner ay makakapag-deactivate mula sa Products page; mananatili ang stock history at hindi ito deletion.',
    safetyEdit:
      'Hindi ako makakapag-edit ng product details, presyo, o stock mula sa chat. Gamitin ang Products page para sa product information at Stock-In / Stock-Out para sa bawat stock change.',
    safetyGeneric:
      'Hindi ako makakabago ng inventory nang direkta mula sa chat. Ang stock ay nagbabago lamang sa validated Stock-In o Stock-Out transactions, at ang bawat product o supplier change ay dumadaan sa parehong role-checked interface.',
    helpIntro: () =>
      `${localizedKnowledge('tl', 'helper', getKnowledgeEntry('help')?.answer || '')}\n\nSubukan ang:\n• Ilan ang natitirang Bond Paper?\n• Ipakita ang low-stock items\n• Ipaliwanag ang reorder recommendations\n• Buksan ang Reports page\n• Gabayan mo ako sa stock-in`,
    unknown: ({ suggestions }) =>
      `${t('tl', 'unclear')}${suggestions ? ` Ang ibig mo bang sabihin: ${suggestions}?` : ''}`,
    clear: 'Na-clear na ang usapan. Ginagamit pa rin ng assistant ang parehong live local inventory state.',
    askProduct: ({ products }) =>
      `Aling produkto ang tinutukoy mo? Kasama sa active products: ${products}.`,
    ambiguous: ({ matches }) =>
      `May nakita akong higit sa isang posibleng produkto: ${matches}. Pakilagay ang SKU o buong pangalan.`,
    unknownProduct: ({ suggestions }) =>
      `${t('tl', 'unknownProduct')}${suggestions ? ` Ang ibig mo bang sabihin: ${suggestions}?` : ''}`,
    roleNote: ({ role }) => `Ang demo role mo ay ${role}. Pareho ang sinusuring permissions ng assistant at ng interface.`,
  },
  ceb: {
    languageSet: 'Sige — magpadayon kita sa Cebuano.',
    stock: ({ name, sku, units, status, reorderLevel, targetStock, extra }) =>
      `Ang ${name} (${sku}) naay ${units} sa stock — ${status}. Ang reorder level ${reorderLevel} ug target stock ${targetStock}. ${extra}`,
    stockExtra: ({ targetStock, stock, recommendedQty, isLow }) =>
      isLow
        ? `Rekomendasyon base sa rule: Max(${targetStock} − ${stock}, 0) = ${recommendedQty} units.`
        : 'Walay reorder nga girekomenda samtang taas pa sa reorder level ang stock.',
    price: ({ name, price, unit, stock, value }) =>
      `Ang ${name} nagkantidad og ${price} kada ${unit}. Ang kasamtangang ${stock} ${unit} adunay gibanabana nga bili nga ${value}.`,
    supplier: ({ name, supplier, details }) =>
      supplier
        ? `Ang supplier sa ${name} kay ${supplier}. Contact: ${details}.`
        : `Walay naka-assign nga supplier ang ${name} sa kasamtangang local state.`,
    reorderLevel: ({ name, reorderLevel, units, status }) =>
      `Ang reorder level sa ${name} kay ${reorderLevel}. Ang kasamtangang stock ${units}, busa ang status ${status}.`,
    targetStock: ({ name, targetStock, stock, recommendedQty }) =>
      `Ang target stock sa ${name} kay ${targetStock}. Recommended quantity = Max(${targetStock} − ${stock}, 0) = ${recommendedQty} units.`,
    productRecommendation: ({ name, recommendedQty, currentStock, targetStock, isPending }) =>
      isPending
        ? `Naay pending reorder recommendation para sa ${name}: ${recommendedQty} units. Gigamit niini ang Max(Target ${targetStock} − Current ${currentStock}, 0). Ang approval purchasing decision lamang — dili kini magdugang og stock.`
        : `Walay pending reorder recommendation para sa ${name} karon. Ang rule mohatag og Max(${targetStock} − ${currentStock}, 0) = ${recommendedQty} units, apan mohimo lamang og recommendation kung ang stock naa sa o ubos sa reorder level.`,
    productStatus: ({ name, status, stock, units, reorderLevel, rule, extra }) =>
      `Ang ${name} kasamtangang ${status}. Ang stock ${units}. Ang status rule: ${rule}. ${extra}`,
    statusRuleLow: ({ stock, reorderLevel }) =>
      `ang ${stock} katumbas o ubos sa reorder level nga ${reorderLevel}`,
    statusRuleOut: () => 'zero ang stock',
    statusRuleSufficient: ({ reorderLevel }) => `ang stock mas taas sa reorder level nga ${reorderLevel}`,
    details: ({ name, sku, category, status, units, reorderLevel, targetStock, price, unit, supplier }) =>
      [
        `${name} (${sku})`,
        `• Kategorya: ${category}`,
        `• Status: ${status}`,
        `• Kasamtangang stock: ${units}`,
        `• Reorder level: ${reorderLevel}`,
        `• Target stock: ${targetStock}`,
        `• Unit price: ${price} kada ${unit}`,
        `• Supplier: ${supplier || 'Walay naka-assign'}`,
      ].join('\n'),
    lowStockTitle: ({ count }) =>
      `Naay ${count} active product${count === 1 ? '' : 's'} nga naa sa o ubos sa reorder level:`,
    lowStockItem: ({ name, sku, units, reorderLevel, recommendedQty }) =>
      `• ${name} (${sku}) — ${units} ang nahabilin; reorder level ${reorderLevel}; girekomenda ${recommendedQty} units.`,
    noLowStock: () => t('ceb', 'noLowStock'),
    outTitle: ({ count }) =>
      `Naay ${count} active product${count === 1 ? '' : 's'} nga zero ang stock:`,
    outItem: ({ name, sku, reorderLevel, recommendedQty }) =>
      `• ${name} (${sku}) — 0 units; reorder level ${reorderLevel}; girekomenda ${recommendedQty} units.`,
    noOut: () => t('ceb', 'noOutOfStock'),
    recTitle: ({ count }) =>
      `Naay ${count} pending reorder recommendation${count === 1 ? '' : 's'}:`,
    recItem: ({ name, sku, currentStock, targetStock, recommendedQty }) =>
      `• ${name} (${sku}) — Max(${targetStock} − ${currentStock}, 0) = ${recommendedQty} units.`,
    noPending: () => t('ceb', 'noPendingRecommendations'),
    summary: ({ totalProducts, totalUnits, inventoryValue, low, out, pending, health }) =>
      [
        'Kasamtangang inventory summary gikan sa shared local state:',
        `• Active products: ${totalProducts}`,
        `• Total units: ${totalUnits}`,
        `• Gibanabana nga inventory value: ${inventoryValue}`,
        `• Low stock: ${low}`,
        `• Out of stock: ${out}`,
        `• Pending reorder recommendations: ${pending}`,
        `• Stock health: ${health}% sa active products ang taas sa reorder level.`,
      ].join('\n'),
    forecastOk: ({ name, periodDays, horizonDays, total, average, projected, coverage }) =>
      `Historical forecast para sa ${name} gamit ang miaging ${periodDays} ka adlaw: ${total} stock-out units, average daily demand ${average} units/adlaw. Ang projected demand sa sunod ${horizonDays} ka adlaw mga ${projected} units. Days of stock coverage: ${coverage}. Kini transparent historical moving average, dili trained machine-learning model.`,
    forecastNone: ({ name, periodDays }) =>
      `Walay stock-out transactions para sa ${name} sa miaging ${periodDays} ka adlaw, busa walay historical forecast. Pag-record og stock-out o pagpili og mas taas nga period sa Forecasting page.`,
    navigate: ({ label }) => `Gibuksan na ang ${label} page.`,
    navigateDenied: ({ pages }) =>
      `${t('ceb', 'navigationDenied')} Mga page nga available sa imong role: ${pages}.`,
    tourStart: ({ title }) =>
      `Gisugdan ang “${title}” walkthrough. I-highlight nako ang tinuod nga interface elements — sunda ang matag step sa imong kaugalingong tulin.`,
    tourDenied: () => t('ceb', 'permissionDenied'),
    tourList: ({ tours }) =>
      `Makatabang ko sa paggiya niini nga workflows:\n${tours.map((tour) => `• ${tour.title}`).join('\n')}\nPananglitan, sulayi ang “giyahan ko sa stock-in” o “unsaon pag add ug product”.`,
    permissionDenied: () => t('ceb', 'permissionDenied'),
    safetyApprove:
      'Dili ko maka-approve o maka-reject sa recommendations gikan sa chat. Ablihi ang Reorder Recommendations ug gamita ang Approve o Reject button — Administrator ug Business Owner lamang ang makadesisyon. Ang approval purchase decision lamang ug dili magdugang og stock.',
    safetyDelete:
      'Dili ko makahimo og delete o deactivate sa produkto gikan sa chat. Ang Administrator ug Business Owner makahimo og deactivate gikan sa Products page; mapreserba ang stock history ug dili kini deletion.',
    safetyEdit:
      'Dili ko makahimo og edit sa product details, presyo, o stock gikan sa chat. Gamita ang Products page para sa product information ug Stock-In / Stock-Out para sa matag stock change.',
    safetyGeneric:
      'Dili ko makabag-o sa inventory direkta gikan sa chat. Ang stock mobag-o lamang pinaagi sa validated Stock-In o Stock-Out transactions, ug ang matag product o supplier change moagi sa parehas nga role-checked interface.',
    helpIntro: () =>
      `${localizedKnowledge('ceb', 'helper', getKnowledgeEntry('help')?.answer || '')}\n\nSulayi ang:\n• Pila ang nahabilin nga Bond Paper?\n• Ipakita ang low-stock items\n• Ipaliwanag ang reorder recommendations\n• Ablihi ang Reports page\n• Giyahan ko sa stock-in`,
    unknown: ({ suggestions }) =>
      `${t('ceb', 'unclear')}${suggestions ? ` Ang buot ba nimong ipasabot: ${suggestions}?` : ''}`,
    clear: 'Nalimpyo na ang panag-istoryahanay. Gigamit gihapon sa assistant ang parehas nga live local inventory state.',
    askProduct: ({ products }) =>
      `Hain nga produkto ang buot nimong pasabot? Apil sa active products: ${products}.`,
    ambiguous: ({ matches }) =>
      `Naay labaw sa usa ka posibleng produkto: ${matches}. Palihug ibutang ang SKU o tibuok nga ngalan.`,
    unknownProduct: ({ suggestions }) =>
      `${t('ceb', 'unknownProduct')}${suggestions ? ` Ang buot ba nimong ipasabot: ${suggestions}?` : ''}`,
    roleNote: ({ role }) => `Ang imong demo role kay ${role}. Parehas ang gisusi nga permissions sa assistant ug sa interface.`,
  },
};

function copy(language, key) {
  return COPY[language]?.[key] || COPY.en[key];
}

function quickReplies(language) {
  return uiText(language).welcomeSuggestions.slice(0, 3);
}

function navigateAction(page, user, language) {
  if (!page || !canAccessPage(user, page.key)) return null;
  return {
    type: 'navigate',
    href: page.href,
    label: language === 'tl' ? `Buksan ang ${page.label}` : language === 'ceb' ? `Ablihi ang ${page.label}` : `Open ${page.label}`,
  };
}

function tourAction(tour, user, language) {
  if (!tour) return null;
  if (tour.permission && !canAccessPage(user, tour.permission) && !canAccessPage(user, 'dashboard')) {
    return null;
  }
  if (tour.permission && user) {
    const page = Object.values(PAGES).find((item) => item.permission === tour.permission);
    if (page && !canAccessPage(user, page.key)) return null;
  }
  return {
    type: 'tour',
    tourId: tour.id,
    label:
      language === 'tl'
        ? 'Simulan ang walkthrough'
        : language === 'ceb'
          ? 'Sugdi ang walkthrough'
          : 'Start walkthrough',
  };
}

function makeResult(language, text, extras = {}) {
  return {
    ok: true,
    language,
    text,
    quickReplies: extras.quickReplies || quickReplies(language),
    action: extras.action || null,
    intent: extras.intent || null,
    lastProductId: extras.lastProductId || null,
    meta: extras.meta || {},
  };
}

function productUnits(product, language) {
  return unitLabel(language, product, Number(product.stock) || 0);
}

function productStockExtra(product, state, language) {
  const status = statusOf(product);
  const recommendedQty = calculateRecommendedQty(product);
  const pending = pendingRecommendationFor(state, product.id);
  return copy(language, 'stockExtra')({
    targetStock: product.targetStock,
    stock: product.stock,
    recommendedQty: pending?.recommendedQty ?? recommendedQty,
    isLow: status.key !== 'sufficient',
  });
}

function answerProductStock(product, state, language) {
  const status = statusOf(product);
  const recommendedQty = calculateRecommendedQty(product);
  const pending = pendingRecommendationFor(state, product.id);
  return copy(language, 'stock')({
    name: product.name,
    sku: product.sku,
    units: productUnits(product, language),
    status: statusText(language, status.key),
    reorderLevel: product.reorderLevel,
    targetStock: product.targetStock,
    extra: copy(language, 'stockExtra')({
      targetStock: product.targetStock,
      stock: product.stock,
      recommendedQty: pending?.recommendedQty ?? recommendedQty,
      isLow: status.key !== 'sufficient',
    }),
  });
}

function answerProductStatus(product, state, language) {
  const status = statusOf(product);
  const rule =
    status.key === 'out'
      ? copy(language, 'statusRuleOut')({})
      : status.key === 'low'
        ? copy(language, 'statusRuleLow')({ stock: product.stock, reorderLevel: product.reorderLevel })
        : copy(language, 'statusRuleSufficient')({ reorderLevel: product.reorderLevel });
  return copy(language, 'productStatus')({
    name: product.name,
    status: statusText(language, status.key),
    stock: product.stock,
    units: productUnits(product, language),
    reorderLevel: product.reorderLevel,
    rule,
    extra: productStockExtra(product, state, language),
  });
}

function answerProductDetails(product, state, language) {
  const status = statusOf(product);
  const supplier = (state.suppliers || []).find((item) => item.id === product.supplierId);
  const currency = state.settings?.currency || '₱';
  return copy(language, 'details')({
    name: product.name,
    sku: product.sku,
    category: product.category,
    status: statusText(language, status.key),
    units: productUnits(product, language),
    reorderLevel: product.reorderLevel,
    targetStock: product.targetStock,
    price: formatMoney(product.unitPrice, currency),
    unit: product.unit,
    supplier: supplier?.name || null,
  });
}

function answerProductPrice(product, state, language) {
  const currency = state.settings?.currency || '₱';
  return copy(language, 'price')({
    name: product.name,
    price: formatMoney(product.unitPrice, currency),
    unit: product.unit,
    stock: product.stock,
    value: formatMoney((Number(product.stock) || 0) * (Number(product.unitPrice) || 0), currency),
  });
}

function answerProductSupplier(product, state, language) {
  const supplier = (state.suppliers || []).find((item) => item.id === product.supplierId);
  return copy(language, 'supplier')({
    name: product.name,
    supplier: supplier?.name || null,
    details: formatSupplier(supplier),
  });
}

function answerProductRecommendation(product, state, language) {
  const pending = pendingRecommendationFor(state, product.id);
  return copy(language, 'productRecommendation')({
    name: product.name,
    recommendedQty: pending?.recommendedQty ?? calculateRecommendedQty(product),
    currentStock: product.stock,
    targetStock: product.targetStock,
    isPending: Boolean(pending),
  });
}

function answerForecast(product, state, language) {
  const settings = state.settings || {};
  const periodDays = Number(settings.forecastPeriodDays) || 30;
  const horizonDays = Number(settings.forecastHorizonDays) || 30;
  const forecast = buildForecast({
    product,
    transactions: state.transactions || [],
    periodDays,
    horizonDays,
  });
  const page = getPage('forecasting');
  const action = navigateAction(page, state.user || null, language);

  if (!forecast.ok) {
    return {
      text: copy(language, 'forecastNone')({ name: product.name, periodDays }),
      action,
      lastProductId: product.id,
    };
  }

  return {
    text: copy(language, 'forecastOk')({
      name: product.name,
      periodDays,
      horizonDays,
      total: formatNumber(forecast.totalStockOut),
      average: forecast.averageDailyDemand.toFixed(2),
      projected: formatNumber(Math.round(forecast.projectedDemand)),
      coverage: formatCoverage(forecast.daysOfCoverage),
    }),
    action,
    lastProductId: product.id,
  };
}

export function respond(input = {}) {
  const {
    text = '',
    state = {},
    user = null,
    language: currentLanguage = 'en',
    lastProductId = null,
  } = input;

  const products = state.products || [];
  const classification = classifyIntent(text, { products, lastProductId });

  let language = currentLanguage;
  if (classification.hasLanguageMarkers) language = classification.language;
  if (classification.explicitLanguage) language = classification.explicitLanguage;

  const product =
    classification.product ||
    (lastProductId ? products.find((item) => item.id === lastProductId) : null);

  const result = (textValue, extras = {}) =>
    makeResult(language, textValue, { intent: classification.intent, ...extras });

  switch (classification.intent) {
    case 'empty':
      return result(copy(language, 'askProduct')({ products: activeProducts(state).slice(0, 6).map((item) => item.name).join(', ') || '—' }));

    case 'language':
      return result(copy(language, 'languageSet'), { quickReplies: quickReplies(language) });

    case 'greeting': {
      const roleLine = user ? ` ${copy(language, 'roleNote')({ role: user.title || user.role })}` : '';
      return result(`${t(language, 'greeting')}${roleLine}`);
    }

    case 'thanks':
      return result(t(language, 'thanks'));

    case 'clear_chat':
      return result(copy(language, 'clear'));

    case 'navigate': {
      const page = classification.page;
      if (!page) return result(copy(language, 'unknown')({}));
      if (!canAccessPage(user, page.key)) {
        const pages = accessiblePages(user).map((item) => item.label).join(', ') || 'none';
        return result(copy(language, 'navigateDenied')({ pages }), {
          intent: classification.intent,
        });
      }
      return result(copy(language, 'navigate')({ label: page.label }), {
        action: navigateAction(page, user, language),
      });
    }

    case 'tour': {
      const tour = classification.tour;
      const action = tourAction(tour, user, language);
      if (!action) {
        return result(copy(language, 'tourDenied')(), { intent: classification.intent });
      }
      return result(copy(language, 'tourStart')({ title: tour.title }), {
        action,
        meta: { tour: tour.id },
      });
    }

    case 'tour_list': {
      const tours = WALKTHROUGHS.filter((item) => tourAction(item, user, language)).slice(0, 8);
      if (tours.length === 0) {
        return result(copy(language, 'permissionDenied')(), { intent: classification.intent });
      }
      return result(copy(language, 'tourList')({ tours }), {
        intent: classification.intent,
        meta: { tours: tours.map((item) => item.id) },
      });
    }

    case 'safety_action': {
      const normalized = classification.normalized;
      const wantsApprove = /approve|reject|aprobahan/.test(normalized);
      const wantsDelete = /delete|remove|deactivate|tangtangon/.test(normalized);
      const wantsEdit = /edit|update|change|set|price|presyo/.test(normalized);
      const wantsStock = /stock|increase|add|restock|deduct|reduce|idagdag|idugang|bawasan/.test(
        normalized
      );

      if (wantsApprove) {
        const action = tourAction(getWalkthrough('approve-reorder'), user, language);
        if (!action) return result(copy(language, 'permissionDenied')(), { intent: 'safety_action' });
        return result(copy(language, 'safetyApprove'), { action });
      }
      if (wantsDelete) {
        return result(copy(language, 'safetyDelete'), {
          action: navigateAction(getPage('products'), user, language),
        });
      }
      if (wantsEdit) {
        return result(copy(language, 'safetyEdit'), {
          action: tourAction(getWalkthrough('edit-product'), user, language),
        });
      }
      if (wantsStock) {
        const tour = getWalkthrough('stock-in');
        return result(t(language, 'safetyAdd'), {
          action: tourAction(tour, user, language),
        });
      }
      return result(copy(language, 'safetyGeneric'), {
        action: navigateAction(getPage('products'), user, language),
      });
    }

    case 'product_ambiguous': {
      const matches = classification.productResolution.matches || [];
      return result(
        copy(language, 'ambiguous')({
          matches: matches.map((item) => `${item.name} (${item.sku})`).join(', '),
        })
      );
    }

    case 'product_lookup': {
      const suggestions = classification.productResolution.suggestions || [];
      if (suggestions.length > 0) {
        return result(
          copy(language, 'unknownProduct')({
            suggestions: suggestions.map((item) => `${item.name} (${item.sku})`).join(', '),
          })
        );
      }
      const names = activeProducts(state)
        .slice(0, 6)
        .map((item) => `${item.name} (${item.sku})`)
        .join(', ');
      return result(copy(language, 'askProduct')({ products: names || '—' }));
    }

    case 'product_unknown':
      return result(copy(language, 'unknownProduct')({}));

    case 'product_stock':
      if (!product) return result(copy(language, 'unknownProduct')({}));
      return result(answerProductStock(product, state, language), {
        lastProductId: product.id,
        meta: { productId: product.id, status: statusOf(product).key },
      });

    case 'product_status':
      if (!product) return result(copy(language, 'unknownProduct')({}));
      return result(answerProductStatus(product, state, language), {
        lastProductId: product.id,
        meta: { productId: product.id, status: statusOf(product).key },
      });

    case 'product_price':
      if (!product) return result(copy(language, 'unknownProduct')({}));
      return result(answerProductPrice(product, state, language), {
        lastProductId: product.id,
      });

    case 'product_supplier':
      if (!product) return result(copy(language, 'unknownProduct')({}));
      return result(answerProductSupplier(product, state, language), {
        lastProductId: product.id,
      });

    case 'product_reorder_level':
      if (!product) return result(copy(language, 'unknownProduct')({}));
      return result(
        copy(language, 'reorderLevel')({
          name: product.name,
          reorderLevel: product.reorderLevel,
          units: productUnits(product, language),
          status: statusText(language, statusOf(product).key),
        }),
        { lastProductId: product.id }
      );

    case 'product_target':
      if (!product) return result(copy(language, 'unknownProduct')({}));
      return result(
        copy(language, 'targetStock')({
          name: product.name,
          targetStock: product.targetStock,
          stock: product.stock,
          recommendedQty: calculateRecommendedQty(product),
        }),
        { lastProductId: product.id }
      );

    case 'product_recommendation':
      if (!product) return result(copy(language, 'unknownProduct')({}));
      return result(answerProductRecommendation(product, state, language), {
        lastProductId: product.id,
      });

    case 'product_details':
      if (!product) return result(copy(language, 'unknownProduct')({}));
      return result(answerProductDetails(product, state, language), {
        lastProductId: product.id,
      });

    case 'list_low_stock': {
      const low = activeProducts(state)
        .filter((item) => statusOf(item).key !== 'sufficient')
        .sort((a, b) => statusOf(a).rank - statusOf(b).rank || a.stock - b.stock);
      if (low.length === 0) {
        return result(copy(language, 'noLowStock')(), {
          action: navigateAction(getPage('alerts'), user, language),
        });
      }
      const lines = low.map((item) =>
        copy(language, 'lowStockItem')({
          name: item.name,
          sku: item.sku,
          units: productUnits(item, language),
          reorderLevel: item.reorderLevel,
          recommendedQty:
            pendingRecommendationFor(state, item.id)?.recommendedQty ??
            calculateRecommendedQty(item),
        })
      );
      return result(
        `${copy(language, 'lowStockTitle')({ count: low.length })}\n${lines.join('\n')}`,
        {
          action: navigateAction(getPage('alerts'), user, language),
          meta: { productIds: low.map((item) => item.id) },
        }
      );
    }

    case 'list_out_of_stock': {
      const out = activeProducts(state).filter((item) => statusOf(item).key === 'out');
      if (out.length === 0) {
        return result(copy(language, 'noOut')(), {
          action: navigateAction(getPage('alerts'), user, language),
        });
      }
      const lines = out.map((item) =>
        copy(language, 'outItem')({
          name: item.name,
          sku: item.sku,
          reorderLevel: item.reorderLevel,
          recommendedQty:
            pendingRecommendationFor(state, item.id)?.recommendedQty ??
            calculateRecommendedQty(item),
        })
      );
      return result(
        `${copy(language, 'outTitle')({ count: out.length })}\n${lines.join('\n')}`,
        {
          action: navigateAction(getPage('alerts'), user, language),
          meta: { productIds: out.map((item) => item.id) },
        }
      );
    }

    case 'list_recommendations': {
      const pending = (state.recommendations || []).filter(
        (recommendation) => recommendation.status === 'pending'
      );
      if (pending.length === 0) {
        return result(copy(language, 'noPending')(), {
          action: navigateAction(getPage('recommendations'), user, language),
        });
      }
      const lines = pending.map((recommendation) =>
        copy(language, 'recItem')({
          name: recommendation.productName,
          sku: recommendation.sku,
          currentStock: recommendation.currentStock,
          targetStock: recommendation.targetStock,
          recommendedQty: recommendation.recommendedQty,
        })
      );
      return result(
        `${copy(language, 'recTitle')({ count: pending.length })}\n${lines.join('\n')}`,
        {
          action: navigateAction(getPage('recommendations'), user, language),
          meta: { recommendationIds: pending.map((item) => item.id) },
        }
      );
    }

    case 'inventory_summary': {
      const active = activeProducts(state);
      const totalUnits = active.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
      const inventoryValue = active.reduce(
        (sum, item) =>
          sum + (Number(item.stock) || 0) * (Number(item.unitPrice) || 0),
        0
      );
      const statusCounts = active.reduce(
        (acc, item) => {
          const key = statusOf(item).key;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        { low: 0, out: 0, sufficient: 0 }
      );
      const pending = (state.recommendations || []).filter(
        (recommendation) => recommendation.status === 'pending'
      ).length;
      const health = active.length
        ? Math.round((statusCounts.sufficient / active.length) * 100)
        : 0;
      return result(
        copy(language, 'summary')({
          totalProducts: formatNumber(active.length),
          totalUnits: formatNumber(totalUnits),
          inventoryValue: formatMoney(inventoryValue, state.settings?.currency || '₱'),
          low: formatNumber(statusCounts.low),
          out: formatNumber(statusCounts.out),
          pending: formatNumber(pending),
          health,
        }),
        {
          action: navigateAction(getPage('dashboard'), user, language),
          meta: { health },
        }
      );
    }

    case 'forecast': {
      if (!product) {
        return result(localizedKnowledge(language, 'forecasting', getKnowledgeEntry('explain_forecast')?.answer || ''), {
          action: navigateAction(getPage('forecasting'), user, language),
        });
      }
      const forecast = answerForecast(product, state, language);
      return result(forecast.text, {
        action: forecast.action,
        lastProductId: product.id,
      });
    }

    case 'help':
      return result(copy(language, 'helpIntro')(), {
        action: navigateAction(getPage('dashboard'), user, language),
        quickReplies: quickReplies(language),
      });

    case 'unknown': {
      const suggestions = classification.productResolution.suggestions || [];
      return result(
        copy(language, 'unknown')({
          suggestions: suggestions.map((item) => `${item.name} (${item.sku})`).join(', '),
        })
      );
    }

    default: {
      const entry = getKnowledgeEntry(classification.intent);
      if (entry) {
        const key = knowledgeKeyForIntent(classification.intent);
        const localized = key
          ? localizedKnowledge(language, key, entry.answer)
          : entry.answer;
        const pageKey =
          classification.intent === 'explain_forecast'
            ? 'forecasting'
            : classification.intent === 'explain_reports'
              ? 'reports'
              : classification.intent === 'explain_audit'
                ? 'audit'
                : classification.intent === 'explain_roles' || classification.intent === 'explain_limitations'
                  ? 'security'
                  : classification.intent === 'explain_demo'
                    ? 'demo'
                    : classification.intent === 'explain_alerts'
                      ? 'alerts'
                      : classification.intent === 'explain_transactions'
                        ? 'transactions'
                        : null;
        return result(localized || entry.answer, {
          action: pageKey ? navigateAction(getPage(pageKey), user, language) : null,
          intent: classification.intent,
        });
      }
      return result(t(language, 'unclear'));
    }
  }
}

export const RESPONSE_ENGINE_VERSION = '1.0.0';
