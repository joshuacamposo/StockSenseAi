'use client';

import { useEffect, useRef } from 'react';
import { subscribePageBridge, takePendingBridge } from '@/lib/chatbot/pageBridge';

/**
 * Apply a page-bridge directive from the assistant.
 *
 * Example: the assistant highlights a product row on /products. Before locating the row, the
 * guide emits `{ type: 'products:search', sku: 'BP-001' }`. This hook applies that search on mount
 * or when the directive is dispatched while the page is already open.
 */
export function usePageFilter(type, apply) {
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    const handle = (detail) => {
      if (detail?.type !== type) return;
      takePendingBridge(type);
      try {
        applyRef.current(detail);
      } catch (error) {
        console.warn(`[StockSense] Page bridge "${type}" failed:`, error?.message);
      }
    };

    const unsubscribe = subscribePageBridge(handle);
    const pending = takePendingBridge(type);
    if (pending) {
      try {
        applyRef.current(pending);
      } catch (error) {
        console.warn(`[StockSense] Pending page bridge "${type}" failed:`, error?.message);
      }
    }

    return unsubscribe;
  }, [type]);
}

export default usePageFilter;
