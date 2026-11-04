// Central chatbot knowledge base.
// Every statement here must match the actually implemented prototype. No imaginary features.

export const KNOWLEDGE_BASE = {
  about: {
    title: 'What StockSense AI is',
    answer:
      'StockSense AI is an inventory and stock management automation prototype designed to help businesses monitor products, manage stock movements, detect low inventory, generate reorder recommendations, and analyze historical demand. It is an interactive academic prototype for the SA101 prefinal defense, not a production system.',
  },
  inventory: {
    title: 'Inventory management',
    answer:
      'Inventory management in StockSense AI covers product registration, supplier assignment, reorder levels, target stock, stock-in and stock-out transactions, automated low-stock detection, transaction history, and audit records. Every figure is calculated from the same centralized local state.',
  },
  productRegistration: {
    title: 'Product registration',
    answer:
      'Products are registered with a unique SKU, name, category, unit, unit price, optional supplier, reorder level, and target stock level. New products start with 0 stock — stock balances only change through validated stock-in and stock-out transactions.',
  },
  sku: {
    title: 'SKU meaning',
    answer:
      'A SKU (Stock Keeping Unit) is the unique code that identifies a product, such as BP-001 for Bond Paper. StockSense AI rejects duplicate SKUs so every transaction, alert, recommendation, and report refers to exactly one product.',
  },
  stockIn: {
    title: 'Stock-In',
    answer:
      'Stock-In is a validated transaction that adds stock. Choose a product, enter a positive whole quantity, and submit. StockSense AI increases the balance, records the transaction, recalculates stock status, resolves any alert that no longer applies, updates pending reorder recommendations, and writes an audit entry.',
  },
  stockOut: {
    title: 'Stock-Out',
    answer:
      'Stock-Out is a validated transaction that deducts stock. The quantity must be a positive whole number and cannot exceed the available stock. A rejected stock-out never changes inventory and never creates a successful transaction record. Stock-out records also feed the historical demand forecast.',
  },
  lowStock: {
    title: 'Low-stock detection',
    answer:
      'Low-stock detection is rule-based and automatic: stock equal to 0 is Out of Stock; stock less than or equal to the reorder level is Low Stock; stock above the reorder level is Sufficient Stock. Status recalculates after every validated transaction, and alerts resolve automatically — there are no duplicate active alerts.',
  },
  reorderLevel: {
    title: 'Reorder level',
    answer:
      'The reorder level is the stock threshold that triggers low-stock detection and a reorder recommendation. If a product has a reorder level of 50 units, any stock balance of 50 units or fewer is classified as Low Stock.',
  },
  targetStock: {
    title: 'Target stock',
    answer:
      'Target stock is the desired stock level used by the reorder formula. It must be greater than the reorder level. The recommendation tops the product back up toward this target, but only a separate stock-in transaction can actually add the units.',
  },
  reorderFormula: {
    title: 'Reorder recommendation calculation',
    answer:
      'StockSense AI uses a rule-based calculation: Recommended Quantity = Max(Target Stock − Current Stock, 0). For example, if the target stock is 100 units and current stock is 20 units, the recommended reorder quantity is 80 units. The rule is deterministic — there is no machine learning involved.',
  },
  approval: {
    title: 'Approval workflow',
    answer:
      'Only the Administrator and Business Owner can approve or reject reorder recommendations. Approval records a purchasing decision and preserves it in recommendation history. It does NOT automatically add stock. Inventory increases only when an authorized user records a separate, validated stock-in transaction.',
  },
  forecasting: {
    title: 'Historical demand forecasting',
    answer:
      'This prototype demonstrates demand forecasting using historical stock-out transactions and a moving-average calculation. Average Daily Demand = Total Stock-Out Units ÷ Historical Calendar Days. Projected Demand = Average Daily Demand × Forecast Days. Days of Stock Coverage = Current Stock ÷ Average Daily Demand. It does not execute a trained machine-learning model and does not claim accuracy or confidence scores.',
  },
  suppliers: {
    title: 'Supplier management',
    answer:
      'The supplier directory stores a supplier name, contact person, phone, email, address, and notes. Suppliers can be assigned to products. A supplier assigned to a product cannot be deleted until those products are reassigned. The chatbot only reports supplier data that exists in the current local state.',
  },
  reports: {
    title: 'Reports and CSV export',
    answer:
      'The Reports page provides inventory, low-stock, stock-in, stock-out, and reorder recommendation reports with search, filters, summary statistics, and CSV export. CSV files are generated from the local application state in the browser — no server is contacted. All records are demonstration data.',
  },
  audit: {
    title: 'Audit trail',
    answer:
      'The audit log records demonstration events such as login, logout, product creation and updates, stock-in, stock-out, reorder approval or rejection, settings changes, and demo data reset. Each entry includes date and time, user, action, entity, and description. These are simulated local records and are not tamper-proof security logs.',
  },
  roles: {
    title: 'Demo roles and permissions',
    answer:
      'There are four demo roles. Administrator: full access including settings, audit logs, and demo reset. Business Owner: inventory management, forecasting, reports, and reorder approvals. Inventory Staff: products, stock-in, stock-out, alerts, and transaction history — but not approvals or settings. Inventory Viewer: read-only dashboard, products, alerts, and reports. Every state-changing action checks these centralized permissions on the client, and the assistant uses the same rules.',
  },
  limitations: {
    title: 'Prototype limitations',
    answer:
      'StockSense AI is a static browser prototype. It has simulated login, client-side role checks, localStorage persistence, rule-based automation, historical moving-average calculations, and a rule-based chatbot. It does not have secure server authentication, a backend database, tamper-proof audit logs, multiuser synchronization, production backups, real machine-learning inference, or cloud AI services. Hardcoded demo passwords and localStorage do not provide production-grade security.',
  },
  transactions: {
    title: 'Transaction history',
    answer:
      'Transaction history lists every successful stock-in and stock-out with the transaction ID, product, SKU, type, quantity, previous and updated stock, user, timestamp, and remarks. Rejected transactions are not stored as successful records.',
  },
  alerts: {
    title: 'Stock alerts',
    answer:
      'Stock alerts are derived from current stock and each product’s reorder level — they are not stored duplicates. A low-stock alert resolves immediately once a stock-in raises the product above its reorder level. Alerts do not order stock; an authorized reviewer handles the generated reorder recommendation.',
  },
  demoTesting: {
    title: 'Demo and testing center',
    answer:
      'The Demo / Testing page runs 16 inventory and chatbot scenarios against isolated test fixtures, so your live demonstration data is never modified. A result only shows PASS after that test has actually executed. The Administrator also has a separate Reset Demo Data action.',
  },
  navigation: {
    title: 'Navigation',
    answer:
      'Use the sidebar to open Dashboard, Products, Suppliers, Stock-In, Stock-Out, Alerts, Reorder Recommendations, Forecasting, Reports, Transactions, Audit Logs, Demo / Testing, Security, and Settings. Menu items are role-aware, and the assistant checks the same route permissions before offering navigation.',
  },
  helper: {
    title: 'What the assistant can do',
    answer:
      'I can look up product stock, prices, suppliers, reorder levels, target stock, categories, and recommended quantities from the live inventory. I can explain alerts, reorder recommendations, approvals, forecasting, reports, audit logs, and roles. I can also open pages you are allowed to access and start interactive walkthroughs that highlight real interface elements.',
  },
};

export const EXPLANATION_INTENT_MAP = {
  explain_about: 'about',
  explain_inventory: 'inventory',
  explain_product_registration: 'productRegistration',
  explain_sku: 'sku',
  explain_stock_in: 'stockIn',
  explain_stock_out: 'stockOut',
  explain_low_stock: 'lowStock',
  explain_reorder_level: 'reorderLevel',
  explain_target_stock: 'targetStock',
  explain_reorder: 'reorderFormula',
  explain_approval: 'approval',
  explain_forecast: 'forecasting',
  explain_suppliers: 'suppliers',
  explain_reports: 'reports',
  explain_audit: 'audit',
  explain_roles: 'roles',
  explain_limitations: 'limitations',
  explain_transactions: 'transactions',
  explain_alerts: 'alerts',
  explain_demo: 'demoTesting',
  explain_navigation: 'navigation',
  help: 'helper',
};

export function getKnowledgeEntry(intent) {
  const key = EXPLANATION_INTENT_MAP[intent];
  return key ? KNOWLEDGE_BASE[key] : null;
}

export function knowledgeKeyForIntent(intent) {
  return EXPLANATION_INTENT_MAP[intent] || null;
}
