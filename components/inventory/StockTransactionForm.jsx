'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CheckCircle2,
  Info,
  PackageSearch,
} from 'lucide-react';
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Field,
  Input,
  Select,
  StatusBadge,
  Textarea,
  cn,
} from '@/components/ui';
import { getStatusForStock, planStockMovement } from '@/lib/inventoryRules';
import { usePageFilter } from '@/hooks/usePageFilter';
import { formatUnits } from '@/lib/format';

export default function StockTransactionForm({ type, products, onSubmit }) {
  const isIn = type === 'in';
  const prefix = isIn ? 'stock-in' : 'stock-out';
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!products.some((product) => product.id === productId)) {
      setProductId(products[0]?.id || '');
    }
  }, [products, productId]);

  usePageFilter('stock:preselect', (detail) => {
    if (detail?.transactionType && detail.transactionType !== (isIn ? 'in' : 'out')) return;
    if (detail?.productId && products.some((item) => item.id === detail.productId)) {
      setProductId(detail.productId);
    }
  });

  const product = products.find((item) => item.id === productId) || null;
  const preview =
    product && String(quantity).trim() !== '' ? planStockMovement(product, type, quantity) : null;
  const previewStatus =
    preview?.ok && product ? getStatusForStock(preview.updatedStock, product.reorderLevel) : null;

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (!product) {
      setError('Select a product first.');
      return;
    }
    setSubmitting(true);
    const result = onSubmit({ productId, quantity, remarks });
    setSubmitting(false);
    if (!result?.ok) {
      setError(result?.error || 'Unable to record the transaction.');
      return;
    }
    toast.success(
      `${isIn ? 'Stock-in' : 'Stock-out'} recorded for ${product.name}: ${result.transaction.previousStock} → ${result.transaction.updatedStock} units.`
    );
    setQuantity('');
    setRemarks('');
  };

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No active products available"
        message="Add an active product first before recording stock movements."
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      data-tour={`${prefix}-form`}
      noValidate
    >
      {error ? (
        <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700 animate-fade-in">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Field
        label="Product"
        htmlFor={`${prefix}-product`}
        required
        hint="Only active products can receive stock transactions."
      >
        <Select
          id={`${prefix}-product`}
          data-tour={`${prefix}-product`}
          value={productId}
          onChange={(event) => {
            setProductId(event.target.value);
            setError('');
          }}
        >
          {products.map((item) => (
            <option key={item.id} value={item.id}>
              {item.sku} — {item.name} ({item.stock} {item.unit}s on hand)
            </option>
          ))}
        </Select>
      </Field>

      {product ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
          <div className="text-[11.5px] text-slate-600">
            <span className="font-semibold text-slate-800">{product.name}</span> · stock{' '}
            <span className="font-bold text-slate-800">{formatUnits(product.stock, product.unit)}</span> ·
            reorder at {product.reorderLevel}
          </div>
          <StatusBadge product={product} />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Field
          label={isIn ? 'Quantity to add' : 'Quantity to deduct'}
          htmlFor={`${prefix}-quantity`}
          required
          error={preview && !preview.ok ? preview.error : ''}
          hint="Whole numbers only. Zero, negative, and decimal values are rejected."
        >
          <Input
            id={`${prefix}-quantity`}
            data-tour={`${prefix}-quantity`}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              setError('');
            }}
            placeholder="40"
            invalid={Boolean(preview && !preview.ok)}
          />
        </Field>

        <Field
          label="Remarks"
          htmlFor={`${prefix}-remarks`}
          hint={isIn ? 'e.g. Delivery from supplier' : 'e.g. Issued to Admin Office'}
        >
          <Input
            id={`${prefix}-remarks`}
            data-tour={`${prefix}-remarks`}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder={isIn ? 'Supplier delivery reference…' : 'Department or purpose…'}
          />
        </Field>
      </div>

      <div
        className={cn(
          'rounded-2xl border p-4 transition-colors',
          preview?.ok
            ? 'border-brand-200 bg-brand-50/60'
            : 'border-slate-200 bg-slate-50/70'
        )}
        data-tour={`${prefix}-preview`}
      >
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
          Transaction preview
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Current stock</p>
            <p className="text-2xl font-extrabold text-slate-900">{product?.stock ?? 0}</p>
          </div>
          <ArrowRight size={18} className="text-slate-400" />
          <div className="text-center">
            <p className="text-[10px] text-slate-500">After transaction</p>
            <p
              className={cn(
                'text-2xl font-extrabold',
                preview?.ok ? 'text-brand-700' : 'text-slate-400'
              )}
            >
              {preview?.ok ? preview.updatedStock : '—'}
            </p>
          </div>
          <div className="ml-auto">
            {preview?.ok && previewStatus ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
                  previewStatus.badge
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', previewStatus.dot)} />
                {previewStatus.label}
              </span>
            ) : (
              <Badge tone="slate">Awaiting valid quantity</Badge>
            )}
          </div>
        </div>
        {preview && !preview.ok && String(quantity).trim() !== '' ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
            <AlertTriangle size={13} /> {preview.error}
          </p>
        ) : null}
        {preview?.ok && previewStatus?.key !== 'sufficient' ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-relaxed text-amber-700">
            <Info size={13} /> After this transaction the product will still be{' '}
            {previewStatus.label.toLowerCase()}; alerts and reorder recommendations will update
            automatically.
          </p>
        ) : null}
        {preview?.ok && previewStatus?.key === 'sufficient' ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-relaxed text-emerald-700">
            <CheckCircle2 size={13} /> The product will be above its reorder level. Any active alert
            resolves and pending recommendations close automatically.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="max-w-xs text-[10.5px] leading-relaxed text-slate-500">
          A transaction record and audit entry will be created. Stock balances are persisted to this
          browser only.
        </p>
        <Button
          type="submit"
          variant={isIn ? 'primary' : 'dark'}
          icon={isIn ? ArrowDownToLine : ArrowUpFromLine}
          loading={submitting}
          data-tour={`${prefix}-button`}
        >
          {isIn ? 'Record Stock-In' : 'Record Stock-Out'}
        </Button>
      </div>
    </form>
  );
}
