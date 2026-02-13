import { usePerpsChannel } from './usePerpsChannel';
import type { AccountState } from '@metamask/perps-controller';

/**
 * Options for usePerpsLiveAccount hook
 */
export type UsePerpsLiveAccountOptions = {
  /** Throttle delay in milliseconds (default: 0 - no throttling) */
  throttleMs?: number;
};

/**
 * Return type for usePerpsLiveAccount hook
 */
export type UsePerpsLiveAccountReturn = {
  /** Current account state (null if not loaded) */
  account: AccountState | null;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
};

/**
 * Hook for real-time account state updates via stream subscription
 *
 * Uses the PerpsStreamManager for cached, BehaviorSubject-like access.
 * Cached data is delivered immediately on subscribe, eliminating loading
 * skeletons when navigating between Perps views.
 *
 * @param _options - Configuration options (unused, for API compatibility)
 * @returns Object containing account state and loading state
 */
export function usePerpsLiveAccount(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: UsePerpsLiveAccountOptions = {},
): UsePerpsLiveAccountReturn {
  const { data: account, isInitialLoading } = usePerpsChannel(
    (sm) => sm.account,
    null,
  );

  return { account, isInitialLoading };
}
