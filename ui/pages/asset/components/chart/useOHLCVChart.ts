import { useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { priceApiBaseUrl } from '../../../../../shared/constants/price-api';
import { getOhlcvTimePeriod } from './chart-window-mapping';
import { type OHLCVApiCandle, type OHLCVBar, toOHLCVBar } from './ohlcv-types';

// ─── Types ──────────────────────────────────────────────────────────────────

export type { OHLCVBar } from './ohlcv-types';

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
   * Fetches older bars when the user scrolls past the oldest one. Stable.
   * With `countBack` (e.g. 300) it walks cursor pages until it has ≥300 bars,
   * then replies once; without it, one page. Returns `noData: true` when
   * history runs out, after a reset mid-flight, or on error.
   */
  fetchOlderBars: (countBack?: number) => Promise<FetchOlderBarsResult>;
  /**
   * Resets the cursor to the cached first page and drops in-flight
   * {@link fetchOlderBars} calls. Call only on a full `SET_OHLCV_DATA`.
   */
  resetPagination: () => void;
};

/**
 * Safety cap on pages per {@link fetchOlderBars} call, e.g. countBack 10k with
 * 100-bar pages stops at 20 pages; the engine asks again for the rest.
 */
const MAX_OLDER_BARS_PAGES_PER_REQUEST = 20;

// ─── Constants ──────────────────────────────────────────────────────────────

// Derived from the shared prices-API base so the chart follows
// `MM_BACKEND_PRICES_API_URL` (staging/local) instead of always hitting prod.
export const OHLCV_BASE_URL = `${priceApiBaseUrl}/v3/ohlcv-chart`;

const FALLBACK_CURRENCY = 'usd';

/**
 * Budget for a single history request. Generous because exceeding it now
 * surfaces the no-data state rather than silently falling back to the legacy
 * chart, so a brief slowdown should not look like an outage.
 */
export const FETCH_TIMEOUT_MS = 10_000;

// ─── Pure fetch function (exported for testing & direct use) ────────────────

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
    url.searchParams.set('timePeriod', getOhlcvTimePeriod(interval));
    url.searchParams.set('interval', interval);
  }
  url.searchParams.set('vsCurrency', vsCurrency);

  // Abort only on timeout, not on interval change: aborts (HTTP/2
  // RST_STREAM) degrade the Price API's responses.
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
    const bars: OHLCVBar[] = (json.data ?? []).map((c: OHLCVApiCandle) =>
      toOHLCVBar(c),
    );
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

// ─── React Query configuration ──────────────────────────────────────────────

/**
 * Cache is fresh for 60s, e.g. 1h → 4h → 1h within a minute makes no request
 * for the second 1h. Fewer requests also avoids the API's truncated pages
 * under rapid switching.
 */
const OHLCV_STALE_TIME_MS = 60_000;

/**
 * Reject a refetch with < 50% of the cached bars as truncated, e.g. 120
 * cached and 40 returned → keep the cache.
 */
const TRUNCATION_THRESHOLD = 0.5;

/** Shape stored in the React Query cache for each `['ohlcv', …]` key. */
type OHLCVQueryData = {
  page: OHLCVPage;
  usedCurrency: string;
};

// ─── React hook ─────────────────────────────────────────────────────────────

/**
 * Fetches OHLCV chart data via React Query, cached per
 * `(assetId, interval, currency)` (see {@link OHLCV_STALE_TIME_MS}).
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

  let errorMessage: string | null = null;
  if (queryError) {
    errorMessage =
      queryError instanceof Error ? queryError.message : 'Unknown error';
  }

  return {
    ohlcvData,
    // True only on a first visit with no cache; cache hits paint instantly.
    isLoading: rqIsLoading,
    error: errorMessage,
    resolvedCurrency,
    fetchOlderBars,
    resetPagination,
  };
};
