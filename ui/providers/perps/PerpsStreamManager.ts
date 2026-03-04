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
  PriceUpdate,
  OrderBookData,
  CandleData,
  CandlePeriod,
} from '@metamask/perps-controller';
import {
  getPerpsControllerCurrentAddress,
  isPerpsControllerInitialized,
  markPerpsControllerInitialized,
} from './getPerpsController';
import { CandleStreamChannel } from './CandleStreamChannel';
import { PerpsDataChannel } from './PerpsDataChannel';
import { submitRequestToBackground } from '../../store/background-connection';

// Empty array constants for stable references
const EMPTY_POSITIONS: Position[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_MARKETS: PerpsMarketData[] = [];
const EMPTY_PRICES: PriceUpdate[] = [];

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

  prices: PerpsDataChannel<PriceUpdate[]>;

  orderBook: PerpsDataChannel<OrderBookData | null>;

  // Candle stream channel (multiplexed by symbol+interval)
  candles: CandleStreamChannel;

  // Internal state
  private prewarmCleanups: (() => void)[] = [];

  // Optimistic overrides for TP/SL - preserves user-set values until WebSocket catches up
  private readonly optimisticTPSLOverrides: Map<
    string,
    OptimisticTPSLOverride
  > = new Map();

  // When we last set an optimistic update - used to block WebSocket overwrites
  private lastOptimisticUpdateTime = 0;

  constructor() {
    this.positions = new PerpsDataChannel<Position[]>({
      connectFn: (push) => {
        submitRequestToBackground<Position[]>('perpsGetPositions', [])
          .then((data) => {
            push(data ?? EMPTY_POSITIONS);
          })
          .catch((err) => {
            console.error('[PerpsStreamManager] Failed to fetch positions', err);
            push(EMPTY_POSITIONS);
          });
        // eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
        return () => {};
      },
      initialValue: EMPTY_POSITIONS,
      name: 'positions',
    });

    this.orders = new PerpsDataChannel<Order[]>({
      connectFn: (push) => {
        submitRequestToBackground<Order[]>('perpsGetOpenOrders', [])
          .then((data) => {
            push(data ?? EMPTY_ORDERS);
          })
          .catch((err) => {
            console.error('[PerpsStreamManager] Failed to fetch orders', err);
            push(EMPTY_ORDERS);
          });
        // eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
        return () => {};
      },
      initialValue: EMPTY_ORDERS,
      name: 'orders',
    });

    this.account = new PerpsDataChannel<AccountState | null>({
      connectFn: (push) => {
        submitRequestToBackground<AccountState>('perpsGetAccountState', [])
          .then((data) => {
            console.debug('[perps:account] REST totalBalance=%s availableBalance=%s unrealizedPnl=%s', data?.totalBalance, data?.availableBalance, data?.unrealizedPnl);
            push(data ?? null);
          })
          .catch((err) => {
            console.error('[PerpsStreamManager] Failed to fetch account', err);
            push(null);
          });
        // eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
        return () => {};
      },
      initialValue: null,
      name: 'account',
    });

    this.markets = new PerpsDataChannel<PerpsMarketData[]>({
      connectFn: (push) => {
        submitRequestToBackground<PerpsMarketData[]>(
          'perpsGetMarketDataWithPrices',
          [],
        )
          .then((data) => {
            push(data ?? EMPTY_MARKETS);
          })
          .catch((err) => {
            console.error('[PerpsStreamManager] Failed to fetch markets', err);
          });
        // eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
        return () => {};
      },
      initialValue: EMPTY_MARKETS,
      name: 'markets',
    });

    this.prices = new PerpsDataChannel<PriceUpdate[]>({
      connectFn: placeholderConnectFn,
      initialValue: EMPTY_PRICES,
      name: 'prices',
    });

    this.orderBook = new PerpsDataChannel<OrderBookData | null>({
      connectFn: placeholderConnectFn,
      initialValue: null,
      name: 'orderBook',
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
              Number.parseFloat(incomingTp) === Number.parseFloat(expectedTp));
          const slMatches =
            incomingSl === expectedSl ||
            (incomingSl &&
              expectedSl &&
              Number.parseFloat(incomingSl) === Number.parseFloat(expectedSl));

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
   * In Phase 2, all stream data arrives via background notifications —
   * no UI controller is created. This simply records the address and
   * clears caches when the address changes.
   *
   * @param address - The selected account address
   */
  init(address: string): void {
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
      return;
    }

    // Address changed - clear caches and reinitialize
    if (
      currentControllerAddress !== null &&
      currentControllerAddress !== address
    ) {
      this.clearAllCaches();
      this.cleanupPrewarm();
      // Decrement old subscriber count
      submitRequestToBackground('perpsSubscriberChange', [-1]).catch(() => {
        // Ignore
      });
    }

    markPerpsControllerInitialized(address);

    // Tell the background this connection is active and wants stream updates
    submitRequestToBackground('perpsSubscriberChange', [1]).catch(() => {
      // Background not ready yet — updates will arrive once controller is initialized
    });
  }

  /**
   * Handle a background stream notification for any channel.
   * Called from ui/index.js when a perpsStreamUpdate notification arrives.
   *
   * @param payload - The notification payload
   * @param payload.channel - Which channel the data is for
   * @param payload.data - The raw data payload
   * @param payload.symbol - For candles: the asset symbol
   * @param payload.interval - For candles: the candle period
   */
  handleBackgroundUpdate(payload: {
    channel: string;
    data: unknown;
    symbol?: string;
    interval?: CandlePeriod;
  }): void {
    const { channel, data } = payload;
    switch (channel) {
      case 'positions': {
        const positions = data as Position[];
        const now = Date.now();
        const inBlockPeriod =
          now - this.lastOptimisticUpdateTime < WEBSOCKET_BLOCK_MS;
        if (inBlockPeriod && this.optimisticTPSLOverrides.size > 0) {
          return;
        }
        const withOverrides = this.applyOptimisticOverrides(positions);
        this.positions.pushData(withOverrides);
        break;
      }
      case 'orders':
        this.orders.pushData(data as Order[]);
        break;
      case 'account': {
        const acc = data as AccountState | null;
        console.debug('[perps:account] stream totalBalance=%s availableBalance=%s unrealizedPnl=%s', acc?.totalBalance, acc?.availableBalance, acc?.unrealizedPnl);
        this.account.pushData(acc);
        break;
      }
      case 'prices':
        this.prices.pushData(data as PriceUpdate[]);
        break;
      case 'orderBook':
        this.orderBook.pushData(data as OrderBookData);
        break;
      case 'candles': {
        const { symbol, interval } = payload;
        if (symbol && interval) {
          this.candles.pushFromBackground({
            symbol,
            interval,
            data: data as CandleData,
          });
        }
        break;
      }
      default:
        console.warn('[PerpsStreamManager] Unknown channel:', channel);
    }
  }

  /**
   * Check if the stream manager has been initialized for a specific address.
   * In Phase 2, initialized means markPerpsControllerInitialized has been called.
   *
   * @param address - Optional address to check
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
      this.prices.prewarm(),
      this.orderBook.prewarm(),
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
    this.prices.clearCache();
    this.orderBook.clearCache();
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
    this.prices.reset();
    this.orderBook.reset();
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
