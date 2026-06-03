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
import {
  coalesceBackgroundRequest,
  invalidateCoalescedRequest,
} from './coalesceBackgroundRequest';
import { usePerpsCacheKey } from './usePerpsCacheKey';

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
  /**
   * Force a fresh fetch on mount, bypassing the coalesce TTL cache.
   * Intended for top-level activity surfaces where correctness beats dedup
   * (e.g. opening the activity page must not surface a stale snapshot taken
   * by another hook consumer). Defaults to false so passive previews (e.g.
   * "Recent activity" on the perps home) keep sharing the cached snapshot.
   */
  forceFreshOnMount?: boolean;
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
 * @param params.forceFreshOnMount - Force a fresh fetch on mount, bypassing the coalesce TTL cache (default: false)
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
  forceFreshOnMount = false,
}: UsePerpsTransactionHistoryParams = {}): UsePerpsTransactionHistoryResult {
  const [transactions, setTransactions] = useState<PerpsTransaction[]>([]);
  // Start in loading state when the hook will auto-fetch on mount so consumers
  // (e.g. Recent Activity) render a skeleton instead of the empty-state
  // "No transactions yet" during the render cycle before the effect fires.
  const [isLoading, setIsLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState<string | null>(null);

  // Scope coalesce keys to the active perps context (provider + testnet +
  // selected address) so switching accounts or toggling testnet inside the
  // 10s TTL does not surface the previous session's orders/fills/funding.
  const perpsScopeKey = usePerpsCacheKey();

  // Keep the coalesce cache keys in one place so fetch and invalidate can
  // never drift; a mismatch would silently make `refetch()` bypass a stale
  // entry on one side while still serving it on the other.
  //
  // Pipe-delimited: CaipAccountId ("eip155:1:0x...") and perpsScopeKey
  // ("hyperliquid:mainnet:0x...") both contain ':' internally but never '|',
  // so fields remain unambiguous without paying JSON.stringify on every
  // render. If a future field can contain '|', switch to a length-prefix
  // encoder rather than re-introducing delimiter collisions.
  const coalesceKeys = useMemo(() => {
    const accountKey = accountId ?? '';
    return {
      fills: `perpsGetOrderFills|${perpsScopeKey}|${accountKey}|false`,
      orders: `perpsGetOrders|${perpsScopeKey}|${accountKey}`,
      funding: `perpsGetFunding|${perpsScopeKey}|${accountKey}|${startTime ?? ''}|${endTime ?? ''}`,
    };
  }, [accountId, startTime, endTime, perpsScopeKey]);

  // Get user history (includes deposits/withdrawals) - single source of truth
  const {
    userHistory,
    isLoading: userHistoryLoading,
    error: userHistoryError,
    fetch: fetchUserHistoryCached,
    refetch: refetchUserHistory,
  } = useUserHistory({ startTime, endTime, accountId });

  // Subscribe to live WebSocket fills for instant trade updates
  // This ensures new trades appear immediately without waiting for REST refetch
  const { fills: liveFills } = usePerpsLiveFills({ throttleMs: 0 });

  // Store userHistory in ref to avoid recreating fetchAllTransactions callback
  const userHistoryRef = useRef(userHistory);
  // Last scope fingerprint we fetched for. Used to re-fire the initial/refresh
  // fetch when the account, testnet flag, provider, or time range changes
  // while the hook stays mounted — without this, switching accounts in-place
  // would render the previous session's transactions.
  const lastFetchedScopeRef = useRef<string | undefined>(undefined);
  // Guards async state commits against scope-change races: if the user
  // switches account / toggles testnet / changes time range while a fetch is
  // mid-flight, its resolution must not overwrite state with the previous
  // scope's data. Each fetch captures a generation at start and only commits
  // if still current.
  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    userHistoryRef.current = userHistory;
  }, [userHistory]);

  const fetchAllTransactions = useCallback(async () => {
    fetchGenerationRef.current += 1;
    const generation = fetchGenerationRef.current;
    try {
      setIsLoading(true);
      setError(null);

      const [fillsResult, ordersResult, funding] = await Promise.all([
        coalesceBackgroundRequest<OrderFill[]>(coalesceKeys.fills, () =>
          submitRequestToBackground<OrderFill[]>('perpsGetOrderFills', [
            { accountId, aggregateByTime: false },
          ]),
        ),
        coalesceBackgroundRequest<Order[]>(coalesceKeys.orders, () =>
          submitRequestToBackground<Order[]>('perpsGetOrders', [{ accountId }]),
        ),
        coalesceBackgroundRequest<Funding[]>(coalesceKeys.funding, () =>
          submitRequestToBackground<Funding[]>('perpsGetFunding', [
            { accountId, startTime, endTime },
          ]),
        ),
      ]);

      if (fetchGenerationRef.current !== generation) {
        return;
      }

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
      if (fetchGenerationRef.current !== generation) {
        return;
      }
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch transaction history';
      setError(errorMessage);
      setTransactions([]);
    } finally {
      if (fetchGenerationRef.current === generation) {
        setIsLoading(false);
      }
    }
  }, [startTime, endTime, accountId, coalesceKeys]);

  const initialFetch = useCallback(async () => {
    // Cache-respecting path — lets rapid re-mounts within the 10s TTL hit the
    // coalesce cache instead of re-firing HL calls.
    const freshUserHistory = await fetchUserHistoryCached();
    userHistoryRef.current = freshUserHistory;
    await fetchAllTransactions();
  }, [fetchAllTransactions, fetchUserHistoryCached]);

  const refetch = useCallback(async () => {
    // Pull-to-refresh must bypass the short-TTL coalesce cache. Drop the three
    // keys fetchAllTransactions consumes (refetchUserHistory invalidates its
    // own key internally).
    invalidateCoalescedRequest(coalesceKeys.fills);
    invalidateCoalescedRequest(coalesceKeys.orders);
    invalidateCoalescedRequest(coalesceKeys.funding);
    const freshUserHistory = await refetchUserHistory();
    userHistoryRef.current = freshUserHistory;
    await fetchAllTransactions();
  }, [fetchAllTransactions, refetchUserHistory, coalesceKeys]);

  useEffect(() => {
    if (skipInitialFetch) {
      return;
    }
    // Re-fire the initial fetch whenever the effective scope changes — account
    // switch, testnet toggle, provider swap, or time-window change — so a hook
    // that stays mounted across a scope transition never renders the previous
    // session's transactions. The fingerprint gate keeps unrelated re-renders
    // from triggering redundant fetches.
    const scopeFingerprint = `${perpsScopeKey}:${accountId ?? ''}:${startTime ?? ''}:${endTime ?? ''}:${forceFreshOnMount ? '1' : '0'}`;
    if (lastFetchedScopeRef.current === scopeFingerprint) {
      return;
    }
    lastFetchedScopeRef.current = scopeFingerprint;
    // Activity surfaces that open on user intent (e.g. PerpsActivityPage)
    // must force a fresh fetch so they never surface a stale snapshot held
    // by a sibling consumer inside the TTL window. Passive previews (e.g.
    // Recent Activity on the perps home) still share the cached snapshot.
    if (forceFreshOnMount) {
      refetch();
    } else {
      initialFetch();
    }
  }, [
    skipInitialFetch,
    forceFreshOnMount,
    perpsScopeKey,
    accountId,
    startTime,
    endTime,
    initialFetch,
    refetch,
  ]);

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
