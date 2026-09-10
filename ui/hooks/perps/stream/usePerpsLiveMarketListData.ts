import { useCallback, useEffect, useMemo } from 'react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { getPerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';
import { formatPerpsFiatUniversal } from '../../../components/app/perps/utils/formatPerpsDisplayPrice';
import {
  usePerpsLiveMarketData,
  type UsePerpsLiveMarketDataReturn,
} from './usePerpsLiveMarketData';
import { usePerpsLivePrices } from './usePerpsLivePrices';

const DEFAULT_REFRESH_INTERVAL_MS = 30000;

export type UsePerpsLiveMarketListDataOptions = {
  refreshIntervalMs?: number;
  activateStream?: boolean;
};

export type UsePerpsLiveMarketListDataReturn = Pick<
  UsePerpsLiveMarketDataReturn,
  'cryptoMarkets' | 'hip3Markets' | 'isInitialLoading' | 'error' | 'refresh'
> & {
  markets: PerpsMarketData[];
  /** Both snapshots used during this render came from the live session. */
  isLive: boolean;
  /** Check the exact rendered rows against their live metadata and prices. */
  areMarketsLive: (renderedMarkets: readonly PerpsMarketData[]) => boolean;
};

export function usePerpsLiveMarketListData(
  options: UsePerpsLiveMarketListDataOptions = {},
): UsePerpsLiveMarketListDataReturn {
  const {
    refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
    activateStream = true,
  } = options;
  const {
    markets,
    cryptoMarkets,
    hip3Markets,
    isInitialLoading,
    error,
    refresh,
  } = usePerpsLiveMarketData({ autoSubscribe: activateStream });

  const marketSymbols = useMemo(
    () =>
      Array.from(new Set(markets.map((market) => market.symbol))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [markets],
  );
  // Use a stable key so the refresh effect only resets when the symbol set changes.
  const marketSymbolsKey = useMemo(
    () => marketSymbols.join('|'),
    [marketSymbols],
  );

  const { prices, isLive: pricesLive } = usePerpsLivePrices({
    symbols: marketSymbols,
    activateStream,
    includeMarketData: false,
  });

  useEffect(() => {
    if (!activateStream || !marketSymbolsKey) {
      return undefined;
    }

    const intervalId = globalThis.setInterval(() => {
      refresh();
    }, refreshIntervalMs);

    return () => globalThis.clearInterval(intervalId);
  }, [activateStream, marketSymbolsKey, refresh, refreshIntervalMs]);

  const liveMarkets = useMemo(() => {
    if (Object.keys(prices).length === 0) {
      return markets;
    }

    return markets.map((market) => {
      const liveUpdate = prices[market.symbol];
      if (!liveUpdate) {
        return market;
      }

      return {
        ...market,
        price: liveUpdate.price
          ? formatPerpsFiatUniversal(liveUpdate.price)
          : market.price,
        change24hPercent:
          liveUpdate.percentChange24h ?? market.change24hPercent,
      };
    });
  }, [markets, prices]);

  const liveMarketMap = useMemo(
    () => new Map(liveMarkets.map((market) => [market.symbol, market])),
    [liveMarkets],
  );
  const metadataMap = useMemo(
    () => new Map(markets.map((market) => [market.symbol, market])),
    [markets],
  );
  const areMarketsLive = useCallback(
    (renderedMarkets: readonly PerpsMarketData[]): boolean =>
      pricesLive &&
      renderedMarkets.length > 0 &&
      renderedMarkets.every((market) => {
        const metadata = metadataMap.get(market.symbol);
        const price = Number(prices[market.symbol]?.price);
        return (
          liveMarketMap.get(market.symbol) === market &&
          Number.isFinite(price) &&
          price > 0 &&
          metadata !== undefined &&
          getPerpsStreamManager().hasLiveMarketData([metadata])
        );
      }),
    [liveMarketMap, metadataMap, prices, pricesLive],
  );
  const liveCryptoMarkets = useMemo(
    () =>
      cryptoMarkets.map((market) => liveMarketMap.get(market.symbol) ?? market),
    [cryptoMarkets, liveMarketMap],
  );
  const liveHip3Markets = useMemo(
    () =>
      hip3Markets.map((market) => liveMarketMap.get(market.symbol) ?? market),
    [hip3Markets, liveMarketMap],
  );

  return {
    markets: liveMarkets,
    isLive: pricesLive && getPerpsStreamManager().hasLiveMarketData(markets),
    areMarketsLive,
    cryptoMarkets: liveCryptoMarkets,
    hip3Markets: liveHip3Markets,
    isInitialLoading,
    error,
    refresh,
  };
}
