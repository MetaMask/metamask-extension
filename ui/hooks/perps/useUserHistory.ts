import { useCallback, useEffect, useRef, useState } from 'react';
import type { CaipAccountId } from '@metamask/utils';
import type { UserHistoryItem } from '@metamask/perps-controller';
import {
  fetchUserHistory,
  peekCachedUserHistory,
} from '../../providers/perps/perps-cache';

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
 * Uses a parameter-aware module-level cache so that each distinct
 * (startTime, endTime, accountId) tuple gets its own cache entry.
 * Concurrent calls with identical params share one inflight request,
 * preventing redundant REST calls and 429s.
 *
 * Automatically fetches on mount and when params change.
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
  const warm = peekCachedUserHistory(startTime, endTime, accountId);

  const [userHistory, setUserHistory] = useState<UserHistoryItem[]>(
    warm ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const doFetch = useCallback(async (): Promise<UserHistoryItem[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const history = await fetchUserHistory(startTime, endTime, accountId);

      if (mountedRef.current) {
        setUserHistory(history);
      }
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
  }, [startTime, endTime, accountId]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return {
    userHistory,
    isLoading,
    error,
    refetch: doFetch,
  };
}
