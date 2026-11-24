import { useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
   * Fetches older candles for the chart engine to prepend when the user scrolls
   * past the oldest loaded bar (host-backed pagination). Stable across renders.
   * Returns `noData: true` when the cursor is exhausted, the series changed
   * mid-flight, or the request failed.
   *
   * When `countBack` is provided (the number of bars the engine is still short
   * by), the function accumulates successive cursor pages until it has gathered
   * at least that many — or history runs out — and returns them as one batch.
   * This lets the engine satisfy a large request in a single round-trip instead
   * of re-asking once per page (the coarse→fine pagination cascade). With no
   * `countBack`, it fetches a single page (legacy behaviour).
   */
  fetchOlderBars: (countBack?: number) => Promise<FetchOlderBarsResult>;
  /**
   * Resets the cursor to the cached first page and drops in-flight
   * {@link fetchOlderBars} calls. Call only on a full `SET_OHLCV_DATA`.
   */
  resetPagination: () => void;
};

/**
 * Upper bound on how many cursor pages a single {@link fetchOlderBars} call will
 * walk while trying to satisfy `countBack`. A safety cap so a large request (or
 * an unexpectedly small server page size) can never spin into an unbounded
 * fetch loop; whatever is gathered by the cap is returned and the engine may
 * ask again for the remainder.
 */
const MAX_OLDER_BARS_PAGES_PER_REQUEST = 20;

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

  // Timeout-only abort: we no longer abort on interval change (to avoid
  // HTTP/2 RST_STREAM degradation on the Price API). Only a truly hung
  // request gets aborted.
  const controller = new AbortController();
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

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

// ─── React Query configuration ──────────────────────────────────────────────

/**
 * How long a cached OHLCV page is considered fresh. Within this window a
 * revisited interval is served from cache with **zero** network requests,
 * which completely avoids the API's volume-based response degradation
 * (truncated pages under rapid switching).
 */
export const OHLCV_STALE_TIME_MS = 60_000;

/**
 * Quality gate: if a background refetch returns fewer than this fraction of the
 * cached bar count, the response is treated as truncated and rejected so React
 * Query keeps the richer cached data. 0.5 = reject if < 50 % of cached bars.
 */
const TRUNCATION_THRESHOLD = 0.5;

/** Shape stored in the React Query cache for each `['ohlcv', …]` key. */
type OHLCVQueryData = {
  page: OHLCVPage;
  usedCurrency: string;
};

// ─── React hook ─────────────────────────────────────────────────────────────

/**
 * Fetches OHLCV chart data reactively via React Query.
 *
 * Each `(assetId, interval, currency)` tuple is cached independently. Revisiting
 * an interval within {@link OHLCV_STALE_TIME_MS} is an instant cache hit — no
 * network request, no chance for the API to return truncated data. After the
 * stale window the cached bars are shown immediately while a background refetch
 * runs (up to React Query's default 5-minute `gcTime`).
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
  const queryClient = useQueryClient();

  // ── React Query fetch ───────────────────────────────────────────────────
  // Each (assetId, interval, currency) is cached independently. The
  // queryFn handles the currency-fallback retry internally so both attempts
  // land under the same cache key.

  const ohlcvQueryKey = [
    'ohlcv',
    assetId,
    interval,
    requestedCurrency,
  ] as const;

  const {
    data,
    isLoading: rqIsLoading,
    error: queryError,
  } = useQuery<OHLCVQueryData>({
    queryKey: ohlcvQueryKey,
    queryFn: async (): Promise<OHLCVQueryData> => {
      // Safe: `enabled: active` guarantees assetId is defined when queryFn runs.
      const resolvedAssetId = assetId as string;

      let usedCurrency = requestedCurrency;
      let page: OHLCVPage;
      try {
        page = await fetchOHLCVPage(
          resolvedAssetId,
          interval,
          requestedCurrency,
        );
      } catch (e) {
        const unsupportedCurrency =
          requestedCurrency !== FALLBACK_CURRENCY &&
          e instanceof Error &&
          e.message === 'OHLCV API error: 400';
        if (!unsupportedCurrency) {
          throw e;
        }
        usedCurrency = FALLBACK_CURRENCY;
        page = await fetchOHLCVPage(
          resolvedAssetId,
          interval,
          FALLBACK_CURRENCY,
        );
      }

      // Quality gate: reject truncated responses so React Query keeps the
      // richer cached data instead of overwriting it with a degraded page.
      const cached = queryClient.getQueryData<OHLCVQueryData>(ohlcvQueryKey);
      if (
        cached &&
        cached.page.bars.length > 0 &&
        page.bars.length < cached.page.bars.length * TRUNCATION_THRESHOLD
      ) {
        // Return the cached data as-is so the cache entry is not degraded.
        return cached;
      }

      return { page, usedCurrency };
    },
    staleTime: OHLCV_STALE_TIME_MS,
    enabled: active,
    retry: false,
  });

  // Derived values — referentially stable when `data` hasn't changed.
  const ohlcvData = data?.page.bars ?? [];
  const resolvedCurrency = data?.usedCurrency ?? requestedCurrency;

  // ── Cursor bookkeeping for host-backed pagination ───────────────────────
  // These live in refs, not state, because advancing the cursor must not
  // re-render — only the chart engine consumes the older bars, and it does
  // so through a stable callback.
  //
  // The cursor tracks the engine's oldest bar, so refetches never move it;
  // only `resetPagination` (on a full engine reload) does.

  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  const assetIdRef = useRef<string | undefined>(assetId);
  const intervalRef = useRef(interval);
  const pageCurrencyRef = useRef(requestedCurrency);
  // Bumped on reset; older-bars calls from a previous generation are dropped.
  const generationRef = useRef(0);
  // Generation of the running older-bars call, so a stale call's `finally`
  // can't release a newer call's lock.
  const inFlightGenRef = useRef<number | null>(null);

  const resetPagination = useCallback(() => {
    // Read the cache directly: the iframe calls this from its own effect,
    // before any effect in this hook could sync `data`.
    const cached = queryClient.getQueryData<OHLCVQueryData>([
      'ohlcv',
      assetId,
      interval,
      requestedCurrency,
    ]);
    generationRef.current += 1;
    inFlightGenRef.current = null;
    nextCursorRef.current = cached?.page.nextCursor ?? null;
    hasMoreRef.current = cached?.page.hasMore ?? false;
    pageCurrencyRef.current = cached?.usedCurrency ?? requestedCurrency;
    assetIdRef.current = assetId;
    intervalRef.current = interval;
  }, [queryClient, assetId, interval, requestedCurrency]);

  // ── Older-bars pagination callback ──────────────────────────────────────

  const fetchOlderBars = useCallback(
    async (countBack?: number): Promise<FetchOlderBarsResult> => {
      const assetIdAtCall = assetIdRef.current;
      const gen = generationRef.current;

      if (
        !assetIdAtCall ||
        !nextCursorRef.current ||
        !hasMoreRef.current ||
        inFlightGenRef.current === gen
      ) {
        return { bars: [], noData: true };
      }

      // How many bars this reply should aim to cover. The engine computes
      // `countBack` to fill its drawing buffer; gathering that many in one
      // reply means it is satisfied in a single round-trip instead of
      // re-requesting the remainder one page at a time.
      const targetBars =
        typeof countBack === 'number' && countBack > 0 ? countBack : 1;

      inFlightGenRef.current = gen;
      let pagesFetched = 0;

      try {
        const accumulated: OHLCVBar[] = [];

        while (
          nextCursorRef.current &&
          hasMoreRef.current &&
          accumulated.length < targetBars &&
          pagesFetched < MAX_OLDER_BARS_PAGES_PER_REQUEST
        ) {
          const page = await fetchOHLCVPage(
            assetIdAtCall,
            intervalRef.current,
            pageCurrencyRef.current,
            { nextCursor: nextCursorRef.current },
          );
          pagesFetched += 1;
          // Reset happened mid-flight: drop the bars, keep the new cursor.
          if (generationRef.current !== gen) {
            return { bars: [], noData: true };
          }

          // Advance the cursor as each page lands so a later call (or the next
          // loop iteration) continues from the right place.
          nextCursorRef.current = page.nextCursor;
          hasMoreRef.current = page.hasMore;
          accumulated.push(...page.bars);

          // A page that came back empty means history is exhausted for this
          // cursor; stop rather than spin.
          if (page.bars.length === 0) {
            break;
          }
        }

        return {
          bars: accumulated,
          noData: accumulated.length === 0,
        };
      } catch {
        return { bars: [], noData: true };
      } finally {
        if (inFlightGenRef.current === gen) {
          inFlightGenRef.current = null;
        }
      }
    },
    [],
  );

  // ── Return ──────────────────────────────────────────────────────────────
  // `rqIsLoading` is true only when there is no cached data AND a fetch is
  // in-flight (first visit to this interval). On cache hits it is false
  // from the first render, so the chart paints instantly.

  let errorMessage: string | null = null;
  if (queryError) {
    errorMessage =
      queryError instanceof Error ? queryError.message : 'Unknown error';
  }

  return {
    ohlcvData,
    isLoading: rqIsLoading,
    error: errorMessage,
    resolvedCurrency,
    fetchOlderBars,
    resetPagination,
  };
};
