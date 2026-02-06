import { useEffect, useState, useRef } from 'react';
import type { AccountState } from '@metamask/perps-controller';
import { usePerpsStreamManager } from './usePerpsStreamManager';

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
 * @example
 * ```tsx
 * function AccountBalance() {
 *   const { account, isInitialLoading } = usePerpsLiveAccount();
 *
 *   if (isInitialLoading) return <Spinner />;
 *   if (!account) return <div>No account data</div>;
 *
 *   return (
 *     <div>
 *       <p>Available: ${account.availableBalance}</p>
 *       <p>Total: ${account.totalBalance}</p>
 *       <p>Unrealized PnL: ${account.unrealizedPnl}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerpsLiveAccount(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: UsePerpsLiveAccountOptions = {},
): UsePerpsLiveAccountReturn {
  const { streamManager, isInitializing } = usePerpsStreamManager();

  // Initialize state from cache if available (synchronous)
  const [account, setAccount] = useState<AccountState | null>(() => {
    if (streamManager) {
      return streamManager.account.getCachedData();
    }
    return null;
  });

  // Track whether we've received real data
  const hasReceivedData = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (streamManager?.account.hasCachedData()) {
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
    if (streamManager.account.hasCachedData()) {
      const cached = streamManager.account.getCachedData();
      setAccount(cached);
      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }
    }

    // Subscribe - callback fires immediately with cached data (if any)
    const unsubscribe = streamManager.account.subscribe((newAccount) => {
      console.log('[Perps] Account received:', {
        totalBalance: newAccount?.totalBalance,
        unrealizedPnl: newAccount?.unrealizedPnl,
        subAccountBreakdown: newAccount?.subAccountBreakdown,
      });

      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }

      setAccount(newAccount);
    });

    return () => {
      unsubscribe();
    };
  }, [streamManager, isInitializing]);

  // If stream manager isn't ready yet, show loading
  if (!streamManager || isInitializing) {
    return { account: null, isInitialLoading: true };
  }

  return { account, isInitialLoading };
}
