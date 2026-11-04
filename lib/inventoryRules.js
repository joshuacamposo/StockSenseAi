// Core inventory rules: stock status, quantity validation, movement planning,
// product input validation, and reorder quantity calculation.
// These pure functions are shared by the UI, the automation engine, the chatbot tests,
// and the demo/testing center, so the rules exist in exactly one place.

export const STOCK_STATUS = {
  out: {
    key: 'out',
    label: 'Out of Stock',
    short: 'Out',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
    text: 'text-rose-600',
    bar: 'bg-rose-500',
    soft: 'bg-rose-50',
    border: 'border-rose-200',
    rank: 0,
  },
  low: {
    key: 'low',
    label: 'Low Stock',
    short: 'Low',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    bar: 'bg-amber-500',
    soft: 'bg-amber-50',
    border: 'border-amber-200',
    rank: 1,
  },
  sufficient: {
    key: 'sufficient',
    label: 'Sufficient Stock',
    short: 'Healthy',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    bar: 'bg-emerald-500',
    soft: 'bg-emerald-50',
    border: 'border-emerald-200',
    rank: 2,
  },
};

export const PRODUCT_CATEGORIES = [
  'Paper Products',
  'Writing Supplies',
  'Electronics',
  'Office Equipment',
  'Consumables',
  'Furniture',
  'Other',
];

export const PRODUCT_UNITS = ['piece', 'ream', 'box', 'set', 'pack', 'cartridge', 'bottle'];

export function getStatusForStock(stock, reorderLevel) {
  const current = Number(stock) || 0;
  const threshold = Number(reorderLevel) || 0;
  if (current <= 0) return STOCK_STATUS.out;
  if (current <= threshold) return STOCK_STATUS.low;
  return STOCK_STATUS.sufficient;
}

export function getStockStatus(product) {
  return getStatusForStock(product?.stock, product?.reorderLevel);
}

export function calculateRecommendedQty(product) {
  if (!product) return 0;
  return Math.max((Number(product.targetStock) || 0) - (Number(product.stock) || 0), 0);
}

export function parseQuantity(value) {
  if (value === '' || value === null || value === undefined) {
    return { ok: false, error: 'Quantity is required.' };
  }
  const raw = typeof value === 'string' ? value.trim() : value;
  if (raw === '') {
    return { ok: false, error: 'Quantity is required.' };
  }
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Quantity must be a valid number.' };
  }
  if (!Number.isInteger(numeric)) {
    return { ok: false, error: 'Quantity must be a whole number.' };
  }
  if (numeric <= 0) {
    return { ok: false, error: 'Quantity must be greater than zero.' };
  }
  return { ok: true, value: numeric };
}

/**
 * Validates a stock movement without mutating anything.
 * type: 'in' | 'out'
 * Returns { ok, quantity, previousStock, updatedStock, status } or { ok:false, error }.
 */
export function planStockMovement(product, type, quantity) {
  if (!product) {
    return { ok: false, error: 'Product not found.' };
  }
  if (product.active === false) {
    return { ok: false, error: 'This product is deactivated and cannot be transacted.' };
  }
  if (type !== 'in' && type !== 'out') {
    return { ok: false, error: 'Invalid transaction type.' };
  }
  const parsed = parseQuantity(quantity);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const previousStock = Number(product.stock) || 0;
  if (type === 'out' && parsed.value > previousStock) {
    return {
      ok: false,
      error: `Cannot stock out more than the available stock (${previousStock} units).`,
    };
  }

  const updatedStock =
    type === 'in' ? previousStock + parsed.value : previousStock - parsed.value;

  return {
    ok: true,
    quantity: parsed.value,
    previousStock,
    updatedStock,
    status: getStatusForStock(updatedStock, product.reorderLevel),
  };
}

export function validateProductInput(input = {}, products = [], editingId = null) {
  const errors = {};
  const sku = String(input.sku || '').trim().toUpperCase();
  const name = String(input.name || '').trim();
  const category = String(input.category || '').trim();
  const unit = String(input.unit || '').trim();
  const supplierId = String(input.supplierId || '').trim();
  const description = String(input.description || '').trim();
  const rawPrice = input.unitPrice;
  const rawReorder = input.reorderLevel;
  const rawTarget = input.targetStock;

  if (!sku) {
    errors.sku = 'SKU is required.';
  } else if (!/^[A-Z0-9][A-Z0-9-]{1,23}$/.test(sku)) {
    errors.sku = 'Use 2–24 letters, numbers, or dashes (for example BP-001).';
  } else {
    const duplicate = products.find(
      (product) =>
        product.id !== editingId &&
        String(product.sku || '').toUpperCase() === sku
    );
    if (duplicate) errors.sku = `SKU "${sku}" is already used by ${duplicate.name}.`;
  }

  if (!name) {
    errors.name = 'Product name is required.';
  } else if (name.length < 2) {
    errors.name = 'Product name must be at least 2 characters.';
  }

  if (!category) errors.category = 'Category is required.';
  if (!unit) errors.unit = 'Unit is required.';

  const unitPrice = rawPrice === '' || rawPrice === null || rawPrice === undefined ? NaN : Number(rawPrice);
  if (rawPrice === '' || rawPrice === null || rawPrice === undefined) {
    errors.unitPrice = 'Unit price is required.';
  } else if (!Number.isFinite(unitPrice)) {
    errors.unitPrice = 'Unit price must be a valid number.';
  } else if (unitPrice < 0) {
    errors.unitPrice = 'Unit price cannot be negative.';
  }

  const reorderLevel =
    rawReorder === '' || rawReorder === null || rawReorder === undefined ? NaN : Number(rawReorder);
  if (rawReorder === '' || rawReorder === null || rawReorder === undefined) {
    errors.reorderLevel = 'Reorder level is required.';
  } else if (!Number.isFinite(reorderLevel)) {
    errors.reorderLevel = 'Reorder level must be a valid number.';
  } else if (!Number.isInteger(reorderLevel)) {
    errors.reorderLevel = 'Reorder level must be a whole number.';
  } else if (reorderLevel < 0) {
    errors.reorderLevel = 'Reorder level cannot be negative.';
  }

  const targetStock =
    rawTarget === '' || rawTarget === null || rawTarget === undefined ? NaN : Number(rawTarget);
  if (rawTarget === '' || rawTarget === null || rawTarget === undefined) {
    errors.targetStock = 'Target stock is required.';
  } else if (!Number.isFinite(targetStock)) {
    errors.targetStock = 'Target stock must be a valid number.';
  } else if (!Number.isInteger(targetStock)) {
    errors.targetStock = 'Target stock must be a whole number.';
  } else if (targetStock <= 0) {
    errors.targetStock = 'Target stock must be greater than zero.';
  } else if (Number.isFinite(reorderLevel) && targetStock <= reorderLevel) {
    errors.targetStock = 'Target stock must be greater than the reorder level.';
  }

  const values = {
    sku,
    name,
    category,
    unit,
    supplierId: supplierId || '',
    description,
    unitPrice: Number.isFinite(unitPrice) ? Math.round(unitPrice * 100) / 100 : 0,
    reorderLevel: Number.isFinite(reorderLevel) ? reorderLevel : 0,
    targetStock: Number.isFinite(targetStock) ? targetStock : 0,
  };

  return { errors, values, valid: Object.keys(errors).length === 0 };
}

export function stockStatusCounts(products = []) {
  return products.reduce(
    (acc, product) => {
      if (!product.active) return acc;
      const status = getStockStatus(product).key;
      acc[status] = (acc[status] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { out: 0, low: 0, sufficient: 0, total: 0 }
  );
}
