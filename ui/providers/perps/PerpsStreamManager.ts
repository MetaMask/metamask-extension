/**
 * PerpsStreamManager - Module-level singleton for Perps data caching
 *
 * This manager provides:
 * - Cached channels for positions, orders, account, and markets
 * - BehaviorSubject-like subscription (immediate callback with cached data)
 * - Prewarm functionality to keep cache fresh
 * - Account-aware initialization (reinitializes on account switch)
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
 *   // First call is synchronous with cached data (if available)
 *   setPositions(positions);
 * });
 * ```
 */

import type {
  Position,
  Order,
  AccountState,
  PerpsMarketData,
  PerpsController,
} from '@metamask/perps-controller';
import { PerpsDataChannel } from './PerpsDataChannel';
import { getPerpsController } from './getPerpsController';

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

class PerpsStreamManager {
  // Data channels
  positions: PerpsDataChannel<Position[]>;

  orders: PerpsDataChannel<Order[]>;

  account: PerpsDataChannel<AccountState | null>;

  markets: PerpsDataChannel<PerpsMarketData[]>;

  // Internal state
  private controller: PerpsController | null = null;

  private currentAddress: string | null = null;

  private initPromise: Promise<void> | null = null;

  private prewarmCleanups: (() => void)[] = [];

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

    // If same address and already initialized, return existing promise or resolve
    if (this.currentAddress === address) {
      if (this.initPromise) {
        return this.initPromise;
      }
      if (this.controller) {
        return Promise.resolve();
      }
    }

    // Address changed - clear caches and reinitialize
    if (this.currentAddress !== null && this.currentAddress !== address) {
      console.log(
        '[PerpsStreamManager] Address changed, clearing caches:',
        this.currentAddress,
        '->',
        address,
      );
      this.clearAllCaches();
      this.cleanupPrewarm();
    }

    this.currentAddress = address;

    // Create initialization promise
    this.initPromise = this.doInit(address);

    return this.initPromise;
  }

  /**
   * Internal initialization logic
   *
   * @param address
   */
  private async doInit(address: string): Promise<void> {
    try {
      // Get or create controller
      const controller = await getPerpsController(address);
      this.controller = controller;

      // Wire up channel connect functions to controller subscriptions
      this.positions.setConnectFn((callback) =>
        controller.subscribeToPositions({ callback }),
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

      console.log('[PerpsStreamManager] Initialized for address:', address);
    } catch (error) {
      console.error('[PerpsStreamManager] Initialization failed:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Check if initialized for a specific address
   *
   * @param address
   */
  isInitialized(address?: string): boolean {
    if (address) {
      return this.controller !== null && this.currentAddress === address;
    }
    return this.controller !== null;
  }

  /**
   * Get the current address the manager is initialized for
   */
  getCurrentAddress(): string | null {
    return this.currentAddress;
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

    console.log('[PerpsStreamManager] Starting prewarm');

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

    console.log('[PerpsStreamManager] Cleaning up prewarm');

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
  }

  /**
   * Full reset - disconnect, clear caches, reset state.
   * Called on account switch or when leaving Perps entirely.
   */
  reset(): void {
    this.cleanupPrewarm();
    this.positions.reset();
    this.orders.reset();
    this.account.reset();
    this.markets.reset();
    this.controller = null;
    this.currentAddress = null;
    this.initPromise = null;
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
