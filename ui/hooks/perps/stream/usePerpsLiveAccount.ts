import { useEffect, useState, useRef } from 'react';
import { usePerpsClient } from '../../../providers/perps';
import type { AccountState } from '../../../providers/perps';

/**
 * Options for usePerpsLiveAccount hook
 */
export interface UsePerpsLiveAccountOptions {
  /** Throttle delay in milliseconds (default: 0 - no throttling) */
  throttleMs?: number;
}

/**
 * Return type for usePerpsLiveAccount hook
 */
export interface UsePerpsLiveAccountReturn {
  /** Current account state (null if not loaded) */
  account: AccountState | null;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
}

/**
 * Hook for real-time account state updates via stream subscription
 *
 * @param options - Configuration options
 * @returns Object containing account state and loading state
 *
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
  options: UsePerpsLiveAccountOptions = {},
): UsePerpsLiveAccountReturn {
  // Note: throttleMs is accepted for API compatibility but not used by controller
  const { throttleMs: _throttleMs = 0 } = options;
  const client = usePerpsClient();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    const unsubscribe = client.streams.account.subscribe({
      callback: (newAccount) => {
        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }

        setAccount(newAccount);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [client]);

  return { account, isInitialLoading };
}
