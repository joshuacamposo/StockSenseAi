// Guided walkthrough configuration.
// Every selector below points at a real element in the running prototype. Tours that include
// interface steps wait for the user to open the relevant modal — they never submit a form for them.

export const WALKTHROUGHS = [
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    shortTitle: 'Dashboard',
    description: 'See how the dashboard summarizes stock health, alerts, and recent movement.',
    route: '/dashboard',
    permission: 'dashboard.view',
    keywords: ['dashboard', 'home', 'overview', 'summary', 'dashboard tour'],
    icon: 'LayoutDashboard',
    steps: [
      {
        selector: '[data-tour="dashboard-stats"]',
        title: 'Live inventory statistics',
        body: 'These cards are calculated from the same centralized state used everywhere else: active products, units on hand, low-stock counts, and pending reorders. Record a transaction and the numbers update immediately.',
      },
      {
        selector: '[data-tour="dashboard-chart"]',
        title: 'Stock movement trend',
        body: 'The chart is built from real stock-in and stock-out records stored in this browser. Hover a day to inspect the quantities.',
      },
      {
        selector: '[data-tour="dashboard-alerts"]',
        title: 'Automatic stock alerts',
        body: 'Alerts are derived from each product’s reorder level. They are not duplicate stored records, so they resolve automatically after a stock-in raises the balance.',
      },
      {
        selector: '[data-tour="dashboard-recent"]',
        title: 'Recent transactions',
        body: 'Every successful stock movement creates a transaction record with the previous balance, updated balance, user, and timestamp.',
      },
    ],
  },
  {
    id: 'inventory-overview',
    title: 'Inventory Overview',
    shortTitle: 'Products',
    description: 'Search, filter, and understand the product catalog.',
    route: '/products',
    permission: 'products.view',
    keywords: ['inventory overview', 'product list', 'products', 'product catalog', 'view products'],
    icon: 'Package',
    steps: [
      {
        selector: '[data-tour="products-search"]',
        title: 'Search products',
        body: 'Search by product name, SKU, category, or description. Search only filters this browser’s local state.',
      },
      {
        selector: '[data-tour="product-status-filter"]',
        title: 'Filter by stock status',
        body: 'Use the status filter to isolate sufficient, low, out-of-stock, or deactivated products.',
      },
      {
        selector: '[data-tour="products-table"]',
        title: 'The catalog table',
        body: 'Stock, reorder level, status, unit price, and supplier are shown together. Stock is read-only here — it changes only through validated transactions.',
      },
      {
        selector: '[data-tour="product-row"]',
        title: 'Product actions',
        body: 'Use the row actions to view details or edit product information. Deactivation preserves all stock history.',
        optional: true,
      },
    ],
  },
  {
    id: 'add-product',
    title: 'Add a New Product',
    shortTitle: 'Add product',
    description: 'Register a product with a unique SKU, reorder level, and target stock.',
    route: '/products',
    permission: 'products.create',
    keywords: ['add product', 'create product', 'new product', 'register product', 'add item'],
    icon: 'PackagePlus',
    steps: [
      {
        selector: '[data-tour="add-product-button"]',
        title: 'Open the product form',
        body: 'Click the highlighted “Add product” button to open the registration form. The walkthrough will continue automatically.',
        advanceOnClick: true,
      },
      {
        selector: '[data-tour="product-sku-input"]',
        title: 'Enter a unique SKU',
        body: 'A SKU identifies one product, such as BP-001. Duplicate SKUs are rejected so transactions and reports always refer to a single item.',
      },
      {
        selector: '[data-tour="product-name-input"]',
        title: 'Name the product',
        body: 'Use the recognizable product name, for example “Bond Paper” or “USB Flash Drive”.',
      },
      {
        selector: '[data-tour="product-category-input"]',
        title: 'Choose a category and unit',
        body: 'Category groups products in reports. The unit of measure (piece, ream, box…) is used when quantities are displayed.',
      },
      {
        selector: '[data-tour="product-reorder-input"]',
        title: 'Set the reorder level',
        body: 'When stock is at or below this level, StockSense AI marks the product Low Stock and generates a reorder recommendation.',
      },
      {
        selector: '[data-tour="product-target-input"]',
        title: 'Set the target stock',
        body: 'Target stock must be greater than the reorder level. The recommendation formula tops stock back up toward this target.',
      },
      {
        selector: '[data-tour="save-product-button"]',
        title: 'Save the product',
        body: 'The product starts with 0 stock. Stock balances only increase through a separate validated stock-in transaction — the form never accepts a stock value.',
      },
    ],
  },
  {
    id: 'edit-product',
    title: 'Edit Product Details',
    shortTitle: 'Edit product',
    description: 'Update product information without changing the stock balance.',
    route: '/products',
    permission: 'products.edit',
    keywords: ['edit product', 'update product', 'change product', 'modify product'],
    icon: 'Pencil',
    steps: [
      {
        selector: '[data-tour="product-row"]',
        title: 'Find the product',
        body: 'Locate the product in the catalog. The first row is highlighted for this demonstration.',
        optional: true,
      },
      {
        selector: '[data-tour="edit-product-button"]',
        title: 'Open the edit form',
        body: 'Click the highlighted pencil button. The stock figure inside the form is read-only and cannot be edited here.',
        advanceOnClick: true,
      },
      {
        selector: '[data-tour="product-name-input"]',
        title: 'Update product information',
        body: 'Change the name, category, price, supplier, reorder level, or target stock as needed.',
      },
      {
        selector: '[data-tour="save-product-button"]',
        title: 'Save changes',
        body: 'Saving updates the product record and writes an audit entry. The current stock balance remains unchanged.',
      },
    ],
  },
  {
    id: 'stock-in',
    title: 'Record a Stock-In',
    shortTitle: 'Stock-in',
    description: 'Receive stock through a validated transaction.',
    route: '/stock-in',
    permission: 'stock.in',
    keywords: ['stock in', 'stockin', 'receive stock', 'restock', 'delivery', 'add stock'],
    icon: 'ArrowDownToLine',
    steps: [
      {
        selector: '[data-tour="stock-in-form"]',
        title: 'The stock-in form',
        body: 'Every stock change must pass through this validated form. The assistant cannot change stock directly.',
      },
      {
        selector: '[data-tour="stock-in-product"]',
        title: 'Choose the product',
        body: 'Only active products can receive stock. The current balance and reorder level are shown beside the selector.',
      },
      {
        selector: '[data-tour="stock-in-quantity"]',
        title: 'Enter a valid quantity',
        body: 'Quantities must be positive whole numbers. Zero, negative, decimal, and empty values are rejected before anything changes.',
      },
      {
        selector: '[data-tour="stock-in-preview"]',
        title: 'Review the preview',
        body: 'Before submitting, the form shows the current stock, the updated balance, and the status that will apply afterwards.',
      },
      {
        selector: '[data-tour="stock-in-button"]',
        title: 'Submit the transaction',
        body: 'Submitting increases the balance, creates a transaction record, recalculates alerts, refreshes recommendations, and writes an audit entry.',
      },
      {
        selector: '[data-tour="stock-in-history"]',
        title: 'Verify the record',
        body: 'The transaction appears in the history with the stock change and user. It is also available on the Transactions page and in reports.',
      },
    ],
  },
  {
    id: 'stock-out',
    title: 'Record a Stock-Out',
    shortTitle: 'Stock-out',
    description: 'Issue stock while respecting available quantities.',
    route: '/stock-out',
    permission: 'stock.out',
    keywords: ['stock out', 'stockout', 'issue stock', 'deduct stock', 'release stock', 'consume stock'],
    icon: 'ArrowUpFromLine',
    steps: [
      {
        selector: '[data-tour="stock-out-form"]',
        title: 'The stock-out form',
        body: 'Stock-out reduces inventory. Rejected stock-outs never modify the balance and never create a successful transaction record.',
      },
      {
        selector: '[data-tour="stock-out-product"]',
        title: 'Choose the product',
        body: 'Select the product being issued. Products with zero stock cannot be deducted from.',
      },
      {
        selector: '[data-tour="stock-out-quantity"]',
        title: 'Enter the quantity',
        body: 'The quantity must be a positive whole number and cannot exceed the available stock.',
      },
      {
        selector: '[data-tour="stock-out-preview"]',
        title: 'Review the result',
        body: 'The preview shows the stock balance after the deduction and whether the product will become low or out of stock.',
      },
      {
        selector: '[data-tour="stock-out-button"]',
        title: 'Submit and verify',
        body: 'A valid stock-out updates the balance, writes a transaction record, recalculates alerts, and feeds historical demand forecasting.',
      },
    ],
  },
  {
    id: 'low-stock-alerts',
    title: 'Low-Stock Alerts',
    shortTitle: 'Alerts',
    description: 'Understand how automatic stock alerts are derived.',
    route: '/alerts',
    permission: 'alerts.view',
    keywords: ['alerts', 'alert', 'low stock alerts', 'stock warnings', 'notifications'],
    icon: 'BellRing',
    steps: [
      {
        selector: '[data-tour="alerts-list"]',
        title: 'Active alerts',
        body: 'Alerts are recalculated from current stock and each reorder level. There are no duplicate active alerts, and an alert disappears as soon as the product is healthy again.',
      },
      {
        selector: '[data-tour="alerts-navigation"]',
        title: 'Always available in the sidebar',
        body: 'The Alerts menu item carries a live count. The same count appears in the top notification bell.',
        optional: true,
      },
    ],
  },
  {
    id: 'reorder-recommendations',
    title: 'Reorder Recommendations',
    shortTitle: 'Recommendations',
    description: 'See the rule-based reorder calculation and review history.',
    route: '/recommendations',
    permission: 'recommendations.view',
    keywords: ['reorder recommendation', 'reorder recommendations', 'recommendation', 'recommended order', 'what to order'],
    icon: 'ClipboardList',
    steps: [
      {
        selector: '[data-tour="recommendations-list"]',
        title: 'Pending recommendations',
        body: 'A pending recommendation is generated automatically for every active product at or below its reorder level. The recommended quantity is Max(Target Stock − Current Stock, 0).',
      },
      {
        selector: '[data-tour="reorder-approval-button"]',
        title: 'Approval is a decision, not stock',
        body: 'Only the Administrator and Business Owner can approve or reject. Approval records a purchasing decision — it never adds stock. A separate stock-in is required when the delivery arrives.',
        optional: true,
      },
    ],
  },
  {
    id: 'approve-reorder',
    title: 'Approve a Reorder Recommendation',
    shortTitle: 'Approve reorder',
    description: 'Walk through the reviewer decision without changing stock.',
    route: '/recommendations',
    permission: 'recommendations.decide',
    keywords: ['approve recommendation', 'approve reorder', 'review recommendation', 'reject recommendation', 'approval workflow'],
    icon: 'CheckCircle2',
    steps: [
      {
        selector: '[data-tour="recommendations-list"]',
        title: 'Review the suggestion',
        body: 'Check the current stock, target stock, and rule-based recommended quantity before making a decision.',
      },
      {
        selector: '[data-tour="reorder-approval-button"]',
        title: 'Open the approval dialog',
        body: 'Click the highlighted Approve button to open the decision dialog. The walkthrough will continue automatically.',
        advanceOnClick: true,
        optional: true,
      },
      {
        selector: '#decision-note',
        title: 'Add an optional decision note',
        body: 'A note might record a purchase order reference or explain why the reorder is deferred. The decision is written to recommendation history and the audit trail.',
      },
      {
        selector: '[data-tour="confirm-reorder-decision"]',
        title: 'Confirm the decision',
        body: 'Confirming does NOT change inventory. The stock balance increases only after a separate, validated stock-in transaction.',
        optional: true,
      },
    ],
  },
  {
    id: 'demand-forecasting',
    title: 'Demand Forecasting',
    shortTitle: 'Forecasting',
    description: 'Explore the historical moving-average projection.',
    route: '/forecasting',
    permission: 'forecasting.view',
    keywords: ['forecast', 'forecasting', 'demand', 'projection', 'trend', 'moving average'],
    icon: 'LineChart',
    steps: [
      {
        selector: '[data-tour="forecast-product"]',
        title: 'Choose a product and window',
        body: 'Select the product, historical period, and forecast horizon. Only actual stock-out transactions in this browser feed the calculation.',
      },
      {
        selector: '[data-tour="forecast-results"]',
        title: 'Read the projection',
        body: 'Average daily demand divides total stock-out units by the full calendar window. Projected demand multiplies that average by the horizon. Days of coverage divides current stock by average daily demand.',
      },
      {
        selector: '[data-tour="forecast-chart"]',
        title: 'Inspect the history',
        body: 'This is a transparent historical moving average, not a trained machine-learning model. It does not claim confidence scores or production accuracy.',
      },
    ],
  },
  {
    id: 'suppliers',
    title: 'Supplier Directory',
    shortTitle: 'Suppliers',
    description: 'Manage supplier contacts and product assignments.',
    route: '/suppliers',
    permission: 'suppliers.view',
    keywords: ['supplier', 'suppliers', 'vendor', 'supplier directory', 'contact person'],
    icon: 'Truck',
    steps: [
      {
        selector: '[data-tour="supplier-list"]',
        title: 'Supplier records',
        body: 'Each supplier card shows the contact person, phone, email, address, and the products assigned to that supplier.',
      },
      {
        selector: '[data-tour="add-supplier-button"]',
        title: 'Manage suppliers',
        body: 'Administrators and Business Owners can add or edit suppliers. A supplier assigned to a product cannot be deleted until the product is reassigned.',
        optional: true,
      },
    ],
  },
  {
    id: 'reports-export',
    title: 'Reports and CSV Export',
    shortTitle: 'Reports',
    description: 'Generate inventory and movement reports and export them locally.',
    route: '/reports',
    permission: 'reports.view',
    keywords: ['report', 'reports', 'csv', 'export', 'download report', 'inventory report'],
    icon: 'FileBarChart',
    steps: [
      {
        selector: '[data-tour="reports-tabs"]',
        title: 'Choose a report',
        body: 'Switch between inventory, low-stock, stock-in, stock-out, and reorder recommendation reports. Each report reads the current local state.',
      },
      {
        selector: '[data-tour="reports-table"]',
        title: 'Review the records',
        body: 'Search and inspect the rows before exporting. Summary values are recalculated for the selected report.',
      },
      {
        selector: '[data-tour="export-csv-button"]',
        title: 'Export locally',
        body: 'CSV files are built in this browser and downloaded directly. No server, database, or external service is contacted.',
      },
    ],
  },
  {
    id: 'transactions',
    title: 'Transaction History',
    shortTitle: 'Transactions',
    description: 'Trace every successful stock movement.',
    route: '/transactions',
    permission: 'transactions.view',
    keywords: ['transaction', 'transactions', 'history', 'stock history', 'movement history', 'activity'],
    icon: 'History',
    steps: [
      {
        selector: '[data-tour="transactions-filter"]',
        title: 'Filter the history',
        body: 'Filter by stock-in, stock-out, or search by product, SKU, user, or remarks.',
      },
      {
        selector: '[data-tour="transactions-table"]',
        title: 'Auditable movement records',
        body: 'Each row shows the previous and updated stock, quantity, user, timestamp, and remarks. Rejected transactions never appear as successful records.',
      },
    ],
  },
  {
    id: 'chatbot-assistant',
    title: 'Use the AI Assistant',
    shortTitle: 'AI assistant',
    description: 'Ask the built-in assistant about real inventory data.',
    route: null,
    permission: null,
    keywords: ['chatbot', 'assistant', 'ai assistant', 'chat', 'ask ai', 'stock sense assistant'],
    icon: 'Bot',
    steps: [
      {
        selector: '[data-tour="chatbot-toggle"]',
        title: 'Open the assistant',
        body: 'Click the highlighted assistant button. It stays available on every workspace page.',
        advanceOnClick: true,
      },
      {
        selector: '[data-tour="chatbot-panel"]',
        title: 'A shared, offline assistant',
        body: 'The assistant reads the same centralized inventory state as the dashboard. It can check product stock, explain automation, open permitted pages, and start walkthroughs.',
      },
      {
        selector: '[data-tour="chatbot-input"]',
        title: 'Ask in English, Tagalog, or Cebuano',
        body: 'Try “Ilan ang natitirang Bond Paper?” or “Pila ang nahabilin nga USB?”. The assistant only reads data and cannot change stock directly.',
      },
    ],
  },
  {
    id: 'rbac-security',
    title: 'Roles and Security Limits',
    shortTitle: 'Roles & limits',
    description: 'Understand demo permissions and prototype security limitations.',
    route: '/security',
    permission: 'security.view',
    keywords: ['security', 'roles', 'permissions', 'rbac', 'limitations', 'access control'],
    icon: 'ShieldCheck',
    steps: [
      {
        selector: '[data-tour="security-rbac"]',
        title: 'Role-based demonstration controls',
        body: 'Four demo roles share one centralized permission matrix. Buttons, routes, actions, and the assistant all check the same rules.',
      },
      {
        selector: '[data-tour="security-limits"]',
        title: 'Honest limitations',
        body: 'Authentication is simulated, passwords are public, role checks are client-side, and audit logs are not tamper-proof. This is an academic prototype, not a production security boundary.',
      },
    ],
  },
];

export function getWalkthrough(id) {
  return WALKTHROUGHS.find((tour) => tour.id === id) || null;
}

export function findWalkthroughByText(rawText = '') {
  const text = String(rawText).toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const tour of WALKTHROUGHS) {
    const phrases = [
      tour.title,
      tour.shortTitle,
      ...(tour.keywords || []),
    ].map((phrase) => String(phrase).toLowerCase());

    for (const phrase of phrases) {
      if (!phrase) continue;
      if (!text.includes(phrase)) continue;
      const score = phrase.length;
      if (score > bestScore) {
        best = tour;
        bestScore = score;
      }
    }
  }

  return best;
}

export function walkthroughSummary() {
  return WALKTHROUGHS.map((tour) => ({
    id: tour.id,
    title: tour.title,
    description: tour.description,
    route: tour.route,
    steps: tour.steps.length,
  }));
}

export const WALKTHROUGH_COUNT = WALKTHROUGHS.length;
