import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAssetId } from '@metamask/assets-controllers';
import {
  CaipChainId,
  Hex,
  isStrictHexString,
  parseCaipAssetType,
} from '@metamask/utils';
import { Point } from 'chart.js';
import type { SupportedCurrency } from '@metamask/core-backend';
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

/** Query key used when the asset cannot be resolved and the query is disabled. */
const DISABLED_QUERY_KEY = [
  'metamask-extension',
  'assetHistoricalPrices',
  'v3',
  'disabled',
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
  try {
    // getAssetId re-uses the assets-controllers v3 spot-prices logic and apply on V3 historical-prices
    const caipAssetType = isStrictHexString(chainId)
      ? (getAssetId({
          chainId,
          tokenAddress: address,
        }) ?? toAssetId(address, chainId))
      : toAssetId(address, chainId);

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
  } catch {
    return null;
  }
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
  const flatlinePlaceholder: { prices: [number, number][] } = {
    prices: [
      [Date.now() - 24 * 60 * 60 * 1000, 0],
      [Date.now(), 0],
    ],
  };

  const v3Params = useMemo(
    () => getV3HistoricalPricesCaipParams(chainId, address),
    [chainId, address],
  );

  const timePeriod = useMemo(
    () => fromIso8601DurationToPriceApiTimePeriod(timeRange),
    [timeRange],
  );

  // The client's query options carry the canonical queryKey, queryFn (with
  // the configured base URL), staleTime, and gcTime.
  const queryOptions = useMemo(
    () =>
      v3Params
        ? apiClient.prices.getV3HistoricalPricesQueryOptions(
            v3Params.caipChainId,
            v3Params.assetType,
            {
              currency: currency as SupportedCurrency,
              timePeriod,
            },
          )
        : null,
    [v3Params, currency, timePeriod],
  );

  const {
    data: prices = [],
    isFetching,
    isLoading,
    isFetchedAfterMount,
    isPlaceholderData,
  } = useQuery({
    queryKey: queryOptions?.queryKey ?? DISABLED_QUERY_KEY,
    queryFn: queryOptions?.queryFn ?? (() => ({ prices: [] })),
    staleTime: queryOptions?.staleTime,
    gcTime: queryOptions?.gcTime,
    enabled: Boolean(queryOptions),
    placeholderData: (previousData) => previousData ?? flatlinePlaceholder,
    retry: false,
    select: transformPricesToPoints,
  });

  const metadata = useMemo(() => deriveMetadata(prices), [prices]);

  return {
    loading: isLoading,
    isFetching,
    isFetchedAfterMount,
    isPlaceholderData,
    data: { prices, metadata },
  };
};
