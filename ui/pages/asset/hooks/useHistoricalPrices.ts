import { useEffect, useState } from 'react';
import { HistoricalPriceValue } from '@metamask/snaps-sdk';
import {
  CaipAssetType,
  CaipChainId,
  Hex,
  isCaipChainId,
} from '@metamask/utils';
// @ts-expect-error suppress CommonJS vs ECMAScript error
import { Point } from 'chart.js';
import { useDispatch, useSelector } from 'react-redux';
import { MINUTE } from '../../../../shared/constants/time';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { getShouldShowFiat } from '../../../selectors';
import { getHistoricalPrices } from '../../../selectors/assets';
import {
  chainSupportsPricing,
  fromIso8601DurationToPriceApiTimePeriod,
} from '../util';
import { fetchHistoricalPricesForAsset } from '../../../store/actions';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';

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

type UseHistoricalPricesParams = {
  chainId: Hex | CaipChainId;
  address: string;
  currency: string;
  timeRange: string;
};

/**
 * Derives some metadata from the prices.
 *
 * @param prices - The prices to derive the metadata from.
 * @returns The metadata derived from the prices.
 */
const deriveMetadata = (prices: Point[]) => {
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

  return { minPricePoint, maxPricePoint, xMin, xMax, yMin, yMax };
};

/**
 * Internal hook that fetches the historical prices for EVM chains. Returns default values otherwise.
 *
 * @param param0 - The parameters for the useHistoricalPrices hook.
 * @param param0.chainId - The chain ID of the asset.
 * @param param0.address - The address of the asset.
 * @param param0.currency - The currency of the asset.
 * @param param0.timeRange - The chart time range, as an ISO 8601 duration string ("P1D", "P1M", "P1Y", "P3YT45S", ...)
 * @returns The historical prices for the given asset and time range.
 */
const useHistoricalPricesEvm = ({
  chainId,
  address,
  currency,
  timeRange,
}: UseHistoricalPricesParams) => {
  const isEvm = !isCaipChainId(chainId);
  const showFiat: boolean = useSelector(getShouldShowFiat);

  const [loading, setLoading] = useState<boolean>(false);
  const [prices, setPrices] = useState<Point[]>([]);
  const [metadata, setMetadata] = useState<HistoricalPrices['metadata']>(
    DEFAULT_USE_HISTORICAL_PRICES_METADATA,
  );

  // Fetch the prices, and set them locally as a result of the fetch
  useEffect(() => {
    if (!isEvm) {
      return;
    }

    const chainSupported = showFiat && chainSupportsPricing(chainId as Hex);
    if (!chainSupported) {
      return;
    }

    const startTime = performance.now();

    const traceContext = trace({
      name: TraceName.GetAssetHistoricalPrices,
      startTime,
    });

    trace({
      name: TraceName.GetAssetHistoricalPrices,
      startTime,
      parentContext: traceContext,
    });

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
        endTrace({
          name: TraceName.GetAssetHistoricalPrices,
          timestamp: performance.timeOrigin + startTime,
        });
        setLoading(false);
      });
  }, [isEvm, chainId, address, currency, timeRange, showFiat]);

  // Compute the metadata
  useEffect(() => {
    if (!isEvm) {
      return;
    }
    const metadataToSet = deriveMetadata(prices);
    setMetadata(metadataToSet);
  }, [isEvm, prices]);

  return { loading, data: { prices, metadata } };
};

/**
 * Internal hook that fetches the historical prices for non-EVM chains. Returns default values otherwise.
 *
 * @param param0 - The parameters for the useHistoricalPrices hook.
 * @param param0.chainId - The chain ID of the asset.
 * @param param0.address - The address of the asset.
 * @param param0.currency - The currency of the asset.
 * @param param0.timeRange - The chart time range, as an ISO 8601 duration string ("P1D", "P1M", "P1Y", "P3YT45S", ...)
 * @returns The historical prices for the given asset and time range.
 */
const useHistoricalPricesNonEvm = ({
  chainId,
  address,
  currency,
  timeRange,
}: UseHistoricalPricesParams) => {
  const isEvm = !isCaipChainId(chainId);
  const [loading, setLoading] = useState<boolean>(false);
  const [prices, setPrices] = useState<Point[]>([]);
  const [metadata, setMetadata] = useState<HistoricalPrices['metadata']>(
    DEFAULT_USE_HISTORICAL_PRICES_METADATA,
  );

  const historicalPricesNonEvm = useSelector(getHistoricalPrices);

  const dispatch = useDispatch();

  /**
   * Fetch the prices by dispatching an action and then updating the redux state.
   * So we follow up with an other effect that will respond on the redux state update and set the prices locally in this hook.
   */
  useEffect(() => {
    if (isEvm) {
      return () => {
        // No clean up needed
      };
    }

    // On non-EVM, we fetch the prices from the snap, then store them in the redux state, and grab them from the redux state
    const fetchPrices = async () => {
      setLoading(true);
      try {
        console.log('FETCHING HISTORICAL PRICES FOR NON-EVM', {
          address,
          chainId,
        });
        await dispatch(fetchHistoricalPricesForAsset(address as CaipAssetType));
      } catch (error) {
        console.error(
          'Error fetching historical prices for %s on %s',
          address,
          chainId,
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const intervalId = setInterval(fetchPrices, 60000); // Refresh every minute
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [isEvm, chainId, address, dispatch]);

  // Retrieve the prices from the state
  useEffect(() => {
    if (isEvm) {
      return;
    }

    const historicalPricesNonEvmThisTokenAndPeriod =
      historicalPricesNonEvm?.[address as CaipAssetType]?.[currency]?.intervals[
        timeRange
      ] ?? [];
    const pricesToSet = historicalPricesNonEvmThisTokenAndPeriod.map(
      ([x, y]: HistoricalPriceValue) => ({ x, y: Number(y) }),
    );
    setPrices(pricesToSet);
  }, [isEvm, historicalPricesNonEvm, address, currency, timeRange]);

  // Compute the metadata
  useEffect(() => {
    if (isEvm) {
      return;
    }

    const metadataToSet = deriveMetadata(prices);
    setMetadata(metadataToSet);
  }, [isEvm, prices]);

  return { loading, data: { prices, metadata } };
};

/**
 * Exposed hook that fetches the historical prices for a given asset and over a given duration.
 * Uses the correct internal hook based on the chain type.
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
  const isEvm = !isCaipChainId(chainId);

  const historicalPricesEvm = useHistoricalPricesEvm({
    chainId,
    address,
    currency,
    timeRange,
  });

  const historicalPricesNonEvm = useHistoricalPricesNonEvm({
    chainId,
    address,
    currency,
    timeRange,
  });

  if (isEvm) {
    return historicalPricesEvm;
  }

  return historicalPricesNonEvm;
};
