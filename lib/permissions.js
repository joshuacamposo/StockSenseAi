// Centralized role + permission configuration.
// These are CLIENT-SIDE DEMONSTRATION CONTROLS, not production-grade security.

export const ROLES = {
  admin: {
    key: 'admin',
    label: 'Administrator',
    badge: 'bg-brand-50 text-brand-700 ring-brand-200',
    dot: 'bg-brand-500',
    description: 'Full system access, audit logs, settings, and demo reset.',
  },
  owner: {
    key: 'owner',
    label: 'Business Owner',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Business-level access including reorder approvals and forecasting.',
  },
  staff: {
    key: 'staff',
    label: 'Inventory Staff',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
    description: 'Day-to-day inventory work: products, stock-in, and stock-out.',
  },
  viewer: {
    key: 'viewer',
    label: 'Inventory Viewer',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-400',
    description: 'Read-only access to dashboard, inventory, alerts, and reports.',
  },
};

export const PERMISSIONS = {
  'dashboard.view': ['admin', 'owner', 'staff', 'viewer'],
  'products.view': ['admin', 'owner', 'staff', 'viewer'],
  'products.create': ['admin', 'owner', 'staff'],
  'products.edit': ['admin', 'owner', 'staff'],
  'products.deactivate': ['admin', 'owner'],
  'suppliers.view': ['admin', 'owner', 'staff'],
  'suppliers.manage': ['admin', 'owner'],
  'stock.in': ['admin', 'owner', 'staff'],
  'stock.out': ['admin', 'owner', 'staff'],
  'alerts.view': ['admin', 'owner', 'staff', 'viewer'],
  'recommendations.view': ['admin', 'owner', 'staff', 'viewer'],
  'recommendations.decide': ['admin', 'owner'],
  'forecasting.view': ['admin', 'owner'],
  'reports.view': ['admin', 'owner', 'staff', 'viewer'],
  'transactions.view': ['admin', 'owner', 'staff'],
  'audit.view': ['admin'],
  'demo.view': ['admin', 'owner', 'staff', 'viewer'],
  'demo.reset': ['admin'],
  'settings.view': ['admin'],
  'settings.manage': ['admin'],
  'security.view': ['admin', 'owner', 'staff', 'viewer'],
};

export const PERMISSION_LABELS = {
  'dashboard.view': 'View dashboard',
  'products.view': 'View products',
  'products.create': 'Add products',
  'products.edit': 'Edit products',
  'products.deactivate': 'Deactivate products',
  'suppliers.view': 'View suppliers',
  'suppliers.manage': 'Manage suppliers',
  'stock.in': 'Record stock-in',
  'stock.out': 'Record stock-out',
  'alerts.view': 'View low-stock alerts',
  'recommendations.view': 'View reorder recommendations',
  'recommendations.decide': 'Approve / reject recommendations',
  'forecasting.view': 'View demand forecasting',
  'reports.view': 'View and export reports',
  'transactions.view': 'View transaction history',
  'audit.view': 'View audit log',
  'demo.view': 'View demo & testing center',
  'demo.reset': 'Reset demonstration data',
  'settings.view': 'Access system settings',
  'settings.manage': 'Manage system settings',
  'security.view': 'View security information',
};

export const ROUTE_PERMISSIONS = {
  '/dashboard': 'dashboard.view',
  '/products': 'products.view',
  '/suppliers': 'suppliers.view',
  '/stock-in': 'stock.in',
  '/stock-out': 'stock.out',
  '/alerts': 'alerts.view',
  '/recommendations': 'recommendations.view',
  '/forecasting': 'forecasting.view',
  '/reports': 'reports.view',
  '/transactions': 'transactions.view',
  '/audit-logs': 'audit.view',
  '/demo-testing': 'demo.view',
  '/settings': 'settings.view',
  '/security': 'security.view',
};

export const ACCESS_DENIED_MESSAGE =
  'Access Denied — Your demo role does not have permission to perform this action.';

export function can(user, permission) {
  if (!user || !permission) return false;
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(user.role);
}

export function canAny(user, permissions = []) {
  return permissions.some((permission) => can(user, permission));
}

export function normalizePath(pathname) {
  if (!pathname) return '/';
  const clean = pathname.split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean;
}

export function getRoutePermission(pathname) {
  return ROUTE_PERMISSIONS[normalizePath(pathname)] || null;
}

export function canAccessRoute(user, pathname) {
  const permission = getRoutePermission(pathname);
  if (!permission) return true;
  return can(user, permission);
}

export function roleLabel(role) {
  return ROLES[role]?.label || 'Unknown role';
}

export function grantedPermissions(role) {
  return Object.keys(PERMISSIONS).filter((permission) =>
    PERMISSIONS[permission].includes(role)
  );
}
