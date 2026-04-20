import { useCallback, useRef, useState } from 'react';
import type { CaipAccountId } from '@metamask/utils';
import type { UserHistoryItem } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  coalesceBackgroundRequest,
  invalidateCoalescedRequest,
} from './coalesceBackgroundRequest';
import { usePerpsCacheKey } from './usePerpsCacheKey';

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
  /** Cache-respecting fetch — initial mount / re-mount within TTL reuses cached data */
  fetch: () => Promise<UserHistoryItem[]>;
  /** Invalidate cache then fetch — explicit user refresh */
  refetch: () => Promise<UserHistoryItem[]>;
};

/**
 * Hook to fetch and manage user transaction history including deposits and withdrawals.
 *
 * Uses the background PerpsController to fetch historical deposit/withdrawal data.
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
  const [userHistory, setUserHistory] = useState<UserHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scope the coalesce key to the active perps context (provider + testnet +
  // selected address) so switching accounts or toggling testnet inside the
  // 10s TTL does not surface the previous session's data. Pipe-delimited:
  // perpsScopeKey and CaipAccountId use ':' internally but never '|', so the
  // fields are unambiguous without paying the cost of JSON.stringify on each
  // render. Fields are fixed-position — do not reorder or add optional
  // fields between existing ones, or an absent value could align with the
  // empty-string fallback from a neighbouring field.
  const perpsScopeKey = usePerpsCacheKey();
  const cacheKey = `perpsGetUserHistory|${perpsScopeKey}|${accountId ?? ''}|${startTime ?? ''}|${endTime ?? ''}`;

  // Guards async state commits against scope-change races: if `accountId`,
  // `startTime`, or `endTime` change while a fetch is mid-flight, its
  // resolution must not overwrite the newer scope's state. Each fetch
  // captures a generation at start and only commits if it still matches.
  const fetchGenerationRef = useRef(0);

  const fetchUserHistory = useCallback(async (): Promise<UserHistoryItem[]> => {
    fetchGenerationRef.current += 1;
    const generation = fetchGenerationRef.current;
    try {
      setIsLoading(true);
      setError(null);

      const history = await coalesceBackgroundRequest<UserHistoryItem[]>(
        cacheKey,
        () =>
          submitRequestToBackground<UserHistoryItem[]>('perpsGetUserHistory', [
            { startTime, endTime, accountId },
          ]),
      );

      if (fetchGenerationRef.current !== generation) {
        return history;
      }
      setUserHistory(history);
      return history;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch user history';
      if (fetchGenerationRef.current !== generation) {
        return [];
      }
      setError(errorMessage);
      setUserHistory([]);
      return [];
    } finally {
      if (fetchGenerationRef.current === generation) {
        setIsLoading(false);
      }
    }
  }, [cacheKey, startTime, endTime, accountId]);

  const refetch = useCallback(async (): Promise<UserHistoryItem[]> => {
    invalidateCoalescedRequest(cacheKey);
    return fetchUserHistory();
  }, [cacheKey, fetchUserHistory]);

  return {
    userHistory,
    isLoading,
    error,
    fetch: fetchUserHistory,
    refetch,
  };
}
