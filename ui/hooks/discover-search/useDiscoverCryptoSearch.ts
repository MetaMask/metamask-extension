import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  error: Error | null;
};

type CryptoSearchPage = {
  data: TrendingAsset[];
  totalCount?: number;
  hasSearchResults: boolean;
  pageInfo?: {
    endCursor: string | null;
    hasNextPage: boolean;
    nextCursor?: string | null;
  };
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

const matchesSearchQuery = (asset: TrendingAsset, query: string): boolean => {
  const normalizedQuery = query.toLowerCase();

  return (
    asset.symbol?.toLowerCase().includes(normalizedQuery) ||
    asset.name?.toLowerCase().includes(normalizedQuery)
  );
};

const dedupeByAssetId = (assets: TrendingAsset[]): TrendingAsset[] => {
  const assetsById = new Map<string, TrendingAsset>();

  assets.forEach((asset) => {
    if (!assetsById.has(asset.assetId)) {
      assetsById.set(asset.assetId, asset);
    }
  });

  return Array.from(assetsById.values());
};

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
    enabled,
    staleTime: DISCOVER_SEARCH_STALE_TIME_MS,
    cacheTime: DISCOVER_SEARCH_GC_TIME_MS,
  });

  const searchQuery = useInfiniteQuery<CryptoSearchPage, Error>({
    queryKey: [
      ...DISCOVER_SEARCH_QUERY_KEY_ROOT,
      'crypto',
      'search',
      trimmedQuery,
      DISCOVER_SEARCH_CHAIN_IDS,
    ] as const,
    queryFn: async ({
      pageParam,
    }: {
      pageParam?: string;
    }): Promise<CryptoSearchPage> => {
      const response = await searchTokens(
        DISCOVER_SEARCH_CHAIN_IDS,
        trimmedQuery,
        {
          limit: DISCOVER_SEARCH_PAGE_SIZE,
          after: pageParam,
          includeMarketData: true,
          includeTokenSecurityData: true,
        },
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const searchResults = response.data as TokenSearchMarketResult[];
      const data = searchResults
        .filter((item) => !item.rwaData)
        .map(mapSearchResultToTrendingAsset);

      return {
        data,
        totalCount: response.totalCount ?? data.length,
        hasSearchResults: searchResults.length > 0,
        pageInfo: response.pageInfo,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo?.hasNextPage
        ? (lastPage.pageInfo.endCursor ??
          lastPage.pageInfo.nextCursor ??
          undefined)
        : undefined,
    enabled: enabled && isSearch,
    staleTime: DISCOVER_SEARCH_STALE_TIME_MS,
    cacheTime: DISCOVER_SEARCH_GC_TIME_MS,
  });

  if (isSearch) {
    const pages = searchQuery.data?.pages ?? [];
    const [firstPage, ...remainingPages] = pages;
    const firstPageData = firstPage?.data ?? [];
    const trendingMatches = (trendingQuery.data ?? []).filter(
      (asset) => !asset.rwaData && matchesSearchQuery(asset, trimmedQuery),
    );
    const sortedFirstPage = firstPage?.hasSearchResults
      ? dedupeByAssetId([...trendingMatches, ...firstPageData]).sort(
          (a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0),
        )
      : [];
    const seenAssetIds = new Set(sortedFirstPage.map((asset) => asset.assetId));
    const appendedData = remainingPages
      .flatMap((page) => page.data)
      .filter((asset) => {
        if (seenAssetIds.has(asset.assetId)) {
          return false;
        }

        seenAssetIds.add(asset.assetId);
        return true;
      });
    const data = [...sortedFirstPage, ...appendedData];
    const lastPage = pages.at(-1);

    return {
      data,
      totalCount: lastPage?.totalCount ?? data.length,
      isLoading: searchQuery.isLoading || searchQuery.isFetching,
      hasNextPage: searchQuery.hasNextPage ?? false,
      isFetchingNextPage: searchQuery.isFetchingNextPage,
      fetchNextPage: searchQuery.fetchNextPage,
      error: searchQuery.error ?? null,
    };
  }

  return {
    data: trendingQuery.data ?? [],
    isLoading: trendingQuery.isLoading || trendingQuery.isFetching,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: async () => undefined,
    error: trendingQuery.error ?? null,
  };
};
