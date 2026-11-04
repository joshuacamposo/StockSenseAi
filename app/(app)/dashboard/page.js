'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BellRing,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  PackageX,
  Plus,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  DemoNote,
  EmptyState,
  LinkButton,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusBadge,
  cn,
} from '@/components/ui';
import StockMovementChart from '@/components/charts/StockMovementChart';
import { ROLES } from '@/lib/permissions';
import {
  calculateRecommendedQty,
  getStockStatus,
} from '@/lib/inventoryRules';
import {
  dateKey,
  formatDateShort,
  formatDateTime,
  formatLongDate,
  formatMoney,
  formatNumber,
  formatUnits,
} from '@/lib/format';

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    products,
    activeProducts,
    transactions,
    alerts,
    pendingRecommendations,
    todayTransactions,
    stats,
    statusCounts,
    settings,
    canDo,
  } = useApp();

  const roleLabel = user ? ROLES[user.role]?.label : '';

  const movementData = useMemo(() => {
    const buckets = [];
    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      buckets.push({
        key: dateKey(date),
        label: formatDateShort(date.toISOString()),
        in: 0,
        out: 0,
      });
    }
    const map = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    transactions.forEach((transaction) => {
      const bucket = map.get(dateKey(transaction.timestamp));
      if (!bucket) return;
      const bucketKey = transaction.type === 'in' ? 'in' : 'out';
      bucket[bucketKey] += Number(transaction.quantity) || 0;
    });
    return buckets;
  }, [transactions]);

  const movementTotals = useMemo(
    () =>
      movementData.reduce(
        (acc, point) => ({ in: acc.in + point.in, out: acc.out + point.out }),
        { in: 0, out: 0 }
      ),
    [movementData]
  );

  const attentionProducts = useMemo(
    () =>
      activeProducts
        .filter((product) => getStockStatus(product).key !== 'sufficient')
        .sort((a, b) => {
          const rank = getStockStatus(a).rank - getStockStatus(b).rank;
          if (rank !== 0) return rank;
          return a.stock - b.stock;
        }),
    [activeProducts]
  );

  const totalRecommended = pendingRecommendations.reduce(
    (sum, recommendation) => sum + (Number(recommendation.recommendedQty) || 0),
    0
  );

  const todayInCount = todayTransactions.filter(
    (transaction) => transaction.type === 'in'
  ).length;
  const todayOutCount = todayTransactions.filter(
    (transaction) => transaction.type === 'out'
  ).length;

  const healthTotal = statusCounts.total || 1;
  const sufficientPct = Math.round((statusCounts.sufficient / healthTotal) * 100);
  const lowPct = Math.round((statusCounts.low / healthTotal) * 100);
  const outPct = Math.max(0, 100 - sufficientPct - lowPct);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        eyebrow="Inventory overview"
        icon={LayoutDashboard}
        subtitle={`Live snapshot for ${settings.businessName} · ${formatLongDate()}. All figures are computed from the centralized inventory state.`}
        badges={
          <>
            <DemoNote />
            <Badge tone="brand">{roleLabel}</Badge>
          </>
        }
        actions={
          <>
            <LinkButton href="/products" variant="secondary" icon={Package} size="md">
              Products
            </LinkButton>
            {canDo('stock.in') ? (
              <LinkButton href="/stock-in" icon={ArrowDownToLine} size="md">
                Record stock-in
              </LinkButton>
            ) : null}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {canDo('products.create') ? (
          <LinkButton href="/products" variant="secondary" size="sm" icon={Plus}>
            Manage products
          </LinkButton>
        ) : null}
        {canDo('stock.out') ? (
          <LinkButton href="/stock-out" variant="secondary" size="sm" icon={ArrowUpFromLine}>
            Record stock-out
          </LinkButton>
        ) : null}
        <LinkButton href="/recommendations" variant="secondary" size="sm" icon={ClipboardList}>
          Reorder recommendations
        </LinkButton>
        {canDo('forecasting.view') ? (
          <LinkButton href="/forecasting" variant="secondary" size="sm" icon={TrendingUp}>
            Demand forecast
          </LinkButton>
        ) : null}
      </div>

      <div data-tour="dashboard-stats" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={formatNumber(stats.totalProducts)}
          hint={`${formatNumber(stats.activeSuppliers)} suppliers on file`}
          icon={Package}
          tone="brand"
        />
        <StatCard
          label="Total Stock Units"
          value={formatNumber(stats.totalStockUnits)}
          hint={`${formatMoney(stats.inventoryValue)} estimated value`}
          icon={Boxes}
          tone="brand"
        />
        <StatCard
          label="Low Stock Items"
          value={formatNumber(stats.lowStock)}
          hint="At or below reorder level"
          icon={AlertTriangle}
          tone="amber"
          onClick={() => router.push('/alerts')}
        />
        <StatCard
          label="Out of Stock Items"
          value={formatNumber(stats.outOfStock)}
          hint="Requires immediate restocking"
          icon={PackageX}
          tone="rose"
          onClick={() => router.push('/alerts')}
        />
        <StatCard
          label="Today's Stock-In"
          value={`+${formatNumber(stats.stockInToday)}`}
          hint={`${todayInCount} transaction(s) today`}
          icon={ArrowDownToLine}
          tone="emerald"
        />
        <StatCard
          label="Today's Stock-Out"
          value={`−${formatNumber(stats.stockOutToday)}`}
          hint={`${todayOutCount} transaction(s) today`}
          icon={ArrowUpFromLine}
          tone="amber"
        />
        <StatCard
          label="Pending Reorders"
          value={formatNumber(stats.pendingRecommendations)}
          hint={`${formatNumber(totalRecommended)} units recommended`}
          icon={ClipboardList}
          tone="violet"
          onClick={() => router.push('/recommendations')}
        />
        <StatCard
          label="Inventory Health"
          value={`${stats.healthPercent}%`}
          hint={`${formatNumber(statusCounts.sufficient)} of ${formatNumber(statusCounts.total)} products healthy`}
          icon={Activity}
          tone={stats.healthPercent >= 70 ? 'emerald' : stats.healthPercent >= 40 ? 'amber' : 'rose'}
        />
      </div>

      {stats.outOfStock > 0 ? (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <PackageX size={18} className="mt-0.5 shrink-0 text-rose-500" />
            <div>
              <p className="text-[13px] font-bold text-rose-900">
                {stats.outOfStock} product{stats.outOfStock === 1 ? ' is' : 's are'} out of stock
              </p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-rose-700">
                Automated alerts are active. {canDo('recommendations.decide')
                  ? 'Review the pending reorder recommendations or record a stock-in once the delivery arrives.'
                  : 'Record a stock-in when the delivery arrives, or review the recommendation status.'}
              </p>
            </div>
          </div>
          <Link
            href="/alerts"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            View alerts <ArrowRight size={14} />
          </Link>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2" data-tour="dashboard-chart">
          <SectionCard
            title="Stock movement"
            subtitle="Units moved in and out over the last 14 calendar days"
            icon={Activity}
            action={
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-brand-700">
                  <span className="h-2 w-2 rounded-full bg-brand-600" />
                  In +{formatNumber(movementTotals.in)}
                </span>
                <span className="flex items-center gap-1.5 text-amber-600">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Out −{formatNumber(movementTotals.out)}
                </span>
              </div>
            }
          >
            <StockMovementChart data={movementData} height={268} />
          </SectionCard>
        </div>

        <SectionCard
          title="Inventory health"
          subtitle="Products by stock status"
          icon={Activity}
          action={<Link href="/alerts" className="text-[11px] font-semibold text-brand-600 hover:underline">Alerts</Link>}
        >
          <div className="flex items-center gap-5">
            <div
              className="relative h-32 w-32 shrink-0 rounded-full"
              style={{
                background:
                  statusCounts.total === 0
                    ? '#e2e8f0'
                    : `conic-gradient(#10b981 0 ${sufficientPct}%, #f59e0b ${sufficientPct}% ${sufficientPct + lowPct}%, #f43f5e ${sufficientPct + lowPct}% 100%)`,
              }}
              aria-hidden="true"
            >
              <div className="absolute inset-[14px] grid place-items-center rounded-full bg-white shadow-inner">
                <div className="text-center">
                  <p className="text-2xl font-extrabold leading-none text-slate-900">
                    {stats.healthPercent}%
                  </p>
                  <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">
                    healthy
                  </p>
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2.5">
              {[
                { label: 'Sufficient', count: statusCounts.sufficient, tone: 'emerald', pct: sufficientPct },
                { label: 'Low stock', count: statusCounts.low, tone: 'amber', pct: lowPct },
                { label: 'Out of stock', count: statusCounts.out, tone: 'rose', pct: outPct },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          row.tone === 'emerald'
                            ? 'bg-emerald-500'
                            : row.tone === 'amber'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        )}
                      />
                      {row.label}
                    </span>
                    <span className="font-bold text-slate-800">{row.count}</span>
                  </div>
                  <ProgressBar value={row.pct} tone={row.tone} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <ClipboardList size={13} /> Reorder queue
              </p>
              <Badge tone={pendingRecommendations.length ? 'amber' : 'emerald'}>
                {pendingRecommendations.length} pending
              </Badge>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">
              {pendingRecommendations.length > 0
                ? `${formatNumber(totalRecommended)} units are recommended across ${pendingRecommendations.length} product(s). Approval records a decision only — stock increases through a separate stock-in.`
                : 'No pending reorder recommendations. Products at or below their reorder level are detected automatically.'}
            </p>
            <Link
              href="/recommendations"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline"
            >
              Review recommendations <ArrowRight size={12} />
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div data-tour="dashboard-alerts">
          <SectionCard
            title="Low stock alerts"
            subtitle="Automatically generated from the reorder level rule"
            icon={BellRing}
            action={
              <Link href="/alerts" className="text-[11px] font-semibold text-brand-600 hover:underline">
                View all ({alerts.length})
              </Link>
            }
            bodyClassName="px-5 py-2"
          >
            {alerts.length === 0 ? (
              <EmptyState
                title="All products are healthy"
                message="No product is at or below its reorder level right now."
                className="py-8"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 py-3 last:pb-2">
                    <span
                      className={cn(
                        'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                        alert.severity === 'out'
                          ? 'bg-rose-50 text-rose-500'
                          : 'bg-amber-50 text-amber-500'
                      )}
                    >
                      <AlertTriangle size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[13px] font-bold text-slate-900">{alert.name}</p>
                        <Badge tone={alert.severity === 'out' ? 'rose' : 'amber'}>
                          {alert.severity === 'out' ? 'Out of stock' : 'Low stock'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{alert.message}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {alert.sku} · {formatUnits(alert.stock, alert.unit)} on hand · target {alert.targetStock}
                      </p>
                    </div>
                    {canDo('stock.in') ? (
                      <Link
                        href="/stock-in"
                        className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-[10.5px] font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700"
                      >
                        Restock
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Products requiring attention"
          subtitle="Low or out-of-stock products ranked by severity"
          icon={AlertTriangle}
          action={
            <Link href="/products" className="text-[11px] font-semibold text-brand-600 hover:underline">
              Inventory
            </Link>
          }
          bodyClassName="px-0 pb-0"
        >
          {attentionProducts.length === 0 ? (
            <EmptyState
              title="Nothing needs attention"
              message="Every active product is above its reorder level."
              className="py-10"
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>On hand</th>
                    <th>Status</th>
                    <th>Suggested order</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionProducts.slice(0, 5).map((product) => {
                    const recommendation = pendingRecommendations.find(
                      (item) => item.productId === product.id
                    );
                    return (
                      <tr key={product.id}>
                        <td>
                          <p className="text-[12.5px] font-bold text-slate-800">{product.name}</p>
                          <p className="text-[10.5px] text-slate-400">{product.sku}</p>
                        </td>
                        <td>
                          <span className="text-[12.5px] font-semibold text-slate-800">{product.stock}</span>
                          <span className="text-[10.5px] text-slate-400"> / {product.reorderLevel}</span>
                        </td>
                        <td>
                          <StatusBadge product={product} />
                        </td>
                        <td className="text-[12px] font-semibold text-slate-700">
                          {recommendation?.recommendedQty ?? calculateRecommendedQty(product)} units
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-4" data-tour="dashboard-recent">
        <SectionCard
          title="Recent stock transactions"
          subtitle="Latest movements recorded in this browser"
          icon={ArrowDownToLine}
          action={
            <Link href="/transactions" className="text-[11px] font-semibold text-brand-600 hover:underline">
              View transaction history
            </Link>
          }
          bodyClassName="px-0 pb-0"
        >
          {recentTransactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              message="Record a stock-in or stock-out to see movement history here."
              className="py-10"
              action={
                canDo('stock.in') ? (
                  <LinkButton href="/stock-in" icon={ArrowDownToLine} size="sm">
                    Record stock-in
                  </LinkButton>
                ) : null
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table min-w-[820px]">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Stock change</th>
                    <th>Recorded by</th>
                    <th>Date &amp; time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <Badge tone={transaction.type === 'in' ? 'emerald' : 'amber'}>
                          {transaction.type === 'in' ? 'Stock-In' : 'Stock-Out'}
                        </Badge>
                      </td>
                      <td>
                        <p className="text-[12.5px] font-semibold text-slate-800">
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
                        {transaction.quantity}
                      </td>
                      <td className="text-[12px] text-slate-600">
                        {transaction.previousStock} → <strong>{transaction.updatedStock}</strong>
                      </td>
                      <td className="text-[12px] text-slate-600">{transaction.userName}</td>
                      <td className="text-[11.5px] text-slate-500">
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
        <Truck size={12} />
        Demonstration dataset · Bond Paper (20), Ballpen (150), USB Flash Drive (8) are seeded from
        the SA101 project brief. Summary values recalculate automatically.
      </p>
    </div>
  );
}
