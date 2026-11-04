// Page metadata and navigation intent resolution for the assistant.
// The assistant never bypasses the same centralized route permissions used by the app.

import { can } from '../permissions';
import { includesPhrase, normalizeText } from './text';

export const PAGES = {
  dashboard: {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    permission: 'dashboard.view',
    aliases: ['dashboard', 'home', 'overview page', 'main page'],
  },
  products: {
    key: 'products',
    label: 'Products',
    href: '/products',
    permission: 'products.view',
    aliases: ['products page', 'product page', 'product catalog', 'inventory page', 'products', 'inventory'],
  },
  suppliers: {
    key: 'suppliers',
    label: 'Suppliers',
    href: '/suppliers',
    permission: 'suppliers.view',
    aliases: ['suppliers page', 'supplier page', 'supplier directory', 'suppliers', 'vendors'],
  },
  stockin: {
    key: 'stockin',
    label: 'Stock-In',
    href: '/stock-in',
    permission: 'stock.in',
    aliases: ['stock in page', 'stock-in page', 'stockin page', 'receive stock page', 'stock in', 'stock-in', 'stockin'],
  },
  stockout: {
    key: 'stockout',
    label: 'Stock-Out',
    href: '/stock-out',
    permission: 'stock.out',
    aliases: ['stock out page', 'stock-out page', 'stockout page', 'issue stock page', 'stock out', 'stock-out', 'stockout'],
  },
  alerts: {
    key: 'alerts',
    label: 'Alerts',
    href: '/alerts',
    permission: 'alerts.view',
    aliases: ['alerts page', 'alert page', 'stock alerts page', 'low stock alerts page', 'alerts', 'notifications page'],
  },
  recommendations: {
    key: 'recommendations',
    label: 'Reorder Recommendations',
    href: '/recommendations',
    permission: 'recommendations.view',
    aliases: [
      'recommendations page',
      'reorder page',
      'reorder recommendation page',
      'recommendation page',
      'reorder recommendations',
      'recommendations',
    ],
  },
  forecasting: {
    key: 'forecasting',
    label: 'Forecasting',
    href: '/forecasting',
    permission: 'forecasting.view',
    aliases: ['forecasting page', 'forecast page', 'demand forecasting page', 'forecasting', 'forecast'],
  },
  reports: {
    key: 'reports',
    label: 'Reports',
    href: '/reports',
    permission: 'reports.view',
    aliases: ['reports page', 'report page', 'reports', 'report'],
  },
  transactions: {
    key: 'transactions',
    label: 'Transactions',
    href: '/transactions',
    permission: 'transactions.view',
    aliases: ['transactions page', 'transaction page', 'transaction history page', 'transactions', 'transaction history'],
  },
  audit: {
    key: 'audit',
    label: 'Audit Logs',
    href: '/audit-logs',
    permission: 'audit.view',
    aliases: ['audit logs page', 'audit log page', 'audit page', 'audit logs', 'audit log', 'activity log'],
  },
  demo: {
    key: 'demo',
    label: 'Demo / Testing',
    href: '/demo-testing',
    permission: 'demo.view',
    aliases: ['demo testing page', 'demo page', 'testing page', 'test center', 'demo testing', 'demo center', 'tests page'],
  },
  settings: {
    key: 'settings',
    label: 'Settings',
    href: '/settings',
    permission: 'settings.view',
    aliases: ['settings page', 'setting page', 'system settings page', 'settings'],
  },
  security: {
    key: 'security',
    label: 'Security & Limits',
    href: '/security',
    permission: 'security.view',
    aliases: ['security page', 'security limits page', 'security page', 'security', 'limitations page'],
  },
};

const NAVIGATION_VERBS = [
  'open',
  'go to',
  'goto',
  'navigate',
  'navigate to',
  'take me',
  'bring me',
  'show me the',
  'show the',
  'where is',
  'where can i find',
  'find the',
  'visit',
  'proceed to',
  'jump to',
  'buksan',
  'pumunta',
  'puntahan',
  'ipakita ang',
  'ipakita mo ang',
  'ablihi',
  'adto sa',
  'adtoa',
];

const PAGE_CONTEXT_WORDS = ['page', 'screen', 'section', 'tab', 'workspace'];

export function getPage(key) {
  return PAGES[key] || null;
}

export function pageByPath(pathname = '') {
  const clean = String(pathname).split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  return Object.values(PAGES).find((page) => page.href === clean) || null;
}

export function canAccessPage(user, key) {
  const page = getPage(key);
  if (!page) return false;
  if (!page.permission) return true;
  return can(user, page.permission);
}

export function accessiblePages(user) {
  return Object.values(PAGES).filter((page) => canAccessPage(user, page.key));
}

export function isNavigationRequest(rawText = '') {
  const normalized = normalizeText(rawText);
  if (!normalized) return false;
  const hasVerb = NAVIGATION_VERBS.some((verb) => includesPhrase(normalized, verb));
  if (!hasVerb) return false;
  const hasPageContext = PAGE_CONTEXT_WORDS.some((word) => normalized.includes(word));
  const hasKnownPage = Object.values(PAGES).some((page) =>
    page.aliases.some((alias) => includesPhrase(normalized, alias))
  );
  return hasPageContext || hasKnownPage;
}

export function resolveNavigation(rawText = '') {
  const normalized = normalizeText(rawText);
  if (!normalized || !isNavigationRequest(normalized)) return null;

  let best = null;
  let bestScore = 0;

  for (const page of Object.values(PAGES)) {
    for (const alias of page.aliases) {
      if (!includesPhrase(normalized, alias)) continue;
      const score = normalizeText(alias).length;
      if (score > bestScore) {
        best = page;
        bestScore = score;
      }
    }
  }

  return best;
}

export function navigationLabelList(user) {
  return accessiblePages(user).map((page) => page.label);
}

export function routePermission(key) {
  return getPage(key)?.permission || null;
}
