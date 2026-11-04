// localStorage helpers with defensive parsing. All access is guarded for SSR.

export const STORAGE_KEY = 'stocksense-ai:state:v1';
export const CHAT_STORAGE_KEY = 'stocksense-ai:chat:v1';
export const STORAGE_VERSION = 1;

export function safeParse(raw) {
  if (typeof raw !== 'string' || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[StockSense] Ignoring unreadable local data:', error?.message);
    return null;
  }
}

export function readLocal(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return safeParse(raw);
  } catch (error) {
    console.warn('[StockSense] localStorage read failed:', error?.message);
    return null;
  }
}

export function writeLocal(key, value) {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('[StockSense] localStorage write failed:', error?.message);
    return false;
  }
}

export function removeLocal(key) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn('[StockSense] localStorage remove failed:', error?.message);
  }
}

export function storageSizeBytes(key) {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Blob([raw]).size : 0;
  } catch {
    return 0;
  }
}
