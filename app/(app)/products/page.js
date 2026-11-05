'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Archive,
  ArrowDownToLine,
  Boxes,
  Eye,
  FilterX,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  Button,
  ConfirmDialog,
  DemoNote,
  EmptyState,
  LinkButton,
  PageHeader,
  SearchInput,
  SectionCard,
  Select,
  StatusBadge,
  cn,
} from '@/components/ui';
import ProductFormModal from '@/components/inventory/ProductFormModal';
import ProductDetailsModal from '@/components/inventory/ProductDetailsModal';
import { usePageFilter } from '@/hooks/usePageFilter';
import { PRODUCT_CATEGORIES, getStockStatus } from '@/lib/inventoryRules';
import { formatMoney, formatUnits } from '@/lib/format';

export default function ProductsPage() {
  const {
    products,
    suppliers,
    transactions,
    recommendations,
    canDo,
    addProduct,
    updateProduct,
    deactivateProduct,
    reactivateProduct,
    getSupplierName,
  } = useApp();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, product: null, action: null });

  const canCreate = canDo('products.create');
  const canEdit = canDo('products.edit');
  const canDeactivate = canDo('products.deactivate');
  const canStockIn = canDo('stock.in');
  const canStockOut = canDo('stock.out');

  const categories = useMemo(
    () => Array.from(new Set([...PRODUCT_CATEGORIES, ...products.map((product) => product.category)])),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => {
        if (!query) return true;
        return (
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          (product.description || '').toLowerCase().includes(query)
        );
      })
      .filter((product) => (category === 'all' ? true : product.category === category))
      .filter((product) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'inactive') return !product.active;
        if (!product.active) return false;
        return getStockStatus(product).key === statusFilter;
      })
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [products, search, category, statusFilter]);

  const summary = useMemo(() => {
    const active = products.filter((product) => product.active);
    return {
      total: products.length,
      active: active.length,
      low: active.filter((product) => getStockStatus(product).key === 'low').length,
      out: active.filter((product) => getStockStatus(product).key === 'out').length,
      value: active.reduce(
        (sum, product) => sum + (Number(product.stock) || 0) * (Number(product.unitPrice) || 0),
        0
      ),
    };
  }, [products]);

  const hasFilters = search !== '' || category !== 'all' || statusFilter !== 'all';

  usePageFilter('products:search', (detail) => {
    setSearch(detail.sku || detail.name || '');
    setCategory('all');
    setStatusFilter('all');
  });

  const openAddForm = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEditForm = (product) => {
    setDetailsProduct(null);
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleSubmit = (values) => {
    const result = editingProduct
      ? updateProduct(editingProduct.id, values)
      : addProduct(values);
    if (result.ok) {
      toast.success(
        editingProduct
          ? `${values.name} was updated. Stock remained ${editingProduct.stock} units.`
          : `${values.name} was added with 0 starting stock. Record a stock-in to add units.`
      );
    }
    return result;
  };

  const requestToggleActive = (product) => {
    setConfirmState({
      open: true,
      product,
      action: product.active ? 'deactivate' : 'reactivate',
    });
  };

  const confirmToggleActive = () => {
    const { product, action } = confirmState;
    if (!product) return;
    const result =
      action === 'deactivate' ? deactivateProduct(product.id) : reactivateProduct(product.id);
    if (result.ok) {
      toast.success(
        action === 'deactivate'
          ? `${product.name} was deactivated. Stock history is preserved.`
          : `${product.name} was reactivated and can receive stock transactions.`
      );
      if (detailsProduct?.id === product.id) setDetailsProduct(null);
    } else if (!result.denied) {
      toast.error(result.error || 'Unable to update the product.');
    }
    setConfirmState({ open: false, product: null, action: null });
  };

  return (
    <div>
      <PageHeader
        title="Products"
        eyebrow="Inventory management"
        icon={Package}
        subtitle="Register products, assign suppliers, and maintain reorder levels. Stock balances can only change through stock-in and stock-out transactions."
        badges={<DemoNote />}
        actions={
          canCreate ? (
            <Button icon={Plus} onClick={openAddForm} data-tour="add-product-button">
              Add product
            </Button>
          ) : (
            <Badge tone="slate">Read-only role</Badge>
          )
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active products', value: summary.active, tone: 'text-slate-900' },
          { label: 'Low stock', value: summary.low, tone: 'text-amber-600' },
          { label: 'Out of stock', value: summary.out, tone: 'text-rose-600' },
          { label: 'Inventory value', value: formatMoney(summary.value), tone: 'text-brand-700' },
        ].map((item) => (
          <div key={item.label} className="card px-4 py-3">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className={cn('mt-1 truncate text-xl font-extrabold', item.tone)}>{item.value}</p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Product catalog"
        subtitle={`${filteredProducts.length} of ${products.length} product record(s) shown`}
        icon={Boxes}
        action={
          hasFilters ? (
            <Button
              size="sm"
              variant="ghost"
              icon={FilterX}
              onClick={() => {
                setSearch('');
                setCategory('all');
                setStatusFilter('all');
              }}
            >
              Clear filters
            </Button>
          ) : null
        }
      >
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by product name, SKU, category, or description…"
            className="lg:max-w-md"
            data-tour="products-search"
            aria-label="Search products"
          />
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="sm:max-w-[210px]"
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="sm:max-w-[190px]"
              data-tour="product-status-filter"
              aria-label="Filter by stock status"
            >
              <option value="all">All statuses</option>
              <option value="sufficient">Sufficient stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
              <option value="inactive">Deactivated</option>
            </Select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No products match your filters"
            message="Try a different search term or clear the active filters."
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setCategory('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : canCreate ? (
                <Button icon={Plus} size="sm" onClick={openAddForm}>
                  Add your first product
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="table-wrap" data-tour="products-table">
            <table className="data-table min-w-[1080px]">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Reorder</th>
                  <th>Status</th>
                  <th>Unit price</th>
                  <th>Supplier</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr
                      key={product.id}
                      data-tour={`product-row-${product.id}`}
                      className={!product.active ? 'opacity-60' : undefined}
                    >
                      <td data-tour={`product-name-cell-${product.id}`}>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                              status.key === 'out'
                                ? 'bg-rose-50 text-rose-500'
                                : status.key === 'low'
                                  ? 'bg-amber-50 text-amber-500'
                                  : 'bg-emerald-50 text-emerald-600'
                            )}
                          >
                            <Package size={16} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-[12.5px] font-bold text-slate-900">
                                {product.name}
                              </p>
                              {!product.active ? <Badge tone="slate">Inactive</Badge> : null}
                            </div>
                            <p className="text-[10.5px] font-medium tracking-wide text-slate-400">
                              {product.sku} · {product.unit}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-[12px] text-slate-600">{product.category}</span>
                      </td>
                      <td data-tour={`stock-cell-${product.id}`}>
                        <p className="text-[13px] font-extrabold text-slate-900">{product.stock}</p>
                        <p className="text-[10px] text-slate-400">of {product.targetStock} target</p>
                      </td>
                      <td data-tour={`reorder-cell-${product.id}`} className="text-[12px] text-slate-600">{product.reorderLevel}</td>
                      <td data-tour={`status-cell-${product.id}`}>
                        <StatusBadge product={product} />
                      </td>
                      <td data-tour={`price-cell-${product.id}`} className="whitespace-nowrap text-[12px] font-semibold text-slate-700">
                        {formatMoney(product.unitPrice)}
                      </td>
                      <td data-tour={`supplier-cell-${product.id}`}>
                        <span className="text-[11.5px] text-slate-600">
                          {getSupplierName(product.supplierId)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailsProduct(product)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="View details"
                            aria-label={`View ${product.name}`}
                          >
                            <Eye size={15} />
                          </button>
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => openEditForm(product)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700"
                              title="Edit product"
                              aria-label={`Edit ${product.name}`}
                              data-tour={`edit-product-button-${product.id}`}
                            >
                              <Pencil size={15} />
                            </button>
                          ) : null}
                          {canDeactivate ? (
                            <button
                              type="button"
                              onClick={() => requestToggleActive(product)}
                              className={cn(
                                'grid h-8 w-8 place-items-center rounded-lg',
                                product.active
                                  ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                                  : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                              )}
                              title={product.active ? 'Deactivate product' : 'Reactivate product'}
                              aria-label={
                                product.active
                                  ? `Deactivate ${product.name}`
                                  : `Reactivate ${product.name}`
                              }
                            >
                              {product.active ? <Archive size={15} /> : <RotateCcw size={15} />}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
            <AlertTriangle size={12} />
            Stock is read-only in the product form. Use Stock-In or Stock-Out so every movement is
            recorded and audited.
          </p>
          {canStockIn ? (
            <LinkButton href="/stock-in" variant="secondary" size="sm" icon={ArrowDownToLine}>
              Record stock-in
            </LinkButton>
          ) : null}
        </div>
      </SectionCard>

      <ProductFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        suppliers={suppliers}
        onSubmit={handleSubmit}
      />

      <ProductDetailsModal
        open={Boolean(detailsProduct)}
        product={detailsProduct}
        onClose={() => setDetailsProduct(null)}
        transactions={transactions}
        recommendations={recommendations}
        supplier={detailsProduct ? suppliers.find((item) => item.id === detailsProduct.supplierId) : null}
        canEdit={canEdit}
        canStockIn={canStockIn}
        canStockOut={canStockOut}
        onEdit={openEditForm}
      />

      <ConfirmDialog
        open={confirmState.open}
        onClose={() => setConfirmState({ open: false, product: null, action: null })}
        onConfirm={confirmToggleActive}
        title={confirmState.action === 'deactivate' ? 'Deactivate product?' : 'Reactivate product?'}
        message={
          confirmState.action === 'deactivate'
            ? `${confirmState.product?.name} will be hidden from stock transactions and excluded from alerts. Its stock history is preserved. This does not delete the product.`
            : `${confirmState.product?.name} will become available for stock transactions and automation again.`
        }
        confirmLabel={confirmState.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        tone={confirmState.action === 'deactivate' ? 'danger' : 'success'}
        icon={confirmState.action === 'deactivate' ? Archive : RotateCcw}
      />
    </div>
  );
}
