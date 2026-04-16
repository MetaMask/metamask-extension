import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CaipAccountId } from '@metamask/utils';
import type { Funding } from '@metamask/perps-controller';
import {
  transformFillsToTransactions,
  transformOrdersToTransactions,
  transformFundingToTransactions,
  transformUserHistoryToTransactions,
} from '../../components/app/perps/utils/transactionTransforms';
import type {
  Order,
  OrderFill,
  PerpsTransaction,
} from '../../components/app/perps/types';
import { submitRequestToBackground } from '../../store/background-connection';
import { useUserHistory } from './useUserHistory';
import { usePerpsLiveFills } from './stream';

/**
 * Parameters for the usePerpsTransactionHistory hook
 */
export type UsePerpsTransactionHistoryParams = {
  /** Optional start time for filtering history (Unix timestamp in ms) */
  startTime?: number;
  /** Optional end time for filtering history (Unix timestamp in ms) */
  endTime?: number;
  /** Optional account ID to fetch history for */
  accountId?: CaipAccountId;
  /** Skip the initial fetch on mount (default: false) */
  skipInitialFetch?: boolean;
};

/**
 * Return type for the usePerpsTransactionHistory hook
 */
export type UsePerpsTransactionHistoryResult = {
  /** Array of all perps transactions (trades, orders, funding, deposits/withdrawals) */
  transactions: PerpsTransaction[];
  /** Whether the hook is currently loading data */
  isLoading: boolean;
  /** Error message if fetching failed, null otherwise */
  error: string | null;
  /** Function to manually refetch all transaction history */
  refetch: () => Promise<void>;
};

/**
 * Comprehensive hook to fetch and combine all perps transaction data.
 *
 * Includes trades, orders, funding payments, and user history (deposits/withdrawals).
 * Uses HyperLiquid user history as the single source of truth for withdrawals.
 * Merges real-time WebSocket fills with REST API data for instant updates.
 *
 * @param params - Optional parameters for filtering and controlling the hook
 * @param params.startTime - Optional start time for filtering history (Unix timestamp in ms)
 * @param params.endTime - Optional end time for filtering history (Unix timestamp in ms)
 * @param params.accountId - Optional account ID to fetch history for
 * @param params.skipInitialFetch - Skip the initial fetch on mount (default: false)
 * @returns Object containing transactions array, loading state, error, and refetch function
 * @example
 * ```tsx
 * function ActivityPage() {
 *   const { transactions, isLoading, error, refetch } = usePerpsTransactionHistory();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return (
 *     <ul>
 *       {transactions.map((tx) => (
 *         <li key={tx.id}>
 *           {tx.type}: {tx.title} - {tx.subtitle}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePerpsTransactionHistory({
  startTime,
  endTime,
  accountId,
  skipInitialFetch = false,
}: UsePerpsTransactionHistoryParams = {}): UsePerpsTransactionHistoryResult {
  const [transactions, setTransactions] = useState<PerpsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    userHistory,
    isLoading: userHistoryLoading,
    error: userHistoryError,
    refetch: refetchUserHistory,
  } = useUserHistory({ startTime, endTime, accountId });

  const { fills: liveFills } = usePerpsLiveFills({ throttleMs: 0 });

  const userHistoryRef = useRef(userHistory);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    userHistoryRef.current = userHistory;
  }, [userHistory]);

  const fetchAllTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fillsResult = await submitRequestToBackground<OrderFill[]>(
        'perpsGetOrderFills',
        [{ accountId, aggregateByTime: false }],
      );

      const ordersResult = await submitRequestToBackground<Order[]>(
        'perpsGetOrders',
        [{ accountId }],
      );

      const funding = await submitRequestToBackground<Funding[]>(
        'perpsGetFunding',
        [{ accountId, startTime, endTime }],
      );

      const fills: OrderFill[] = Array.isArray(fillsResult) ? fillsResult : [];
      const orders: Order[] = Array.isArray(ordersResult) ? ordersResult : [];
      const orderMap = new Map(orders.map((order) => [order.orderId, order]));

      const enrichedFills = fills.map((fill) => ({
        ...fill,
        detailedOrderType: orderMap.get(fill.orderId)?.detailedOrderType,
      }));

      const fillTransactions = transformFillsToTransactions(enrichedFills);
      const orderTransactions = transformOrdersToTransactions(orders);
      const fundingTransactions = transformFundingToTransactions(funding);
      const userHistoryTransactions = transformUserHistoryToTransactions(
        userHistoryRef.current,
      );

      const allTransactions = [
        ...fillTransactions,
        ...orderTransactions,
        ...fundingTransactions,
        ...userHistoryTransactions,
      ];

      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      const uniqueTransactions = allTransactions.reduce((acc, transaction) => {
        const existingIndex = acc.findIndex((t) => t.id === transaction.id);
        if (existingIndex === -1) {
          acc.push(transaction);
        }
        return acc;
      }, [] as PerpsTransaction[]);

      setTransactions(uniqueTransactions);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch transaction history';
      setError(errorMessage);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [startTime, endTime, accountId]);

  const refetch = useCallback(async () => {
    const freshUserHistory = await refetchUserHistory();
    userHistoryRef.current = freshUserHistory;
    await fetchAllTransactions();
  }, [fetchAllTransactions, refetchUserHistory]);

  useEffect(() => {
    if (skipInitialFetch || initialFetchDone.current) {
      return;
    }
    initialFetchDone.current = true;

    fetchAllTransactions();
  }, [skipInitialFetch, fetchAllTransactions]);

  const combinedIsLoading = useMemo(
    () => isLoading || userHistoryLoading,
    [isLoading, userHistoryLoading],
  );

  const combinedError = useMemo(() => {
    if (error) {
      return error;
    }
    if (userHistoryError) {
      return userHistoryError;
    }
    return null;
  }, [error, userHistoryError]);

  const mergedTransactions = useMemo(() => {
    const liveTransactions = transformFillsToTransactions(liveFills);

    if (transactions.length === 0) {
      return liveTransactions;
    }

    const restTradeTransactions = transactions.filter(
      (tx) => tx.type === 'trade',
    );
    const nonTradeTransactions = transactions.filter(
      (tx) => tx.type !== 'trade',
    );

    const tradeMap = new Map<string, PerpsTransaction>();

    for (const tx of restTradeTransactions) {
      const timestampSeconds = Math.floor(tx.timestamp / 1000);
      const dedupKey = `${tx.symbol}-${timestampSeconds}`;
      tradeMap.set(dedupKey, tx);
    }

    for (const tx of liveTransactions) {
      const timestampSeconds = Math.floor(tx.timestamp / 1000);
      const dedupKey = `${tx.symbol}-${timestampSeconds}`;
      tradeMap.set(dedupKey, tx);
    }

    const allTransactions = [
      ...Array.from(tradeMap.values()),
      ...nonTradeTransactions,
    ];

    return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }, [liveFills, transactions]);

  return {
    transactions: mergedTransactions,
    isLoading: combinedIsLoading,
    error: combinedError,
    refetch,
  };
}
