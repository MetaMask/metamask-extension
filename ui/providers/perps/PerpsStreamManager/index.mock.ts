/**
 * Mock PerpsStreamManager - Module-level singleton for mock Perps data
 *
 * This mock provides the same API as the real PerpsStreamManager but returns
 * static mock data from ui/components/app/perps/mocks.ts.
 *
 * Use this during development to work on UI without the actual perps-controller dependency.
 *
 * Architecture:
 * - Single instance shared across all Perps views
 * - Uses mock data from mocks.ts
 * - Same API as real PerpsStreamManager for drop-in replacement
 */

import {
  mockPositions,
  mockOrders,
  mockAccountState,
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../../components/app/perps/mocks';
import type {
  Position,
  Order,
  AccountState,
  PerpsMarketData,
  CandleData,
} from '@metamask/perps-controller';

/**
 * Simple channel implementation for mock data
 * Mimics the behavior of PerpsDataChannel but with static data
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
class MockDataChannel<T> {
  private data: T;

  private subscribers: Set<(data: T) => void> = new Set();

  private name: string;

  constructor(initialData: T, name: string) {
    this.data = initialData;
    this.name = name;
  }

  /**
   * Subscribe to data updates
   * Immediately calls callback with cached data (BehaviorSubject pattern)
   *
   * @param callback
   */
  subscribe(callback: (data: T) => void): () => void {
    // Immediately invoke with current data
    callback(this.data);

    // Add to subscribers for future updates
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Push new data to all subscribers
   *
   * @param newData
   */
  pushData(newData: T): void {
    this.data = newData;
    this.subscribers.forEach((callback) => callback(newData));
  }

  /**
   * Get cached data synchronously
   */
  getCachedData(): T {
    return this.data;
  }

  /**
   * Check if we have cached data
   */
  hasCachedData(): boolean {
    return true; // Mock always has data
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    console.log(`[MockDataChannel:${this.name}] Cache cleared (no-op in mock)`);
  }

  /**
   * Reset the channel
   */
  reset(): void {
    this.subscribers.clear();
  }

  /**
   * Prewarm - start subscription to keep cache fresh
   * In mock, this is a no-op but returns cleanup function for API compatibility
   */
  prewarm(): () => void {
    console.log(`[MockDataChannel:${this.name}] Prewarm (no-op in mock)`);
    return () => {
      console.log(
        `[MockDataChannel:${this.name}] Prewarm cleanup (no-op in mock)`,
      );
    };
  }

  /**
   * Set connect function (no-op in mock, kept for API compatibility)
   *
   * @param _connectFn
   */
  setConnectFn(_connectFn: unknown): void {
    // No-op in mock
  }
}

/**
 * Mock candle stream channel (placeholder for API compatibility)
 */
class MockCandleStreamChannel {
  setController(_controller: unknown): void {
    console.log('[MockCandleStreamChannel] Controller set (no-op in mock)');
  }

  clearAll(): void {
    console.log('[MockCandleStreamChannel] Cleared all (no-op in mock)');
  }

  /**
   * Subscribe to candle updates.
   * In mock, no live data is pushed; returns an unsubscribe function.
   *
   * @param _params
   * @param _params.symbol
   * @param _params.interval
   * @param _params.duration
   * @param _params.throttleMs
   * @param _params.callback
   * @param _params.onError
   */
  subscribe(_params: {
    symbol: string;
    interval: string;
    duration?: string;
    throttleMs?: number;
    callback: (data: CandleData) => void;
    onError?: (err: Error) => void;
  }): () => void {
    console.log(
      '[MockCandleStreamChannel] Subscribed to candles (no-op in mock)',
    );
    return () => {
      console.log('[MockCandleStreamChannel] Unsubscribed from candles');
    };
  }

  /**
   * Fetch historical candles.
   * In mock, resolves with no data (hook handles empty state).
   *
   * @param _symbol
   * @param _interval
   * @param _duration
   */
  fetchHistoricalCandles(
    _symbol: string,
    _interval: string,
    _duration: string,
  ): Promise<void> {
    console.log(
      '[MockCandleStreamChannel] fetchHistoricalCandles (no-op in mock)',
    );
    return Promise.resolve();
  }
}

/**
 * Mock PerpsStreamManager
 */
class MockPerpsStreamManager {
  // Data channels with mock data
  positions: MockDataChannel<Position[]>;

  orders: MockDataChannel<Order[]>;

  account: MockDataChannel<AccountState | null>;

  markets: MockDataChannel<PerpsMarketData[]>;

  candles: MockCandleStreamChannel;

  // Internal state
  private prewarmCleanups: (() => void)[] = [];

  private currentAddress: string | null = null;

  constructor() {
    // Initialize channels with mock data
    this.positions = new MockDataChannel<Position[]>(
      mockPositions,
      'positions',
    );
    this.orders = new MockDataChannel<Order[]>(mockOrders, 'orders');
    this.account = new MockDataChannel<AccountState | null>(
      mockAccountState,
      'account',
    );
    this.markets = new MockDataChannel<PerpsMarketData[]>(
      [...mockCryptoMarkets, ...mockHip3Markets],
      'markets',
    );
    this.candles = new MockCandleStreamChannel();
  }

  /**
   * Initialize the stream manager for a specific address.
   * In mock, we just track the address.
   *
   * @param address - The selected account address
   */
  async init(address: string): Promise<void> {
    if (!address) {
      console.warn('[MockPerpsStreamManager] No address provided');
      return;
    }

    if (this.currentAddress === address) {
      console.log(
        `[MockPerpsStreamManager] Already initialized for ${address}`,
      );
      return Promise.resolve();
    }

    // Address changed - simulate clearing caches
    if (this.currentAddress !== null && this.currentAddress !== address) {
      console.log('[MockPerpsStreamManager] Address changed, clearing caches');
      this.clearAllCaches();
      this.cleanupPrewarm();
    }

    this.currentAddress = address;
    console.log(`[MockPerpsStreamManager] Initialized for ${address}`);
  }

  /**
   * Check if initialized for a specific address
   *
   * @param address
   */
  isInitialized(address?: string): boolean {
    if (address) {
      return this.currentAddress === address;
    }
    return this.currentAddress !== null;
  }

  /**
   * Get the current address the manager is initialized for
   */
  getCurrentAddress(): string | null {
    return this.currentAddress;
  }

  /**
   * Prewarm all channels - start subscriptions to keep cache fresh.
   * In mock, this is mostly a no-op but maintains API compatibility.
   */
  prewarm(): void {
    if (this.prewarmCleanups.length > 0) {
      console.log('[MockPerpsStreamManager] Already prewarming');
      return;
    }

    console.log('[MockPerpsStreamManager] Starting prewarm');
    this.prewarmCleanups = [
      this.positions.prewarm(),
      this.orders.prewarm(),
      this.account.prewarm(),
      this.markets.prewarm(),
    ];
  }

  /**
   * Stop prewarming - cleanup long-lived subscriptions.
   * In mock, this is a no-op but maintains API compatibility.
   */
  cleanupPrewarm(): void {
    if (this.prewarmCleanups.length === 0) {
      return;
    }

    console.log('[MockPerpsStreamManager] Cleaning up prewarm');
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
   * In mock, this doesn't actually clear data, just logs.
   */
  clearAllCaches(): void {
    console.log('[MockPerpsStreamManager] Clearing all caches');
    this.positions.clearCache();
    this.orders.clearCache();
    this.account.clearCache();
    this.markets.clearCache();
    this.candles.clearAll();
  }

  /**
   * Full reset - clear caches and reset channel state.
   */
  reset(): void {
    console.log('[MockPerpsStreamManager] Resetting');
    this.cleanupPrewarm();
    this.positions.reset();
    this.orders.reset();
    this.account.reset();
    this.markets.reset();
    this.candles.clearAll();
    this.currentAddress = null;
  }

  /**
   * Set optimistic TP/SL override for a position.
   * In mock, this is a no-op but kept for API compatibility.
   *
   * @param _symbol
   * @param _takeProfitPrice
   * @param _stopLossPrice
   */
  setOptimisticTPSL(
    _symbol: string,
    _takeProfitPrice?: string,
    _stopLossPrice?: string,
  ): void {
    console.log('[MockPerpsStreamManager] setOptimisticTPSL (no-op in mock)');
  }

  /**
   * Clear optimistic override for a position.
   * In mock, this is a no-op but kept for API compatibility.
   *
   * @param _symbol
   */
  clearOptimisticTPSL(_symbol: string): void {
    console.log('[MockPerpsStreamManager] clearOptimisticTPSL (no-op in mock)');
  }

  /**
   * Push positions with overrides applied.
   * In mock, this just pushes the data directly.
   *
   * @param positions
   */
  pushPositionsWithOverrides(positions: Position[]): void {
    this.positions.pushData(positions);
  }
}

// Module-level singleton instance
const mockStreamManager = new MockPerpsStreamManager();

/**
 * Get the mock PerpsStreamManager singleton instance.
 * This is shared across all Perps views.
 */
export function getPerpsStreamManager(): MockPerpsStreamManager {
  return mockStreamManager;
}

/**
 * Reset the mock stream manager (for testing or account switch).
 */
export function resetPerpsStreamManager(): void {
  mockStreamManager.reset();
}

export { MockPerpsStreamManager as PerpsStreamManager };
export { MockDataChannel as PerpsDataChannel };
