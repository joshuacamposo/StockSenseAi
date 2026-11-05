'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  History,
  Info,
  Package,
  Search,
  UserRound,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
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
import { usePageFilter } from '@/hooks/usePageFilter';
import { formatDateTime, formatNumber, formatUnits } from '@/lib/format';

const TYPE_TABS = [
  { key: 'all', label: 'All transactions' },
  { key: 'in', label: 'Stock-In' },
  { key: 'out', label: 'Stock-Out' },
];

export default function TransactionsPage() {
  const { transactions, products, settings } = useApp();
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  usePageFilter('transactions:search', (detail) => {
    if (detail?.query) setSearch(detail.query);
    if (detail?.productId) setType('all');
  });

  const unitById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(product.id, product.unit));
    return map;
  }, [products]);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [transactions]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sorted.filter((transaction) => {
      if (type !== 'all' && transaction.type !== type) return false;
      if (!query) return true;
      return [
        transaction.id,
        transaction.productName,
        transaction.sku,
        transaction.userName,
        transaction.remarks,
        transaction.type === 'in' ? 'stock-in' : 'stock-out',
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [search, sorted, type]);

  const totalIn = filtered
    .filter((transaction) => transaction.type === 'in')
    .reduce((sum, transaction) => sum + (Number(transaction.quantity) || 0), 0);
  const totalOut = filtered
    .filter((transaction) => transaction.type === 'out')
    .reduce((sum, transaction) => sum + (Number(transaction.quantity) || 0), 0);
  const contributors = new Set(filtered.map((transaction) => transaction.userName)).size;

  return (
    <div data-tour="transactions-navigation">
      <PageHeader
        title="Transaction History"
        eyebrow="Stock movement ledger"
        icon={History}
        subtitle={`Read-only audit trail of every successful stock movement for ${settings.businessName}. Rejected transactions never appear as successful records.`}
        badges={
          <>
            <DemoNote />
            <Badge tone="brand">{formatNumber(transactions.length)} total records</Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Visible records"
          value={formatNumber(filtered.length)}
          hint={search || type !== 'all' ? 'Matching the current filters' : 'All recorded movements'}
          icon={History}
          tone="brand"
        />
        <StatCard
          label="Units received"
          value={`+${formatNumber(totalIn)}`}
          hint="Total stock-in quantity"
          icon={ArrowDownToLine}
          tone="emerald"
        />
        <StatCard
          label="Units issued"
          value={`−${formatNumber(totalOut)}`}
          hint="Total stock-out quantity"
          icon={ArrowUpFromLine}
          tone="amber"
        />
        <StatCard
          label="Users involved"
          value={formatNumber(contributors)}
          hint="Distinct demonstration users"
          icon={UserRound}
          tone="violet"
        />
      </div>

      <div
        className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
        data-tour="transactions-filter"
      >
        <Tabs tabs={TYPE_TABS} active={type} onChange={setType} />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search product, SKU, user, or remarks…"
          className="w-full sm:w-80"
        />
      </div>

      <div className="mt-4">
        <SectionCard
          title="Movement records"
          subtitle="Newest first · previous and updated balances are preserved for every transaction"
          icon={History}
          bodyClassName="px-0 pb-0"
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No transactions match"
              message="Try clearing the search or choosing a different transaction type."
              className="py-12"
            />
          ) : (
            <div className="table-wrap" data-tour="transactions-table">
              <table className="data-table min-w-[1040px]">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Stock change</th>
                    <th>Recorded by</th>
                    <th>Date &amp; time</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <Badge tone={transaction.type === 'in' ? 'emerald' : 'amber'} dot>
                          {transaction.type === 'in' ? 'Stock-In' : 'Stock-Out'}
                        </Badge>
                      </td>
                      <td>
                        <p className="text-[12.5px] font-bold text-slate-800">
                          {transaction.productName}
                        </p>
                        <p className="text-[10.5px] text-slate-400">{transaction.sku}</p>
                      </td>
                      <td
                        className={cn(
                          'text-[12.5px] font-bold',
                          transaction.type === 'in' ? 'text-emerald-600' : 'text-amber-600'
                        )}
                      >
                        {transaction.type === 'in' ? '+' : '−'}
                        {formatUnits(
                          transaction.quantity,
                          unitById.get(transaction.productId) || 'unit'
                        )}
                      </td>
                      <td className="text-[12px] text-slate-600">
                        {formatNumber(transaction.previousStock)} →{' '}
                        <strong className="text-slate-800">
                          {formatNumber(transaction.updatedStock)}
                        </strong>
                      </td>
                      <td>
                        <p className="text-[12px] font-semibold text-slate-700">
                          {transaction.userName}
                        </p>
                        <p className="text-[10.5px] capitalize text-slate-400">
                          {transaction.role}
                        </p>
                      </td>
                      <td className="whitespace-nowrap text-[11.5px] text-slate-500">
                        {formatDateTime(transaction.timestamp)}
                      </td>
                      <td className="max-w-[260px] text-[11.5px] text-slate-500">
                        {transaction.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <Callout tone="info" className="mt-4" title="Read-only transaction ledger" icon={Info}>
        Stock movements cannot be edited or deleted from this page. A rejected stock-out never
        changes the balance and never appears here. Historical records in this demonstration are
        stored only in this browser&apos;s localStorage.
      </Callout>

      <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-slate-400">
        <Package size={12} />
        Showing {filtered.length} of {transactions.length} records. Stock balances are changed only
        through validated Stock-In and Stock-Out forms.
        <ArrowRight size={12} />
      </p>
    </div>
  );
}
