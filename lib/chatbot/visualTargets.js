// Pure builders for the assistant's visual navigation and highlighting.
//
// A target describes a real, stable DOM element — never a screen coordinate. The client-side
// SmartVisualGuide navigates to `href`, applies an optional page bridge (search/filter/tab), waits
// for the element, scrolls it into view, and draws a spotlight and localized tooltip.
//
// This module is deliberately pure so the same target decisions can be tested in Node without a
// browser. It never mutates inventory and never returns a form-submit or approval action.

import { can, normalizePath } from '../permissions';
import { getPage, canAccessPage } from './navigationHandler';
import { visualText, elementLabel } from './languageDictionary';
import { includesPhrase, normalizeText } from './text';

function safeValue(value) {
  return String(value || '').replace(/["\\\n\r]/g, '');
}

function money(value, currency = '₱') {
  const amount = Number(value) || 0;
  return `${currency}${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const NAVIGATION_TOUR = {
  dashboard: 'dashboard-navigation',
  products: 'products-navigation',
  suppliers: 'suppliers-navigation',
  stockin: 'stockin-navigation',
  stockout: 'stockout-navigation',
  alerts: 'alerts-navigation',
  recommendations: 'recommendations-navigation',
  forecasting: 'forecasting-navigation',
  reports: 'reports-navigation',
  transactions: 'transactions-navigation',
  audit: 'audit-navigation',
  demo: 'demo-navigation',
  settings: 'settings-navigation',
  security: 'security-navigation',
};

// ---------------------------------------------------------------------------
// Element directory
// ---------------------------------------------------------------------------
// `selector` must be a stable data-tour/data-testid selector. `aliases` are matched against the
// normalized question. `permission` is checked with the same centralized matrix as the interface.

export const ELEMENT_TARGETS = [
  {
    id: 'add-product-button',
    pageKey: 'products',
    selector: '[data-tour="add-product-button"]',
    permission: 'products.create',
    aliases: [
      'add product button',
      'add product',
      'new product button',
      'create product button',
      'register product button',
      'button to add a product',
      'button para magdagdag ng product',
      'button para makadugang og product',
    ],
  },
  {
    id: 'products-search',
    pageKey: 'products',
    selector: '[data-tour="products-search"]',
    aliases: [
      'product search',
      'search products',
      'search box',
      'search bar',
      'product search box',
      'search field',
      'search input',
      'search ng produkto',
      'search sa produkto',
    ],
  },
  {
    id: 'product-status-filter',
    pageKey: 'products',
    selector: '[data-tour="product-status-filter"]',
    aliases: [
      'status filter',
      'stock status filter',
      'product filter',
      'filter products',
      'filter ng stock',
      'filter sa stock',
    ],
  },
  {
    id: 'products-table',
    pageKey: 'products',
    selector: '[data-tour="products-table"]',
    aliases: ['product table', 'products table', 'product catalog', 'inventory table', 'talahanayan ng produkto', 'talaan sa produkto'],
  },
  {
    id: 'add-product-button',
    pageKey: 'products',
    selector: '[data-tour="add-product-button"]',
    permission: 'products.create',
    aliases: ['add item button', 'new item button'],
  },
  {
    id: 'add-supplier-button',
    pageKey: 'suppliers',
    selector: '[data-tour="add-supplier-button"]',
    permission: 'suppliers.manage',
    aliases: ['add supplier button', 'new supplier button', 'create supplier button', 'button para magdagdag ng supplier'],
  },
  {
    id: 'supplier-list',
    pageKey: 'suppliers',
    selector: '[data-tour="supplier-list"]',
    aliases: ['supplier list', 'supplier directory', 'suppliers list', 'listahan ng supplier', 'lista sa supplier'],
  },
  {
    id: 'stock-in-form',
    pageKey: 'stockin',
    selector: '[data-tour="stock-in-form"]',
    aliases: ['stock in form', 'stock-in form', 'stockin form', 'receive stock form', 'form para mag stock in'],
  },
  {
    id: 'stock-in-product',
    pageKey: 'stockin',
    selector: '[data-tour="stock-in-product"]',
    bridge: { type: 'stock:preselect', transactionType: 'in' },
    aliases: ['stock in product selector', 'product selector stock in', 'stock in product field', 'product dropdown stock in'],
  },
  {
    id: 'stock-in-quantity',
    pageKey: 'stockin',
    selector: '[data-tour="stock-in-quantity"]',
    aliases: ['stock in quantity', 'quantity field stock in', 'stock in quantity field', 'quantity input stock in', 'field ng quantity'],
  },
  {
    id: 'stock-in-remarks',
    pageKey: 'stockin',
    selector: '[data-tour="stock-in-remarks"]',
    aliases: ['stock in remarks', 'remarks field stock in', 'remarks field', 'field ng remarks'],
  },
  {
    id: 'stock-in-button',
    pageKey: 'stockin',
    selector: '[data-tour="stock-in-button"]',
    aliases: ['record stock in button', 'stock in button', 'submit stock in', 'save stock in', 'stock in submit button'],
  },
  {
    id: 'stock-out-form',
    pageKey: 'stockout',
    selector: '[data-tour="stock-out-form"]',
    aliases: ['stock out form', 'stock-out form', 'stockout form', 'issue stock form', 'form para mag stock out'],
  },
  {
    id: 'stock-out-product',
    pageKey: 'stockout',
    selector: '[data-tour="stock-out-product"]',
    bridge: { type: 'stock:preselect', transactionType: 'out' },
    aliases: ['stock out product selector', 'product selector stock out', 'stock out product field'],
  },
  {
    id: 'stock-out-quantity',
    pageKey: 'stockout',
    selector: '[data-tour="stock-out-quantity"]',
    aliases: ['stock out quantity', 'quantity field stock out', 'stock out quantity field'],
  },
  {
    id: 'stock-out-remarks',
    pageKey: 'stockout',
    selector: '[data-tour="stock-out-remarks"]',
    aliases: ['stock out remarks', 'remarks field stock out'],
  },
  {
    id: 'stock-out-button',
    pageKey: 'stockout',
    selector: '[data-tour="stock-out-button"]',
    aliases: ['record stock out button', 'stock out button', 'submit stock out', 'save stock out'],
  },
  {
    id: 'alerts-list',
    pageKey: 'alerts',
    selector: '[data-tour="alerts-list"]',
    aliases: ['alerts list', 'alert list', 'active alerts', 'stock alerts', 'notifications list', 'listahan ng alerts', 'lista sa alerts'],
  },
  {
    id: 'recommendations-list',
    pageKey: 'recommendations',
    selector: '[data-tour="recommendations-list"]',
    aliases: [
      'recommendations list',
      'reorder recommendations list',
      'pending recommendations',
      'recommendation cards',
      'listahan ng recommendations',
      'lista sa recommendations',
    ],
  },
  {
    id: 'approve-reorder',
    pageKey: 'recommendations',
    selector: '[data-tour^="approve-reorder"]',
    permission: 'recommendations.decide',
    aliases: ['approve button', 'approve recommendation button', 'approval button', 'button to approve', 'reject button'],
  },
  {
    id: 'forecasting-product',
    pageKey: 'forecasting',
    selector: '[data-tour="forecast-product"]',
    aliases: ['forecast product selector', 'product selector forecast', 'forecast product', 'forecast dropdown'],
  },
  {
    id: 'forecasting-results',
    pageKey: 'forecasting',
    selector: '[data-tour="forecast-results"]',
    aliases: ['forecast results', 'forecast result', 'forecast numbers', 'forecast summary'],
  },
  {
    id: 'forecasting-chart',
    pageKey: 'forecasting',
    selector: '[data-tour="forecast-chart"]',
    aliases: ['forecast chart', 'demand chart', 'forecast graph'],
  },
  {
    id: 'reports-tabs',
    pageKey: 'reports',
    selector: '[data-tour="reports-tabs"]',
    bridge: { type: 'reports:tab', tab: 'inventory' },
    aliases: ['report tabs', 'reports tabs', 'report selector', 'mga tab ng report', 'mga tab sa report'],
  },
  {
    id: 'reports-table',
    pageKey: 'reports',
    selector: '[data-tour="reports-table"]',
    aliases: ['report table', 'reports table', 'report preview', 'talahanayan ng report', 'talaan sa report'],
  },
  {
    id: 'export-csv',
    pageKey: 'reports',
    selector: '[data-tour="export-csv-button"]',
    aliases: ['export csv', 'export button', 'csv button', 'download report', 'download csv', 'export csv button'],
  },
  {
    id: 'transactions-filter',
    pageKey: 'transactions',
    selector: '[data-tour="transactions-filter"]',
    aliases: ['transaction filter', 'transactions filter', 'transaction search', 'movement filter'],
  },
  {
    id: 'transactions-table',
    pageKey: 'transactions',
    selector: '[data-tour="transactions-table"]',
    aliases: ['transaction table', 'transactions table', 'transaction history table', 'movement table', 'talahanayan ng transaksyon'],
  },
  {
    id: 'audit-table',
    pageKey: 'audit',
    selector: '[data-tour="audit-table"]',
    aliases: ['audit table', 'audit log table', 'audit trail table', 'activity log table'],
  },
  {
    id: 'dashboard-stats',
    pageKey: 'dashboard',
    selector: '[data-tour="dashboard-stats"]',
    aliases: ['dashboard stats', 'dashboard statistics', 'statistics cards', 'summary cards', 'dashboard cards'],
  },
  {
    id: 'dashboard-chart',
    pageKey: 'dashboard',
    selector: '[data-tour="dashboard-chart"]',
    aliases: ['dashboard chart', 'stock movement chart', 'movement chart', 'trend chart'],
  },
  {
    id: 'dashboard-alerts',
    pageKey: 'dashboard',
    selector: '[data-tour="dashboard-alerts"]',
    aliases: ['dashboard alerts', 'alerts panel', 'alert panel', 'alert card'],
  },
  {
    id: 'dashboard-recent',
    pageKey: 'dashboard',
    selector: '[data-tour="dashboard-recent"]',
    aliases: ['recent transactions', 'recent activity', 'recent movements', 'latest transactions'],
  },
  {
    id: 'chatbot-input',
    pageKey: null,
    selector: '[data-tour="chatbot-input"]',
    aliases: ['chat input', 'message box', 'assistant input', 'chat box', 'message field', 'chatbot input'],
  },
  {
    id: 'run-all-tests',
    pageKey: 'demo',
    selector: '[data-tour="run-all-button"]',
    aliases: ['run all tests', 'run tests button', 'test button', 'run all button'],
  },
  {
    id: 'reset-demo',
    pageKey: 'demo',
    selector: '[data-tour="reset-demo-button"]',
    aliases: ['reset demo button', 'reset data button', 'reset button'],
  },
  {
    id: 'settings-form',
    pageKey: 'settings',
    selector: '[data-tour="settings-form"]',
    aliases: ['settings form', 'business settings', 'settings fields', 'business name field'],
  },
  {
    id: 'security-rbac',
    pageKey: 'security',
    selector: '[data-tour="security-rbac"]',
    aliases: ['roles section', 'permissions section', 'rbac section', 'roles and permissions'],
  },
  {
    id: 'security-limits',
    pageKey: 'security',
    selector: '[data-tour="security-limits"]',
    aliases: ['limitations section', 'security limitations', 'prototype limitations'],
  },
  {
    id: 'notifications-bell',
    pageKey: null,
    selector: '[data-tour="notifications-bell"]',
    aliases: ['notification bell', 'notifications button', 'bell button', 'bell icon', 'alerts bell'],
  },
  {
    id: 'navigation',
    pageKey: null,
    selector: 'nav[aria-label="Main navigation"]',
    aliases: ['sidebar', 'navigation menu', 'side menu', 'menu', 'main menu', 'navigation'],
  },
];

const LOCATION_MARKERS = [
  'where is',
  'where are',
  'where can i find',
  'where do i find',
  'where do i see',
  'where can i see',
  'show me where',
  'locate',
  'find the',
  'point me to',
  'nasaan',
  'saan',
  'asaan',
  'saan makikita',
  'saan matatagpuan',
  'ipakita kung saan',
  'hain',
  'asa',
  'asa makita',
  'diin',
  'ipakita kung asa',
  'asang bahin',
];

const ELEMENT_WORDS = [
  'button',
  'field',
  'form',
  'input',
  'search',
  'filter',
  'tab',
  'table',
  'menu',
  'sidebar',
  'section',
  'panel',
  'selector',
  'dropdown',
  'bell',
  'chart',
  'card',
  'header',
  'list',
  'box',
  'screen',
  'link',
];

export function isLocationQuestion(rawText = '') {
  const normalized = normalizeText(rawText);
  if (!normalized) return false;
  return LOCATION_MARKERS.some((marker) => includesPhrase(normalized, marker));
}

export function isElementLocationRequest(rawText = '') {
  const normalized = normalizeText(rawText);
  if (!normalized) return false;

  const asksLocation = isLocationQuestion(normalized);
  const asksHighlight = includesAnyPhrase(normalized, [
    'highlight',
    'show me the',
    'show the',
    'point to',
    'point me to',
    'ipakita ang',
    'ipakita mo ang',
    'ipakita',
  ]);

  if (!asksLocation && !asksHighlight) return false;

  if (isExplicitElementLocationRequest(normalized)) return true;
  return Boolean(resolveElementTarget(normalized));
}

/**
 * Strict variant: requires an explicit UI noun such as button, form, field, table, tab, or menu.
 * Used before navigation so "where is the products page" still navigates while
 * "where is the stock-in form" highlights the form.
 */
export function isExplicitElementLocationRequest(rawText = '') {
  const normalized = normalizeText(rawText);
  if (!normalized) return false;
  const asksLocation = isLocationQuestion(normalized);
  const asksHighlight = includesAnyPhrase(normalized, [
    'highlight',
    'show me the',
    'show the',
    'point to',
    'point me to',
    'ipakita ang',
    'ipakita mo ang',
    'ipakita',
  ]);
  if (!asksLocation && !asksHighlight) return false;
  return ELEMENT_WORDS.some((word) => includesPhrase(normalized, word));
}

function includesAnyPhrase(normalized, phrases = []) {
  return phrases.some((phrase) => includesPhrase(normalized, phrase));
}

export function resolveElementTarget(rawText = '') {
  const normalized = normalizeText(rawText);
  if (!normalized) return null;

  let best = null;
  let bestScore = 0;

  for (const target of ELEMENT_TARGETS) {
    for (const alias of target.aliases) {
      if (!includesPhrase(normalized, alias)) continue;
      // Prefer longer, more specific phrases. A small bonus goes to targets that include a
      // disambiguating element word (e.g. "approve recommendation button").
      const score = normalizeText(alias).length;
      if (score > bestScore) {
        best = target;
        bestScore = score;
      }
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// Target builders
// ---------------------------------------------------------------------------

function resolveCopyValue(value, args = {}) {
  if (typeof value === 'function') {
    try {
      return value(args) || '';
    } catch (error) {
      return '';
    }
  }
  return value || '';
}

function buildPageTarget({ pageKey, selector, id, title, body, bridge, kind = 'element', permission }, user, language) {
  const page = getPage(pageKey);
  if (!page) return null;
  if (!canAccessPage(user, page.key)) return null;
  if (permission && !can(user, permission)) return null;

  return {
    id,
    kind,
    pageKey,
    href: page.href,
    selector,
    title: resolveCopyValue(title),
    body: resolveCopyValue(body),
    bridge: bridge || null,
    language,
  };
}

function productSelector(product, part) {
  return `[data-tour="${part}-${safeValue(product.id)}"]`;
}

function productBridge(product) {
  return {
    type: 'products:search',
    productId: product.id,
    sku: product.sku,
    name: product.name,
    clearFilters: true,
  };
}

function buildProductTarget({ classification, product, user, language, state }) {
  if (!product) return null;
  const intent = classification.intent;
  const copy = visualText(language);
  const currency = state?.settings?.currency || '₱';
  const unit = product.unit || 'unit';
  const base = { pageKey: 'products', bridge: productBridge(product), kind: 'cell' };

  if (intent === 'product_stock' || intent === 'product_target') {
    return buildPageTarget(
      {
        ...base,
        id: `product-stock-${safeValue(product.id)}`,
        selector: productSelector(product, 'stock-cell'),
        title: copy.stockCellTitle({ name: product.name }),
        body: copy.stockCellBody({
          stock: product.stock,
          unit,
          target: product.targetStock,
        }),
      },
      user,
      language
    );
  }

  if (intent === 'product_status') {
    return buildPageTarget(
      {
        ...base,
        id: `product-status-${safeValue(product.id)}`,
        selector: productSelector(product, 'status-cell'),
        title: copy.statusCellTitle({ name: product.name }),
        body: copy.statusCellBody({}),
      },
      user,
      language
    );
  }

  if (intent === 'product_price') {
    return buildPageTarget(
      {
        ...base,
        id: `product-price-${safeValue(product.id)}`,
        selector: productSelector(product, 'price-cell'),
        title: copy.priceCellTitle({ name: product.name }),
        body: copy.priceCellBody({ price: money(product.unitPrice, currency) }),
      },
      user,
      language
    );
  }

  if (intent === 'product_supplier') {
    return buildPageTarget(
      {
        ...base,
        id: `product-supplier-${safeValue(product.id)}`,
        selector: productSelector(product, 'supplier-cell'),
        title: copy.supplierCellTitle({ name: product.name }),
        body: copy.supplierCellBody({}),
      },
      user,
      language
    );
  }

  if (intent === 'product_reorder_level') {
    return buildPageTarget(
      {
        ...base,
        id: `product-reorder-${safeValue(product.id)}`,
        selector: productSelector(product, 'reorder-cell'),
        title: copy.reorderCellTitle({ name: product.name }),
        body: copy.reorderCellBody({ reorderLevel: product.reorderLevel }),
      },
      user,
      language
    );
  }

  if (intent === 'product_location' || intent === 'product_details') {
    return buildPageTarget(
      {
        ...base,
        id: `product-row-${safeValue(product.id)}`,
        selector: productSelector(product, 'product-row'),
        kind: 'row',
        title: copy.productRowTitle({ name: product.name }),
        body: copy.productRowBody({}),
      },
      user,
      language
    );
  }

  if (intent === 'product_history') {
    return buildPageTarget(
      {
        id: `product-history-${safeValue(product.id)}`,
        pageKey: 'transactions',
        selector: '[data-tour="transactions-table"]',
        kind: 'section',
        title: copy.historyTitle({ name: product.name }),
        body: copy.historyBody({ name: product.name }),
        bridge: { type: 'transactions:search', query: product.sku, productId: product.id },
      },
      user,
      language
    );
  }

  if (intent === 'product_recommendation') {
    return buildPageTarget(
      {
        id: `product-recommendation-${safeValue(product.id)}`,
        pageKey: 'recommendations',
        selector: `[data-tour="recommendation-card-${safeValue(product.id)}"]`,
        kind: 'card',
        title: copy.recommendationTitle({ name: product.name }),
        body: copy.recommendationBody({}),
      },
      user,
      language
    );
  }

  if (intent === 'forecast') {
    return buildPageTarget(
      {
        id: `forecast-${safeValue(product.id)}`,
        pageKey: 'forecasting',
        selector: '[data-tour="forecast-results"]',
        kind: 'section',
        title: copy.forecastTitle({}),
        body: copy.forecastBody({}),
        bridge: { type: 'forecasting:product', productId: product.id },
      },
      user,
      language
    );
  }

  return null;
}

function buildListTarget({ classification, user, language }) {
  const intent = classification.intent;
  const copy = visualText(language);

  if (intent === 'list_all_products') {
    return buildPageTarget(
      {
        id: 'products-all',
        pageKey: 'products',
        selector: '[data-tour="products-table"]',
        kind: 'section',
        title: language === 'tl' ? 'Lahat ng Produkto' : language === 'ceb' ? 'Tanang Produkto' : 'All Products',
        body: language === 'tl' ? 'Ipinapakita ang buong katalogo ng mga produkto kasama ang stock.' : language === 'ceb' ? 'Ipakita ang tibuok nga katalogo sa mga produkto uban ang stock.' : 'Showing the complete product catalog with current stock levels.',
      },
      user,
      language
    );
  }

  if (intent === 'list_low_stock' || intent === 'list_out_of_stock') {
    const severity = intent === 'list_out_of_stock' ? 'out' : 'low';
    return buildPageTarget(
      {
        id: `alerts-${severity}`,
        pageKey: 'alerts',
        selector: '[data-tour="alerts-list"]',
        kind: 'section',
        title: copy.alertsTitle({}),
        body: copy.alertsBody({}),
        bridge: { type: 'alerts:filter', severity },
      },
      user,
      language
    );
  }

  if (intent === 'list_recommendations') {
    return buildPageTarget(
      {
        id: 'recommendations-list',
        pageKey: 'recommendations',
        selector: '[data-tour="recommendations-list"]',
        kind: 'section',
        title: copy.recommendationsListTitle({}),
        body: copy.recommendationsListBody({}),
      },
      user,
      language
    );
  }

  if (intent === 'inventory_summary') {
    return buildPageTarget(
      {
        id: 'dashboard-stats',
        pageKey: 'dashboard',
        selector: '[data-tour="dashboard-stats"]',
        kind: 'section',
        title: copy.dashboardStatsTitle({}),
        body: copy.dashboardStatsBody({}),
      },
      user,
      language
    );
  }

  return null;
}

function buildElementTarget({ classification, product, user, language }) {
  const target = classification.elementTarget;
  if (!target) return null;
  const copy = visualText(language);
  const label = elementLabel(language, target.id);
  let bridge = target.bridge ? { ...target.bridge } : null;
  if (bridge?.type === 'stock:preselect' && product?.id) {
    bridge = { ...bridge, productId: product.id };
  }

  return buildPageTarget(
    {
      id: `element-${target.id}`,
      pageKey: target.pageKey,
      selector: target.selector,
      kind: 'element',
      title: copy.elementTitle({ label }),
      body: copy.elementBody({}),
      bridge,
      permission: target.permission || null,
    },
    user,
    language
  );
}

function buildNavigationTarget({ classification, user, language }) {
  const page = classification.page;
  if (!page) return null;
  const copy = visualText(language);
  return buildPageTarget(
    {
      id: `page-${page.key}`,
      pageKey: page.key,
      // PageHeader carries this marker on every workspace page. If it is missing for any reason,
      // the SmartVisualGuide retries and then fails safely.
      selector: '[data-tour="page-header"]',
      kind: 'page',
      title: copy.navigationTitle({ label: page.label }),
      body: copy.navigationBody({}),
    },
    user,
    language
  );
}

export function canHighlightElement(user, target) {
  if (!target) return false;
  if (target.pageKey && !canAccessPage(user, target.pageKey)) return false;
  if (target.permission && !can(user, target.permission)) return false;
  return true;
}

export function buildVisualTarget({ classification = {}, product = null, user = null, language = 'en', state = {} } = {}) {
  if (!user || !classification?.intent) return null;

  switch (classification.intent) {
    case 'navigate':
      return buildNavigationTarget({ classification, user, language });

    case 'element_location':
      return buildElementTarget({ classification, product, user, language });

    case 'product_location':
    case 'product_history':
    case 'product_stock':
    case 'product_price':
    case 'product_supplier':
    case 'product_reorder_level':
    case 'product_target':
    case 'product_recommendation':
    case 'product_status':
    case 'product_details':
    case 'forecast':
      return buildProductTarget({ classification, product, user, language, state });

    case 'list_low_stock':
    case 'list_out_of_stock':
    case 'list_recommendations':
    case 'inventory_summary':
    case 'list_all_products':
      return buildListTarget({ classification, user, language });

    default:
      return null;
  }
}

export function navigationTargetPath(target) {
  return target?.href ? normalizePath(target.href) : null;
}

export function navigationTourFor(pageKey) {
  return NAVIGATION_TOUR[pageKey] || null;
}
