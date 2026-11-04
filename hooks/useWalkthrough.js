'use client';

import { useWalkthroughContext } from '@/context/WalkthroughContext';

export function useWalkthrough() {
  return useWalkthroughContext();
}

export default useWalkthrough;
