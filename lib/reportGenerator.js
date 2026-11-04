// CSV report generation from local application state only. No server calls.

import { formatDate, formatDateTime, formatMoney } from './format';
import { getStockStatus } from './inventoryRules';

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const string = String(value);
  if (/[",\n\r]/.test(string)) {
    return `"${string.replace(/"/g, '""')}"`;
  }
  return string;
}

export function toCsv(rows = [], columns = []) {
  const header = columns.map((column) => escapeCell(column.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const raw = typeof column.value === 'function' ? column.value(row) : row[column.key];
          return escapeCell(raw);
        })
        .join(',')
    )
    .join('\r\n');
  return `\uFEFF${header}\r\n${body}`;
}

export function downloadTextFile(filename, content, mime = 'text/csv;charset=utf-8;') {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function timestampedName(prefix, extension = 'csv') {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${prefix}-${stamp}.${extension}`;
}

export function supplierName(suppliers, supplierId) {
  return suppliers.find((supplier) => supplier.id === supplierId)?.name || 'Unassigned';
}

export function inventoryColumns(suppliers) {
  return [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { label: 'Unit Price', value: (row) => Number(row.unitPrice || 0).toFixed(2) },
    { key: 'stock', label: 'Current Stock' },
    { key: 'reorderLevel', label: 'Reorder Level' },
    { key: 'targetStock', label: 'Target Stock' },
    { label: 'Status', value: (row) => getStockStatus(row).label },
    { label: 'Supplier', value: (row) => supplierName(suppliers, row.supplierId) },
    { label: 'Active', value: (row) => (row.active ? 'Yes' : 'No') },
  ];
}

export function inventoryRows(products) {
  return products.map((product) => ({
    ...product,
    unitPrice: formatMoney(product.unitPrice),
  }));
}

export function lowStockRows(products) {
  return products
    .filter((product) => product.active && getStockStatus(product).key !== 'sufficient')
    .sort((a, b) => getStockStatus(a).rank - getStockStatus(b).rank || a.stock - b.stock)
    .map((product) => ({
      ...product,
      status: getStockStatus(product).label,
      deficit: Math.max((Number(product.targetStock) || 0) - (Number(product.stock) || 0), 0),
    }));
}

export function lowStockColumns() {
  return [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'stock', label: 'Current Stock' },
    { key: 'reorderLevel', label: 'Reorder Level' },
    { key: 'targetStock', label: 'Target Stock' },
    { key: 'status', label: 'Status' },
    { key: 'deficit', label: 'Units Below Target' },
  ];
}

export function transactionColumns() {
  return [
    { key: 'id', label: 'Transaction ID' },
    { key: 'productName', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { label: 'Type', value: (row) => (row.type === 'in' ? 'Stock-In' : 'Stock-Out') },
    { key: 'quantity', label: 'Quantity' },
    { key: 'previousStock', label: 'Previous Stock' },
    { key: 'updatedStock', label: 'Updated Stock' },
    { key: 'userName', label: 'User' },
    { label: 'Date & Time', value: (row) => formatDateTime(row.timestamp) },
    { key: 'remarks', label: 'Remarks' },
  ];
}

export function reorderColumns() {
  return [
    { key: 'sku', label: 'SKU' },
    { key: 'productName', label: 'Product' },
    { key: 'currentStock', label: 'Stock at Recommendation' },
    { key: 'reorderLevel', label: 'Reorder Level' },
    { key: 'targetStock', label: 'Target Stock' },
    { key: 'recommendedQty', label: 'Recommended Quantity' },
    { key: 'status', label: 'Status' },
    { label: 'Created', value: (row) => formatDate(row.createdAt) },
    { label: 'Decided By', value: (row) => row.decidedBy || '—' },
    { label: 'Decision Date', value: (row) => (row.decidedAt ? formatDateTime(row.decidedAt) : '—') },
    { key: 'decisionNote', label: 'Decision Note' },
  ];
}
