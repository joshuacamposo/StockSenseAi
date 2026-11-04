'use client';

import { useApp } from '@/context/AppProvider';

export function useInventory() {
  const {
    ready,
    products,
    activeProducts,
    suppliers,
    transactions,
    recommendations,
    pendingRecommendations,
    alerts,
    stats,
    statusCounts,
    recentTransactions,
    todayTransactions,
    settings,
    canDo,
    getProductById,
    getSupplierById,
    getSupplierName,
    addProduct,
    updateProduct,
    deactivateProduct,
    reactivateProduct,
    recordStockIn,
    recordStockOut,
    decideRecommendation,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    updateSettings,
  } = useApp();

  return {
    ready,
    products,
    activeProducts,
    suppliers,
    transactions,
    recommendations,
    pendingRecommendations,
    alerts,
    stats,
    statusCounts,
    recentTransactions,
    todayTransactions,
    settings,
    canDo,
    getProductById,
    getSupplierById,
    getSupplierName,
    addProduct,
    updateProduct,
    deactivateProduct,
    reactivateProduct,
    recordStockIn,
    recordStockOut,
    decideRecommendation,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    updateSettings,
  };
}

export default useInventory;
