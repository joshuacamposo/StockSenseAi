// Small event bridge used by the visual guide to prepare a page before highlighting.
//
// A directive is both dispatched immediately (when the page is already mounted) and kept as a
// pending value (when a client-side route change is still mounting the page). Pages consume the
// pending value in a useEffect through `usePageFilter`.

export const PAGE_BRIDGE_EVENT = 'stocksense:page-bridge';

const pending = new Map();

export function emitPageBridge(detail) {
  if (!detail || !detail.type) return;
  pending.set(detail.type, detail);
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(PAGE_BRIDGE_EVENT, { detail }));
  } catch (error) {
    console.warn('[StockSense] Unable to emit page bridge directive:', error?.message);
  }
}

export function subscribePageBridge(handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (event) => {
    if (event?.detail) handler(event.detail);
  };
  window.addEventListener(PAGE_BRIDGE_EVENT, listener);
  return () => window.removeEventListener(PAGE_BRIDGE_EVENT, listener);
}

export function takePendingBridge(type) {
  if (!pending.has(type)) return null;
  const detail = pending.get(type);
  pending.delete(type);
  return detail;
}

export function clearPendingBridges() {
  pending.clear();
}
