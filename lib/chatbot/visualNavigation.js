// Browser helpers for safe visual navigation. Nothing here mutates application data.
// Every helper is defensive: missing elements, detached nodes, and blocked scrolling fail safely.

export const GUIDE_PADDING = 8;
export const DEFAULT_TIMEOUT_MS = 6000;
export const DEFAULT_INTERVAL_MS = 150;

export function normalizePathname(value) {
  const clean = String(value || '/').split('?')[0].split('#')[0];
  return clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
}

export function pathsMatch(a, b) {
  return normalizePathname(a) === normalizePathname(b);
}

export function isElementUsable(element) {
  if (!element || typeof element.getBoundingClientRect !== 'function') return false;
  if (element.isConnected === false) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

export function findElement(selector) {
  if (typeof document === 'undefined' || !selector) return null;
  try {
    const element = document.querySelector(selector);
    return isElementUsable(element) ? element : null;
  } catch (error) {
    console.warn('[StockSense] Invalid highlight selector:', error?.message);
    return null;
  }
}

/**
 * Wait for an element to exist and have layout. Returns the element or null after the timeout.
 * The optional `shouldContinue` callback lets a React effect cancel an obsolete search.
 */
export function waitForElement(
  selector,
  { timeout = DEFAULT_TIMEOUT_MS, interval = DEFAULT_INTERVAL_MS, shouldContinue = () => true } = {}
) {
  if (typeof document === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    let timer = null;

    const attempt = () => {
      if (!shouldContinue()) {
        resolve(null);
        return;
      }
      const element = findElement(selector);
      if (element) {
        resolve(element);
        return;
      }
      if (Date.now() - startedAt >= timeout) {
        resolve(null);
        return;
      }
      timer = setTimeout(attempt, interval);
    };

    attempt();

    // The promise cannot be cancelled directly; callers use shouldContinue and ignore the result.
    // Clearing the timer is handled by the timeout path and by the caller's cancellation flag.
    if (timer && typeof timer.unref === 'function') timer.unref();
  });
}

export function scrollElementIntoView(element) {
  if (!isElementUsable(element)) return false;
  try {
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    return true;
  } catch (error) {
    try {
      element.scrollIntoView();
      return true;
    } catch (fallbackError) {
      console.warn('[StockSense] Unable to scroll to highlight target:', fallbackError?.message);
      return false;
    }
  }
}

export function measureElement(element, padding = GUIDE_PADDING) {
  if (!isElementUsable(element)) return null;
  const rect = element.getBoundingClientRect();
  const top = Math.max(4, rect.top - padding);
  const left = Math.max(4, rect.left - padding);
  const right = Math.min(
    (typeof window !== 'undefined' ? window.innerWidth : rect.right) - 4,
    rect.right + padding
  );
  const bottom = Math.min(
    (typeof window !== 'undefined' ? window.innerHeight : rect.bottom) - 4,
    rect.bottom + padding
  );
  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

const TOOLTIP_WIDTH = 320;
const TOOLTIP_ESTIMATED_HEIGHT = 150;
const GAP = 14;
const MARGIN = 12;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Choose a readable tooltip position without covering the highlighted element.
 * Pure function so placement can be tested without a browser.
 */
export function computeTooltipPosition(
  rect,
  viewport = { width: 1280, height: 800 },
  size = { width: TOOLTIP_WIDTH, height: TOOLTIP_ESTIMATED_HEIGHT }
) {
  if (!rect) return { top: MARGIN, left: MARGIN, placement: 'center' };

  const spaceRight = viewport.width - (rect.left + rect.width);
  const spaceLeft = rect.left;
  const spaceBelow = viewport.height - (rect.top + rect.height);
  const spaceAbove = rect.top;

  let placement;
  let top;
  let left;

  if (spaceRight >= size.width + GAP) {
    placement = 'right';
    left = rect.left + rect.width + GAP;
    top = rect.top + rect.height / 2 - size.height / 2;
  } else if (spaceLeft >= size.width + GAP) {
    placement = 'left';
    left = rect.left - size.width - GAP;
    top = rect.top + rect.height / 2 - size.height / 2;
  } else if (spaceBelow >= size.height + GAP) {
    placement = 'below';
    left = rect.left + rect.width / 2 - size.width / 2;
    top = rect.top + rect.height + GAP;
  } else {
    placement = 'above';
    left = rect.left + rect.width / 2 - size.width / 2;
    top = rect.top - size.height - GAP;
  }

  return {
    placement,
    top: Math.round(clamp(top, MARGIN, Math.max(MARGIN, viewport.height - size.height - MARGIN))),
    left: Math.round(clamp(left, MARGIN, Math.max(MARGIN, viewport.width - size.width - MARGIN))),
  };
}

export function viewportSize() {
  if (typeof window === 'undefined') return { width: 1280, height: 800 };
  return { width: window.innerWidth, height: window.innerHeight };
}
