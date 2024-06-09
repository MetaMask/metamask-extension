import { useEffect, useState } from 'react';
// @ts-expect-error suppress CommonJS vs ECMAScript error
import { Point } from 'chart.js';
import { useSelector } from 'react-redux';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { MINUTE } from '../../../shared/constants/time';
import { getShouldShowFiat } from '../../selectors';
import { chainSupportsPricing } from './util';

/** Time range units supported by the price API */
export type TimeRange = `${number}D` | `${number}M` | `${number}Y`;
export type HistoricalPrices = {
  prices?: Point[];
  edges?: { xMin: Point; xMax: Point; yMin: Point; yMax: Point };
};

export const useHistoricalPrices = ({
  chainId,
  address,
  currency,
  timeRange,
}: {
  chainId: `0x${string}`;
  address: string;
  currency: string;
  timeRange: TimeRange;
}) => {
  const showFiat = useSelector(getShouldShowFiat);
  const chainSupported = showFiat && chainSupportsPricing(chainId);

  const [loading, setLoading] = useState<boolean>(chainSupported);
  const [data, setData] = useState<HistoricalPrices>({});

  if (chainSupported) {
    useEffect(() => {
      setLoading(true);
      fetchWithCache({
        url: `https://price.api.cx.metamask.io/v1/chains/${chainId}/historical-prices/${address}?vsCurrency=${currency}&timePeriod=${timeRange}`,
        cacheOptions: { cacheRefreshTime: 5 * MINUTE },
        functionName: 'GetAssetHistoricalPrices',
        fetchOptions: { headers: { 'X-Client-Id': 'extension' } },
      })
        .catch(() => ({}))
        .then((resp?: { prices?: number[][] }) => {
          const prices = resp?.prices?.map((p) => ({ x: p?.[0], y: p?.[1] }));

          let edges;
          if (prices && prices.length > 0) {
            let [xMin, xMax, yMin, yMax]: Point[] = [];
            for (const p of prices) {
              xMin = !xMin || p.x < xMin.x ? p : xMin;
              xMax = !xMax || p.x > xMax.x ? p : xMax;
              yMin = !yMin || p.y < yMin.y ? p : yMin;
              yMax = !yMax || p.y > yMax.y ? p : yMax;
            }
            edges = { xMin, xMax, yMin, yMax };
          }

          setData({ prices, edges });
          setLoading(false);
        });
    }, [chainId, address, currency, timeRange]);
  }
  return { loading, data };
};
