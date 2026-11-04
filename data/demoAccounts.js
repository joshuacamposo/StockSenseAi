// Demonstration accounts for the StockSense AI prototype.
// PASSWORDS ARE HARDCODED AND PUBLIC BY DESIGN. This is NOT production authentication.
// All role checks are client-side demonstration controls only.

export const DEMO_ACCOUNTS = [
  {
    id: 'usr-admin',
    name: 'System Administrator',
    email: 'admin@stocksense.demo',
    password: 'Admin123!',
    role: 'admin',
    title: 'System Administrator',
    initials: 'SA',
    color: 'bg-brand-600',
    blurb: 'Full access, including settings, audit logs, and demo data reset.',
  },
  {
    id: 'usr-owner',
    name: 'Business Owner',
    email: 'owner@stocksense.demo',
    password: 'Owner123!',
    role: 'owner',
    title: 'Business Owner',
    initials: 'BO',
    color: 'bg-emerald-600',
    blurb: 'Can approve reorder recommendations and view forecasting & reports.',
  },
  {
    id: 'usr-staff',
    name: 'Inventory Staff',
    email: 'staff@stocksense.demo',
    password: 'Staff123!',
    role: 'staff',
    title: 'Inventory Staff',
    initials: 'IS',
    color: 'bg-amber-500',
    blurb: 'Handles products, stock-in, and stock-out. Cannot approve reorders.',
  },
  {
    id: 'usr-viewer',
    name: 'Inventory Viewer',
    email: 'viewer@stocksense.demo',
    password: 'Viewer123!',
    role: 'viewer',
    title: 'Inventory Viewer',
    initials: 'IV',
    color: 'bg-slate-500',
    blurb: 'Read-only access to dashboard, inventory, alerts, and reports.',
  },
];

export const DEMO_PASSWORD_WARNING =
  'Demo credentials are hardcoded and visible on purpose. This is an academic prototype, not secure production authentication.';
