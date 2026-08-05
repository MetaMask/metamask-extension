import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRwas, type TrendingAsset } from '@metamask/assets-controllers';

import {
  DISCOVER_SEARCH_GC_TIME_MS,
  DISCOVER_SEARCH_PAGE_SIZE,
  DISCOVER_SEARCH_QUERY_KEY_ROOT,
  DISCOVER_SEARCH_STALE_TIME_MS,
  DISCOVER_STOCKS_CHAIN_IDS,
} from './constants';

export type UseDiscoverStocksSearchOptions = {
  query: string;
  enabled?: boolean;
};

export type UseDiscoverStocksSearchResult = {
  data: TrendingAsset[];
  totalCount?: number;
  isLoading: boolean;
  error: Error | null;
};

type StocksSearchPage = {
  data: TrendingAsset[];
  totalCount: number;
};

const normalizeRwaToken = (
  token: Awaited<ReturnType<typeof fetchRwas>>['data'][number],
): TrendingAsset => ({
  assetId: token.assetId,
  symbol: token.symbol,
  name: token.name,
  decimals: token.decimals,
  price: token.rwaData.price,
  aggregatedUsdVolume: token.rwaData.aggregatedUsdVolume,
  marketCap: token.rwaData.marketCap,
  priceChangePct: { h24: token.rwaData.priceChange },
  rwaData: token.rwaData as unknown as TrendingAsset['rwaData'],
});

/**
 * Tokenized stocks (RWA) Discover feed via `/v1/rwas`.
 * @param options0
 * @param options0.query
 * @param options0.enabled
 */
export const useDiscoverStocksSearch = ({
  query,
  enabled = true,
}: UseDiscoverStocksSearchOptions): UseDiscoverStocksSearchResult => {
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  // Empty query: Ethereum-only preview (matches mobile stocks feed).
  // Search: Ethereum + BNB so users can find stocks across supported RWA chains.
  const chainIds = useMemo(
    () =>
      hasQuery ? DISCOVER_STOCKS_CHAIN_IDS : [DISCOVER_STOCKS_CHAIN_IDS[0]],
    [hasQuery],
  );

  const stocksQuery = useQuery<StocksSearchPage, Error>({
    queryKey: [
      ...DISCOVER_SEARCH_QUERY_KEY_ROOT,
      'stocks',
      trimmedQuery,
      chainIds,
    ] as const,
    queryFn: async (): Promise<StocksSearchPage> => {
      const response = await fetchRwas({
        chainIds,
        query: hasQuery ? trimmedQuery : undefined,
        sortBy: 'price_change_desc',
        limit: DISCOVER_SEARCH_PAGE_SIZE,
      });

      const data = response.data.map(normalizeRwaToken);
      return {
        data,
        totalCount: response.totalCount ?? data.length,
      };
    },
    enabled,
    staleTime: DISCOVER_SEARCH_STALE_TIME_MS,
    gcTime: DISCOVER_SEARCH_GC_TIME_MS,
  });

  return {
    data: stocksQuery.data?.data ?? [],
    totalCount: stocksQuery.data?.totalCount,
    isLoading: stocksQuery.isLoading || stocksQuery.isFetching,
    error: stocksQuery.error ?? null,
  };
};
