import { useCallback, useEffect, useRef, useState } from 'react';
import type { CaipAccountId } from '@metamask/utils';
import type { UserHistoryItem } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../store/background-connection';
import { getPerpsStreamManager } from '../../providers/perps/PerpsStreamManager';

/**
 * Parameters for the useUserHistory hook
 */
export type UseUserHistoryParams = {
  /** Optional start time for filtering history (Unix timestamp in ms) */
  startTime?: number;
  /** Optional end time for filtering history (Unix timestamp in ms) */
  endTime?: number;
  /** Optional account ID to fetch history for */
  accountId?: CaipAccountId;
};

/**
 * Return type for the useUserHistory hook
 */
export type UseUserHistoryResult = {
  /** Array of user history items (deposits/withdrawals) */
  userHistory: UserHistoryItem[];
  /** Whether the hook is currently loading data */
  isLoading: boolean;
  /** Error message if fetching failed, null otherwise */
  error: string | null;
  /** Function to manually refetch the user history */
  refetch: () => Promise<UserHistoryItem[]>;
};

/**
 * Hook to fetch and manage user transaction history including deposits and withdrawals.
 *
 * Subscribes to the PerpsStreamManager's userHistory channel so data
 * persists across component remounts (no redundant REST calls on tab switch).
 *
 * @param params - Optional parameters for filtering history
 * @param params.startTime - Optional start time for filtering history (Unix timestamp in ms)
 * @param params.endTime - Optional end time for filtering history (Unix timestamp in ms)
 * @param params.accountId - Optional account ID to fetch history for
 * @returns Object containing userHistory array, loading state, error, and refetch function
 */
export function useUserHistory({
  startTime,
  endTime,
  accountId,
}: UseUserHistoryParams = {}): UseUserHistoryResult {
  const manager = getPerpsStreamManager();
  const cachedData = manager.userHistory.getCachedData();

  const [userHistory, setUserHistory] = useState<UserHistoryItem[]>(
    manager.userHistory.hasCachedData() ? cachedData : [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = manager.userHistory.subscribe((data) => {
      if (mountedRef.current) {
        setUserHistory(data);
      }
    });
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [manager]);

  const refetch = useCallback(async (): Promise<UserHistoryItem[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const history = await submitRequestToBackground<UserHistoryItem[]>(
        'perpsGetUserHistory',
        [{ startTime, endTime, accountId }],
      );

      manager.userHistory.pushData(history);
      return history;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch user history';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      return [];
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [startTime, endTime, accountId, manager]);

  return {
    userHistory,
    isLoading,
    error,
    refetch,
  };
}
