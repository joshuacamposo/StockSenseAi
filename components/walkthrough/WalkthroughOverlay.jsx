'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  MousePointerClick,
  SkipForward,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useWalkthrough } from '@/hooks/useWalkthrough';
import { cn } from '@/components/ui';

const TOOLTIP_WIDTH = 356;
const MARGIN = 16;

export default function WalkthroughOverlay() {
  const {
    isActive,
    tour,
    step,
    stepIndex,
    totalSteps,
    progress,
    isFirst,
    isLast,
    nextStep,
    previousStep,
    endTour,
  } = useWalkthrough();

  const [rect, setRect] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const lastSelectorRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!isActive || !step) {
      setRect(null);
      setNotFound(false);
      lastSelectorRef.current = null;
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;
    let hasScrolled = false;

    const find = () => {
      if (cancelled) return false;
      const element = document.querySelector(step.selector);
      if (!element) {
        setNotFound(true);
        setRect(null);
        return false;
      }
      setNotFound(false);
      if (lastSelectorRef.current !== step.selector) {
        lastSelectorRef.current = step.selector;
        hasScrolled = false;
      }
      if (!hasScrolled) {
        hasScrolled = true;
        try {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } catch (error) {
          // Older browsers may not support the options object; the poll below still updates.
        }
      }
      setRect(element.getBoundingClientRect());
      return true;
    };

    find();
    const timer = setInterval(() => {
      attempts += 1;
      const found = find();
      if (found || attempts > 24) clearInterval(timer);
    }, 250);

    const refresh = () => {
      requestAnimationFrame(() => {
        const element = document.querySelector(step.selector);
        if (element) setRect(element.getBoundingClientRect());
      });
    };
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
    };
  }, [isActive, step, stepIndex]);

  // Steps that need the user to open a modal wait for that real click.
  useEffect(() => {
    if (!isActive || !step?.advanceOnClick) return undefined;
    const element = document.querySelector(step.selector);
    if (!element) return undefined;

    let timer = null;
    const handleClick = () => {
      timer = setTimeout(() => nextStep(), 480);
    };
    element.addEventListener('click', handleClick);
    return () => {
      if (timer) clearTimeout(timer);
      element.removeEventListener('click', handleClick);
    };
  }, [isActive, step, stepIndex, nextStep]);

  useEffect(() => {
    if (!isActive) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        endTour(false);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextStep();
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousStep();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [endTour, isActive, nextStep, previousStep]);

  const placement = useMemo(() => {
    if (!rect) return null;
    const fitsBelow = rect.bottom + 210 < viewport.height;
    const top = fitsBelow ? rect.bottom + 12 : Math.max(MARGIN, rect.top - 210);
    const left = Math.min(
      Math.max(MARGIN, rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2),
      Math.max(MARGIN, viewport.width - TOOLTIP_WIDTH - MARGIN)
    );
    return { top, left };
  }, [rect, viewport]);

  if (!isActive || !tour || !step) return null;

  const isMobile = viewport.width < 640;
  const highlightStyle = rect
    ? {
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.58)',
      }
    : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-live="polite">
      {highlightStyle ? (
        <div
          className="pointer-events-none absolute rounded-xl border-2 border-brand-300 ring-4 ring-brand-400/30 transition-all duration-300"
          style={highlightStyle}
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-950/55" aria-hidden="true" />
      )}

      <div
        role="dialog"
        aria-label={`Guided walkthrough: ${tour.title}`}
        className={cn(
          'pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-ink-900 text-white shadow-2xl animate-pop-in',
          isMobile ? 'bottom-4 left-4 right-4' : ''
        )}
        style={
          isMobile
            ? undefined
            : placement
              ? { top: placement.top, left: placement.left, width: TOOLTIP_WIDTH }
              : { top: '50%', left: '50%', width: TOOLTIP_WIDTH, transform: 'translate(-50%, -50%)' }
        }
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/20 text-brand-200">
              <Compass size={16} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-200">
                Guided walkthrough
              </p>
              <p className="text-[13.5px] font-bold leading-tight">{tour.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => endTour(false)}
            className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="End walkthrough"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-4 py-3.5">
          <div className="mb-2.5 flex items-center justify-between text-[10.5px] font-semibold text-white/60">
            <span>
              Step {stepIndex + 1} of {totalSteps}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <h3 className="text-[14px] font-bold leading-snug">{step.title}</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-300">{step.body}</p>

          {step.advanceOnClick && !notFound ? (
            <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-brand-100">
              <MousePointerClick size={13} />
              Click the highlighted control to continue
            </p>
          ) : null}

          {notFound ? (
            <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-100">
              <TriangleAlert size={13} className="mt-0.5 shrink-0" />
              This control is not visible right now. Open the relevant page or dialog, or skip this
              step.
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => endTour(false)}
            className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            End tour
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={previousStep}
              disabled={isFirst}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11.5px] font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={13} /> Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-[11.5px] font-bold text-white transition hover:bg-brand-400"
            >
              {isLast ? (
                <>
                  Finish <Check size={13} />
                </>
              ) : (
                <>
                  {step.advanceOnClick ? 'Skip' : 'Next'} <ArrowRight size={13} />
                </>
              )}
            </button>
            {!isLast ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white"
                aria-label="Skip step"
                title="Skip step"
              >
                <SkipForward size={14} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
