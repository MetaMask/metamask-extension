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
 * Monotonic counter for aggregated order-book subscription instances.
 * Never reused across activations so A→B→A and close→reopen cannot collide
 * with a late packet from an earlier socket that shared the same config.
 */
let nextOrderBookAggregatedSubscriptionGeneration = 0;

/**
 * Cache of subscription ids by activation key so StrictMode double-render does
 * not allocate two generations for the same activation.
 */
const subscriptionIdsByActivationKey = new Map<string, string>();

/**
 * Allocate a never-reused generation for one aggregated order-book activation.
 *
 * @returns Next monotonic generation value.
 */
export function allocateOrderBookAggregatedSubscriptionGeneration(): number {
  nextOrderBookAggregatedSubscriptionGeneration += 1;
  return nextOrderBookAggregatedSubscriptionGeneration;
}

/**
 * Reset the generation counter. Test-only — keeps suite IDs deterministic.
 */
export function resetOrderBookAggregatedSubscriptionGenerationForTests(): void {
  nextOrderBookAggregatedSubscriptionGeneration = 0;
  subscriptionIdsByActivationKey.clear();
}

/**
 * Allocate or reuse a subscription id for `activationKey`. Mutates the module
 * Map / generation counter — call only from layout/commit, never from render.
 * @param options0
 * @param options0.activationKey
 * @param options0.symbol
 * @param options0.nSigFigs
 * @param options0.mantissa
 */
function getOrCreateAggregatedSubscriptionId({
  activationKey,
  symbol,
  nSigFigs,
  mantissa,
}: {
  activationKey: string;
  symbol: string;
  nSigFigs?: 2 | 3 | 4 | 5;
  mantissa?: 2 | 5;
}): string {
  const existing = subscriptionIdsByActivationKey.get(activationKey);
  if (existing) {
    return existing;
  }

  const subscriptionId = buildOrderBookAggregatedSubscriptionId({
    symbol,
    nSigFigs,
    mantissa,
    generation: allocateOrderBookAggregatedSubscriptionGeneration(),
  });
  subscriptionIdsByActivationKey.set(activationKey, subscriptionId);
  return subscriptionId;
}

/**
 * Build the UI-owned identity for an aggregated order-book subscription
 * instance. Includes a unique monotonic `generation` so each activation is
 * distinct even when symbol/grouping/reconnect config repeats.
 *
 * @param params - Identity components.
 * @param params.symbol - Market symbol.
 * @param params.nSigFigs - Server aggregation significant figures.
 * @param params.mantissa - Mantissa refinement when nSigFigs is 5.
 * @param params.generation - Never-reused activation counter.
 * @returns Identity string carried through activate + emissions.
 */
export function buildOrderBookAggregatedSubscriptionId({
  symbol,
  nSigFigs,
  mantissa,
  generation,
}: {
  symbol: string;
  nSigFigs?: 2 | 3 | 4 | 5;
  mantissa?: 2 | 5;
  generation: number;
}): string {
  return `${symbol}:${nSigFigs ?? ''}:${mantissa ?? ''}:${generation}`;
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

  // Configuration + reconnect inputs that should start a new subscription
  // instance. The instance identity itself is a never-reused generation so
  // A→B→A and close→reopen cannot accept a late packet from the earlier socket.
  const activationKey =
    isAggregated && activeSymbol
      ? `${activeSymbol}:${nSigFigs ?? ''}:${mantissa ?? ''}:${reconnectNonce}`
      : undefined;

  // Allocated + registered in layout (commit), never during render — so the
  // module-level generation Map is not mutated on discarded/Concurrent renders.
  // Until layout commits a matching id, treat subscriptionId as absent so
  // activate/resetKey cannot run against a previous instance's identity.
  const [aggregatedSubscription, setAggregatedSubscription] = useState<{
    activationKey: string;
    subscriptionId: string;
  } | null>(null);

  const subscriptionId =
    isAggregated &&
    activationKey &&
    aggregatedSubscription?.activationKey === activationKey
      ? aggregatedSubscription.subscriptionId
      : undefined;
  // Reset key clears cached rows the instant the subscription instance changes
  // (grouping, reconnect, or a fresh open after close).
  const resetKey = isAggregated ? subscriptionId : activeSymbol;

  // Allocate identity, register it, and tear down on key change / unmount —
  // all in the commit phase. Module Map mutation must not run during render
  // (Concurrent/StrictMode can discard renders); layout is the commit boundary.
  // Sync setState here is intentional so activate/resetKey see the new id before
  // paint — queueMicrotask is too late for the activate effect.
  useLayoutEffect(() => {
    if (!isAggregated || !streamManager) {
      return undefined;
    }

    if (!activationKey || !activeSymbol) {
      streamManager.setActiveOrderBookAggregatedSubscriptionId(null);
      return () => {
        streamManager.setActiveOrderBookAggregatedSubscriptionId(null);
        streamManager.orderBookAggregated.clearCache();
        streamManager.orderBookAggregatedStatus.clearCache();
      };
    }

    const nextSubscriptionId = getOrCreateAggregatedSubscriptionId({
      activationKey,
      symbol: activeSymbol,
      nSigFigs,
      mantissa,
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- commit-phase allocation; must land before activate effect
    setAggregatedSubscription((prev) =>
      prev?.activationKey === activationKey &&
      prev.subscriptionId === nextSubscriptionId
        ? prev
        : { activationKey, subscriptionId: nextSubscriptionId },
    );

    streamManager.setActiveOrderBookAggregatedSubscriptionId(
      nextSubscriptionId,
    );

    return () => {
      // Null the identity and drop cached rows/status in the same commit so a
      // late packet cannot repopulate the cache between clear and deregister.
      subscriptionIdsByActivationKey.delete(activationKey);
      streamManager.setActiveOrderBookAggregatedSubscriptionId(null);
      streamManager.orderBookAggregated.clearCache();
      streamManager.orderBookAggregatedStatus.clearCache();
    };
  }, [
    isAggregated,
    streamManager,
    activationKey,
    activeSymbol,
    nSigFigs,
    mantissa,
  ]);

  const { data: orderBook, isInitialLoading } = usePerpsChannel(
    isAggregated ? getOrderBookAggregatedChannel : getOrderBookChannel,
    null,
    resetKey,
  );

  const { data: connectionStatus } = usePerpsChannel<OrderBookConnectionStatus>(
    getOrderBookAggregatedStatusChannel,
    'connecting',
    // Raw-channel consumers must not reset the shared aggregated status cache
    // when their symbol changes — only aggregated instances own that channel.
    isAggregated ? resetKey : undefined,
  );

  useEffect(() => {
    if (!manageStream || !enabled || !symbol) {
      return undefined;
    }
    // Wait for the layout pass to allocate a matching aggregated identity so we
    // never activate with a stale subscriptionId from the prior activationKey.
    if (isAggregated && !subscriptionId) {
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
    // Raw channel has no subscriptionId; reconnect must still force re-activate.
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
