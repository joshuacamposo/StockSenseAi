'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useApp } from '@/context/AppProvider';
import { WALKTHROUGHS, getWalkthrough } from '@/lib/chatbot/walkthroughConfig';

const WalkthroughContext = createContext(null);

function normalizePath(value) {
  const clean = String(value || '/').split('?')[0].split('#')[0];
  return clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
}

export function WalkthroughProvider({ children }) {
  const { user, canDo } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [activeId, setActiveId] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState([]);
  const pendingRouteRef = useRef(null);

  const tour = activeId ? getWalkthrough(activeId) : null;
  const step = tour?.steps?.[stepIndex] || null;
  const totalSteps = tour?.steps?.length || 0;
  const isFirst = stepIndex <= 0;
  const isLast = totalSteps > 0 && stepIndex >= totalSteps - 1;

  const endTour = useCallback((completed = false) => {
    if (completed && activeId) {
      setCompletedIds((previous) =>
        previous.includes(activeId) ? previous : [...previous, activeId]
      );
    }
    setActiveId(null);
    setStepIndex(0);
    pendingRouteRef.current = null;
  }, [activeId]);

  const startTour = useCallback(
    (tourId) => {
      const nextTour = getWalkthrough(tourId);
      if (!nextTour) {
        toast.error('That walkthrough is not available.');
        return false;
      }
      if (!user) {
        toast.error('Sign in to start a guided walkthrough.');
        return false;
      }
      if (nextTour.permission && !canDo(nextTour.permission)) {
        toast.error('Your demo role does not have permission for this walkthrough.');
        return false;
      }
      const expected = nextTour.route ? normalizePath(nextTour.route) : null;
      const needsNavigation = Boolean(expected && normalizePath(pathname) !== expected);
      pendingRouteRef.current = needsNavigation ? expected : null;
      setActiveId(nextTour.id);
      setStepIndex(0);
      if (needsNavigation) {
        router.push(nextTour.route);
      }
      return true;
    },
    [canDo, pathname, router, user]
  );

  const nextStep = useCallback(() => {
    if (!tour) return;
    setStepIndex((current) => {
      if (current >= tour.steps.length - 1) {
        setCompletedIds((previous) =>
          previous.includes(tour.id) ? previous : [...previous, tour.id]
        );
        setActiveId(null);
        pendingRouteRef.current = null;
        return 0;
      }
      return current + 1;
    });
  }, [tour]);

  const previousStep = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const goToStep = useCallback(
    (index) => {
      if (!tour) return;
      setStepIndex(Math.min(Math.max(0, index), tour.steps.length - 1));
    },
    [tour]
  );

  // End the tour only after the user leaves the page it belongs to. While the
  // route change requested by startTour is still in flight, wait for it instead
  // of cancelling immediately (router.push is asynchronous).
  useEffect(() => {
    if (!tour) {
      pendingRouteRef.current = null;
      return undefined;
    }
    const expected = tour.route ? normalizePath(tour.route) : null;
    if (!expected) return undefined;

    if (normalizePath(pathname) === expected) {
      pendingRouteRef.current = null;
      return undefined;
    }

    if (pendingRouteRef.current === expected) {
      const timer = setTimeout(() => {
        pendingRouteRef.current = null;
        setActiveId(null);
        setStepIndex(0);
      }, 6000);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setActiveId(null);
      setStepIndex(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, tour]);

  const value = useMemo(
    () => ({
      tours: WALKTHROUGHS,
      tour,
      tourId: activeId,
      isActive: Boolean(tour),
      step,
      stepIndex,
      totalSteps,
      progress: totalSteps ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0,
      isFirst,
      isLast,
      completedIds,
      startTour,
      nextStep,
      previousStep,
      goToStep,
      endTour,
    }),
    [
      activeId,
      completedIds,
      endTour,
      goToStep,
      isFirst,
      isLast,
      nextStep,
      previousStep,
      startTour,
      step,
      stepIndex,
      totalSteps,
      tour,
    ]
  );

  return <WalkthroughContext.Provider value={value}>{children}</WalkthroughContext.Provider>;
}

export function useWalkthroughContext() {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used inside <WalkthroughProvider>.');
  }
  return context;
}

export default WalkthroughContext;
