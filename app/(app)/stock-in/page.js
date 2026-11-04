'use client';

import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  ClipboardCheck,
  Info,
  PackageCheck,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  DemoNote,
  EmptyState,
  LinkButton,
  PageHeader,
  SectionCard,
  StatusBadge,
  cn,
} from '@/components/ui';
import StockTransactionForm from '@/components/inventory/StockTransactionForm';
import { calculateRecommendedQty, getStockStatus } from '@/lib/inventoryRules';
import { formatDateTime, formatNumber, formatUnits } from '@/lib/format';

export default function StockInPage() {
  const {
    activeProducts,
    transactions,
    todayTransactions,
    recordStockIn,
    alerts,
    pendingRecommendations,
    settings,
  } = useApp();

  const recent = transactions
    .filter((transaction) => transaction.type === 'in')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 7);

  const todayTotal = todayTransactions
    .filter((transaction) => transaction.type === 'in')
    .reduce((sum, transaction) => sum + (Number(transaction.quantity) || 0), 0);
  const todayCount = todayTransactions.filter((transaction) => transaction.type === 'in').length;

  const restockQueue = activeProducts
    .filter((product) => getStockStatus(product).key !== 'sufficient')
    .sort((a, b) => getStockStatus(a).rank - getStockStatus(b).rank || a.stock - b.stock)
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Stock-In"
        eyebrow="Inventory transaction"
        icon={ArrowDownToLine}
        subtitle={`Receive stock into ${settings.businessName}. Each validated stock-in updates the balance, recalculates alerts, refreshes recommendations, and writes an audit entry.`}
        badges={<DemoNote />}
        actions={
          <>
            <LinkButton href="/stock-out" variant="secondary" icon={ArrowUpFromLine} size="md">
              Stock-out
            </LinkButton>
            <LinkButton href="/transactions" variant="secondary" icon={ArrowRight} size="md">
              History
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Record a stock-in"
            subtitle="Stock quantities increase only after a valid transaction is submitted"
            icon={ArrowDownToLine}
          >
            <StockTransactionForm type="in" products={activeProducts} onSubmit={recordStockIn} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Today&apos;s stock-in
              </p>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={17} />
              </span>
            </div>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              +{formatNumber(todayTotal)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              units across {todayCount} transaction{todayCount === 1 ? '' : 's'} today
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-center">
              <div className="rounded-lg bg-slate-50 px-2 py-2">
                <p className="text-[15px] font-extrabold text-slate-900">{alerts.length}</p>
                <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">
                  Active alerts
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-2 py-2">
                <p className="text-[15px] font-extrabold text-slate-900">
                  {pendingRecommendations.length}
                </p>
                <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">
                  Pending reorders
                </p>
              </div>
            </div>
          </div>

          <SectionCard
            title="Restock queue"
            subtitle="Products currently at or below their reorder level"
            icon={Boxes}
            action={<Link href="/alerts" className="text-[11px] font-semibold text-brand-600">Alerts</Link>}
            bodyClassName="px-5 py-2"
          >
            {restockQueue.length === 0 ? (
              <EmptyState
                title="No products need restocking"
                message="Every active product is above its reorder level."
                className="py-8"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {restockQueue.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-800">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatUnits(product.stock, product.unit)} · reorder at {product.reorderLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge product={product} />
                      <p className="mt-1 text-[10px] font-semibold text-brand-700">
                        +{formatNumber(
                          pendingRecommendations.find((item) => item.productId === product.id)
                            ?.recommendedQty ?? calculateRecommendedQty(product)
                        )}{' '}
                        suggested
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-brand-900">
              <ClipboardCheck size={14} /> Automated follow-up
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-brand-800">
              When a stock-in pushes a product above its reorder level, its low-stock alert resolves
              automatically and its pending reorder recommendation is superseded. Pending decisions
              are preserved in recommendation history.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4" data-tour="stock-in-history">
        <SectionCard
          title="Recent stock-in transactions"
          subtitle="Actual transaction records from this browser"
          icon={PackageCheck}
          bodyClassName="px-0 pb-0"
          action={
            <Link href="/transactions" className="text-[11px] font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="No stock-in records yet"
              message="Submit the form above to create the first stock-in transaction."
              className="py-10"
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Stock change</th>
                    <th>Remarks</th>
                    <th>Recorded by</th>
                    <th>Date &amp; time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="font-mono text-[10.5px] text-slate-400">{transaction.id}</td>
                      <td>
                        <p className="text-[12px] font-semibold text-slate-800">
                          {transaction.productName}
                        </p>
                        <p className="text-[10px] text-slate-400">{transaction.sku}</p>
                      </td>
                      <td className="text-[12px] font-bold text-emerald-600">
                        +{transaction.quantity}
                      </td>
                      <td className="text-[11.5px] text-slate-500">
                        {transaction.previousStock} → {transaction.updatedStock}
                      </td>
                      <td className="max-w-[220px] truncate text-[11px] text-slate-500">
                        {transaction.remarks}
                      </td>
                      <td className="text-[11.5px] text-slate-600">{transaction.userName}</td>
                      <td className="text-[11px] text-slate-500">
                        {formatDateTime(transaction.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[10.5px] text-slate-400">
        <Info size={12} />
        Quantities must be positive whole numbers. Invalid transactions never modify stock or create
        a successful transaction record.
      </p>
    </div>
  );
}
