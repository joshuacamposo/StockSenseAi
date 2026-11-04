// Deterministic demonstration seed data.
// The three required products (Bond Paper, Ballpen, USB Flash Drive) keep their exact
// starting stock values from the project brief. Historical transactions are generated so the
// forecasting prototype has real stock-out records to work with.

import { DEMO_ACCOUNTS } from '@/data/demoAccounts';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import { DEMO_SUPPLIERS } from '@/data/demoSuppliers';
import { calculateRecommendedQty } from './inventoryRules';
import { STORAGE_VERSION } from './storage';
import { newId } from './id';

export const DEMO_SETTINGS = {
  businessName: 'StockSense Demo Trading',
  currency: '₱',
  forecastPeriodDays: 30,
  forecastHorizonDays: 30,
  lowStockEmailAlerts: false,
  demoBanner: true,
  compactTables: false,
};

// Historical demand events (days ago) used to build a consistent transaction chain that ends
// at each product's seeded current stock.
const HISTORY = {
  'prod-bp-001': [
    { daysAgo: 29, type: 'out', qty: 8, remarks: 'Issued to Admin Office' },
    { daysAgo: 27, type: 'out', qty: 6, remarks: 'Issued to Registrar' },
    { daysAgo: 24, type: 'out', qty: 7, remarks: 'Branch replenishment' },
    { daysAgo: 22, type: 'out', qty: 5, remarks: 'Issued to Accounting' },
    { daysAgo: 19, type: 'out', qty: 9, remarks: 'Bulk printing request' },
    { daysAgo: 17, type: 'out', qty: 6, remarks: 'Issued to HR Office' },
    { daysAgo: 14, type: 'out', qty: 8, remarks: 'Issued to Admin Office' },
    { daysAgo: 12, type: 'out', qty: 5, remarks: 'Registrar forms printing' },
    { daysAgo: 9, type: 'out', qty: 7, remarks: 'Issued to Accounting' },
    { daysAgo: 7, type: 'out', qty: 6, remarks: 'Marketing printouts' },
    { daysAgo: 5, type: 'out', qty: 8, remarks: 'Issued to Admin Office' },
    { daysAgo: 3, type: 'out', qty: 5, remarks: 'Faculty request' },
  ],
  'prod-pen-001': [
    { daysAgo: 28, type: 'out', qty: 12, remarks: 'New employee kits' },
    { daysAgo: 25, type: 'out', qty: 15, remarks: 'Training room supplies' },
    { daysAgo: 22, type: 'out', qty: 10, remarks: 'Front desk replenishment' },
    { daysAgo: 20, type: 'out', qty: 14, remarks: 'Enrollment station supplies' },
    { daysAgo: 18, type: 'in', qty: 100, remarks: 'Delivery from Northwind Office Supplies' },
    { daysAgo: 17, type: 'out', qty: 11, remarks: 'Faculty requests' },
    { daysAgo: 15, type: 'out', qty: 13, remarks: 'Exam week supplies' },
    { daysAgo: 13, type: 'out', qty: 9, remarks: 'Cashier station' },
    { daysAgo: 10, type: 'out', qty: 16, remarks: 'Student activity kits' },
    { daysAgo: 8, type: 'out', qty: 12, remarks: 'Registration week' },
    { daysAgo: 6, type: 'out', qty: 10, remarks: 'Front desk replenishment' },
    { daysAgo: 4, type: 'out', qty: 14, remarks: 'Department requests' },
    { daysAgo: 2, type: 'out', qty: 11, remarks: 'Make-up exam supplies' },
  ],
  'prod-usb-001': [
    { daysAgo: 27, type: 'out', qty: 2, remarks: 'IT department request' },
    { daysAgo: 23, type: 'out', qty: 1, remarks: 'Presentation copy' },
    { daysAgo: 21, type: 'in', qty: 10, remarks: 'Delivery from TechHub Trading' },
    { daysAgo: 20, type: 'out', qty: 2, remarks: 'Records digitization' },
    { daysAgo: 18, type: 'out', qty: 3, remarks: 'Backup media for registrar' },
    { daysAgo: 15, type: 'out', qty: 2, remarks: 'IT department request' },
    { daysAgo: 13, type: 'out', qty: 1, remarks: 'Marketing presentation' },
    { daysAgo: 11, type: 'out', qty: 2, remarks: 'Enrollment data turnover' },
    { daysAgo: 8, type: 'out', qty: 2, remarks: 'IT department request' },
    { daysAgo: 6, type: 'out', qty: 1, remarks: 'Faculty presentation' },
    { daysAgo: 4, type: 'out', qty: 2, remarks: 'Records backup' },
    { daysAgo: 2, type: 'out', qty: 1, remarks: 'System installer media' },
  ],
};

function seedActor(index) {
  const accounts = [DEMO_ACCOUNTS[2], DEMO_ACCOUNTS[1], DEMO_ACCOUNTS[0]]; // staff, owner, admin
  return accounts[index % accounts.length];
}

function buildSeedTransactions(now) {
  const rows = [];

  for (const product of DEMO_PRODUCTS) {
    const events = HISTORY[product.id];
    if (!events || events.length === 0) continue;

    // Walk backwards from the current stock so the transaction chain is always consistent.
    const newestFirst = [...events].sort((a, b) => b.daysAgo - a.daysAgo);
    let stockAfter = product.stock;
    const built = [];

    newestFirst.forEach((event, index) => {
      const stockBefore = event.type === 'in' ? stockAfter - event.qty : stockAfter + event.qty;
      const when = new Date(now);
      when.setDate(when.getDate() - event.daysAgo);
      when.setHours(8 + (index % 9), (index * 13) % 60, 0, 0);
      const actor = seedActor(index);
      built.push({
        id: `txn-seed-${product.sku.toLowerCase()}-${String(index + 1).padStart(2, '0')}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type: event.type,
        quantity: event.qty,
        previousStock: stockBefore,
        updatedStock: stockAfter,
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        remarks: `${event.remarks} (demonstration record)`,
        timestamp: when.toISOString(),
        seeded: true,
      });
      stockAfter = stockBefore;
    });

    rows.push(...built);
  }

  return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function buildSeedRecommendations(now) {
  const createdAt = new Date(now.getTime() - 1000 * 60 * 45).toISOString();
  return DEMO_PRODUCTS.filter((product) => product.stock <= product.reorderLevel).map((product) => ({
    id: `rec-seed-${product.sku.toLowerCase()}`,
    productId: product.id,
    sku: product.sku,
    productName: product.name,
    unit: product.unit,
    currentStock: product.stock,
    reorderLevel: product.reorderLevel,
    targetStock: product.targetStock,
    recommendedQty: calculateRecommendedQty(product),
    status: 'pending',
    source: 'automated-rule',
    createdAt,
    updatedAt: createdAt,
    createdBy: 'System (automated rule)',
    decidedAt: null,
    decidedBy: null,
    decisionNote: '',
  }));
}

function buildSeedAuditLogs(now, recommendations) {
  const seededAt = now.toISOString();
  return [
    {
      id: newId('log'),
      timestamp: seededAt,
      userId: 'system',
      userName: 'StockSense Automation',
      role: 'system',
      action: 'Demo Data Initialized',
      entity: 'System',
      description:
        'Demonstration inventory, suppliers, historical stock movements, and reorder recommendations were initialized in localStorage.',
    },
    {
      id: newId('log'),
      timestamp: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
      userId: 'system',
      userName: 'StockSense Automation',
      role: 'system',
      action: 'Recommendation Generated',
      entity: 'Automated Reorder Engine',
      description: `Rule-based reorder recommendations generated for ${recommendations.length} product(s) at or below their reorder levels.`,
    },
  ];
}

export function createInitialState(session = null) {
  const now = new Date();
  const recommendations = buildSeedRecommendations(now);
  const transactions = buildSeedTransactions(now);

  return {
    version: STORAGE_VERSION,
    session,
    products: DEMO_PRODUCTS.map((product) => ({
      ...product,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })),
    suppliers: DEMO_SUPPLIERS.map((supplier) => ({ ...supplier })),
    transactions,
    recommendations,
    auditLogs: buildSeedAuditLogs(now, recommendations),
    settings: { ...DEMO_SETTINGS },
    meta: {
      seededAt: now.toISOString(),
      lastResetAt: now.toISOString(),
      isDemoData: true,
      appVersion: '1.0.0',
    },
  };
}
