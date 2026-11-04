'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Info,
  PackageX,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  Callout,
  DemoNote,
  EmptyState,
  LinkButton,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  Tabs,
  cn,
} from '@/components/ui';
import { calculateRecommendedQty, getStockStatus } from '@/lib/inventoryRules';
import { formatNumber, formatUnits } from '@/lib/format';

export default function AlertsPage() {
  const { alerts, pendingRecommendations, canDo, stats } = useApp();
  const [tab, setTab] = useState('all');

  const filtered = useMemo(() => {
    if (tab === 'all') return alerts;
    return alerts.filter((alert) => alert.severity === tab);
  }, [alerts, tab]);

  const canStockIn = canDo('stock.in');
  const canViewRecommendations = canDo('recommendations.view');

  return (
    <div>
      <PageHeader
        title="Stock Alerts"
        eyebrow="Automated monitoring"
        icon={BellRing}
        subtitle="Alerts are derived automatically from the reorder-level rule. They resolve on their own once stock rises above the reorder level — there are no duplicate active alerts."
        badges={<DemoNote />}
        actions={
          canStockIn ? (
            <LinkButton href="/stock-in" icon={ArrowDownToLine} size="md">
              Record stock-in
            </LinkButton>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Active alerts"
          value={formatNumber(alerts.length)}
          hint="Low + out of stock"
          icon={BellRing}
          tone={alerts.length ? 'amber' : 'emerald'}
        />
        <StatCard
          label="Low stock"
          value={formatNumber(stats.lowStock)}
          hint="At or below reorder level"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Out of stock"
          value={formatNumber(stats.outOfStock)}
          hint="Zero units on hand"
          icon={PackageX}
          tone="rose"
        />
        <StatCard
          label="Pending reorders"
          value={formatNumber(pendingRecommendations.length)}
          hint="Awaiting owner/admin review"
          icon={ClipboardList}
          tone="violet"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2" data-tour="alerts-list">
          <SectionCard
            title="Active stock alerts"
            subtitle="Generated automatically after every inventory transaction"
            icon={BellRing}
            action={
              <Tabs
                active={tab}
                onChange={setTab}
                tabs={[
                  { key: 'all', label: 'All', count: alerts.length },
                  { key: 'low', label: 'Low', count: alerts.filter((a) => a.severity === 'low').length },
                  { key: 'out', label: 'Out', count: alerts.filter((a) => a.severity === 'out').length },
                ]}
              />
            }
            bodyClassName="px-5 py-2"
          >
            {filtered.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title={alerts.length === 0 ? 'All clear — no active alerts' : 'No alerts in this category'}
                message={
                  alerts.length === 0
                    ? 'Every active product is above its reorder level. Alerts will appear automatically when stock falls to or below the reorder level.'
                    : 'Switch tabs to see the other active alerts.'
                }
                className="py-12"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((alert) => {
                  const recommendation = pendingRecommendations.find(
                    (item) => item.productId === alert.productId
                  );
                  return (
                    <div key={alert.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                      <span
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                          alert.severity === 'out'
                            ? 'bg-rose-50 text-rose-500'
                            : 'bg-amber-50 text-amber-500'
                        )}
                      >
                        {alert.severity === 'out' ? <PackageX size={18} /> : <AlertTriangle size={18} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13.5px] font-bold text-slate-900">{alert.name}</p>
                          <Badge tone={alert.severity === 'out' ? 'rose' : 'amber'}>
                            {alert.severity === 'out' ? 'Out of stock' : 'Low stock'}
                          </Badge>
                          <Badge tone="slate">{alert.sku}</Badge>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{alert.message}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-slate-500">
                          <span>
                            Current: <strong className="text-slate-700">{alert.stock}</strong> {alert.unit}(s)
                          </span>
                          <span>
                            Reorder level: <strong className="text-slate-700">{alert.reorderLevel}</strong>
                          </span>
                          <span>
                            Target: <strong className="text-slate-700">{alert.targetStock}</strong>
                          </span>
                          <span>
                            Suggested order:{' '}
                            <strong className="text-brand-700">
                              {recommendation?.recommendedQty ??
                                Math.max(alert.targetStock - alert.stock, 0)}{' '}
                              units
                            </strong>
                          </span>
                        </div>
                        {alert.severity === 'out' ? (
                          <p className="mt-1.5 flex items-center gap-1 text-[10.5px] font-medium text-rose-600">
                            <ShieldAlert size={12} /> No units available — stock-out is blocked until stock is received.
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        {canStockIn ? (
                          <LinkButton href="/stock-in" size="sm" icon={ArrowDownToLine}>
                            Restock
                          </LinkButton>
                        ) : null}
                        {canViewRecommendations ? (
                          <Link
                            href="/recommendations"
                            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-brand-700 hover:underline"
                          >
                            Recommendation <ArrowRight size={11} />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Detection rules" subtitle="Rule-based, recalculated automatically" icon={Info}>
            <div className="space-y-2.5">
              {[
                { label: 'Out of stock', rule: 'Stock = 0', tone: 'rose' },
                { label: 'Low stock', rule: 'Stock ≤ reorder level', tone: 'amber' },
                { label: 'Sufficient', rule: 'Stock > reorder level', tone: 'emerald' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-700">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        item.tone === 'rose'
                          ? 'bg-rose-500'
                          : item.tone === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      )}
                    />
                    {item.label}
                  </span>
                  <code className="text-[10.5px] text-slate-500">{item.rule}</code>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Alerts are not stored as duplicates. They are computed from current stock, so an alert
              disappears immediately when a stock-in raises the product above its reorder level.
            </p>
          </SectionCard>

          <Callout tone="info" title="Alerts do not order stock">
            Raising an alert is not a purchase. A recommendation is generated for review, and an
            authorized owner or administrator must approve it. Even then, stock only increases after
            a separate stock-in transaction.
          </Callout>

          <div className="card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Demonstration note
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              Bond Paper (20 units) and USB Flash Drive (8 units) start below their reorder levels.
              Stapler starts at 0 units to demonstrate the out-of-stock state.
            </p>
            <p className="mt-2 text-[10px] text-slate-400">
              All seeded records are labeled demonstration data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
