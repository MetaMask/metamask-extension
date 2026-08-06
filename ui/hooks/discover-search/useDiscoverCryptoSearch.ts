import { useQuery } from '@tanstack/react-query';
import {
  getTrendingTokens,
  searchTokens,
  type TrendingAsset,
} from '@metamask/assets-controllers';

import {
  DISCOVER_SEARCH_CHAIN_IDS,
  DISCOVER_SEARCH_GC_TIME_MS,
  DISCOVER_SEARCH_PAGE_SIZE,
  DISCOVER_SEARCH_QUERY_KEY_ROOT,
  DISCOVER_SEARCH_STALE_TIME_MS,
} from './constants';
import type { TokenSearchMarketResult } from './types';

export type UseDiscoverCryptoSearchOptions = {
  query: string;
  enabled?: boolean;
};

export type UseDiscoverCryptoSearchResult = {
  data: TrendingAsset[];
  totalCount?: number;
  isLoading: boolean;
  error: Error | null;
};

type CryptoSearchPage = {
  data: TrendingAsset[];
  totalCount?: number;
};

const mapSearchResultToTrendingAsset = (
  item: TokenSearchMarketResult,
): TrendingAsset => ({
  assetId: item.assetId,
  name: item.name,
  symbol: item.symbol,
  decimals: item.decimals,
  price: item.price ?? '0',
  marketCap: item.marketCap ?? 0,
  aggregatedUsdVolume: item.aggregatedUsdVolume ?? 0,
  priceChangePct: item.pricePercentChange1d
    ? { h24: item.pricePercentChange1d }
    : undefined,
  rwaData: item.rwaData,
  securityData: item.securityData,
});

/**
 * Crypto Discover feed: trending when query is empty, market-data search otherwise.
 * @param options0
 * @param options0.query
 * @param options0.enabled
 */
export const useDiscoverCryptoSearch = ({
  query,
  enabled = true,
}: UseDiscoverCryptoSearchOptions): UseDiscoverCryptoSearchResult => {
  const trimmedQuery = query.trim();
  const isSearch = trimmedQuery.length > 0;

  const trendingQuery = useQuery<TrendingAsset[], Error>({
    queryKey: [
      ...DISCOVER_SEARCH_QUERY_KEY_ROOT,
      'crypto',
      'trending',
      DISCOVER_SEARCH_CHAIN_IDS,
    ] as const,
    queryFn: async (): Promise<TrendingAsset[]> =>
      getTrendingTokens({
        chainIds: DISCOVER_SEARCH_CHAIN_IDS,
        sort: 'h24_trending',
        minLiquidity: 200_000,
        minVolume24hUsd: 1_000_000,
        includeTokenSecurityData: true,
      }),
    enabled: enabled && !isSearch,
    staleTime: DISCOVER_SEARCH_STALE_TIME_MS,
    cacheTime: DISCOVER_SEARCH_GC_TIME_MS,
  });

  const searchQuery = useQuery<CryptoSearchPage, Error>({
    queryKey: [
      ...DISCOVER_SEARCH_QUERY_KEY_ROOT,
      'crypto',
      'search',
      trimmedQuery,
      DISCOVER_SEARCH_CHAIN_IDS,
    ] as const,
    queryFn: async (): Promise<CryptoSearchPage> => {
      const response = await searchTokens(
        DISCOVER_SEARCH_CHAIN_IDS,
        trimmedQuery,
        {
          limit: DISCOVER_SEARCH_PAGE_SIZE,
          includeMarketData: true,
          includeTokenSecurityData: true,
        },
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const data = (response.data as TokenSearchMarketResult[])
        .filter((item) => !item.rwaData)
        .map(mapSearchResultToTrendingAsset);

      return {
        data,
        totalCount: response.totalCount ?? data.length,
      };
    },
    enabled: enabled && isSearch,
    staleTime: DISCOVER_SEARCH_STALE_TIME_MS,
    cacheTime: DISCOVER_SEARCH_GC_TIME_MS,
  });

  if (isSearch) {
    return {
      data: searchQuery.data?.data ?? [],
      totalCount: searchQuery.data?.totalCount,
      isLoading: searchQuery.isLoading || searchQuery.isFetching,
      error: searchQuery.error ?? null,
    };
  }

  return {
    data: trendingQuery.data ?? [],
    isLoading: trendingQuery.isLoading || trendingQuery.isFetching,
    error: trendingQuery.error ?? null,
  };
};
