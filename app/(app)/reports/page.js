'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Download,
  FileBarChart,
  FileSpreadsheet,
  Info,
  Package,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  Button,
  Callout,
  DemoNote,
  EmptyState,
  PageHeader,
  SearchInput,
  SectionCard,
  StatCard,
  Tabs,
  cn,
} from '@/components/ui';
import {
  downloadTextFile,
  inventoryColumns,
  lowStockColumns,
  lowStockRows,
  reorderColumns,
  timestampedName,
  toCsv,
  transactionColumns,
} from '@/lib/reportGenerator';
import { RECOMMENDATION_STATUS } from '@/lib/recommendations';
import { formatMoney, formatNumber } from '@/lib/format';

const TABS = [
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'low-stock', label: 'Low stock', icon: TriangleAlert },
  { key: 'stock-in', label: 'Stock-In', icon: ArrowDownToLine },
  { key: 'stock-out', label: 'Stock-Out', icon: ArrowUpFromLine },
  { key: 'recommendations', label: 'Reorders', icon: ClipboardList },
];

function searchRow(row, query) {
  if (!query) return true;
  const haystack = Object.values(row)
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value).toLowerCase())
    .join(' ');
  return haystack.includes(query.toLowerCase());
}

export default function ReportsPage() {
  const { products, suppliers, transactions, recommendations, settings } = useApp();
  const [tab, setTab] = useState('inventory');
  const [search, setSearch] = useState('');

  const report = useMemo(() => {
    if (tab === 'low-stock') {
      const rows = lowStockRows(products);
      return {
        rows,
        columns: lowStockColumns(),
        filename: 'stocksense-low-stock',
        description: 'Active products at or below their reorder level, with units below target.',
      };
    }
    if (tab === 'stock-in' || tab === 'stock-out') {
      const type = tab === 'stock-in' ? 'in' : 'out';
      const rows = transactions
        .filter((transaction) => transaction.type === type)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return {
        rows,
        columns: transactionColumns(),
        filename: `stocksense-${tab}`,
        description:
          type === 'in'
            ? 'Every successful stock-in transaction recorded in this browser.'
            : 'Every successful stock-out transaction recorded in this browser.',
      };
    }
    if (tab === 'recommendations') {
      const rows = [...recommendations].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      return {
        rows,
        columns: reorderColumns(),
        filename: 'stocksense-reorder-recommendations',
        description:
          'Rule-based reorder recommendations, including approval decisions and superseded rows.',
      };
    }
    return {
      rows: products,
      columns: inventoryColumns(suppliers),
      filename: 'stocksense-inventory',
      description: 'The complete product catalog with stock, status, supplier, and pricing.',
    };
  }, [products, recommendations, suppliers, tab, transactions]);

  const filteredRows = useMemo(
    () => report.rows.filter((row) => searchRow(row, search)),
    [report.rows, search]
  );

  const stats = useMemo(() => {
    const totalUnits = filteredRows.reduce((sum, row) => {
      if (tab === 'stock-in' || tab === 'stock-out') return sum + (Number(row.quantity) || 0);
      if (tab === 'recommendations') return sum + (Number(row.recommendedQty) || 0);
      if (tab === 'low-stock') return sum + (Number(row.deficit) || 0);
      return sum + (Number(row.stock) || 0);
    }, 0);
    const value = filteredRows.reduce((sum, row) => {
      if (tab === 'inventory') {
        return sum + (Number(row.stock) || 0) * (Number(row.unitPrice) || 0);
      }
      return 0;
    }, 0);
    return { totalUnits, value };
  }, [filteredRows, tab]);

  const handleExport = () => {
    if (filteredRows.length === 0) {
      toast.error('There are no rows to export for this report.');
      return;
    }
    const csv = toCsv(filteredRows, report.columns);
    downloadTextFile(timestampedName(report.filename), csv);
    toast.success(`Exported ${filteredRows.length} row(s) to CSV. No server was contacted.`);
  };

  const tabsWithCounts = TABS.map((item) => {
    if (item.key === 'inventory') return { ...item, count: products.length };
    if (item.key === 'low-stock') return { ...item, count: lowStockRows(products).length };
    if (item.key === 'stock-in')
      return { ...item, count: transactions.filter((tx) => tx.type === 'in').length };
    if (item.key === 'stock-out')
      return { ...item, count: transactions.filter((tx) => tx.type === 'out').length };
    return { ...item, count: recommendations.length };
  });

  return (
    <div data-tour="reports-navigation">
      <PageHeader
        title="Reports"
        eyebrow="Local reporting"
        icon={FileBarChart}
        subtitle={`Generate and export inventory, movement, and reorder reports for ${settings.businessName}. Every report is built in this browser from the shared local state.`}
        badges={
          <>
            <DemoNote />
            <Badge tone="brand">CSV export</Badge>
          </>
        }
        actions={
          <Button
            icon={Download}
            onClick={handleExport}
            data-tour="export-csv-button"
            disabled={filteredRows.length === 0}
          >
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Report rows"
          value={formatNumber(filteredRows.length)}
          hint={search ? 'Matching the current search' : 'All rows in this report'}
          icon={FileSpreadsheet}
          tone="brand"
        />
        <StatCard
          label={tab === 'recommendations' ? 'Recommended units' : 'Units summarized'}
          value={formatNumber(stats.totalUnits)}
          hint={
            tab === 'low-stock'
              ? 'Units below target stock'
              : tab === 'inventory'
                ? 'Current units on hand'
                : 'Quantities in the filtered rows'
          }
          icon={ClipboardList}
          tone="violet"
        />
        <StatCard
          label="Inventory value"
          value={tab === 'inventory' ? formatMoney(stats.value, settings.currency) : '—'}
          hint={
            tab === 'inventory'
              ? 'Current stock × unit price'
              : 'Available on the inventory report'
          }
          icon={Package}
          tone="emerald"
        />
        <StatCard
          label="Data source"
          value="Local"
          hint="No backend, database, or external API"
          icon={Info}
          tone="amber"
        />
      </div>

      <div className="mt-4" data-tour="reports-tabs">
        <Tabs tabs={tabsWithCounts} active={tab} onChange={setTab} />
      </div>

      <div className="mt-4">
        <SectionCard
          title="Report preview"
          subtitle={report.description}
          icon={FileSpreadsheet}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search this report…"
                className="w-full sm:w-64"
              />
              <Button
                size="sm"
                variant="secondary"
                icon={Download}
                onClick={handleExport}
                disabled={filteredRows.length === 0}
              >
                CSV
              </Button>
            </div>
          }
          bodyClassName="px-0 pb-0"
        >
          {filteredRows.length === 0 ? (
            <EmptyState
              icon={Search}
              title={search ? 'No matching rows' : 'No records in this report'}
              message={
                search
                  ? 'Try a different search term or switch to another report.'
                  : 'Record the relevant inventory activity and it will appear here immediately.'
              }
              className="py-12"
            />
          ) : (
            <div className="table-wrap" data-tour="reports-table">
              <table className="data-table min-w-[980px]">
                <thead>
                  <tr>
                    {report.columns.map((column) => (
                      <th key={column.label}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.slice(0, 300).map((row, index) => (
                    <tr key={row.id || `${row.sku || 'row'}-${index}`}>
                      {report.columns.map((column) => {
                        const raw =
                          typeof column.value === 'function'
                            ? column.value(row)
                            : row[column.key];
                        let display = raw;
                        if (
                          tab === 'recommendations' &&
                          column.label === 'Status' &&
                          RECOMMENDATION_STATUS[raw]
                        ) {
                          display = RECOMMENDATION_STATUS[raw].label;
                        }
                        if (column.label === 'Status' && tab === 'recommendations') {
                          const meta = RECOMMENDATION_STATUS[row.status];
                          return (
                            <td key={column.label}>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset',
                                  meta?.badge || 'bg-slate-100 text-slate-600 ring-slate-200'
                                )}
                              >
                                {meta?.label || row.status}
                              </span>
                            </td>
                          );
                        }
                        return (
                          <td
                            key={column.label}
                            className={cn(
                              column.label === 'Product' ||
                                column.label === 'SKU' ||
                                column.label === 'Transaction ID'
                                ? 'font-semibold text-slate-700'
                                : 'text-slate-600'
                            )}
                          >
                            {display === null || display === undefined || display === ''
                              ? '—'
                              : String(display)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <Callout tone="info" className="mt-4" title="Static browser reporting" icon={Info}>
        CSV files are generated by JavaScript in this browser and downloaded directly. The prototype
        contacts no server or external service. Refreshing or clearing browser storage removes the
        demonstration records, so download anything you need before resetting demo data.
      </Callout>
    </div>
  );
}
