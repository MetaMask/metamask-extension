import { useEffect, useState, useRef } from 'react';
import type { Position } from '@metamask/perps-controller';
import { usePerpsStreamManager } from './usePerpsStreamManager';

/**
 * Options for usePerpsLivePositions hook
 */
export type UsePerpsLivePositionsOptions = {
  /** Throttle delay in milliseconds (default: 0 - no throttling for instant updates) */
  throttleMs?: number;
};

/**
 * Return type for usePerpsLivePositions hook
 */
export type UsePerpsLivePositionsReturn = {
  /** Array of current positions */
  positions: Position[];
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
};

// Stable empty array reference to prevent re-renders
const EMPTY_POSITIONS: Position[] = [];

/**
 * Hook for real-time position updates via stream subscription
 *
 * Uses the PerpsStreamManager for cached, BehaviorSubject-like access.
 * Cached data is delivered immediately on subscribe, eliminating loading
 * skeletons when navigating between Perps views.
 *
 * @param _options - Configuration options (unused, for API compatibility)
 * @returns Object containing positions array and loading state
 * @example
 * ```tsx
 * function PositionsList() {
 *   const { positions, isInitialLoading } = usePerpsLivePositions();
 *
 *   if (isInitialLoading) return <Spinner />;
 *
 *   return (
 *     <ul>
 *       {positions.map((pos) => (
 *         <li key={pos.symbol}>
 *           {pos.symbol}: {pos.size} @ {pos.entryPrice}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePerpsLivePositions(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: UsePerpsLivePositionsOptions = {},
): UsePerpsLivePositionsReturn {
  const { streamManager, isInitializing } = usePerpsStreamManager();

  // Initialize state from cache if available (synchronous)
  const [positions, setPositions] = useState<Position[]>(() => {
    if (streamManager) {
      const cached = streamManager.positions.getCachedData();
      return cached;
    }
    return EMPTY_POSITIONS;
  });

  // Track whether we've received real data
  // If cache exists, we're not in initial loading
  const hasReceivedData = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (streamManager?.positions.hasCachedData()) {
      hasReceivedData.current = true;
      return false;
    }
    return true;
  });

  useEffect(() => {
    // If still initializing stream manager, stay in loading state
    if (isInitializing || !streamManager) {
      return;
    }

    // Check if we have cached data immediately
    if (streamManager.positions.hasCachedData()) {
      const cached = streamManager.positions.getCachedData();
      setPositions(cached);
      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }
    }

    // Subscribe - callback fires immediately with cached data (if any)
    const unsubscribe = streamManager.positions.subscribe((newPositions) => {
      console.log(
        '[Perps] Positions received:',
        newPositions.length,
        newPositions.map((p) => ({
          symbol: p.symbol,
          size: p.size,
          positionValue: p.positionValue,
        })),
      );

      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }

      setPositions(newPositions);
    });

    return () => {
      unsubscribe();
    };
  }, [streamManager, isInitializing]);

  // If stream manager isn't ready yet, show loading
  if (!streamManager || isInitializing) {
    return { positions: EMPTY_POSITIONS, isInitialLoading: true };
  }

  return { positions, isInitialLoading };
}
