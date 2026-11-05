'use client';

// Renders the assistant's visual navigation: a subtle spotlight over a real DOM element plus a
// localized tooltip. It only navigates, scrolls, focuses, and highlights. It never clicks, submits,
// approves, or changes inventory data.

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Crosshair, Loader2, X } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { cn } from '@/components/ui';
import {
  computeTooltipPosition,
  measureElement,
  pathsMatch,
  scrollElementIntoView,
  viewportSize,
  waitForElement,
} from '@/lib/chatbot/visualNavigation';
import { emitPageBridge } from '@/lib/chatbot/pageBridge';
import { visualText } from '@/lib/chatbot/languageDictionary';

const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 172;
const SETTLE_MS = 320;

const INDICATOR_STYLES = {
  EN: 'bg-sky-50 text-sky-700 ring-sky-200',
  TL: 'bg-amber-50 text-amber-700 ring-amber-200',
  BIS: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export default function SmartVisualGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const { visualTarget, dismissVisualTarget } = useChatbot();

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState('idle');
  const [rect, setRect] = useState(null);
  const dismissRef = useRef(null);
  const remeasureRef = useRef(null);

  const target = visualTarget;
  const targetLanguage = target?.language || 'en';
  const copy = visualText(targetLanguage);
  const indicator = target?.language === 'tl' ? 'TL' : target?.language === 'ceb' ? 'BIS' : 'EN';

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback(() => {
    setStatus('idle');
    setRect(null);
    dismissVisualTarget();
  }, [dismissVisualTarget]);

  // Locate the target, prepare its page, then spotlight the element.
  useEffect(() => {
    if (!target?.selector) {
      setStatus('idle');
      setRect(null);
      return undefined;
    }

    let cancelled = false;
    setStatus('locating');
    setRect(null);

    const prepare = async () => {
      if (target.href && !pathsMatch(pathname, target.href)) {
        router.push(target.href);
      }

      if (target.bridge) emitPageBridge(target.bridge);

      const element = await waitForElement(target.selector, {
        shouldContinue: () => !cancelled,
      });

      if (cancelled) return;

      if (!element) {
        setStatus('error');
        return;
      }

      scrollElementIntoView(element);

      // Wait for smooth scrolling and page-bridge filters to settle before measuring.
      await new Promise((resolve) => {
        setTimeout(resolve, SETTLE_MS);
      });

      if (cancelled) return;
      const nextRect = measureElement(element);
      if (!nextRect) {
        setStatus('error');
        return;
      }
      setRect(nextRect);
      setStatus('active');
    };

    prepare();

    return () => {
      cancelled = true;
    };
    // The requestId changes every time the user asks again, even for the same element.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.requestId]);

  // Keep the spotlight aligned while the page scrolls or the viewport changes.
  useEffect(() => {
    if (status !== 'active' || !target?.selector) return undefined;

    const update = () => {
      if (remeasureRef.current) return;
      remeasureRef.current = requestAnimationFrame(() => {
        remeasureRef.current = null;
        const element = document.querySelector(target.selector);
        const nextRect = element ? measureElement(element) : null;
        if (nextRect) setRect(nextRect);
      });
    };

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      if (remeasureRef.current) cancelAnimationFrame(remeasureRef.current);
      remeasureRef.current = null;
    };
  }, [status, target?.selector]);

  // If the user leaves the highlighted page while the tooltip is open, clear it safely.
  useEffect(() => {
    if (status !== 'active' || !target?.href) return;
    if (!pathsMatch(pathname, target.href)) dismiss();
  }, [dismiss, pathname, status, target?.href]);

  // Escape dismisses; focus moves to the dismiss button so keyboard users are not trapped.
  useEffect(() => {
    if (status !== 'active') return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const timer = setTimeout(() => dismissRef.current?.focus(), 60);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, [dismiss, status]);

  if (!mounted || !target) return null;

  const tooltipPosition =
    status === 'active'
      ? computeTooltipPosition(rect, viewportSize(), {
          width: TOOLTIP_WIDTH,
          height: TOOLTIP_HEIGHT,
        })
      : null;

  return createPortal(
    <>
      {status === 'active' && rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[95] rounded-xl ring-2 ring-cyan-300/90 transition-all duration-150 smart-guide-spotlight"
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.42), 0 0 22px 4px rgba(34, 211, 238, 0.35)',
          }}
        />
      ) : null}

      {status === 'locating' ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[96] flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-200 bg-white/95 px-3.5 py-2 text-[11.5px] font-semibold text-slate-700 shadow-lg backdrop-blur"
        >
          <Loader2 size={14} className="animate-spin text-cyan-600" />
          {copy.locating}
        </div>
      ) : null}

      {status === 'error' ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[96] w-[min(92vw,380px)] -translate-x-1/2 rounded-xl border border-amber-200 bg-white p-3.5 text-[11.5px] leading-relaxed text-slate-700 shadow-xl"
        >
          <div className="flex items-start gap-2">
            <Crosshair size={15} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="flex-1">{copy.notFound}</p>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={copy.dismiss}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {status === 'active' && rect && tooltipPosition ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="smart-guide-title"
          aria-describedby="smart-guide-body"
          className="fixed z-[96] rounded-2xl border border-cyan-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur animate-fade-in"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            width: `${TOOLTIP_WIDTH}px`,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600 ring-1 ring-inset ring-cyan-200">
                <Crosshair size={13} />
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ring-1 ring-inset',
                  INDICATOR_STYLES[indicator] || INDICATOR_STYLES.EN
                )}
              >
                {indicator}
              </span>
            </div>
            <button
              ref={dismissRef}
              type="button"
              onClick={dismiss}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={copy.dismiss}
              title={copy.dismiss}
            >
              <X size={14} />
            </button>
          </div>

          <h3 id="smart-guide-title" className="mt-2 text-[13px] font-extrabold leading-snug text-slate-900">
            {target.title}
          </h3>
          <p id="smart-guide-body" className="mt-1 text-[11.5px] leading-relaxed text-slate-600">
            {target.body}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            <span className="text-[9.5px] font-medium text-slate-400">
              Read-only highlight · nothing is changed
            </span>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-700"
            >
              {copy.done}
            </button>
          </div>
        </div>
      ) : null}
    </>,
    document.body
  );
}
