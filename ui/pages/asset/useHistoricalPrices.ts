import { useEffect, useState } from 'react';
import { HistoricalPriceValue } from '@metamask/snaps-sdk';
import { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
// @ts-expect-error suppress CommonJS vs ECMAScript error
import { Point } from 'chart.js';
import { useSelector } from 'react-redux';
import { MINUTE } from '../../../shared/constants/time';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { getShouldShowFiat } from '../../selectors';
import { getHistoricalPrices } from '../../selectors/assets';
import { getMultichainIsEvm } from '../../selectors/multichain';
import {
  chainSupportsPricing,
  fromIso8601DurationToPriceApiTimePeriod,
} from './util';

export type HistoricalPrices = {
  /** The prices data points. Is an empty array if the prices could not be loaded. */
  prices: Point[];
  /** Metadata derived from the prices array, computed here to encaspulate logic and leverage memoization. */
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

/**
 * Fetches the historical prices for a given asset and over a given duration.
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
}: {
  chainId: Hex | CaipChainId;
  address: string;
  currency: string;
  timeRange: string;
}) => {
  const isEvm = useSelector(getMultichainIsEvm);
  const showFiat: boolean = useSelector(getShouldShowFiat);

  const [loading, setLoading] = useState<boolean>(false);
  const [prices, setPrices] = useState<Point[]>([]);
  const [metadata, setMetadata] = useState<HistoricalPrices['metadata']>(
    DEFAULT_USE_HISTORICAL_PRICES_METADATA,
  );

  const historicalPricesNonEvm = useSelector(getHistoricalPrices);

  // Fetch the prices
  useEffect(() => {
    if (isEvm) {
      const chainSupported = showFiat && chainSupportsPricing(chainId as Hex);
      if (!chainSupported) {
        return;
      }
      setLoading(true);
      const timePeriod = fromIso8601DurationToPriceApiTimePeriod(timeRange);
      fetchWithCache({
        url: `https://price.api.cx.metamask.io/v1/chains/${chainId}/historical-prices/${address}?vsCurrency=${currency}&timePeriod=${timePeriod}`,
        cacheOptions: { cacheRefreshTime: 5 * MINUTE },
        functionName: 'GetAssetHistoricalPrices',
        fetchOptions: { headers: { 'X-Client-Id': 'extension' } },
      })
        .catch(() => ({}))
        .then((resp?: { prices?: number[][] }) => {
          const pricesToSet =
            resp?.prices?.map((p) => ({ x: p?.[0], y: p?.[1] })) ?? [];
          setPrices(pricesToSet);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const historicalPricesNonEvmThisTokenAndPeriod =
        historicalPricesNonEvm[address as CaipAssetType]?.[currency]?.intervals[
          timeRange
        ] ?? [];
      const pricesToSet = historicalPricesNonEvmThisTokenAndPeriod.map(
        ([x, y]: HistoricalPriceValue) => ({ x, y: Number(y) }),
      );
      setPrices(pricesToSet);
    }
  }, [
    chainId,
    address,
    currency,
    timeRange,
    isEvm,
    historicalPricesNonEvm,
    showFiat,
  ]);

  // Compute the metadata
  useEffect(() => {
    const xMin = Math.min(...prices.map((p) => p.x));
    const xMax = Math.max(...prices.map((p) => p.x));
    const yMin = Math.min(...prices.map((p) => p.y));
    const yMax = Math.max(...prices.map((p) => p.y));

    const minPricePoint =
      prices.find((p) => p.y === yMin) ??
      DEFAULT_USE_HISTORICAL_PRICES_METADATA.minPricePoint;
    const maxPricePoint =
      prices.find((p) => p.y === yMax) ??
      DEFAULT_USE_HISTORICAL_PRICES_METADATA.maxPricePoint;

    setMetadata({ minPricePoint, maxPricePoint, xMin, xMax, yMin, yMax });
  }, [prices]);

  return { loading, data: { prices, metadata } };
};
