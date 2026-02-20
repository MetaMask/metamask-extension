/**
 * PerpsStreamManager - Module-level singleton for Perps data caching
 *
 * This manager provides:
 * - Cached channels for positions, orders, account, and markets
 * - BehaviorSubject-like subscription (immediate callback with cached data)
 * - Prewarm functionality to keep cache fresh
 * - Account-aware initialization (reinitializes on account switch)
 * - Optimistic TP/SL overrides (preserves user-set values until WebSocket catches up)
 *
 * Architecture:
 * - Single instance shared across all Perps views (tab, home, detail, etc.)
 * - Cache persists across navigation within Perps
 * - Cache clears on account/network change
 *
 * Usage:
 * ```typescript
 * const streamManager = getPerpsStreamManager();
 * await streamManager.init(selectedAddress);
 *
 * // Subscribe with immediate cached data
 * const unsubscribe = streamManager.positions.subscribe((positions) => {
 *   setPositions(positions);
 * });
 * ```
 */

import type {
  Position,
  Order,
  AccountState,
  PerpsMarketData,
} from '@metamask/perps-controller';
import { PerpsDataChannel } from './PerpsDataChannel';
import { CandleStreamChannel } from './CandleStreamChannel';
import {
  getPerpsController,
  getPerpsControllerCurrentAddress,
  isPerpsControllerInitialized,
  isPerpsControllerInitializationCancelledError,
} from './getPerpsController';

// Empty array constants for stable references
const EMPTY_POSITIONS: Position[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_MARKETS: PerpsMarketData[] = [];

/**
 * Placeholder noop function for channel initialization.
 * Actual connect functions are set when init() is called.
 */
// eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
const placeholderConnectFn = () => () => {};

/**
 * Optimistic TP/SL override for a position.
 * Used to preserve user-set values until WebSocket catches up.
 */
type OptimisticTPSLOverride = {
  takeProfitPrice?: string;
  stopLossPrice?: string;
  expiresAt: number;
};

// Grace period for optimistic overrides (30 seconds)
// HyperLiquid's WebSocket can take >10s to reflect new TP/SL trigger orders
const OPTIMISTIC_OVERRIDE_TTL_MS = 30000;

// Block period: ignore WebSocket pushes for this long after optimistic update
// Prevents immediate overwrite from stale WebSocket data
const WEBSOCKET_BLOCK_MS = 3000;

class PerpsStreamManager {
  // Data channels
  positions: PerpsDataChannel<Position[]>;

  orders: PerpsDataChannel<Order[]>;

  account: PerpsDataChannel<AccountState | null>;

  markets: PerpsDataChannel<PerpsMarketData[]>;

  // Candle stream channel (multiplexed by symbol+interval)
  candles: CandleStreamChannel;

  // Internal state
  private prewarmCleanups: (() => void)[] = [];

  // Optimistic overrides for TP/SL - preserves user-set values until WebSocket catches up
  private optimisticTPSLOverrides: Map<string, OptimisticTPSLOverride> =
    new Map();

  // When we last set an optimistic update - used to block WebSocket overwrites
  private lastOptimisticUpdateTime = 0;

  constructor() {
    // Initialize channels with placeholder connect functions
    // Real connect functions are set when init() is called
    this.positions = new PerpsDataChannel<Position[]>({
      connectFn: placeholderConnectFn,
      initialValue: EMPTY_POSITIONS,
      name: 'positions',
    });

    this.orders = new PerpsDataChannel<Order[]>({
      connectFn: placeholderConnectFn,
      initialValue: EMPTY_ORDERS,
      name: 'orders',
    });

    this.account = new PerpsDataChannel<AccountState | null>({
      connectFn: placeholderConnectFn,
      initialValue: null,
      name: 'account',
    });

    this.markets = new PerpsDataChannel<PerpsMarketData[]>({
      connectFn: placeholderConnectFn,
      initialValue: EMPTY_MARKETS,
      name: 'markets',
    });

    this.candles = new CandleStreamChannel();
  }

  /**
   * Set optimistic TP/SL override for a position.
   * This preserves user-set values when WebSocket sends stale data.
   *
   * @param symbol - Position symbol
   * @param takeProfitPrice - Take profit price (or undefined to clear)
   * @param stopLossPrice - Stop loss price (or undefined to clear)
   */
  setOptimisticTPSL(
    symbol: string,
    takeProfitPrice?: string,
    stopLossPrice?: string,
  ): void {
    this.lastOptimisticUpdateTime = Date.now();
    this.optimisticTPSLOverrides.set(symbol, {
      takeProfitPrice,
      stopLossPrice,
      expiresAt: Date.now() + OPTIMISTIC_OVERRIDE_TTL_MS,
    });
  }

  /**
   * Clear optimistic override for a position.
   *
   * @param symbol - Position symbol
   */
  clearOptimisticTPSL(symbol: string): void {
    this.optimisticTPSLOverrides.delete(symbol);
  }

  /**
   * Push positions to the channel with optimistic overrides applied.
   * Use this instead of positions.pushData() when pushing data from REST
   * (delayed refetch, visibility refetch) so we don't overwrite with stale
   * data while the override is active.
   *
   * IMPORTANT: We do NOT clear overrides when merging REST data - only clear
   * when WebSocket confirms. Otherwise REST could return correct data, we'd
   * clear the override, then the next WebSocket push (still stale) would
   * overwrite with old values.
   *
   * @param positions - Raw positions from REST
   */
  pushPositionsWithOverrides(positions: Position[]): void {
    const withOverrides = this.applyOptimisticOverrides(positions, false);
    this.positions.pushData(withOverrides);
  }

  /**
   * Apply optimistic overrides to positions array.
   * Expired overrides are automatically cleaned up.
   *
   * @param positions - Raw positions from stream
   * @param clearOnMatch - If true, clear override when incoming matches expected. Only true for WebSocket data.
   * @returns Positions with active optimistic overrides merged in
   */
  private applyOptimisticOverrides(
    positions: Position[],
    clearOnMatch = true,
  ): Position[] {
    const now = Date.now();

    // Clean up expired overrides
    for (const [symbol, override] of this.optimisticTPSLOverrides.entries()) {
      if (override.expiresAt < now) {
        this.optimisticTPSLOverrides.delete(symbol);
      }
    }

    // If no active overrides, return as-is
    if (this.optimisticTPSLOverrides.size === 0) {
      return positions;
    }

    return positions.map((position) => {
      const override = this.optimisticTPSLOverrides.get(position.symbol);
      if (override) {
        if (clearOnMatch) {
          const incomingTp = position.takeProfitPrice ?? '';
          const incomingSl = position.stopLossPrice ?? '';
          const expectedTp = override.takeProfitPrice ?? '';
          const expectedSl = override.stopLossPrice ?? '';
          const tpMatches =
            incomingTp === expectedTp ||
            (incomingTp &&
              expectedTp &&
              parseFloat(incomingTp) === parseFloat(expectedTp));
          const slMatches =
            incomingSl === expectedSl ||
            (incomingSl &&
              expectedSl &&
              parseFloat(incomingSl) === parseFloat(expectedSl));

          if (tpMatches && slMatches) {
            this.optimisticTPSLOverrides.delete(position.symbol);
            return position;
          }
        }

        return {
          ...position,
          takeProfitPrice: override.takeProfitPrice,
          stopLossPrice: override.stopLossPrice,
        };
      }
      return position;
    });
  }

  /**
   * Initialize the stream manager for a specific address.
   * If address changes, reinitializes with cleared cache.
   *
   * @param address - The selected account address
   */
  async init(address: string): Promise<void> {
    if (!address) {
      console.warn('[PerpsStreamManager] No address provided');
      return;
    }

    const currentControllerAddress = getPerpsControllerCurrentAddress();

    // If same address and already initialized, nothing to do
    if (
      currentControllerAddress === address &&
      isPerpsControllerInitialized(address)
    ) {
      return Promise.resolve();
    }

    // Address changed - clear caches and reinitialize
    if (
      currentControllerAddress !== null &&
      currentControllerAddress !== address
    ) {
      this.clearAllCaches();
      this.cleanupPrewarm();
    }

    // Wire up the channels to the controller
    // getPerpsController handles all initialization and address-change logic
    await this.doInit(address);
  }

  /**
   * Internal initialization logic
   *
   * @param address
   */
  private async doInit(address: string): Promise<void> {
    try {
      // Get or create controller (getPerpsController owns all lifecycle logic)
      const controller = await getPerpsController(address);

      // Wire up channel connect functions to controller subscriptions
      // Wrap positions callback to apply optimistic TP/SL overrides
      this.positions.setConnectFn((callback) =>
        controller.subscribeToPositions({
          callback: (positions) => {
            const now = Date.now();
            const inBlockPeriod =
              now - this.lastOptimisticUpdateTime < WEBSOCKET_BLOCK_MS;

            // During block period with active overrides, ignore WebSocket pushes
            // to prevent stale data from overwriting our optimistic update
            if (inBlockPeriod && this.optimisticTPSLOverrides.size > 0) {
              return;
            }

            const withOverrides = this.applyOptimisticOverrides(positions);
            callback(withOverrides);
          },
        }),
      );

      this.orders.setConnectFn((callback) =>
        controller.subscribeToOrders({ callback }),
      );

      this.account.setConnectFn((callback) =>
        controller.subscribeToAccount({ callback }),
      );

      // Markets use HTTP fetch, not WebSocket subscription
      // We wrap it in a polling-like pattern for consistency
      this.markets.setConnectFn((callback) => {
        let isCancelled = false;

        const fetchMarkets = async () => {
          if (isCancelled) {
            return;
          }
          try {
            const provider = controller.getActiveProviderOrNull();
            if (provider) {
              const data = await provider.getMarketDataWithPrices();
              if (!isCancelled) {
                callback(data);
              }
            }
          } catch (error) {
            console.error(
              '[PerpsStreamManager] Failed to fetch markets:',
              error,
            );
          }
        };

        // Fetch immediately
        fetchMarkets();

        // Return cleanup function
        return () => {
          isCancelled = true;
        };
      });

      // Wire candle stream channel to controller
      this.candles.setController(controller);
    } catch (error) {
      if (isPerpsControllerInitializationCancelledError(error)) {
        throw error;
      }

      console.error('[PerpsStreamManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if initialized for a specific address
   *
   * @param address
   */
  isInitialized(address?: string): boolean {
    return isPerpsControllerInitialized(address);
  }

  /**
   * Get the current address the manager is initialized for
   */
  getCurrentAddress(): string | null {
    return getPerpsControllerCurrentAddress();
  }

  /**
   * Prewarm all channels - start subscriptions to keep cache fresh.
   * Call this when entering Perps (tab or any route).
   */
  prewarm(): void {
    if (this.prewarmCleanups.length > 0) {
      // Already prewarming
      return;
    }

    this.prewarmCleanups = [
      this.positions.prewarm(),
      this.orders.prewarm(),
      this.account.prewarm(),
      this.markets.prewarm(),
    ];
  }

  /**
   * Stop prewarming - cleanup long-lived subscriptions.
   * Call this when leaving Perps entirely.
   * Note: Cache is NOT cleared, only subscriptions are cleaned up.
   */
  cleanupPrewarm(): void {
    if (this.prewarmCleanups.length === 0) {
      return;
    }

    this.prewarmCleanups.forEach((cleanup) => cleanup());
    this.prewarmCleanups = [];
  }

  /**
   * Check if currently prewarming
   */
  isPrewarming(): boolean {
    return this.prewarmCleanups.length > 0;
  }

  /**
   * Clear all channel caches.
   * Called on account/network change.
   */
  clearAllCaches(): void {
    this.positions.clearCache();
    this.orders.clearCache();
    this.account.clearCache();
    this.markets.clearCache();
    this.candles.clearAll();
  }

  /**
   * Full reset - clear caches and reset channel state.
   * Called on account switch or when leaving Perps entirely.
   * Note: Does not reset the controller itself - that's managed by getPerpsController.
   */
  reset(): void {
    this.cleanupPrewarm();
    this.positions.reset();
    this.orders.reset();
    this.account.reset();
    this.markets.reset();
    this.candles.clearAll();
    this.optimisticTPSLOverrides.clear();
  }
}

// Module-level singleton instance
const streamManager = new PerpsStreamManager();

/**
 * Get the PerpsStreamManager singleton instance.
 * This is shared across all Perps views.
 */
export function getPerpsStreamManager(): PerpsStreamManager {
  return streamManager;
}

/**
 * Reset the stream manager (for testing or account switch).
 */
export function resetPerpsStreamManager(): void {
  streamManager.reset();
}

export { PerpsStreamManager };
