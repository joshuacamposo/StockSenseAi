// Supplier validation and deletion rules.
// Kept as pure functions so the interface, AppProvider, and automated tests share one rule set.

export function validateSupplierInput(input = {}) {
  const values = {
    name: String(input.name || '').trim(),
    contactPerson: String(input.contactPerson || '').trim(),
    phone: String(input.phone || '').trim(),
    email: String(input.email || '').trim(),
    address: String(input.address || '').trim(),
    notes: String(input.notes || '').trim(),
  };

  const errors = {};
  if (!values.name) errors.name = 'Supplier name is required.';
  if (!values.contactPerson) errors.contactPerson = 'Contact person is required.';
  if (!values.phone) errors.phone = 'Phone number is required.';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  return {
    values,
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function supplierAssignments(products = [], supplierId) {
  if (!supplierId) return [];
  return products.filter((product) => product.supplierId === supplierId);
}

/**
 * A supplier can only be removed when no product references it.
 * The guard exists so product records never point at a missing supplier.
 */
export function canDeleteSupplier(supplier, products = []) {
  if (!supplier) {
    return { ok: false, error: 'Supplier not found.', assigned: [] };
  }
  const assigned = supplierAssignments(products, supplier.id);
  if (assigned.length > 0) {
    return {
      ok: false,
      error: `Cannot delete ${supplier.name} — it is assigned to ${assigned.length} product(s). Reassign those products first.`,
      assigned,
    };
  }
  return { ok: true, assigned: [] };
}
