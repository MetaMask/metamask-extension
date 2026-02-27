import { useCallback, useState } from 'react';
import type { CaipAccountId } from '@metamask/utils';
import type { UserHistoryItem } from '@metamask/perps-controller';
import { usePerpsController } from '../../providers/perps';

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
  const controller = usePerpsController();
  const [userHistory, setUserHistory] = useState<UserHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserHistory = useCallback(async (): Promise<UserHistoryItem[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const history = await controller.getUserHistory({
        startTime,
        endTime,
        accountId,
      });

      setUserHistory(history);
      return history;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch user history';
      setError(errorMessage);
      setUserHistory([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [controller, startTime, endTime, accountId]);

  return {
    userHistory,
    isLoading,
    error,
    refetch: fetchUserHistory,
  };
}
