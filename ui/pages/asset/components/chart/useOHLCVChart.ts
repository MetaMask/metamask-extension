import { useEffect, useState } from 'react';
import { priceApiBaseUrl } from '../../../../../shared/constants/price-api';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OHLCVBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type UseOHLCVChartOptions = {
  /** CAIP asset id. The hook stays idle until this is defined. */
  assetId?: string;
  interval: string;
  /** The user's display currency. Falls back to USD if the API rejects it. */
  currency?: string;
  /** Set false to keep the hook idle, e.g. while the line chart is showing. */
  enabled?: boolean;
};

export type UseOHLCVChartResult = {
  ohlcvData: OHLCVBar[];
  isLoading: boolean;
  error: string | null;
  /**
   * The currency the returned bars are actually priced in. Differs from the
   * requested currency when the API does not support it and we fell back to
   * USD, so callers can label the figures honestly.
   */
  resolvedCurrency: string;
};

// ─── Constants ──────────────────────────────────────────────────────────────

// Derived from the shared prices-API base so the chart follows
// `MM_BACKEND_PRICES_API_URL` (staging/local) instead of always hitting prod.
export const OHLCV_BASE_URL = `${priceApiBaseUrl}/v3/ohlcv-chart`;

export const FALLBACK_CURRENCY = 'usd';

/** Maps a candle interval to the timePeriod query param the OHLCV API expects. */
export const INTERVAL_TO_TIME_PERIOD: Record<string, string> = {
  '1m': '1d',
  '5m': '1d',
  '15m': '1d',
  '1h': '1w',
  '4h': '1m',
  '1d': '1m',
  '1w': '1y',
};

/**
 * Budget for a single history request. Generous because exceeding it now
 * surfaces the no-data state rather than silently falling back to the legacy
 * chart, so a brief slowdown should not look like an outage.
 */
export const FETCH_TIMEOUT_MS = 10_000;

// ─── Pure fetch function (exported for testing & direct use) ────────────────

type OHLCVApiCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * Fetches OHLCV candle data from the MetaMask Price API.
 *
 * @param assetId    - CAIP or CoinGecko asset identifier
 * @param interval   - Candle interval (e.g. '1h', '1d')
 * @param vsCurrency - Fiat quote currency (default 'usd')
 * @param signal     - Optional AbortSignal for cancellation
 * @returns Mapped array of OHLCVBar objects
 */
export async function fetchOHLCV(
  assetId: string,
  interval: string,
  vsCurrency = FALLBACK_CURRENCY,
  signal?: AbortSignal,
): Promise<OHLCVBar[]> {
  const timePeriod = INTERVAL_TO_TIME_PERIOD[interval] ?? '1d';
  const url = new URL(`${OHLCV_BASE_URL}/${assetId}`);
  url.searchParams.set('timePeriod', timePeriod);
  url.searchParams.set('interval', interval);
  url.searchParams.set('vsCurrency', vsCurrency);

  // A single controller drives both the caller's cancellation and the timeout,
  // so a request that blows the budget is actually aborted rather than left
  // running to land late over newer state.
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller);

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`OHLCV API error: ${response.status}`);
    }

    const json = await response.json();
    return (json.data ?? []).map((c: OHLCVApiCandle) => ({
      time: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));
  } catch (error) {
    throw timedOut ? new Error('OHLCV fetch timeout') : error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

// ─── React hook ─────────────────────────────────────────────────────────────

/**
 * Fetches OHLCV chart data reactively.
 * Re-fetches whenever assetId, interval, or currency changes.
 * Aborts in-flight requests on unmount or when inputs change.
 *
 * The price API does not quote every fiat the extension can display, so a
 * rejected currency is retried once in USD rather than surfaced as an error.
 *
 * @param options - Hook options
 * @param options.assetId - CAIP or CoinGecko asset identifier
 * @param options.interval - Candle interval (e.g. '1h', '1d')
 * @param options.currency - The user's display currency
 * @param options.enabled - Set false to keep the hook idle
 */
export const useOHLCVChart = ({
  assetId,
  interval,
  currency,
  enabled = true,
}: UseOHLCVChartOptions): UseOHLCVChartResult => {
  const requestedCurrency = (currency || FALLBACK_CURRENCY).toLowerCase();
  const active = enabled && Boolean(assetId);

  const [ohlcvData, setOhlcvData] = useState<OHLCVBar[]>([]);
  const [isLoading, setIsLoading] = useState(active);
  const [error, setError] = useState<string | null>(null);
  const [resolvedCurrency, setResolvedCurrency] = useState(requestedCurrency);

  // Reset synchronously when the *data series* (asset/interval/currency)
  // changes, before the fetch effect runs. Without this the previous series'
  // bars linger in `ohlcvData` and `isLoading` stays false for the first render
  // after the change, so callers either paint stale candles under the new key
  // or flash a "no data" placeholder before loading begins. `enabled` is
  // deliberately excluded: toggling to line mode (enabled=false) and back must
  // keep the loaded candles so the still-mounted iframe round-trips instantly
  // instead of blanking into a reload. Adjusting state from a changed input
  // during render is the React-recommended pattern
  // (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  const seriesKey = `${assetId ?? ''}|${interval}|${requestedCurrency}`;
  const [renderedSeriesKey, setRenderedSeriesKey] = useState(seriesKey);
  if (renderedSeriesKey !== seriesKey) {
    setRenderedSeriesKey(seriesKey);
    setOhlcvData([]);
    setError(null);
    setIsLoading(active);
  }

  // Entering candle mode with no bars yet (a cold line→candle toggle) must show
  // loading rather than an empty "no data" frame while the first fetch runs.
  // This never clears existing bars, so a warm toggle back keeps the last
  // candles on screen and only refreshes them in the background.
  const [renderedEnabled, setRenderedEnabled] = useState(enabled);
  if (renderedEnabled !== enabled) {
    setRenderedEnabled(enabled);
    if (active && ohlcvData.length === 0) {
      setIsLoading(true);
    }
  }

  useEffect(() => {
    if (!assetId || !enabled) {
      return undefined;
    }

    const controller = new AbortController();

    // eslint-disable-next-line no-void -- fire-and-forget async data fetch inside effect
    void (async () => {
      setIsLoading(true);
      setError(null);

      let usedCurrency = requestedCurrency;
      try {
        let data;
        try {
          data = await fetchOHLCV(
            assetId,
            interval,
            requestedCurrency,
            controller.signal,
          );
        } catch (e) {
          // Only an API rejection is worth retrying: a timeout or an abort
          // would fail the same way in USD.
          const unsupportedCurrency =
            requestedCurrency !== FALLBACK_CURRENCY &&
            e instanceof Error &&
            e.message.startsWith('OHLCV API error:');
          if (!unsupportedCurrency || controller.signal.aborted) {
            throw e;
          }
          usedCurrency = FALLBACK_CURRENCY;
          data = await fetchOHLCV(
            assetId,
            interval,
            FALLBACK_CURRENCY,
            controller.signal,
          );
        }

        if (!controller.signal.aborted) {
          setOhlcvData(data);
          setResolvedCurrency(usedCurrency);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setOhlcvData([]);
          setError(e instanceof Error ? e.message : 'Unknown error');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [assetId, interval, requestedCurrency, enabled]);

  return { ohlcvData, isLoading, error, resolvedCurrency };
};
