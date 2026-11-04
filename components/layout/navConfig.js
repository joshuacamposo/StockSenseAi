import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  ClipboardList,
  FlaskConical,
  History,
  LayoutDashboard,
  LineChart,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  Truck,
  FileBarChart,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        permission: 'dashboard.view',
        tour: 'dashboard-navigation',
      },
    ],
  },
  {
    label: 'Inventory',
    items: [
      {
        href: '/products',
        label: 'Products',
        icon: Package,
        permission: 'products.view',
        tour: 'products-navigation',
      },
      {
        href: '/suppliers',
        label: 'Suppliers',
        icon: Truck,
        permission: 'suppliers.view',
        tour: 'suppliers-navigation',
      },
      {
        href: '/stock-in',
        label: 'Stock-In',
        icon: ArrowDownToLine,
        permission: 'stock.in',
        tour: 'stockin-navigation',
      },
      {
        href: '/stock-out',
        label: 'Stock-Out',
        icon: ArrowUpFromLine,
        permission: 'stock.out',
        tour: 'stockout-navigation',
      },
    ],
  },
  {
    label: 'Automation',
    items: [
      {
        href: '/alerts',
        label: 'Alerts',
        icon: Bell,
        permission: 'alerts.view',
        tour: 'alerts-navigation',
        badge: 'alerts',
      },
      {
        href: '/recommendations',
        label: 'Reorder Recommendations',
        icon: ClipboardList,
        permission: 'recommendations.view',
        tour: 'recommendations-navigation',
        badge: 'recommendations',
      },
      {
        href: '/forecasting',
        label: 'Forecasting',
        icon: LineChart,
        permission: 'forecasting.view',
        tour: 'forecasting-navigation',
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        href: '/reports',
        label: 'Reports',
        icon: FileBarChart,
        permission: 'reports.view',
        tour: 'reports-navigation',
      },
      {
        href: '/transactions',
        label: 'Transactions',
        icon: History,
        permission: 'transactions.view',
        tour: 'transactions-navigation',
      },
      {
        href: '/audit-logs',
        label: 'Audit Logs',
        icon: ScrollText,
        permission: 'audit.view',
        tour: 'audit-navigation',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '/demo-testing',
        label: 'Demo / Testing',
        icon: FlaskConical,
        permission: 'demo.view',
        tour: 'demo-navigation',
      },
      {
        href: '/security',
        label: 'Security & Limits',
        icon: ShieldCheck,
        permission: 'security.view',
        tour: 'security-navigation',
      },
      {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
        permission: 'settings.view',
        tour: 'settings-navigation',
      },
    ],
  },
];

export function flattenNav() {
  return NAV_SECTIONS.flatMap((section) => section.items);
}
