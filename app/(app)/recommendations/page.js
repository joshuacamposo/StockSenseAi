'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  History,
  Info,
  Lock,
  PackageCheck,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  Button,
  Callout,
  DemoNote,
  EmptyState,
  LinkButton,
  PageHeader,
  SectionCard,
  StatCard,
  Tabs,
  Textarea,
  Modal,
  cn,
} from '@/components/ui';
import { RECOMMENDATION_STATUS } from '@/lib/recommendations';
import { formatDateTime, formatNumber, formatUnits } from '@/lib/format';

function StatusPill({ status }) {
  const meta = RECOMMENDATION_STATUS[status] || RECOMMENDATION_STATUS.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        meta.badge
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

export default function RecommendationsPage() {
  const {
    recommendations,
    pendingRecommendations,
    products,
    canDo,
    decideRecommendation,
    getProductById,
  } = useApp();

  const canDecide = canDo('recommendations.decide');
  const canStockIn = canDo('stock.in');
  const [historyTab, setHistoryTab] = useState('all');
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState('');

  const history = useMemo(() => {
    return recommendations
      .filter((recommendation) => recommendation.status !== 'pending')
      .filter((recommendation) => (historyTab === 'all' ? true : recommendation.status === historyTab))
      .sort((a, b) => new Date(b.decidedAt || b.updatedAt) - new Date(a.decidedAt || a.updatedAt));
  }, [recommendations, historyTab]);

  const approvedCount = recommendations.filter((item) => item.status === 'approved').length;
  const rejectedCount = recommendations.filter((item) => item.status === 'rejected').length;
  const totalRecommended = pendingRecommendations.reduce(
    (sum, item) => sum + (Number(item.recommendedQty) || 0),
    0
  );

  const openDecision = (recommendation, type) => {
    if (!canDecide) {
      toast.error(
        'Access Denied — Your demo role does not have permission to perform this action.'
      );
      return;
    }
    setDecision({ recommendation, type });
    setNote('');
  };

  const submitDecision = () => {
    if (!decision) return;
    const result = decideRecommendation(
      decision.recommendation.id,
      decision.type,
      note
    );
    if (result.ok) {
      toast.success(
        decision.type === 'approved'
          ? 'Recommendation approved. No stock was added — record a stock-in when the delivery arrives.'
          : 'Recommendation rejected. The decision was recorded in the audit trail.'
      );
      setDecision(null);
      setNote('');
    } else if (!result.denied) {
      toast.error(result.error || 'Unable to record the decision.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Reorder Recommendations"
        eyebrow="Automated decision support"
        icon={ClipboardList}
        subtitle="Recommendations are calculated with Max(Target Stock − Current Stock, 0). Approval records a purchasing decision only — inventory never increases automatically."
        badges={<DemoNote />}
        actions={
          canStockIn ? (
            <LinkButton href="/stock-in" variant="secondary" icon={ArrowDownToLine} size="md">
              Record stock-in
            </LinkButton>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Pending review"
          value={formatNumber(pendingRecommendations.length)}
          hint={`${formatNumber(totalRecommended)} units recommended`}
          icon={ClipboardList}
          tone="amber"
        />
        <StatCard label="Approved" value={formatNumber(approvedCount)} hint="Decision history" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Rejected" value={formatNumber(rejectedCount)} hint="Decision history" icon={XCircle} tone="rose" />
        <StatCard
          label="Coverage rule"
          value="Target − Stock"
          hint="Recommended quantity formula"
          icon={Info}
          tone="brand"
        />
      </div>

      {!canDecide ? (
        <Callout tone="warning" className="mt-4" title="Read-only approval workflow" icon={Lock}>
          Your role ({canDecide ? 'reviewer' : 'staff or viewer'}) can review recommendations but
          cannot approve or reject them. Only the Administrator and Business Owner can perform this
          action. This restriction is also enforced by the StockSense AI Assistant.
        </Callout>
      ) : null}

      <div className="mt-4" data-tour="recommendations-list">
        <SectionCard
          title="Pending recommendations"
          subtitle="Automatically updated when inventory changes"
          icon={AlertTriangle}
          action={<Badge tone={pendingRecommendations.length ? 'amber' : 'emerald'}>{pendingRecommendations.length} pending</Badge>}
        >
          {pendingRecommendations.length === 0 ? (
            <EmptyState
              icon={PackageCheck}
              title="No pending reorder recommendations"
              message="All active products are above their reorder levels. A new recommendation is generated automatically when a product falls to or below its reorder level."
              className="py-10"
              action={
                canStockIn ? (
                  <LinkButton href="/stock-out" variant="secondary" size="sm">
                    Record a stock-out to demo automation
                  </LinkButton>
                ) : null
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {pendingRecommendations.map((recommendation) => {
                const product = getProductById(recommendation.productId) || {
                  name: recommendation.productName,
                  sku: recommendation.sku,
                  unit: recommendation.unit,
                  stock: recommendation.currentStock,
                  reorderLevel: recommendation.reorderLevel,
                  targetStock: recommendation.targetStock,
                };
                return (
                  <div
                    key={recommendation.id}
                    data-tour={`recommendation-card-${recommendation.productId}`}
                    className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/70 to-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[14px] font-extrabold text-slate-900">{product.name}</p>
                          <Badge tone="slate">{product.sku}</Badge>
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-slate-500">
                          Generated {formatDateTime(recommendation.createdAt)} by {recommendation.createdBy}
                        </p>
                      </div>
                      <StatusPill status={recommendation.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                        <p className="text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                          Current stock
                        </p>
                        <p className="mt-0.5 text-[17px] font-extrabold text-slate-900">
                          {recommendation.currentStock}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                        <p className="text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                          Target stock
                        </p>
                        <p className="mt-0.5 text-[17px] font-extrabold text-slate-900">
                          {recommendation.targetStock}
                        </p>
                      </div>
                      <div className="rounded-xl border border-brand-200 bg-brand-50 px-2.5 py-2">
                        <p className="text-[9.5px] font-bold uppercase tracking-wide text-brand-600">
                          Recommended
                        </p>
                        <p className="mt-0.5 text-[17px] font-extrabold text-brand-700">
                          {recommendation.recommendedQty}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 rounded-lg bg-white/70 px-2.5 py-1.5 font-mono text-[10.5px] text-slate-600 ring-1 ring-inset ring-slate-200">
                      Max({recommendation.targetStock} − {recommendation.currentStock}, 0) ={' '}
                      {recommendation.recommendedQty} units
                    </p>

                    {recommendation.previousQuantity !== undefined ? (
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        Updated automatically from a previous suggestion of{' '}
                        {recommendation.previousQuantity} units as stock changed.
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-100 pt-3">
                      <Button
                        size="sm"
                        variant="success"
                        icon={CheckCircle2}
                        disabled={!canDecide}
                        onClick={() => openDecision(recommendation, 'approved')}
                        data-tour={`approve-reorder-${recommendation.productId}`}
                        title={canDecide ? 'Approve recommendation' : 'Administrator or Business Owner only'}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={XCircle}
                        disabled={!canDecide}
                        onClick={() => openDecision(recommendation, 'rejected')}
                        data-tour={`reject-reorder-${recommendation.productId}`}
                        className="text-rose-600"
                        title={canDecide ? 'Reject recommendation' : 'Administrator or Business Owner only'}
                      >
                        Reject
                      </Button>
                      {canStockIn ? (
                        <LinkButton
                          href="/stock-in"
                          size="sm"
                          variant="ghost"
                          icon={ArrowDownToLine}
                          className="ml-auto"
                        >
                          Stock-in instead
                        </LinkButton>
                      ) : null}
                    </div>
                    {!canDecide ? (
                      <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-amber-700">
                        <Lock size={11} /> Approval is restricted to Administrator and Business Owner.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Decision history"
            subtitle="Approved, rejected, and automatically superseded recommendations"
            icon={History}
            action={
              <Tabs
                active={historyTab}
                onChange={setHistoryTab}
                tabs={[
                  { key: 'all', label: 'All' },
                  { key: 'approved', label: 'Approved', count: approvedCount },
                  { key: 'rejected', label: 'Rejected', count: rejectedCount },
                  {
                    key: 'superseded',
                    label: 'Superseded',
                    count: recommendations.filter((item) => item.status === 'superseded').length,
                  },
                ]}
              />
            }
            bodyClassName="px-0 pb-0"
          >
            {history.length === 0 ? (
              <EmptyState
                icon={History}
                title="No decisions recorded yet"
                message="Approve or reject a pending recommendation to create decision history."
                className="py-10"
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Decided by</th>
                      <th>Date</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((recommendation) => (
                      <tr key={recommendation.id}>
                        <td>
                          <p className="text-[12px] font-semibold text-slate-800">
                            {recommendation.productName}
                          </p>
                          <p className="text-[10px] text-slate-400">{recommendation.sku}</p>
                        </td>
                        <td className="text-[12px] font-bold text-slate-800">
                          {recommendation.recommendedQty}
                        </td>
                        <td>
                          <StatusPill status={recommendation.status} />
                        </td>
                        <td className="text-[11.5px] text-slate-600">{recommendation.decidedBy || '—'}</td>
                        <td className="text-[11px] text-slate-500">
                          {formatDateTime(recommendation.decidedAt || recommendation.updatedAt)}
                        </td>
                        <td className="max-w-[280px] text-[11px] leading-relaxed text-slate-500">
                          {recommendation.decisionNote || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-900">
              <ShieldCheck size={15} /> Approval ≠ automatic stock
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
              Approving a recommendation only records that a reorder was authorized. Inventory
              increases exclusively through a separate, validated stock-in transaction — keeping
              stock balances and the audit trail accurate.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-700">
              <ArrowRight size={12} /> Approval → purchase decision → stock-in → new balance
            </div>
          </div>

          <SectionCard title="How recommendations work" subtitle="Rule-based automation" icon={Info}>
            <ol className="space-y-2 text-[11.5px] leading-relaxed text-slate-600">
              {[
                'Detect products at or below their reorder level.',
                'Generate a pending recommendation using Max(Target − Current, 0).',
                'An Administrator or Business Owner reviews the suggestion.',
                'The decision is recorded and persisted with an audit entry.',
                'Stock changes only after a separate validated stock-in transaction.',
              ].map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      </div>

      <Modal
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
        size="sm"
        icon={decision?.type === 'approved' ? CheckCircle2 : XCircle}
        title={decision?.type === 'approved' ? 'Approve reorder recommendation?' : 'Reject reorder recommendation?'}
        description={
          decision
            ? `${decision.recommendation.productName} · ${decision.recommendation.recommendedQty} units recommended`
            : ''
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision?.type === 'approved' ? 'success' : 'danger'}
              onClick={submitDecision}
              data-tour="confirm-reorder-decision"
            >
              {decision?.type === 'approved' ? 'Confirm approval' : 'Confirm rejection'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div
            className={cn(
              'rounded-xl border p-3 text-[11.5px] leading-relaxed',
              decision?.type === 'approved'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            )}
          >
            {decision?.type === 'approved'
              ? 'This records the purchasing decision only. Stock will NOT increase automatically. Record a stock-in transaction when the delivery arrives.'
              : 'The recommendation will be marked as rejected and preserved in decision history. Stock is unchanged.'}
          </div>
          <div>
            <label htmlFor="decision-note" className="field-label">
              Decision note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Textarea
              id="decision-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                decision?.type === 'approved'
                  ? 'e.g. Purchase order prepared for supplier'
                  : 'e.g. Budget deferred to next quarter'
              }
            />
          </div>
          <p className="text-[10.5px] text-slate-500">
            Recorded as {decision?.recommendation?.productName} ·{' '}
            {formatUnits(decision?.recommendation?.recommendedQty || 0, decision?.recommendation?.unit)}
          </p>
        </div>
      </Modal>
    </div>
  );
}
