'use client';

import { useEffect, useState } from 'react';
import { Boxes, Info, PackagePlus, Save } from 'lucide-react';
import {
  Button,
  Callout,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '@/lib/inventoryRules';
import { formatMoney } from '@/lib/format';

const EMPTY_VALUES = {
  sku: '',
  name: '',
  category: PRODUCT_CATEGORIES[0],
  unit: PRODUCT_UNITS[0],
  unitPrice: '',
  supplierId: '',
  reorderLevel: '',
  targetStock: '',
  description: '',
};

export default function ProductFormModal({ open, onClose, product, suppliers, onSubmit }) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (product) {
      setValues({
        sku: product.sku || '',
        name: product.name || '',
        category: product.category || PRODUCT_CATEGORIES[0],
        unit: product.unit || PRODUCT_UNITS[0],
        unitPrice: String(product.unitPrice ?? ''),
        supplierId: product.supplierId || '',
        reorderLevel: String(product.reorderLevel ?? ''),
        targetStock: String(product.targetStock ?? ''),
        description: product.description || '',
      });
    } else {
      setValues(EMPTY_VALUES);
    }
    setErrors({});
    setFormError('');
  }, [open, product]);

  const update = (key) => (event) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onSubmit(values);
    if (!result?.ok) {
      setErrors(result?.errors || {});
      setFormError(result?.error || 'Unable to save the product.');
      return;
    }
    setErrors({});
    setFormError('');
    onClose();
  };

  const unitOptions = Array.from(new Set([...PRODUCT_UNITS, values.unit].filter(Boolean)));
  const categoryOptions = Array.from(
    new Set([...PRODUCT_CATEGORIES, values.category].filter(Boolean))
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={product ? Boxes : PackagePlus}
      title={product ? `Edit ${product.name}` : 'Add new product'}
      description={
        product
          ? 'Update product information. Stock balances cannot be edited here — use stock transactions.'
          : 'Register a new product. New products start with 0 stock until a stock-in is recorded.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" icon={Save} data-tour="save-product-button">
            {product ? 'Save changes' : 'Save product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate>
        {formError && Object.keys(errors).length === 0 ? (
          <Callout tone="danger" className="mb-4">
            {formError}
          </Callout>
        ) : null}

        {product ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <Info size={15} className="mt-0.5 shrink-0 text-slate-400" />
            <span>
              Current stock is <strong>{product.stock}</strong> {product.unit}(s). Stock only
              changes through validated Stock-In and Stock-Out transactions, so it is read-only in
              this form.
            </span>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" htmlFor="product-sku" required error={errors.sku} hint="Unique code, e.g. BP-001.">
            <Input
              id="product-sku"
              data-tour="product-sku-input"
              value={values.sku}
              onChange={update('sku')}
              placeholder="BP-001"
              invalid={Boolean(errors.sku)}
              autoComplete="off"
            />
          </Field>

          <Field label="Product name" htmlFor="product-name" required error={errors.name}>
            <Input
              id="product-name"
              data-tour="product-name-input"
              value={values.name}
              onChange={update('name')}
              placeholder="Bond Paper"
              invalid={Boolean(errors.name)}
              autoComplete="off"
            />
          </Field>

          <Field label="Category" htmlFor="product-category" required error={errors.category}>
            <Select
              id="product-category"
              data-tour="product-category-input"
              value={values.category}
              onChange={update('category')}
              invalid={Boolean(errors.category)}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Unit of measure" htmlFor="product-unit" required error={errors.unit}>
            <Select
              id="product-unit"
              data-tour="product-unit-input"
              value={values.unit}
              onChange={update('unit')}
              invalid={Boolean(errors.unit)}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Unit price"
            htmlFor="product-price"
            required
            error={errors.unitPrice}
            hint="Selling or valuation price per unit (cannot be negative)."
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                ₱
              </span>
              <Input
                id="product-price"
                data-tour="product-price-input"
                type="number"
                min="0"
                step="0.01"
                className="pl-8"
                value={values.unitPrice}
                onChange={update('unitPrice')}
                placeholder="245.00"
                invalid={Boolean(errors.unitPrice)}
              />
            </div>
          </Field>

          <Field
            label="Assigned supplier"
            htmlFor="product-supplier"
            error={errors.supplierId}
            hint="Optional. Suppliers are managed in the Supplier directory."
          >
            <Select
              id="product-supplier"
              data-tour="product-supplier-input"
              value={values.supplierId}
              onChange={update('supplierId')}
            >
              <option value="">Unassigned</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Reorder level"
            htmlFor="product-reorder"
            required
            error={errors.reorderLevel}
            hint="Stock at or below this level triggers Low Stock."
          >
            <Input
              id="product-reorder"
              data-tour="product-reorder-input"
              type="number"
              min="0"
              step="1"
              value={values.reorderLevel}
              onChange={update('reorderLevel')}
              placeholder="50"
              invalid={Boolean(errors.reorderLevel)}
            />
          </Field>

          <Field
            label="Target stock level"
            htmlFor="product-target"
            required
            error={errors.targetStock}
            hint="Used by the reorder formula. Must exceed the reorder level."
          >
            <Input
              id="product-target"
              data-tour="product-target-input"
              type="number"
              min="1"
              step="1"
              value={values.targetStock}
              onChange={update('targetStock')}
              placeholder="100"
              invalid={Boolean(errors.targetStock)}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="product-description"
            error={errors.description}
            className="sm:col-span-2"
            hint="Optional notes for the demo. Do not store real sensitive business data."
          >
            <Textarea
              id="product-description"
              value={values.description}
              onChange={update('description')}
              placeholder="Short description of the product…"
            />
          </Field>
        </div>

        <div className="mt-4 rounded-xl bg-brand-50/70 p-3 text-[11px] leading-relaxed text-brand-900 ring-1 ring-inset ring-brand-100">
          <strong>Reorder preview:</strong>{' '}
          {Number(values.targetStock) > 0 && Number(values.reorderLevel) >= 0
            ? `Target ${values.targetStock || 0} − Current 0 = ${Math.max(
                Number(values.targetStock || 0) - 0,
                0
              )} units recommended once this product is at or below its reorder level.`
            : 'Enter the reorder and target levels to preview the automated recommendation.'}{' '}
          Estimated value per unit: {formatMoney(values.unitPrice || 0)}.
        </div>
      </form>
    </Modal>
  );
}
