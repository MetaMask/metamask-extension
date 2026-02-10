/**
 * CandleStreamChannel - Multiplexer/cache for candlestick data streams
 *
 * Sits between the PerpsController and React hooks. Provides:
 * - Subscription deduplication per symbol+interval key
 * - Per-key caching with immediate delivery to new subscribers
 * - Per-subscriber throttling (first update always immediate)
 * - Load-more via fetchHistoricalCandles (merge older data into cache)
 * - Auto-disconnect when last subscriber for a key unsubscribes
 * - Reconnect to re-establish all active subscriptions after WS reconnect
 *
 * Cache key format: "${symbol}-${interval}" (e.g., "BTC-1h")
 */

import type {
  CandleData,
  PerpsController,
  SubscribeCandlesParams,
} from '@metamask/perps-controller';
import {
  type CandlePeriod,
  type TimeDuration,
  calculateCandleCount,
} from '../../components/app/perps/constants/chartConfig';

/** Maximum total candles to keep in memory per key */
const MAX_CANDLES_IN_MEMORY = 1000;

/** Minimum candles to fetch on load-more */
const LOAD_MORE_MIN = 50;

/** Maximum candles to fetch on load-more */
const LOAD_MORE_MAX = 500;

/** Per-subscriber state */
type SubscriberEntry = {
  callback: (data: CandleData) => void;
  throttleMs: number;
  lastDeliveryTime: number;
  pendingTimer: ReturnType<typeof setTimeout> | null;
};

/** Per cache-key state */
type ChannelEntry = {
  cache: CandleData | null;
  subscribers: Map<string, SubscriberEntry>;
  unsubscribeFromSource: (() => void) | null;
  isConnected: boolean;
  /** The duration used for the initial subscription */
  duration: TimeDuration | undefined;
};

/**
 * Build a cache key from symbol and interval.
 *
 * @param symbol - Asset symbol (e.g., "BTC")
 * @param interval - Candle period (e.g., "1h")
 * @returns Cache key string
 */
function cacheKey(symbol: string, interval: CandlePeriod): string {
  return `${symbol}-${interval}`;
}

/**
 * Parse a cache key back into symbol and interval.
 *
 * @param key - Cache key (e.g., "BTC-1h")
 * @returns Object with symbol and interval
 */
function parseCacheKey(key: string): {
  symbol: string;
  interval: CandlePeriod;
} {
  const lastDash = key.lastIndexOf('-');
  return {
    symbol: key.slice(0, lastDash),
    interval: key.slice(lastDash + 1) as CandlePeriod,
  };
}

export class CandleStreamChannel {
  private channels = new Map<string, ChannelEntry>();

  private controller: PerpsController | null = null;

  /**
   * Set the controller reference. Called from PerpsStreamManager.init().
   *
   * @param controller - PerpsController instance
   */
  setController(controller: PerpsController): void {
    this.controller = controller;
  }

  /**
   * Subscribe to candle data for a symbol+interval pair.
   *
   * If cached data exists for the key, the callback fires immediately.
   * If this is the first subscriber for the key, opens a controller subscription.
   *
   * @param params - Subscription parameters
   * @param params.symbol - Asset symbol (e.g., "BTC")
   * @param params.interval - Candle period (e.g., CandlePeriod.OneHour)
   * @param params.duration - Optional time duration for initial fetch sizing
   * @param params.callback - Called with CandleData on each update
   * @param params.throttleMs - Throttle interval in ms (default 0 = no throttle)
   * @param params.onError - Optional error callback
   * @returns Unsubscribe function
   */
  subscribe(params: {
    symbol: string;
    interval: CandlePeriod;
    duration?: TimeDuration;
    callback: (data: CandleData) => void;
    throttleMs?: number;
    onError?: (error: Error) => void;
  }): () => void {
    const {
      symbol,
      interval,
      duration,
      callback,
      throttleMs = 0,
      onError,
    } = params;
    const key = cacheKey(symbol, interval);
    const subscriberId = crypto.randomUUID();

    // Get or create channel entry
    let entry = this.channels.get(key);
    if (!entry) {
      entry = {
        cache: null,
        subscribers: new Map(),
        unsubscribeFromSource: null,
        isConnected: false,
        duration,
      };
      this.channels.set(key, entry);
    }

    // Register subscriber
    const subscriber: SubscriberEntry = {
      callback,
      throttleMs,
      lastDeliveryTime: 0,
      pendingTimer: null,
    };
    entry.subscribers.set(subscriberId, subscriber);

    // Deliver cached data immediately (BehaviorSubject pattern)
    if (entry.cache) {
      callback(entry.cache);
      subscriber.lastDeliveryTime = Date.now();
    }

    // Connect to controller if first subscriber and not already connected
    if (!entry.isConnected && this.controller) {
      this.connect(key, entry, onError);
    }

    // Return unsubscribe function
    return () => {
      const currentEntry = this.channels.get(key);
      if (!currentEntry) {
        return;
      }

      // Clear any pending throttle timer
      const sub = currentEntry.subscribers.get(subscriberId);
      if (sub?.pendingTimer) {
        clearTimeout(sub.pendingTimer);
      }

      currentEntry.subscribers.delete(subscriberId);

      // Disconnect if no more subscribers (keep cache)
      if (currentEntry.subscribers.size === 0) {
        this.disconnect(key, currentEntry);
      }
    };
  }

  /**
   * Fetch older historical candles and merge them into the cache.
   *
   * Uses endTime = oldest cached candle - 1 to paginate backwards.
   * Deduplicates by timestamp, sorts ascending, caps at MAX_CANDLES_IN_MEMORY.
   * Notifies all subscribers for the key with the merged data.
   *
   * @param symbol - Asset symbol
   * @param interval - Candle period
   * @param duration - Time duration for calculating how many candles to fetch
   * @returns Promise that resolves when fetch + merge is complete
   */
  async fetchHistoricalCandles(
    symbol: string,
    interval: CandlePeriod,
    duration: TimeDuration,
  ): Promise<void> {
    if (!this.controller) {
      return;
    }

    const key = cacheKey(symbol, interval);
    const entry = this.channels.get(key);

    // Need cached data to know where to paginate from
    if (!entry?.cache?.candles?.length) {
      return;
    }

    // Get the oldest candle's time
    const oldestTime = entry.cache.candles[0].time;
    const endTime = oldestTime - 1;

    // Calculate fetch limit
    const rawLimit = calculateCandleCount(duration, interval);
    const limit = Math.min(Math.max(rawLimit, LOAD_MORE_MIN), LOAD_MORE_MAX);

    try {
      const olderData = await this.controller.fetchHistoricalCandles(
        symbol,
        interval,
        limit,
        endTime,
      );

      if (!olderData?.candles?.length) {
        return;
      }

      // Merge: prepend older candles + existing candles
      const existingCandles = entry.cache.candles;
      const allCandles = [...olderData.candles, ...existingCandles];

      // Deduplicate by timestamp (keep first occurrence)
      const seen = new Set<number>();
      const deduped = allCandles.filter((candle) => {
        if (seen.has(candle.time)) {
          return false;
        }
        seen.add(candle.time);
        return true;
      });

      // Sort ascending by time
      deduped.sort((a, b) => a.time - b.time);

      // Cap at MAX_CANDLES_IN_MEMORY (keep newest)
      const capped =
        deduped.length > MAX_CANDLES_IN_MEMORY
          ? deduped.slice(deduped.length - MAX_CANDLES_IN_MEMORY)
          : deduped;

      // Update cache with new merged data (immutable update)
      const mergedData: CandleData = {
        ...entry.cache,
        candles: capped,
      };
      entry.cache = mergedData;

      // Notify all subscribers
      this.notifySubscribers(entry, mergedData);
    } catch (error) {
      console.error(
        `[CandleStreamChannel] fetchHistoricalCandles failed for ${key}:`,
        error,
      );
    }
  }

  /**
   * Re-establish all active subscriptions.
   * Called after WebSocket reconnect to restore live data.
   */
  reconnect(): void {
    if (!this.controller) {
      return;
    }

    for (const [key, entry] of this.channels.entries()) {
      // Only reconnect channels that have active subscribers
      if (entry.subscribers.size > 0) {
        // Disconnect existing source
        if (entry.unsubscribeFromSource) {
          entry.unsubscribeFromSource();
          entry.unsubscribeFromSource = null;
        }
        entry.isConnected = false;

        // Reconnect
        this.connect(key, entry);
      }
    }
  }

  /**
   * Clear all caches and disconnect all channels.
   * Called on account/network change.
   */
  clearAll(): void {
    for (const [key, entry] of this.channels.entries()) {
      // Clear pending throttle timers
      for (const sub of entry.subscribers.values()) {
        if (sub.pendingTimer) {
          clearTimeout(sub.pendingTimer);
          sub.pendingTimer = null;
        }
      }

      this.disconnect(key, entry);
    }
    this.channels.clear();
    this.controller = null;
  }

  /**
   * Connect a channel entry to the controller's candle subscription.
   *
   * @param key - Cache key
   * @param entry - Channel entry
   * @param onError - Optional error callback
   */
  private connect(
    key: string,
    entry: ChannelEntry,
    onError?: (error: Error) => void,
  ): void {
    if (!this.controller || entry.isConnected) {
      return;
    }

    const { symbol, interval } = parseCacheKey(key);

    entry.isConnected = true;

    const subscribeParams: SubscribeCandlesParams = {
      symbol,
      interval,
      duration: entry.duration,
      callback: (data: CandleData) => {
        // Update cache (immutable — new object triggers React re-renders)
        entry.cache = data;

        // Notify all subscribers (with per-subscriber throttling)
        this.notifySubscribers(entry, data);
      },
      onError,
    };

    entry.unsubscribeFromSource =
      this.controller.subscribeToCandles(subscribeParams);
  }

  /**
   * Disconnect a channel entry from the controller.
   * Cache is preserved for re-navigation.
   *
   * @param _key - Cache key (unused, for future logging)
   * @param entry - Channel entry
   */
  private disconnect(_key: string, entry: ChannelEntry): void {
    if (entry.unsubscribeFromSource) {
      entry.unsubscribeFromSource();
      entry.unsubscribeFromSource = null;
    }
    entry.isConnected = false;
  }

  /**
   * Notify all subscribers with throttling.
   * First delivery is always immediate; subsequent deliveries are throttled.
   *
   * @param entry - Channel entry
   * @param data - CandleData to deliver
   */
  private notifySubscribers(entry: ChannelEntry, data: CandleData): void {
    const now = Date.now();

    for (const subscriber of entry.subscribers.values()) {
      const elapsed = now - subscriber.lastDeliveryTime;

      if (subscriber.throttleMs <= 0 || elapsed >= subscriber.throttleMs) {
        // No throttle, or enough time has passed — deliver immediately
        subscriber.callback(data);
        subscriber.lastDeliveryTime = now;

        // Clear any pending timer since we just delivered
        if (subscriber.pendingTimer) {
          clearTimeout(subscriber.pendingTimer);
          subscriber.pendingTimer = null;
        }
      } else if (!subscriber.pendingTimer) {
        // Schedule delivery for when the throttle window expires
        const remaining = subscriber.throttleMs - elapsed;
        subscriber.pendingTimer = setTimeout(() => {
          subscriber.pendingTimer = null;
          // Deliver the latest cached data (not stale `data` from closure)
          if (entry.cache) {
            subscriber.callback(entry.cache);
            subscriber.lastDeliveryTime = Date.now();
          }
        }, remaining);
      }
      // If a timer is already pending, we skip — it will deliver the latest cache
    }
  }
}
