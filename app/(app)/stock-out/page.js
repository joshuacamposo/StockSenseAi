'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  Info,
  PackageX,
  TrendingDown,
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
import { getStockStatus } from '@/lib/inventoryRules';
import { formatDateTime, formatNumber, formatUnits } from '@/lib/format';

export default function StockOutPage() {
  const {
    activeProducts,
    transactions,
    todayTransactions,
    recordStockOut,
    alerts,
    settings,
  } = useApp();

  const recent = transactions
    .filter((transaction) => transaction.type === 'out')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 7);

  const todayTotal = todayTransactions
    .filter((transaction) => transaction.type === 'out')
    .reduce((sum, transaction) => sum + (Number(transaction.quantity) || 0), 0);
  const todayCount = todayTransactions.filter((transaction) => transaction.type === 'out').length;

  const nearEmpty = activeProducts
    .filter((product) => product.stock > 0 && getStockStatus(product).key !== 'sufficient')
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Stock-Out"
        eyebrow="Inventory transaction"
        icon={ArrowUpFromLine}
        subtitle={`Issue stock from ${settings.businessName}. Quantities above the available balance are rejected without changing inventory.`}
        badges={<DemoNote />}
        actions={
          <>
            <LinkButton href="/stock-in" variant="secondary" icon={ArrowDownToLine} size="md">
              Stock-in
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
            title="Record a stock-out"
            subtitle="Stock-out always requires enough available stock"
            icon={ArrowUpFromLine}
          >
            <StockTransactionForm type="out" products={activeProducts} onSubmit={recordStockOut} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Today&apos;s stock-out
              </p>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingDown size={17} />
              </span>
            </div>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              −{formatNumber(todayTotal)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              units across {todayCount} transaction{todayCount === 1 ? '' : 's'} today
            </p>
            <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[10.5px] leading-relaxed text-slate-600">
              Stock-out demand records feed the historical moving-average forecast on the Forecasting
              page.
            </div>
          </div>

          <SectionCard
            title="Watch list"
            subtitle="Low-stock products that may run out soon"
            icon={AlertTriangle}
            action={<Link href="/alerts" className="text-[11px] font-semibold text-brand-600">Alerts</Link>}
            bodyClassName="px-5 py-2"
          >
            {nearEmpty.length === 0 ? (
              <EmptyState
                title="No low-stock products"
                message="All active products are above their reorder levels."
                className="py-8"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {nearEmpty.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-800">{product.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatUnits(product.stock, product.unit)} · reorder at {product.reorderLevel}
                      </p>
                    </div>
                    <StatusBadge product={product} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
              <Info size={14} /> Validation rules
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] leading-relaxed text-amber-800">
              <li>Zero, negative, decimal, and non-numeric quantities are rejected.</li>
              <li>A stock-out larger than the available balance is rejected.</li>
              <li>Rejections never change stock or create a successful transaction.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4" data-tour="stock-out-history">
        <SectionCard
          title="Recent stock-out transactions"
          subtitle="Actual transaction records from this browser"
          icon={PackageX}
          bodyClassName="px-0 pb-0"
          action={
            <Link href="/transactions" className="text-[11px] font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="No stock-out records yet"
              message="Submit the form above to create the first stock-out transaction."
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
                      <td className="text-[12px] font-bold text-amber-600">
                        −{transaction.quantity}
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
        <Boxes size={12} />
        Stock-out demand is used by the historical moving-average forecast. The prototype does not
        run a trained machine-learning model.
      </p>
    </div>
  );
}
