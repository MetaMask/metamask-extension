import { useCallback, useEffect, useRef, useState } from 'react';
import { INTERVAL_TO_TIME_PERIOD, OHLCV_BASE_URL } from './useOHLCVChart';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OHLCVRealtimeBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type UseOHLCVRealtimeOptions = {
  /** CAIP-19 or similar asset identifier */
  assetId: string;
  /** Candle interval (e.g. "1m", "5m", "1h", "1d") */
  interval: string;
  /** Fiat currency code (default "usd") */
  currency?: string;
  /** When false, skips subscription */
  enabled: boolean;
};

export type UseOHLCVRealtimeResult = {
  /** Latest bar from polling (timestamp in milliseconds) */
  latestBar: OHLCVRealtimeBar | null;
};

// ─── Constants ──────────────────────────────────────────────────────────────

/** Debounce before starting polling to avoid thrashing during rapid navigation. */
const DEBOUNCE_MS = 500;

/** How often we poll /latest for new data. */
const POLL_INTERVAL_MS = 5_000;

/** REST endpoint for fetching the latest single candle. */
const OHLCV_LATEST_URL = OHLCV_BASE_URL.replace('/ohlcv-chart', '/ohlcv');

// ─── Helper functions ───────────────────────────────────────────────────────

type OHLCVApiBar = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * Fetch the latest (current) candle from the /latest REST endpoint.
 * The API returns a single bar object with `timestamp` in milliseconds.
 *
 * @param assetId - CAIP or similar asset identifier
 * @param timePeriod - Time period for the API request
 * @param interval - Candle interval
 * @param currency - Fiat quote currency
 * @param signal - Optional AbortSignal for cancellation
 * @returns The latest bar or null if unavailable
 */
async function fetchLatestBar(
  assetId: string,
  timePeriod: string,
  interval: string,
  currency: string,
  signal?: AbortSignal,
): Promise<OHLCVRealtimeBar | null> {
  const url = new URL(`${OHLCV_LATEST_URL}/${assetId}/latest`);
  url.searchParams.set('timePeriod', timePeriod);
  url.searchParams.set('interval', interval);
  url.searchParams.set('vsCurrency', currency);

  console.log('[OHLCV-RT] Fetching /latest', {
    assetId,
    interval,
    timePeriod,
    currency,
    url: url.toString(),
  });

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    console.log('[OHLCV-RT] Error: /latest returned non-OK status', {
      status: response.status,
      statusText: response.statusText,
    });
    return null;
  }

  const bar = (await response.json()) as OHLCVApiBar | null;
  if (!bar) {
    console.log('[OHLCV-RT] Error: /latest returned null or empty body');
    return null;
  }

  // Validate numeric data
  if (
    typeof bar.timestamp !== 'number' ||
    typeof bar.close !== 'number' ||
    Number.isNaN(bar.timestamp) ||
    Number.isNaN(bar.close)
  ) {
    console.log('[OHLCV-RT] Error: Invalid bar data from /latest', { bar });
    return null;
  }

  console.log('[OHLCV-RT] Received bar from /latest', {
    timestamp: bar.timestamp,
    close: bar.close,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    volume: bar.volume,
  });

  // Keep timestamp in milliseconds (matching useOHLCVChart format)
  return {
    time: bar.timestamp,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  };
}

/**
 * Field-by-field equality check to avoid re-rendering on identical bars.
 *
 * @param a - First bar to compare
 * @param b - Second bar to compare
 * @returns True if bars are equal (or both null)
 */
function areBarsEqual(
  a: OHLCVRealtimeBar | null,
  b: OHLCVRealtimeBar | null,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.time === b.time &&
    a.open === b.open &&
    a.high === b.high &&
    a.low === b.low &&
    a.close === b.close &&
    a.volume === b.volume
  );
}

// ─── React hook ─────────────────────────────────────────────────────────────

/**
 * Fetches real-time OHLCV candle updates via HTTP polling.
 *
 * Uses a 500ms debounce before starting to avoid thrashing during rapid
 * asset or interval changes.
 *
 * Polls the /latest endpoint every 5 seconds to get the most recent candle,
 * updating the UI with any price changes.
 *
 * @param options - Hook configuration options
 * @param options.assetId - CAIP-19 or similar asset identifier
 * @param options.interval - Candle interval (e.g. "1m", "5m", "1h", "1d")
 * @param options.currency - Fiat currency code (default "usd")
 * @param options.enabled - When false, skips subscription
 * @returns Object containing the latest bar data
 */
export function useOHLCVRealtime({
  assetId,
  interval,
  currency = 'usd',
  enabled,
}: UseOHLCVRealtimeOptions): UseOHLCVRealtimeResult {
  const [latestBar, setLatestBar] = useState<OHLCVRealtimeBar | null>(null);

  // Always update state to trigger re-render and forward to chart.
  // The chart needs REALTIME_UPDATE on every poll to show the "pulse" animation,
  // even if the underlying bar data hasn't changed (price stable).
  const updateLatestBar = useCallback((bar: OHLCVRealtimeBar) => {
    setLatestBar((prev) => {
      const isEqual = areBarsEqual(prev, bar);
      console.log('[OHLCV-RT] Updating latestBar state', {
        prevClose: prev?.close,
        newClose: bar.close,
        timestamp: bar.time,
        dataChanged: !isEqual,
      });
      // Always return a new object to trigger React state update
      return { ...bar };
    });
  }, []);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track the subscription key to reset state on dependency changes
  const subscriptionKeyRef = useRef('');

  // Reset latestBar when inputs change (separate effect to avoid lint warning)
  useEffect(() => {
    const newKey = `${assetId}-${interval}-${currency}`;
    if (subscriptionKeyRef.current && subscriptionKeyRef.current !== newKey) {
      setLatestBar(null);
    }
    subscriptionKeyRef.current = newKey;
  }, [assetId, interval, currency]);

  useEffect(() => {
    if (!enabled || !assetId || !interval) {
      console.log('[OHLCV-RT] Polling disabled or missing params', {
        enabled,
        assetId: Boolean(assetId),
        interval: Boolean(interval),
      });
      return undefined;
    }

    const timePeriod = INTERVAL_TO_TIME_PERIOD[interval] ?? '1d';

    console.log('[OHLCV-RT] Starting polling subscription', {
      assetId,
      interval,
      timePeriod,
      currency,
      debounceMs: DEBOUNCE_MS,
      pollIntervalMs: POLL_INTERVAL_MS,
    });

    const pollLatest = async () => {
      // Abort any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const bar = await fetchLatestBar(
          assetId,
          timePeriod,
          interval,
          currency,
          controller.signal,
        );
        if (bar && !controller.signal.aborted) {
          updateLatestBar(bar);
        } else if (!bar) {
          console.log('[OHLCV-RT] No bar returned from fetchLatestBar');
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('[OHLCV-RT] Error during polling', {
            error: error.message,
            name: error.name,
          });
        }
      }
    };

    // Debounce before starting the polling loop
    debounceTimerRef.current = setTimeout(() => {
      console.log('[OHLCV-RT] Debounce complete, starting immediate poll');
      // Immediate poll for instant data
      // eslint-disable-next-line no-void -- fire-and-forget async poll
      void pollLatest();

      // Then poll periodically
      console.log(
        `[OHLCV-RT] Starting periodic polling every ${POLL_INTERVAL_MS}ms`,
      );
      pollTimerRef.current = setInterval(() => {
        // eslint-disable-next-line no-void -- fire-and-forget async poll
        void pollLatest();
      }, POLL_INTERVAL_MS);
    }, DEBOUNCE_MS);

    return () => {
      console.log('[OHLCV-RT] Cleaning up polling subscription', {
        assetId,
        interval,
      });

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }

      abortControllerRef.current?.abort();
    };
  }, [assetId, interval, currency, enabled, updateLatestBar]);

  return { latestBar };
}
