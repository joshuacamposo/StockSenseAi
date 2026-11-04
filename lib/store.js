// Single source of truth for the whole application.
// The store lives in one module-level object, is persisted to localStorage, and is consumed by
// React through AppProvider. The chatbot reads this same state — there is no duplicate dataset.

import { DEMO_ACCOUNTS } from '@/data/demoAccounts';
import { createInitialState } from './seed';
import { STORAGE_KEY, STORAGE_VERSION, readLocal, writeLocal } from './storage';

let state = null;
let initialized = false;
const listeners = new Set();

export function subscribeStore(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch (error) {
      console.error('[StockSense] store listener failed', error);
    }
  }
}

function normalizeState(parsed) {
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    parsed.version !== STORAGE_VERSION ||
    !Array.isArray(parsed.products)
  ) {
    return createInitialState();
  }

  const defaults = createInitialState();
  const session =
    parsed.session && DEMO_ACCOUNTS.some((account) => account.id === parsed.session.userId)
      ? parsed.session
      : null;

  return {
    ...defaults,
    ...parsed,
    version: STORAGE_VERSION,
    session,
    products: parsed.products
      .filter((product) => product && product.id && product.sku)
      .map((product) => ({
        ...product,
        stock: Math.max(0, Math.floor(Number(product.stock) || 0)),
        reorderLevel: Math.max(0, Math.floor(Number(product.reorderLevel) || 0)),
        targetStock: Math.max(0, Math.floor(Number(product.targetStock) || 0)),
        unitPrice: Math.max(0, Number(product.unitPrice) || 0),
        active: product.active !== false,
      })),
    suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : defaults.suppliers,
    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    settings: {
      ...defaults.settings,
      ...(parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {}),
    },
    meta: {
      ...defaults.meta,
      ...(parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : {}),
    },
  };
}

export function initStore() {
  if (typeof window === 'undefined') return null;
  if (initialized) return state;
  const parsed = readLocal(STORAGE_KEY);
  state = normalizeState(parsed);
  initialized = true;
  // Persist the normalized state so a partially corrupt payload is repaired once.
  writeLocal(STORAGE_KEY, state);
  return state;
}

export function getStore() {
  return state;
}

export function isStoreReady() {
  return initialized;
}

export function setStore(updater) {
  if (typeof window === 'undefined') return state;
  if (!initialized) initStore();
  if (!state) return state;
  const next = typeof updater === 'function' ? updater(state) : updater;
  if (!next || next === state) return state;
  state = next;
  writeLocal(STORAGE_KEY, state);
  emit();
  return state;
}

export function resetStore(preserveSession = null) {
  if (typeof window === 'undefined') return null;
  state = createInitialState(preserveSession);
  initialized = true;
  writeLocal(STORAGE_KEY, state);
  emit();
  return state;
}
