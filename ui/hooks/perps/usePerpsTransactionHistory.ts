import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CaipAccountId } from '@metamask/utils';
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
import { usePerpsController } from '../../providers/perps';
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
  const controller = usePerpsController();
  const [transactions, setTransactions] = useState<PerpsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user history (includes deposits/withdrawals) - single source of truth
  const {
    userHistory,
    isLoading: userHistoryLoading,
    error: userHistoryError,
    refetch: refetchUserHistory,
  } = useUserHistory({ startTime, endTime, accountId });

  // Subscribe to live WebSocket fills for instant trade updates
  // This ensures new trades appear immediately without waiting for REST refetch
  const { fills: liveFills } = usePerpsLiveFills({ throttleMs: 0 });

  // Store userHistory in ref to avoid recreating fetchAllTransactions callback
  const userHistoryRef = useRef(userHistory);
  // Track if initial fetch has been done to prevent duplicate fetches
  const initialFetchDone = useRef(false);

  useEffect(() => {
    userHistoryRef.current = userHistory;
  }, [userHistory]);

  const fetchAllTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = controller.getActiveProvider();
      if (!provider) {
        throw new Error('No active provider available');
      }

      // Fetch all transaction data in parallel
      const [fillsResult, ordersResult, funding] = await Promise.all([
        provider.getOrderFills({
          accountId,
          aggregateByTime: false,
        }),
        provider.getOrders({ accountId }),
        provider.getFunding({
          accountId,
          startTime,
          endTime,
        }),
      ]);

      const fills: OrderFill[] = Array.isArray(fillsResult) ? fillsResult : [];
      const orders: Order[] = Array.isArray(ordersResult) ? ordersResult : [];
      const orderMap = new Map(orders.map((order) => [order.orderId, order]));

      // Attaching detailedOrderType allows us to display the TP/SL pill in the trades history list.
      const enrichedFills = fills.map((fill) => ({
        ...fill,
        detailedOrderType: orderMap.get(fill.orderId)?.detailedOrderType,
      }));

      // Transform each data type to PerpsTransaction format
      const fillTransactions = transformFillsToTransactions(enrichedFills);
      const orderTransactions = transformOrdersToTransactions(orders);
      const fundingTransactions = transformFundingToTransactions(funding);
      const userHistoryTransactions = transformUserHistoryToTransactions(
        userHistoryRef.current,
      );

      // Combine all transactions (no Arbitrum withdrawals - using user history as single source of truth)
      const allTransactions = [
        ...fillTransactions,
        ...orderTransactions,
        ...fundingTransactions,
        ...userHistoryTransactions,
      ];

      // Sort by timestamp descending (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      // Remove duplicates based on ID
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
  }, [controller, startTime, endTime, accountId]);

  const refetch = useCallback(async () => {
    // Fetch user history first, then fetch all transactions
    const freshUserHistory = await refetchUserHistory();
    userHistoryRef.current = freshUserHistory;
    await fetchAllTransactions();
  }, [fetchAllTransactions, refetchUserHistory]);

  useEffect(() => {
    if (!skipInitialFetch && !initialFetchDone.current) {
      initialFetchDone.current = true;
      refetch();
    }
  }, [skipInitialFetch, refetch]);

  // Combine loading states
  const combinedIsLoading = useMemo(
    () => isLoading || userHistoryLoading,
    [isLoading, userHistoryLoading],
  );

  // Combine error states
  const combinedError = useMemo(() => {
    if (error) {
      return error;
    }
    if (userHistoryError) {
      return userHistoryError;
    }
    return null;
  }, [error, userHistoryError]);

  // Merge live WebSocket fills with REST transactions for instant updates
  // Live fills take precedence for recent trades
  // IMPORTANT: Deduplicate trades using asset+timestamp (truncated to seconds), not tx.id,
  // because:
  // 1. The ID includes array index which differs between REST and WebSocket arrays
  // 2. Aggregated fills (from split stop loss/TP) may have slightly different first-fill
  //    timestamps between REST and WebSocket if fills arrive in different order
  const mergedTransactions = useMemo(() => {
    // Transform live fills to PerpsTransaction format
    // Note: transformFillsToTransactions now aggregates split stop loss/TP fills
    const liveTransactions = transformFillsToTransactions(liveFills);

    // If no REST transactions yet, return only live fills
    if (transactions.length === 0) {
      return liveTransactions;
    }

    // Separate trade transactions from non-trade transactions (orders, funding, deposits)
    // Non-trade transactions use their ID directly (no index issue)
    const restTradeTransactions = transactions.filter(
      (tx) => tx.type === 'trade',
    );
    const nonTradeTransactions = transactions.filter(
      (tx) => tx.type !== 'trade',
    );

    // Merge trades using asset+timestamp(seconds) as dedup key
    // Use seconds-truncated timestamp to handle cases where REST and WebSocket
    // aggregated fills have slightly different first-fill timestamps
    const tradeMap = new Map<string, PerpsTransaction>();

    // Add REST trade transactions first
    for (const tx of restTradeTransactions) {
      // Use symbol + timestamp (truncated to seconds) as key
      const timestampSeconds = Math.floor(tx.timestamp / 1000);
      const dedupKey = `${tx.symbol}-${timestampSeconds}`;
      tradeMap.set(dedupKey, tx);
    }

    // Add live fills (overwrites REST duplicates - live data is fresher)
    for (const tx of liveTransactions) {
      const timestampSeconds = Math.floor(tx.timestamp / 1000);
      const dedupKey = `${tx.symbol}-${timestampSeconds}`;
      tradeMap.set(dedupKey, tx);
    }

    // Combine deduplicated trades with non-trade transactions
    const allTransactions = [
      ...Array.from(tradeMap.values()),
      ...nonTradeTransactions,
    ];

    // Sort by timestamp descending
    return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }, [liveFills, transactions]);

  return {
    transactions: mergedTransactions,
    isLoading: combinedIsLoading,
    error: combinedError,
    refetch,
  };
}
