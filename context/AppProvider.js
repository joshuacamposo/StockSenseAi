'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { DEMO_ACCOUNTS } from '@/data/demoAccounts';
import {
  ACCESS_DENIED_MESSAGE,
  can,
  PERMISSIONS,
  getRoutePermission,
  normalizePath,
} from '@/lib/permissions';
import {
  getStockStatus,
  planStockMovement,
  stockStatusCounts,
  validateProductInput,
} from '@/lib/inventoryRules';
import {
  applyRecommendationDecision,
  decisionAuditDescription,
  reconcileRecommendations,
} from '@/lib/recommendations';
import {
  canDeleteSupplier,
  validateSupplierInput,
} from '@/lib/supplierRules';
import { formatUnits, isToday } from '@/lib/format';
import { newId } from '@/lib/id';
import {
  getStore,
  initStore,
  isStoreReady,
  resetStore,
  setStore,
  subscribeStore,
} from '@/lib/store';

const AppContext = createContext(null);

function safeUser(account) {
  if (!account) return null;
  const { password, ...rest } = account;
  return rest;
}

function findAccount(id) {
  return DEMO_ACCOUNTS.find((account) => account.id === id) || null;
}

function auditEntry(actor, action, entity, description) {
  return {
    id: newId('log'),
    timestamp: new Date().toISOString(),
    userId: actor?.id || 'system',
    userName: actor?.name || 'System',
    role: actor?.role || 'system',
    action,
    entity,
    description,
  };
}

function writeAudit(entries) {
  return entries.filter(Boolean);
}

export function AppProvider({ children }) {
  const [snapshot, setSnapshot] = useState(null);
  const [ready, setReady] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    const initial = initStore();
    setSnapshot(initial);
    setReady(Boolean(initial) || typeof window !== 'undefined');
    const unsubscribe = subscribeStore(() => setSnapshot(getStore()));
    return unsubscribe;
  }, []);

  const user = useMemo(() => {
    if (!snapshot?.session?.userId) return null;
    return safeUser(findAccount(snapshot.session.userId));
  }, [snapshot?.session?.userId]);

  userRef.current = user;

  const deny = useCallback(() => {
    toast.error(ACCESS_DENIED_MESSAGE, { id: 'access-denied' });
    return { ok: false, denied: true, error: ACCESS_DENIED_MESSAGE };
  }, []);

  const authorize = useCallback((permission) => can(userRef.current, permission), []);

  const login = useCallback((email, password) => {
    const account = findAccount(
      DEMO_ACCOUNTS.find(
        (candidate) => candidate.email.toLowerCase() === String(email || '').trim().toLowerCase()
      )?.id
    );

    if (!account || account.password !== password) {
      return {
        ok: false,
        error:
          'Invalid email or password. Use one of the demonstration accounts shown on this page.',
      };
    }

    if (!isStoreReady()) initStore();
    const now = new Date().toISOString();
    const entry = auditEntry(account, 'Login', 'Session', `Signed in as ${account.title}.`);
    setStore((prev) => ({
      ...prev,
      session: { userId: account.id, loginAt: now },
      auditLogs: writeAudit([entry, ...(prev?.auditLogs || [])]).slice(0, 500),
    }));
    return { ok: true, user: safeUser(account) };
  }, []);

  const logout = useCallback(() => {
    const actor = userRef.current;
    const entry = actor
      ? auditEntry(actor, 'Logout', 'Session', `Signed out of the prototype.`)
      : null;
    setStore((prev) => ({
      ...prev,
      session: null,
      auditLogs: writeAudit([entry, ...(prev?.auditLogs || [])]).slice(0, 500),
    }));
    return { ok: true };
  }, []);

  const addProduct = useCallback((input) => {
    const actor = userRef.current;
    if (!can(actor, 'products.create')) return deny();
    const snapshotState = getStore();
    const { errors, values, valid } = validateProductInput(input, snapshotState.products, null);
    if (!valid) {
      return { ok: false, errors, error: 'Please correct the highlighted fields.' };
    }

    const now = new Date().toISOString();
    const product = {
      id: newId('prod'),
      ...values,
      stock: 0,
      active: true,
      aliases: [],
      createdAt: now,
      updatedAt: now,
    };

    const reconciled = reconcileRecommendations(
      [...snapshotState.products, product],
      snapshotState.recommendations,
      now
    );
    const createdRecommendation = reconciled.events.some((event) => event.type === 'created');
    const entry = auditEntry(
      actor,
      'Product Created',
      `${product.sku} — ${product.name}`,
      `Added product with 0 starting stock (stock only changes through stock transactions). Reorder level ${product.reorderLevel}, target stock ${product.targetStock}.${
        createdRecommendation
          ? ' An automated reorder recommendation was generated for this new product.'
          : ''
      }`
    );

    setStore((prev) => ({
      ...prev,
      products: [...prev.products, product],
      recommendations: reconciled.recommendations,
      auditLogs: [entry, ...prev.auditLogs].slice(0, 500),
    }));

    return { ok: true, product };
  }, [deny]);

  const updateProduct = useCallback((productId, input) => {
    const actor = userRef.current;
    if (!can(actor, 'products.edit')) return deny();
    const snapshotState = getStore();
    const existing = snapshotState.products.find((product) => product.id === productId);
    if (!existing) return { ok: false, error: 'Product not found.' };

    const { errors, values, valid } = validateProductInput(
      input,
      snapshotState.products,
      productId
    );
    if (!valid) {
      return { ok: false, errors, error: 'Please correct the highlighted fields.' };
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...values,
      stock: existing.stock,
      active: existing.active,
      updatedAt: now,
    };
    const products = snapshotState.products.map((product) =>
      product.id === productId ? updated : product
    );
    const reconciled = reconcileRecommendations(
      products,
      snapshotState.recommendations,
      now
    );
    const entry = auditEntry(
      actor,
      'Product Updated',
      `${updated.sku} — ${updated.name}`,
      `Updated product details. Stock was not modified (${updated.stock} units). Reorder level ${updated.reorderLevel}, target stock ${updated.targetStock}, price ${updated.unitPrice}.`
    );

    setStore((prev) => ({
      ...prev,
      products,
      recommendations: reconciled.recommendations,
      auditLogs: [entry, ...prev.auditLogs].slice(0, 500),
    }));

    return { ok: true, product: updated };
  }, [deny]);

  const setProductActive = useCallback((productId, active) => {
    const actor = userRef.current;
    if (!can(actor, 'products.deactivate')) return deny();
    const snapshotState = getStore();
    const existing = snapshotState.products.find((product) => product.id === productId);
    if (!existing) return { ok: false, error: 'Product not found.' };

    const now = new Date().toISOString();
    const updated = { ...existing, active, updatedAt: now };
    const products = snapshotState.products.map((product) =>
      product.id === productId ? updated : product
    );
    const reconciled = reconcileRecommendations(
      products,
      snapshotState.recommendations,
      now
    );
    const entry = auditEntry(
      actor,
      active ? 'Product Reactivated' : 'Product Deactivated',
      `${updated.sku} — ${updated.name}`,
      active
        ? 'Product was reactivated and is available for stock transactions again.'
        : 'Product was deactivated. Stock history is preserved; pending recommendations were closed.'
    );

    setStore((prev) => ({
      ...prev,
      products,
      recommendations: reconciled.recommendations,
      auditLogs: [entry, ...prev.auditLogs].slice(0, 500),
    }));

    return { ok: true, product: updated };
  }, [deny]);

  const deactivateProduct = useCallback(
    (productId) => setProductActive(productId, false),
    [setProductActive]
  );

  const reactivateProduct = useCallback(
    (productId) => setProductActive(productId, true),
    [setProductActive]
  );

  const addSupplier = useCallback((input) => {
    const actor = userRef.current;
    if (!can(actor, 'suppliers.manage')) return deny();
    const { errors, values, valid } = validateSupplierInput(input);
    if (!valid) {
      return { ok: false, errors, error: 'Please correct the highlighted fields.' };
    }

    const supplier = {
      id: newId('sup'),
      ...values,
      createdAt: new Date().toISOString(),
    };
    const entry = auditEntry(
      actor,
      'Supplier Added',
      supplier.name,
      `Added supplier contact ${supplier.contactPerson}.`
    );

    setStore((prev) => ({
      ...prev,
      suppliers: [...prev.suppliers, supplier],
      auditLogs: [entry, ...prev.auditLogs].slice(0, 500),
    }));

    return { ok: true, supplier };
  }, [deny]);

  const updateSupplier = useCallback((supplierId, input) => {
    const actor = userRef.current;
    if (!can(actor, 'suppliers.manage')) return deny();
    const snapshotState = getStore();
    const existing = snapshotState.suppliers.find((supplier) => supplier.id === supplierId);
    if (!existing) return { ok: false, error: 'Supplier not found.' };

    const { errors, values, valid } = validateSupplierInput(input);
    if (!valid) {
      return { ok: false, errors, error: 'Please correct the highlighted fields.' };
    }

    const updated = { ...existing, ...values };
    const entry = auditEntry(actor, 'Supplier Updated', updated.name, `Updated supplier contact details.`);

    setStore((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((supplier) =>
        supplier.id === supplierId ? updated : supplier
      ),
      auditLogs: [entry, ...prev.auditLogs].slice(0, 500),
    }));

    return { ok: true, supplier: updated };
  }, [deny]);

  const deleteSupplier = useCallback((supplierId) => {
    const actor = userRef.current;
    if (!can(actor, 'suppliers.manage')) return deny();
    const snapshotState = getStore();
    const supplier = snapshotState.suppliers.find((item) => item.id === supplierId);
    const guard = canDeleteSupplier(supplier, snapshotState.products);
    if (!guard.ok) return { ok: false, error: guard.error };

    const entry = auditEntry(actor, 'Supplier Deleted', supplier.name, 'Removed supplier from the directory.');
    setStore((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((item) => item.id !== supplierId),
      auditLogs: [entry, ...prev.auditLogs].slice(0, 500),
    }));
    return { ok: true };
  }, [deny]);

  const recordMovement = useCallback((type, payload) => {
    const actor = userRef.current;
    const permission = type === 'in' ? 'stock.in' : 'stock.out';
    if (!can(actor, permission)) return deny();

    const snapshotState = getStore();
    const product = snapshotState.products.find((item) => item.id === payload?.productId);
    if (!product) {
      return { ok: false, error: 'Product not found. Please select a valid product.' };
    }

    const plan = planStockMovement(product, type, payload?.quantity);
    if (!plan.ok) return { ok: false, error: plan.error };

    const now = new Date().toISOString();
    const updatedProduct = { ...product, stock: plan.updatedStock, updatedAt: now };
    const products = snapshotState.products.map((item) =>
      item.id === product.id ? updatedProduct : item
    );
    const transaction = {
      id: newId('txn'),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type,
      quantity: plan.quantity,
      previousStock: plan.previousStock,
      updatedStock: plan.updatedStock,
      userId: actor.id,
      userName: actor.name,
      role: actor.role,
      remarks:
        String(payload?.remarks || '').trim() ||
        (type === 'in' ? 'Stock received' : 'Stock issued'),
      timestamp: now,
    };
    const reconciled = reconcileRecommendations(
      products,
      snapshotState.recommendations,
      now
    );
    const label = type === 'in' ? 'Stock-In' : 'Stock-Out';
    const entry = auditEntry(
      actor,
      label,
      `${product.sku} — ${product.name}`,
      `Recorded ${label.toLowerCase()} of ${formatUnits(plan.quantity, product.unit)}. Stock ${plan.previousStock} → ${plan.updatedStock}. New status: ${plan.status.label}.`
    );

    setStore((prev) => ({
      ...prev,
      products,
      transactions: [transaction, ...prev.transactions],
      recommendations: reconciled.recommendations,
      auditLogs: [entry, ...prev.auditLogs].slice(0, 500),
    }));

    return { ok: true, transaction, product: updatedProduct };
  }, [deny]);

  const recordStockIn = useCallback(
    (payload) => recordMovement('in', payload),
    [recordMovement]
  );

  const recordStockOut = useCallback(
    (payload) => recordMovement('out', payload),
    [recordMovement]
  );

  const decideRecommendation = useCallback((recommendationId, decision, note = '') => {
    const actor = userRef.current;
    if (!can(actor, 'recommendations.decide')) return deny();
    if (decision !== 'approved' && decision !== 'rejected') {
      return { ok: false, error: 'Invalid recommendation decision.' };
    }
    const snapshotState = getStore();
    const recommendation = snapshotState.recommendations.find(
      (item) => item.id === recommendationId
    );
    const result = applyRecommendationDecision(recommendation, decision, {
      note,
      actor,
      now: new Date().toISOString(),
    });
    if (!result.ok) return { ok: false, error: result.error };

    const updated = result.recommendation;
    const label = decision === 'approved' ? 'Reorder Approved' : 'Reorder Rejected';

    setStore((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((item) =>
        item.id === recommendationId ? updated : item
      ),
      auditLogs: [
        auditEntry(
          actor,
          label,
          `${recommendation.sku} — ${recommendation.productName}`,
          decisionAuditDescription(updated, decision)
        ),
        ...prev.auditLogs,
      ].slice(0, 500),
    }));

    return { ok: true, recommendation: updated };
  }, [deny]);

  const updateSettings = useCallback((patch) => {
    const actor = userRef.current;
    if (!can(actor, 'settings.manage')) return deny();
    const snapshotState = getStore();
    const allowed = [
      'businessName',
      'currency',
      'forecastPeriodDays',
      'forecastHorizonDays',
      'lowStockEmailAlerts',
      'demoBanner',
      'compactTables',
    ];
    const sanitized = {};
    for (const key of allowed) {
      if (patch && Object.prototype.hasOwnProperty.call(patch, key)) {
        sanitized[key] = patch[key];
      }
    }
    const nextSettings = { ...snapshotState.settings, ...sanitized };
    setStore((prev) => ({
      ...prev,
      settings: nextSettings,
      auditLogs: [
        auditEntry(
          actor,
          'Settings Updated',
          'Prototype Settings',
          `Updated settings: ${Object.keys(sanitized).join(', ') || 'no changes'}.`
        ),
        ...prev.auditLogs,
      ].slice(0, 500),
    }));
    return { ok: true, settings: nextSettings };
  }, [deny]);

  const resetDemoData = useCallback(() => {
    const actor = userRef.current;
    if (!can(actor, 'demo.reset')) return deny();
    const currentSession = getStore()?.session || null;
    resetStore(currentSession);
    const entry = auditEntry(
      actor,
      'Demo Reset',
      'System',
      'Reset all demonstration data to the original seeded inventory, transactions, recommendations, and settings. Current session was preserved.'
    );
    setStore((prev) => ({
      ...prev,
      auditLogs: [entry, ...(prev?.auditLogs || [])].slice(0, 500),
    }));
    return { ok: true };
  }, [deny]);

  const products = snapshot?.products || [];
  const suppliers = snapshot?.suppliers || [];
  const transactions = snapshot?.transactions || [];
  const recommendations = snapshot?.recommendations || [];
  const auditLogs = snapshot?.auditLogs || [];
  const settings = snapshot?.settings || { businessName: 'StockSense', currency: '₱' };

  const activeProducts = useMemo(() => products.filter((product) => product.active), [products]);

  const statusCounts = useMemo(() => stockStatusCounts(products), [products]);

  const alerts = useMemo(() => {
    return activeProducts
      .filter((product) => getStockStatus(product).key !== 'sufficient')
      .map((product) => {
        const status = getStockStatus(product);
        return {
          id: `alert-${product.id}`,
          productId: product.id,
          sku: product.sku,
          name: product.name,
          unit: product.unit,
          stock: product.stock,
          reorderLevel: product.reorderLevel,
          targetStock: product.targetStock,
          severity: status.key,
          statusLabel: status.label,
          message:
            status.key === 'out'
              ? `${product.name} is out of stock. Reorder level is ${product.reorderLevel} units.`
              : `${product.name} is low on stock: ${formatUnits(product.stock, product.unit)} remaining (reorder level ${product.reorderLevel}).`,
        };
      })
      .sort((a, b) => {
        const rank = { out: 0, low: 1 };
        return rank[a.severity] - rank[b.severity] || a.stock - b.stock;
      });
  }, [activeProducts]);

  const pendingRecommendations = useMemo(
    () =>
      recommendations
        .filter((recommendation) => recommendation.status === 'pending')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [recommendations]
  );

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8),
    [transactions]
  );

  const todayTransactions = useMemo(
    () => transactions.filter((transaction) => isToday(transaction.timestamp)),
    [transactions]
  );

  const stats = useMemo(() => {
    const totalStockUnits = activeProducts.reduce(
      (sum, product) => sum + (Number(product.stock) || 0),
      0
    );
    const inventoryValue = activeProducts.reduce(
      (sum, product) => sum + (Number(product.stock) || 0) * (Number(product.unitPrice) || 0),
      0
    );
    const stockInToday = todayTransactions
      .filter((transaction) => transaction.type === 'in')
      .reduce((sum, transaction) => sum + (Number(transaction.quantity) || 0), 0);
    const stockOutToday = todayTransactions
      .filter((transaction) => transaction.type === 'out')
      .reduce((sum, transaction) => sum + (Number(transaction.quantity) || 0), 0);
    const healthPercent =
      statusCounts.total > 0
        ? Math.round((statusCounts.sufficient / statusCounts.total) * 100)
        : 0;

    return {
      totalProducts: activeProducts.length,
      totalStockUnits,
      inventoryValue,
      lowStock: statusCounts.low,
      outOfStock: statusCounts.out,
      sufficient: statusCounts.sufficient,
      stockInToday,
      stockOutToday,
      pendingRecommendations: pendingRecommendations.length,
      healthPercent,
      activeSuppliers: suppliers.length,
    };
  }, [activeProducts, todayTransactions, statusCounts, pendingRecommendations, suppliers]);

  const state = useMemo(
    () => ({
      products,
      activeProducts,
      suppliers,
      transactions,
      recommendations,
      auditLogs,
      settings,
      meta: snapshot?.meta || null,
      alerts,
      pendingRecommendations,
      recentTransactions,
      todayTransactions,
      stats,
      statusCounts,
    }),
    [
      products,
      activeProducts,
      suppliers,
      transactions,
      recommendations,
      auditLogs,
      settings,
      snapshot?.meta,
      alerts,
      pendingRecommendations,
      recentTransactions,
      todayTransactions,
      stats,
      statusCounts,
    ]
  );

  const canDo = useCallback((permission) => can(user, permission), [user]);

  const value = useMemo(
    () => ({
      ready,
      user,
      accounts: DEMO_ACCOUNTS,
      ...state,
      canDo,
      canUser: can,
      permissions: PERMISSIONS,
      getRoutePermission,
      normalizePath,
      login,
      logout,
      addProduct,
      updateProduct,
      deactivateProduct,
      reactivateProduct,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      recordStockIn,
      recordStockOut,
      decideRecommendation,
      updateSettings,
      resetDemoData,
      getProductById: (id) => products.find((product) => product.id === id) || null,
      getSupplierById: (id) => suppliers.find((supplier) => supplier.id === id) || null,
      getSupplierName: (id) => suppliers.find((supplier) => supplier.id === id)?.name || 'Unassigned',
      authorize,
      rawState: snapshot,
    }),
    [
      ready,
      user,
      state,
      canDo,
      login,
      logout,
      addProduct,
      updateProduct,
      deactivateProduct,
      reactivateProduct,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      recordStockIn,
      recordStockOut,
      decideRecommendation,
      updateSettings,
      resetDemoData,
      products,
      suppliers,
      authorize,
      snapshot,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>.');
  }
  return context;
}

export default AppContext;
