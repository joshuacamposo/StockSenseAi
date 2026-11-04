// Isolated fixtures for the Demo & Testing Center.
//
// Everything in this file builds a FRESH copy of the demonstration data. Automated tests never
// read or write the live localStorage state, so running them cannot change the user's inventory.
// The same production rule functions are used: planStockMovement, reconcileRecommendations,
// applyRecommendationDecision, validateProductInput, and canDeleteSupplier.

import { DEMO_ACCOUNTS } from '../../data/demoAccounts';
import { DEMO_PRODUCTS } from '../../data/demoProducts';
import { DEMO_SUPPLIERS } from '../../data/demoSuppliers';
import {
  calculateRecommendedQty,
  getStatusForStock,
  getStockStatus,
  planStockMovement,
  validateProductInput,
} from '../inventoryRules';
import { reconcileRecommendations } from '../recommendations';

export const FIXTURE_NOW = '2026-01-15T09:00:00.000Z';
export const FIXTURE_NOW_LATER = '2026-01-15T10:30:00.000Z';
export const TEST_ADMIN = DEMO_ACCOUNTS.find((account) => account.role === 'admin');
export const TEST_STAFF = DEMO_ACCOUNTS.find((account) => account.role === 'staff');

function cloneProducts(products = DEMO_PRODUCTS) {
  return products.map((product) => ({
    ...product,
    aliases: Array.isArray(product.aliases) ? [...product.aliases] : [],
    createdAt: FIXTURE_NOW,
    updatedAt: FIXTURE_NOW,
  }));
}

function cloneSuppliers(suppliers = DEMO_SUPPLIERS) {
  return suppliers.map((supplier) => ({ ...supplier }));
}

/**
 * Builds a complete but isolated application snapshot for a test.
 * Only the three required products plus the four additional demonstration products are present.
 */
export function createFixtureState(overrides = {}) {
  return {
    version: '1.0.0',
    session: null,
    products: cloneProducts(overrides.products),
    suppliers: cloneSuppliers(overrides.suppliers),
    transactions: Array.isArray(overrides.transactions) ? [...overrides.transactions] : [],
    recommendations: Array.isArray(overrides.recommendations)
      ? overrides.recommendations.map((recommendation) => ({ ...recommendation }))
      : [],
    auditLogs: [],
    settings: {
      businessName: 'StockSense Demo Trading',
      currency: '₱',
      forecastPeriodDays: 30,
      forecastHorizonDays: 30,
      ...(overrides.settings || {}),
    },
    meta: { isDemoData: true, syntheticFixture: true },
  };
}

export function findProduct(state, sku) {
  return state.products.find((product) => product.sku === sku) || null;
}

export function withProductStock(state, productId, stock) {
  return {
    ...state,
    products: state.products.map((product) =>
      product.id === productId ? { ...product, stock } : product
    ),
  };
}

export function buildFixtureRecommendations(state, now = FIXTURE_NOW) {
  return reconcileRecommendations(state.products, state.recommendations, now).recommendations;
}

/**
 * Applies one movement to an isolated fixture using the exact production planning rule.
 * The real AppProvider performs the same plan -> product update -> reconcile sequence.
 */
export function applyFixtureMovement(
  state,
  productId,
  type,
  quantity,
  actor = TEST_ADMIN,
  now = FIXTURE_NOW
) {
  const product = state.products.find((item) => item.id === productId);
  const plan = planStockMovement(product, type, quantity);

  if (!plan.ok) {
    return { ok: false, error: plan.error, state };
  }

  const products = state.products.map((item) =>
    item.id === productId
      ? {
          ...item,
          stock: plan.updatedStock,
          updatedAt: now,
        }
      : item
  );

  const transaction = {
    id: `txn-fixture-${state.transactions.length + 1}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    type,
    quantity: plan.quantity,
    previousStock: plan.previousStock,
    updatedStock: plan.updatedStock,
    userId: actor?.id || 'usr-test',
    userName: actor?.name || 'Test User',
    role: actor?.role || 'admin',
    remarks: 'Isolated automated-test movement',
    timestamp: now,
  };

  const reconciled = reconcileRecommendations(products, state.recommendations, now);

  return {
    ok: true,
    transaction,
    plan,
    state: {
      ...state,
      products,
      transactions: [transaction, ...state.transactions],
      recommendations: reconciled.recommendations,
    },
  };
}

export {
  calculateRecommendedQty,
  getStatusForStock,
  getStockStatus,
  planStockMovement,
  reconcileRecommendations,
  validateProductInput,
};
