'use client';

import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  History,
  Pencil,
  Truck,
} from 'lucide-react';
import {
  Badge,
  Button,
  LinkButton,
  Modal,
  ProgressBar,
  StatusBadge,
  cn,
} from '@/components/ui';
import { getStockStatus } from '@/lib/inventoryRules';
import { formatDateTime, formatMoney, formatUnits } from '@/lib/format';

export default function ProductDetailsModal({
  product,
  open,
  onClose,
  transactions = [],
  recommendations = [],
  supplier,
  canEdit,
  canStockIn,
  canStockOut,
  onEdit,
}) {
  if (!product) return null;

  const status = getStockStatus(product);
  const history = transactions
    .filter((transaction) => transaction.productId === product.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 6);
  const pending = recommendations.find(
    (recommendation) => recommendation.productId === product.id && recommendation.status === 'pending'
  );
  const stockRatio = product.targetStock
    ? Math.min((product.stock / product.targetStock) * 100, 100)
    : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon={Boxes}
      title={product.name}
      description={`${product.sku} · ${product.category} · ${product.unit}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canStockIn ? (
            <LinkButton href="/stock-in" variant="secondary" icon={ArrowDownToLine} size="md">
              Stock-In
            </LinkButton>
          ) : null}
          {canStockOut ? (
            <LinkButton href="/stock-out" variant="secondary" icon={ArrowUpFromLine} size="md">
              Stock-Out
            </LinkButton>
          ) : null}
          {canEdit ? (
            <Button icon={Pencil} onClick={() => onEdit?.(product)}>
              Edit product
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge product={product} />
          <Badge tone={product.active ? 'emerald' : 'slate'}>
            {product.active ? 'Active product' : 'Deactivated'}
          </Badge>
          <Badge tone="brand">{formatMoney(product.unitPrice)} / {product.unit}</Badge>
          {pending ? <Badge tone="amber">Pending reorder: {pending.recommendedQty} units</Badge> : null}
        </div>

        <div className={cn('rounded-2xl border p-4', status.soft, status.border)}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
                Current stock
              </p>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                {formatUnits(product.stock, product.unit)}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-600">
              <p>
                Reorder level: <strong>{product.reorderLevel}</strong>
              </p>
              <p>
                Target stock: <strong>{product.targetStock}</strong>
              </p>
              <p className={cn('font-semibold', status.text)}>{status.label}</p>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar value={stockRatio} tone={status.key === 'out' ? 'rose' : status.key === 'low' ? 'amber' : 'emerald'} />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>{Math.round(stockRatio)}% of target stock</span>
              <span>
                {pending
                  ? `${pending.recommendedQty} units recommended`
                  : product.stock <= product.reorderLevel
                    ? 'Restock recommended'
                    : 'Above reorder level'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <Truck size={14} /> Supplier
            </div>
            {supplier ? (
              <div className="space-y-1 text-xs text-slate-600">
                <p className="text-sm font-bold text-slate-900">{supplier.name}</p>
                <p>Contact: {supplier.contactPerson}</p>
                <p>Phone: {supplier.phone}</p>
                <p>Email: {supplier.email || '—'}</p>
                <p className="pt-1 text-[11px] leading-relaxed text-slate-500">{supplier.address}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No supplier assigned. Assign one by editing this product.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <ClipboardList size={14} /> Product information
            </div>
            <dl className="space-y-1.5 text-xs">
              {[
                ['SKU', product.sku],
                ['Category', product.category],
                ['Unit', product.unit],
                ['Unit price', formatMoney(product.unitPrice)],
                ['Inventory value', formatMoney(product.unitPrice * product.stock)],
                ['Last updated', formatDateTime(product.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
            {product.description ? (
              <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] leading-relaxed text-slate-500">
                {product.description}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <History size={14} /> Recent stock history
            </p>
            <Link href="/transactions" className="text-[11px] font-semibold text-brand-600 hover:underline">
              View all transactions
            </Link>
          </div>
          {history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
              No stock movements recorded yet for this product.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-bold">Type</th>
                    <th className="px-3 py-2 font-bold">Qty</th>
                    <th className="px-3 py-2 font-bold">Stock</th>
                    <th className="px-3 py-2 font-bold">Date</th>
                    <th className="px-3 py-2 font-bold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <Badge tone={transaction.type === 'in' ? 'emerald' : 'amber'}>
                          {transaction.type === 'in' ? 'Stock-In' : 'Stock-Out'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-800">
                        {transaction.quantity}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {transaction.previousStock} → {transaction.updatedStock}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {formatDateTime(transaction.timestamp)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{transaction.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
