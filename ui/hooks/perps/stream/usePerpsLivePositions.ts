import { usePerpsChannel } from './usePerpsChannel';
import type { Position } from '@metamask/perps-controller';

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
 */
export function usePerpsLivePositions(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: UsePerpsLivePositionsOptions = {},
): UsePerpsLivePositionsReturn {
  const { data: positions, isInitialLoading } = usePerpsChannel(
    (sm) => sm.positions,
    EMPTY_POSITIONS,
  );

  return { positions, isInitialLoading };
}
