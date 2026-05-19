import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CaipChainId, Hex, parseCaipAssetType } from '@metamask/utils';
// @ts-expect-error suppress CommonJS vs ECMAScript error
import { Point } from 'chart.js';
import { API_URLS, GC_TIMES, STALE_TIMES } from '@metamask/core-backend';
import { fromIso8601DurationToPriceApiTimePeriod } from '../util';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { apiClient } from '../../../helpers/api-client';

export type HistoricalPrices = {
  /** The prices data points. Is an empty array if the prices could not be loaded. */
  prices: Point[];
  /** Metadata derived from the prices array, computed here to encapsulate logic and leverage memoization. */
  metadata: {
    /** Data point from the prices array with the lowest price. Is `{ x: -Infinity, y: -Infinity }` if the prices array is empty. */
    minPricePoint: Point;
    /** Data point from the prices array with the highest price. Is `{ x: Infinity, y: Infinity }` if the prices array is empty. */
    maxPricePoint: Point;
    /** Minimum x value in the prices array. Is `-Infinity` if the prices array is empty. */
    xMin: number;
    /** Maximum x value in the prices array. Is `Infinity` if the prices array is empty. */
    xMax: number;
    /** Minimum y value in the prices array. Is `-Infinity` if the prices array is empty. */
    yMin: number;
    /** Maximum y value in the prices array. Is `Infinity` if the prices array is empty. */
    yMax: number;
  };
};

export const DEFAULT_USE_HISTORICAL_PRICES_METADATA: HistoricalPrices['metadata'] =
  {
    minPricePoint: { x: -Infinity, y: -Infinity },
    maxPricePoint: { x: Infinity, y: Infinity },
    xMin: Infinity,
    xMax: -Infinity,
    yMin: Infinity,
    yMax: -Infinity,
  };

type UseHistoricalPricesParams = {
  chainId: Hex | CaipChainId;
  address: string;
  currency: string;
  timeRange: string;
};

/**
 * Derives metadata from the prices in a single pass (safe for large arrays).
 *
 * @param prices - The prices to derive the metadata from.
 * @returns The metadata derived from the prices.
 */
const deriveMetadata = (prices: Point[]): HistoricalPrices['metadata'] => {
  if (prices.length === 0) {
    return DEFAULT_USE_HISTORICAL_PRICES_METADATA;
  }

  let xMin = Infinity;
  let xMax = -Infinity;
  let minPricePoint = prices[0];
  let maxPricePoint = prices[0];

  for (const p of prices) {
    if (p.x < xMin) {
      xMin = p.x;
    }
    if (p.x > xMax) {
      xMax = p.x;
    }
    if (p.y < minPricePoint.y) {
      minPricePoint = p;
    }
    if (p.y > maxPricePoint.y) {
      maxPricePoint = p;
    }
  }

  return {
    minPricePoint,
    maxPricePoint,
    xMin,
    xMax,
    yMin: minPricePoint.y,
    yMax: maxPricePoint.y,
  };
};

const transformPricesToPoints = (
  data: { prices?: number[][] } | undefined,
): Point[] => data?.prices?.map((p) => ({ x: p?.[0], y: p?.[1] })) ?? [];

type PricesClientFetch = {
  fetch: (
    baseUrl: string,
    path: string,
    options?: {
      signal?: AbortSignal;
      params?: Record<string, string | undefined>;
    },
  ) => Promise<{ prices?: [number, number][] }>;
};

/** TanStack Query key prefix — distinct from `@metamask/core-backend` `['prices', ...]` keys to avoid cache/queryFn mismatches. */
const V3_HISTORICAL_PRICES_QUERY_KEY_ROOT = [
  'metamask-extension',
  'assetHistoricalPrices',
  'v3',
] as const;

/**
 * CAIP-2 chain id and asset-type segment for `/v3/historical-prices/{chainId}/{assetId}`.
 *
 * @param chainId - Chain id (hex or CAIP-2).
 * @param address - Token address or CAIP-19 asset type.
 * @returns Parsed segments, or null if a CAIP asset id cannot be derived.
 */
function getV3HistoricalPricesCaipParams(
  chainId: Hex | CaipChainId,
  address: string,
): { caipChainId: CaipChainId; assetType: string } | null {
  const caipAssetType = toAssetId(address, chainId);
  if (!caipAssetType) {
    return null;
  }
  const {
    chainId: caipChainId,
    assetNamespace,
    assetReference,
  } = parseCaipAssetType(caipAssetType);
  return {
    caipChainId,
    assetType: `${assetNamespace}:${assetReference}`,
  };
}

/**
 * Fetches the historical prices for a given asset over a given duration
 * using the price API v3 endpoint for both EVM and non-EVM chains.
 *
 * @param param0 - The parameters for the useHistoricalPrices hook.
 * @param param0.chainId - The chain ID of the asset.
 * @param param0.address - The address of the asset.
 * @param param0.currency - The currency of the asset.
 * @param param0.timeRange - The chart time range, as an ISO 8601 duration string ("P1D", "P1M", "P1Y", "P3YT45S", ...)
 * @returns The historical prices for the given asset and time range.
 */
export const useHistoricalPrices = ({
  chainId,
  address,
  currency,
  timeRange,
}: UseHistoricalPricesParams) => {
  const v3Params = useMemo(
    () => getV3HistoricalPricesCaipParams(chainId, address),
    [chainId, address],
  );

  const timePeriod = useMemo(
    () => fromIso8601DurationToPriceApiTimePeriod(timeRange),
    [timeRange],
  );

  const queryKey = useMemo(() => {
    if (!v3Params) {
      return [...V3_HISTORICAL_PRICES_QUERY_KEY_ROOT, 'disabled'] as const;
    }
    return [
      ...V3_HISTORICAL_PRICES_QUERY_KEY_ROOT,
      v3Params.caipChainId,
      v3Params.assetType,
      currency,
      timePeriod,
    ] as const;
  }, [v3Params, currency, timePeriod]);

  const { data: prices = [], isFetching } = useQuery({
    // @ts-expect-error - fix once extension in react-query v5
    queryKey,
    queryFn: async ({ queryKey: qk, signal }) => {
      if (qk[3] === 'disabled') {
        return { prices: [] as [number, number][] };
      }
      const caipChainId = qk[3] as CaipChainId;
      const assetType = qk[4] as string;
      const curr = qk[5] as string;
      const period = qk[6] as string;
      return (apiClient.prices as unknown as PricesClientFetch).fetch(
        API_URLS.PRICES,
        `/v3/historical-prices/${caipChainId}/${assetType}`,
        {
          signal,
          params: {
            vsCurrency: curr,
            timePeriod: period,
          },
        },
      );
    },
    enabled: Boolean(v3Params),
    keepPreviousData: true,
    retry: false,
    staleTime: STALE_TIMES.PRICES,
    gcTime: GC_TIMES.DEFAULT,
    select: transformPricesToPoints,
  });

  const metadata = useMemo(() => deriveMetadata(prices), [prices]);

  return {
    loading: isFetching,
    data: { prices, metadata },
  };
};
