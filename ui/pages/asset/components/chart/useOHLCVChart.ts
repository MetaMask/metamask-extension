import { useCallback, useEffect, useRef, useState } from 'react';
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

/** One page of candles plus the cursor needed to fetch the page before it. */
export type OHLCVPage = {
  bars: OHLCVBar[];
  /** Opaque cursor for the next (older) page, or null when history is done. */
  nextCursor: string | null;
  /** Whether an older page exists. */
  hasMore: boolean;
};

/** Result of a host-backed older-bars fetch, in the shape the engine wants. */
export type FetchOlderBarsResult = {
  bars: OHLCVBar[];
  noData: boolean;
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
  /**
   * Fetches the next older page of candles by cursor, for the chart engine to
   * prepend when the user scrolls past the oldest loaded bar (host-backed
   * pagination). Stable across renders. Returns `noData: true` when the cursor
   * is exhausted, the series changed mid-flight, or the request failed.
   */
  fetchOlderBars: () => Promise<FetchOlderBarsResult>;
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
 * Fetches one page of OHLCV candles from the MetaMask Price API, along with
 * the cursor for the page before it.
 *
 * The initial page is addressed by `timePeriod` + `interval`. Older pages are
 * addressed by the opaque `nextCursor` the API returns, which already encodes
 * the window and interval, so paging sends only the cursor (plus currency) —
 * mirroring the chart engine's own paginator.
 *
 * @param assetId            - CAIP or CoinGecko asset identifier
 * @param interval           - Candle interval (e.g. '1h', '1d')
 * @param vsCurrency         - Fiat quote currency (default 'usd')
 * @param options            - Paging / cancellation options
 * @param options.nextCursor - Cursor from a previous page; omit for the first
 * @param options.signal     - Optional AbortSignal for cancellation
 * @returns The page's bars plus the next cursor and whether more remain
 */
export async function fetchOHLCVPage(
  assetId: string,
  interval: string,
  vsCurrency = FALLBACK_CURRENCY,
  options: { nextCursor?: string | null; signal?: AbortSignal } = {},
): Promise<OHLCVPage> {
  const { nextCursor, signal } = options;
  const url = new URL(`${OHLCV_BASE_URL}/${assetId}`);
  if (nextCursor) {
    url.searchParams.set('nextCursor', nextCursor);
  } else {
    url.searchParams.set(
      'timePeriod',
      INTERVAL_TO_TIME_PERIOD[interval] ?? '1d',
    );
    url.searchParams.set('interval', interval);
  }
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
    const bars: OHLCVBar[] = (json.data ?? []).map((c: OHLCVApiCandle) => ({
      time: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));
    return {
      bars,
      nextCursor: json.nextCursor ?? null,
      hasMore: Boolean(json.hasNext),
    };
  } catch (error) {
    throw timedOut ? new Error('OHLCV fetch timeout') : error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

/**
 * Fetches the initial page of OHLCV candle data from the MetaMask Price API.
 * Thin wrapper over {@link fetchOHLCVPage} that drops the cursor fields, kept
 * for callers that only need the bars.
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
  const { bars } = await fetchOHLCVPage(assetId, interval, vsCurrency, {
    signal,
  });
  return bars;
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

  // Cursor bookkeeping for host-backed pagination. These live in refs, not
  // state, because advancing the cursor must not re-render — only the chart
  // engine consumes the older bars, and it does so through a stable callback.
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  // Identifies the series the cursor belongs to, so a page that resolves after
  // the user switched token/interval/currency is dropped instead of prepended
  // onto the wrong chart.
  const seriesKeyRef = useRef('');
  const assetIdRef = useRef<string | undefined>(assetId);
  const intervalRef = useRef(interval);
  // The currency the loaded bars are actually priced in, so older pages are
  // fetched in the same currency rather than re-triggering the USD fallback.
  const pageCurrencyRef = useRef(requestedCurrency);
  // Guards against overlapping older-bar fetches corrupting the cursor.
  const olderBarsInFlightRef = useRef(false);

  useEffect(() => {
    if (!assetId || !enabled) {
      return undefined;
    }

    const controller = new AbortController();
    const seriesKey = `${assetId}|${interval}|${requestedCurrency}`;
    seriesKeyRef.current = seriesKey;
    assetIdRef.current = assetId;
    intervalRef.current = interval;
    // Reset the cursor for the new series; older-bar fetches before the first
    // page lands are no-ops.
    nextCursorRef.current = null;
    hasMoreRef.current = false;

    // eslint-disable-next-line no-void -- fire-and-forget async data fetch inside effect
    void (async () => {
      setIsLoading(true);
      setError(null);

      let usedCurrency = requestedCurrency;
      try {
        let page;
        try {
          page = await fetchOHLCVPage(assetId, interval, requestedCurrency, {
            signal: controller.signal,
          });
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
          page = await fetchOHLCVPage(assetId, interval, FALLBACK_CURRENCY, {
            signal: controller.signal,
          });
        }

        if (!controller.signal.aborted) {
          setOhlcvData(page.bars);
          setResolvedCurrency(usedCurrency);
          nextCursorRef.current = page.nextCursor;
          hasMoreRef.current = page.hasMore;
          pageCurrencyRef.current = usedCurrency;
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setOhlcvData([]);
          setError(e instanceof Error ? e.message : 'Unknown error');
          nextCursorRef.current = null;
          hasMoreRef.current = false;
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [assetId, interval, requestedCurrency, enabled]);

  const fetchOlderBars =
    useCallback(async (): Promise<FetchOlderBarsResult> => {
      const assetIdAtCall = assetIdRef.current;
      const seriesKeyAtCall = seriesKeyRef.current;
      const cursor = nextCursorRef.current;

      if (
        !assetIdAtCall ||
        !cursor ||
        !hasMoreRef.current ||
        olderBarsInFlightRef.current
      ) {
        return { bars: [], noData: true };
      }

      olderBarsInFlightRef.current = true;
      try {
        const page = await fetchOHLCVPage(
          assetIdAtCall,
          intervalRef.current,
          pageCurrencyRef.current,
          { nextCursor: cursor },
        );

        // A new series started while this was in flight: drop the stale page so
        // its bars cannot land on the wrong chart, and leave the (new series')
        // cursor untouched.
        if (seriesKeyRef.current !== seriesKeyAtCall) {
          return { bars: [], noData: true };
        }

        nextCursorRef.current = page.nextCursor;
        hasMoreRef.current = page.hasMore;
        return { bars: page.bars, noData: page.bars.length === 0 };
      } catch {
        return { bars: [], noData: true };
      } finally {
        olderBarsInFlightRef.current = false;
      }
    }, []);

  return { ohlcvData, isLoading, error, resolvedCurrency, fetchOlderBars };
};
