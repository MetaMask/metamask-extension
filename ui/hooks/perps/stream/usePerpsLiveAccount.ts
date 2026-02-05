import { useEffect, useState, useRef } from 'react';
import type { AccountState } from '@metamask/perps-controller';
import { usePerpsController } from '../../../providers/perps';

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
 * Uses the PerpsController directly for WebSocket subscriptions.
 *
 * @param options - Configuration options
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
  const controller = usePerpsController();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    const unsubscribe = controller.subscribeToAccount({
      callback: (newAccount) => {
        // Debug: Log account state including subAccountBreakdown for HIP-3
        console.log('[Perps] Account received:', {
          totalBalance: newAccount.totalBalance,
          unrealizedPnl: newAccount.unrealizedPnl,
          subAccountBreakdown: newAccount.subAccountBreakdown,
        });

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
  }, [controller]);

  return { account, isInitialLoading };
}
