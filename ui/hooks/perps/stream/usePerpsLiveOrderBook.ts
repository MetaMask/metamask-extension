import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import type { OrderBookData } from '@metamask/perps-controller';
import type {
  OrderBookConnectionStatus,
  PerpsStreamManager,
} from '../../../providers/perps';
import { submitRequestToBackground } from '../../../store/background-connection';
import { usePerpsChannel } from './usePerpsChannel';
import { usePerpsStreamManager } from './usePerpsStreamManager';

/**
 * Options for usePerpsLiveOrderBook hook
 */
export type UsePerpsLiveOrderBookOptions = {
  /** Symbol to get order book for (e.g., 'BTC', 'ETH') */
  symbol: string;
  /** Number of levels to return per side (default: 10) */
  levels?: number;
  /** Price aggregation significant figures (2-5, default: 5) */
  nSigFigs?: 2 | 3 | 4 | 5;
  /** Mantissa for aggregation when nSigFigs is 5 */
  mantissa?: 2 | 5;
  /** When false, no background order-book stream is activated (default: true). */
  enabled?: boolean;
  /**
   * When false, only read from the shared channel; do not activate/deactivate the
   * background stream (default: true). Use when another surface already owns
   * order-book stream lifecycle (e.g. order entry page top-of-book).
   */
  manageStream?: boolean;
  /**
   * Which order-book channel to read/activate (default: 'orderBook').
   * 'orderBook' is the raw, full-precision book shared with top-of-book mid and
   * slippage estimation. 'orderBookAggregated' is a second, independent
   * subscription that uses server-side `nSigFigs`/`mantissa` aggregation for the
   * order-book panel, so the raw channel is never coarsened.
   */
  channel?: 'orderBook' | 'orderBookAggregated';
};

/**
 * Return type for usePerpsLiveOrderBook hook
 */
export type UsePerpsLiveOrderBookReturn = {
  /** Full order book data */
  orderBook: OrderBookData | null;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
  /**
   * Health of the underlying stream. Only meaningful for the
   * `orderBookAggregated` channel (its dedicated socket); the raw channel
   * always reports `connected`.
   */
  connectionStatus: OrderBookConnectionStatus;
  /**
   * Re-establishes the stream after a dropped connection. Tears the current
   * subscription down and re-activates it (rebuilding the dedicated socket for
   * the aggregated channel). No-op unless `manageStream` is enabled.
   */
  reconnect: () => void;
};

const getOrderBookChannel = (sm: PerpsStreamManager) => sm.orderBook;
const getOrderBookAggregatedChannel = (sm: PerpsStreamManager) =>
  sm.orderBookAggregated;
const getOrderBookAggregatedStatusChannel = (sm: PerpsStreamManager) =>
  sm.orderBookAggregatedStatus;

/**
 * Build the UI-owned identity for an aggregated order-book subscription.
 * Must stay in sync with the hook's `resetKey` so channel clears and packet
 * filtering share the same generation.
 *
 * @param params - Identity components.
 * @param params.symbol - Market symbol.
 * @param params.nSigFigs - Server aggregation significant figures.
 * @param params.mantissa - Mantissa refinement when nSigFigs is 5.
 * @param params.reconnectNonce - Bumped by `reconnect()` to force a new socket.
 * @returns Stable identity string carried through activate + emissions.
 */
export function buildOrderBookAggregatedSubscriptionId({
  symbol,
  nSigFigs,
  mantissa,
  reconnectNonce,
}: {
  symbol: string;
  nSigFigs?: 2 | 3 | 4 | 5;
  mantissa?: 2 | 5;
  reconnectNonce: number;
}): string {
  return `${symbol}:${nSigFigs ?? ''}:${mantissa ?? ''}:${reconnectNonce}`;
}

/**
 * Hook for real-time order book data via background stream notifications.
 *
 * Activates the background order-book stream for `symbol` (mirrors
 * `usePerpsTopOfBook` / mobile's subscribeToOrderBook wiring) and reads from
 * the shared PerpsStreamManager channel.
 *
 * @param options - Configuration options
 * @returns Object containing order book data and loading state
 */
export function usePerpsLiveOrderBook(
  options: UsePerpsLiveOrderBookOptions,
): UsePerpsLiveOrderBookReturn {
  const {
    symbol,
    levels,
    nSigFigs,
    mantissa,
    enabled = true,
    manageStream = true,
    channel = 'orderBook',
  } = options;
  const activeSymbol = enabled ? symbol : undefined;
  const isAggregated = channel === 'orderBookAggregated';
  const { streamManager } = usePerpsStreamManager();

  // Bumped by reconnect() to force the activate effect to tear down and
  // re-subscribe (which rebuilds the aggregated channel's dedicated socket).
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const reconnect = useCallback(() => {
    setReconnectNonce((nonce) => nonce + 1);
  }, []);

  // For the aggregated channel, changing the server-side aggregation params
  // yields a structurally different book, so fold them into the reset key to
  // drop the prior grouping's rows the instant the grouping changes. The
  // reconnect nonce is also folded in so a manual reconnect clears the stale
  // book (and resets the status channel to `connecting`) while re-subscribing.
  // This same string is the subscription identity tagged on activate + every
  // background emission so late packets from the prior grouping are discarded.
  let subscriptionId: string | undefined;
  let resetKey: string | undefined;
  if (activeSymbol) {
    if (isAggregated) {
      subscriptionId = buildOrderBookAggregatedSubscriptionId({
        symbol: activeSymbol,
        nSigFigs,
        mantissa,
        reconnectNonce,
      });
      resetKey = subscriptionId;
    } else {
      resetKey = activeSymbol;
    }
  }

  // Register the active identity before paint so a late IPC packet from the
  // prior grouping cannot land between clearCache and the next stream update.
  useLayoutEffect(() => {
    if (!isAggregated || !streamManager) {
      return;
    }
    streamManager.setActiveOrderBookAggregatedSubscriptionId(
      subscriptionId ?? null,
    );
  }, [isAggregated, streamManager, subscriptionId]);

  const { data: orderBook, isInitialLoading } = usePerpsChannel(
    isAggregated ? getOrderBookAggregatedChannel : getOrderBookChannel,
    null,
    resetKey,
  );

  const { data: connectionStatus } = usePerpsChannel<OrderBookConnectionStatus>(
    getOrderBookAggregatedStatusChannel,
    'connecting',
    resetKey,
  );

  useEffect(() => {
    if (!manageStream || !enabled || !symbol) {
      return undefined;
    }
    const activateAction = isAggregated
      ? 'perpsActivateOrderBookAggregatedStream'
      : 'perpsActivateOrderBookStream';
    const deactivateAction = isAggregated
      ? 'perpsDeactivateOrderBookAggregatedStream'
      : 'perpsDeactivateOrderBookStream';
    submitRequestToBackground(activateAction, [
      {
        symbol,
        levels,
        nSigFigs,
        mantissa,
        ...(isAggregated ? { subscriptionId } : {}),
      },
    ]).catch(() => {
      // Controller not ready yet — stream will activate on retry when symbol changes.
    });
    return () => {
      submitRequestToBackground(deactivateAction, []).catch(() => {
        // Best-effort teardown.
      });
    };
  }, [
    manageStream,
    enabled,
    symbol,
    levels,
    nSigFigs,
    mantissa,
    isAggregated,
    reconnectNonce,
    subscriptionId,
  ]);

  return {
    orderBook,
    isInitialLoading: isInitialLoading || !activeSymbol,
    // The raw channel shares the always-on controller socket, so it has no
    // independent health to report — treat it as connected.
    connectionStatus: isAggregated ? connectionStatus : 'connected',
    reconnect,
  };
}
