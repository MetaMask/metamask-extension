import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CaipChainId, Hex } from '@metamask/utils';
import { GC_TIMES, STALE_TIMES } from '@metamask/core-backend';
import { toAssetId } from '../../../../shared/lib/asset-utils';

/** MetaMask Price API OHLCV endpoint (same one mobile's `useOHLCVChart` uses). */
const OHLCV_BASE_URL = 'https://price.api.cx.metamask.io/v3/ohlcv-chart';

// Default OHLCV window fetched for the first render (mirrors mobile's `1D`
// TimeRange -> `1d` timePeriod mapping in `TimeRangeSelector.tsx`). NOTE: the
// `/v3/ohlcv-chart` endpoint expects Price-API short codes (`1h`/`1d`/`1w`/`1m`/`1y`),
// NOT ISO-8601 durations like `P1D` — sending `P1D` returns HTTP 400 and forces
// the legacy chart fallback for every asset.
const DEFAULT_TIME_PERIOD = '1d';

/** TanStack Query key prefix — namespaced to avoid clashing with other price queries. */
const OHLCV_CHART_QUERY_KEY_ROOT = [
  'metamask-extension',
  'assetOhlcvChart',
  'v3',
] as const;

/** OHLCV bar shape expected by the advanced-chart engine (`SET_OHLCV_DATA`). */
export type OhlcvBar = {
  /** Unix timestamp in milliseconds. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type OhlcvApiCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type OhlcvApiResponse = {
  data?: OhlcvApiCandle[];
  hasNext?: boolean;
  nextCursor?: string;
};

export type UseOhlcvChartDataParams = {
  /** Chain id (hex for EVM, or CAIP-2). */
  chainId: Hex | CaipChainId;
  /** Token address (EVM) or CAIP-19 asset reference. */
  address: string;
  /** OHLCV window as a Price-API short code (`1h`/`1d`/`1w`/`1m`/`1y`). Defaults to `1d`. */
  timePeriod?: string;
};

/**
 * Mirrors mobile's `useOHLCVChart` return shape so the extension can make the
 * same data-driven advanced-vs-legacy chart decision.
 */
export type UseOhlcvChartDataResult = {
  /** Mapped OHLCV bars (empty while loading, on error, or when unsupported). */
  data: OhlcvBar[];
  /** True while the initial fetch is in flight. */
  isLoading: boolean;
  /** Fetch error message, or `null`. */
  error: string | null;
  /** True when the API returned an empty data array (asset not supported). */
  hasEmptyData: boolean;
};

const mapCandle = (candle: OhlcvApiCandle): OhlcvBar => ({
  time: candle.timestamp,
  open: candle.open,
  high: candle.high,
  low: candle.low,
  close: candle.close,
  volume: candle.volume,
});

/**
 * Fetches a page of OHLCV candles for the asset from the Price API.
 *
 * @param assetId - CAIP-19 asset id, e.g. `eip155:1/slip44:60`.
 * @param timePeriod - Price-API window short code (e.g. `1d`).
 * @param signal - Optional abort signal.
 * @returns The mapped OHLCV bars (empty array if unsupported/none).
 */
async function fetchOhlcv(
  assetId: string,
  timePeriod: string,
  signal?: AbortSignal,
): Promise<OhlcvBar[]> {
  const url = new URL(`${OHLCV_BASE_URL}/${assetId}`);
  url.searchParams.set('timePeriod', timePeriod);

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error(`OHLCV API error: ${response.status}`);
  }
  const json = (await response.json()) as OhlcvApiResponse;
  return (json.data ?? []).map(mapCandle);
}

/**
 * Fetches OHLCV chart data for an asset, mirroring the return shape of mobile's
 * `useOHLCVChart` (`app/components/UI/Charts/AdvancedChart/useOHLCVChart.ts`).
 *
 * Lifted to the asset-page parent so the advanced-vs-legacy chart decision can
 * be made before choosing which chart to render (and so the bars can be passed
 * down to `AdvancedAssetChart` without a second fetch).
 *
 * @param params - The hook parameters.
 * @param params.chainId - The chain id of the asset.
 * @param params.address - The address (or CAIP-19 reference) of the asset.
 * @param params.timePeriod - The OHLCV window (Price-API short code, e.g. `1d`).
 * @returns The OHLCV bars plus loading/error/empty state.
 */
export const useOhlcvChartData = ({
  chainId,
  address,
  timePeriod = DEFAULT_TIME_PERIOD,
}: UseOhlcvChartDataParams): UseOhlcvChartDataResult => {
  const assetId = useMemo(() => {
    try {
      return toAssetId(address, chainId) ?? null;
    } catch {
      return null;
    }
  }, [address, chainId]);

  // The react-query `enabled` gate. If this is false the query is DISABLED and
  // NO network request fires. It is driven purely by `Boolean(assetId)`.
  const enabled = Boolean(assetId);

  const {
    data = [],
    isInitialLoading,
    isError,
    error,
    isFetched,
  } = useQuery({
    queryKey: [
      ...OHLCV_CHART_QUERY_KEY_ROOT,
      assetId ?? 'disabled',
      timePeriod,
    ] as const,
    queryFn: ({ signal }) =>
      fetchOhlcv(assetId as string, timePeriod, signal),
    enabled,
    retry: false,
    staleTime: STALE_TIMES.PRICES,
    gcTime: GC_TIMES.DEFAULT,
  });

  const errorMessage = useMemo(() => {
    if (!isError) {
      return null;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return error ? String(error) : 'OHLCV fetch failed';
  }, [isError, error]);

  return {
    data,
    isLoading: isInitialLoading,
    error: errorMessage,
    hasEmptyData: isFetched && !isError && data.length === 0,
  };
};
