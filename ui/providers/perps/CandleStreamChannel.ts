/**
 * CandleStreamChannel - Multiplexer/cache for candlestick data streams
 *
 * Sits between PerpsStreamManager (which receives background notifications)
 * and React hooks. Provides:
 * - Subscription deduplication per symbol+interval key
 * - Per-key caching with immediate delivery to new subscribers
 * - Per-subscriber throttling (first update always immediate)
 * - Load-more via fetchHistoricalCandles (merge older data into cache)
 * - Auto-disconnect when last subscriber for a key unsubscribes
 * - Reconnect to re-establish all active subscriptions after WS reconnect
 *
 * Cache key format: "${symbol}-${interval}" (e.g., "BTC-1h")
 */

import type { CandleData } from '@metamask/perps-controller';
import {
  type CandlePeriod,
  TimeDuration,
  calculateCandleCount,
} from '../../components/app/perps/constants/chartConfig';
import { submitRequestToBackground } from '../../store/background-connection';

/** Maximum total candles to keep in memory per key */
const MAX_CANDLES_IN_MEMORY = 1000;

/** Minimum candles to fetch on load-more */
const LOAD_MORE_MIN = 50;

/** Maximum candles to fetch on load-more */
const LOAD_MORE_MAX = 500;

/**
 * Grace period before a candle stream is torn down after the last subscriber
 * leaves.  If a new subscriber for the same symbol+interval arrives within
 * this window (e.g. navigating back to the same chart), the pending
 * deactivation is cancelled and the live subscription is preserved, avoiding
 * a redundant unsubscribe + resubscribe POST to the Hyperliquid API.
 *
 * 500ms matches mobile's CandleConnectDebounceMs — long enough to absorb
 * React's async cleanup-then-remount cycle during page transitions, short
 * enough that abandoned subscriptions don't linger.
 */
const DISCONNECT_GRACE_MS = 500;

/**
 * If cache was updated within this window, skip the immediate
 * `perpsActivateCandleStream` call and serve from cache instead. A deferred
 * activation fires after DEFERRED_ACTIVATION_MS to re-establish the live WS
 * subscription. This avoids the two heaviest WS messages (candleSnapshot POST +
 * candle subscribe) during rapid market navigation.
 */
const CACHE_FRESH_MS = 30_000;

/**
 * Delay before a deferred candle activation fires. Long enough that rapid
 * navigation (BTC → ETH → SOL) only triggers one activation for the final
 * market, short enough that live updates resume quickly.
 */
const DEFERRED_ACTIVATION_MS = 2_000;

/** Per-subscriber state */
type SubscriberEntry = {
  callback: (data: CandleData) => void;
  onError?: (error: Error) => void;
  throttleMs: number;
  lastDeliveryTime: number;
  pendingTimer: ReturnType<typeof setTimeout> | null;
};

/** Per cache-key state */
type ChannelEntry = {
  cache: CandleData | null;
  /** Epoch ms when cache was last updated via pushFromBackground */
  cacheUpdatedAt: number;
  subscribers: Map<string, SubscriberEntry>;
  unsubscribeFromSource: (() => void) | null;
  isConnected: boolean;
  /** The duration used for the initial subscription */
  duration: TimeDuration | undefined;
  /** Timer to defer disconnect so rapid re-navigation can cancel teardown */
  disconnectTimer: ReturnType<typeof setTimeout> | null;
  /** Timer for deferred activation when serving from fresh cache */
  deferredConnectTimer: ReturnType<typeof setTimeout> | null;
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
  private readonly channels = new Map<string, ChannelEntry>();

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
        cacheUpdatedAt: 0,
        subscribers: new Map(),
        unsubscribeFromSource: null,
        isConnected: false,
        duration,
        disconnectTimer: null,
        deferredConnectTimer: null,
      };
      this.channels.set(key, entry);
    }

    // Cancel any pending teardown for this key so re-navigation reuses the
    // existing background subscription instead of forcing a new one.
    if (entry.disconnectTimer !== null) {
      clearTimeout(entry.disconnectTimer);
      entry.disconnectTimer = null;
    }

    // Register subscriber
    const subscriber: SubscriberEntry = {
      callback,
      onError,
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

    // Connect to background streaming if first subscriber and not already connected
    if (!entry.isConnected) {
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

      // Defer disconnect to allow rapid re-navigation to cancel teardown.
      if (currentEntry.subscribers.size === 0) {
        currentEntry.disconnectTimer = setTimeout(() => {
          currentEntry.disconnectTimer = null;
          // Re-check: a new subscriber may have arrived during the grace period.
          if (currentEntry.subscribers.size === 0) {
            this.disconnect(key, currentEntry);
          }
        }, DISCONNECT_GRACE_MS);
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
      const olderData = await submitRequestToBackground<CandleData>(
        'perpsFetchHistoricalCandles',
        [{ symbol, interval, limit, endTime }],
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
        '[CandleStreamChannel] fetchHistoricalCandles failed for key:',
        key,
        error,
      );
    }
  }

  /**
   * Push candle data from a background notification.
   * Updates the cache for the given symbol+interval key and notifies subscribers.
   *
   * @param params - Background notification payload
   * @param params.symbol - Asset symbol (e.g., "BTC")
   * @param params.interval - Candle period (e.g., "1h")
   * @param params.data - CandleData from the background controller
   */
  pushFromBackground({
    symbol,
    interval,
    data,
  }: {
    symbol: string;
    interval: CandlePeriod;
    data: CandleData;
  }): void {
    const key = cacheKey(symbol, interval);
    let entry = this.channels.get(key);
    if (!entry) {
      entry = {
        cache: null,
        cacheUpdatedAt: 0,
        subscribers: new Map(),
        unsubscribeFromSource: null,
        isConnected: false,
        duration: undefined,
        disconnectTimer: null,
        deferredConnectTimer: null,
      };
      this.channels.set(key, entry);
    }
    entry.cache = data;
    entry.cacheUpdatedAt = Date.now();
    this.notifySubscribers(entry, data);
  }

  /**
   * Re-establish all active subscriptions via background streaming.
   * Called after WebSocket reconnect to restore live data.
   */
  reconnect(): void {
    for (const [key, entry] of this.channels.entries()) {
      // Only reconnect channels that have active subscribers
      if (entry.subscribers.size > 0) {
        // Cancel any deferred activation from a previous connect
        if (entry.deferredConnectTimer !== null) {
          clearTimeout(entry.deferredConnectTimer);
          entry.deferredConnectTimer = null;
        }
        // Disconnect existing source
        if (entry.unsubscribeFromSource) {
          entry.unsubscribeFromSource();
          entry.unsubscribeFromSource = null;
        }
        entry.isConnected = false;

        // Re-activate background stream for this key
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

      // Cancel any pending deferred disconnect
      if (entry.disconnectTimer !== null) {
        clearTimeout(entry.disconnectTimer);
        entry.disconnectTimer = null;
      }

      this.disconnect(key, entry);
    }
    this.channels.clear();
  }

  /**
   * Connect a channel entry to the controller's candle subscription.
   *
   * @param key - Cache key
   * @param entry - Channel entry
   * @param _onError - Optional error callback (unused; errors are forwarded to all subscribers)
   */
  private connect(
    key: string,
    entry: ChannelEntry,
    _onError?: (error: Error) => void,
  ): void {
    if (entry.isConnected) {
      return;
    }

    // Cancel any previously deferred activation for this key so only the
    // latest connect intent wins (e.g., rapid period toggling).
    if (entry.deferredConnectTimer !== null) {
      clearTimeout(entry.deferredConnectTimer);
      entry.deferredConnectTimer = null;
    }

    const cacheAge = Date.now() - entry.cacheUpdatedAt;
    const hasFreshCache = entry.cache && cacheAge < CACHE_FRESH_MS;

    if (hasFreshCache) {
      // Cache is fresh enough — serve it immediately and defer the WS
      // activation so rapid market navigation doesn't burst the rate limit.
      // Mark connected so subsequent subscribers don't trigger extra activations.
      entry.isConnected = true;

      entry.deferredConnectTimer = setTimeout(() => {
        entry.deferredConnectTimer = null;
        // Only fire if still connected and has subscribers; the user may have
        // navigated away during the deferral window.
        if (entry.isConnected && entry.subscribers.size > 0) {
          this.activateBackground(key, entry);
        }
      }, DEFERRED_ACTIVATION_MS);

      // eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
      entry.unsubscribeFromSource = () => {};
      return;
    }

    // No fresh cache — activate immediately so the user sees data ASAP.
    entry.isConnected = true;
    this.activateBackground(key, entry);

    // eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
    entry.unsubscribeFromSource = () => {};
  }

  /**
   * Send `perpsActivateCandleStream` to the background.
   * Extracted so both immediate and deferred paths share the same logic.
   * @param key
   * @param entry
   */
  private activateBackground(key: string, entry: ChannelEntry): void {
    const { symbol, interval } = parseCacheKey(key);

    // Use a lighter duration on revisit to conserve rate limit budget (mobile
    // pattern from PR #28141). When cache already has data the controller only
    // needs a short refresh; users can lazy-load more history via scroll.
    const connectDuration = entry.cache ? TimeDuration.OneDay : entry.duration;

    submitRequestToBackground('perpsActivateCandleStream', [
      { symbol, interval, duration: connectDuration },
    ]).catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn(
        '[CandleStreamChannel] Failed to activate streaming for key:',
        key,
        error,
      );
      entry.isConnected = false;
      for (const sub of entry.subscribers.values()) {
        sub.onError?.(error);
      }
    });
  }

  /**
   * Disconnect a channel entry from the controller.
   * Cache is preserved for re-navigation.
   *
   * @param key - Cache key (symbol-interval); forwarded to background so only this stream stops
   * @param entry - Channel entry
   */
  private disconnect(key: string, entry: ChannelEntry): void {
    if (entry.deferredConnectTimer !== null) {
      clearTimeout(entry.deferredConnectTimer);
      entry.deferredConnectTimer = null;
    }
    if (entry.unsubscribeFromSource) {
      entry.unsubscribeFromSource();
      entry.unsubscribeFromSource = null;
    }
    entry.isConnected = false;
    const { symbol, interval } = parseCacheKey(key);
    submitRequestToBackground('perpsDeactivateCandleStream', [
      { symbol, interval },
    ]);
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
