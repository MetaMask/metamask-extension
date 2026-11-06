import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getTrendingTokens,
  searchTokens,
  type TrendingAsset,
} from '@metamask/assets-controllers';
import type { CaipChainId } from '@metamask/utils';
import { TOKEN_SEARCH_SERVICE_PROFILE } from '#shared/lib/token-search/token-search-api';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { getIsStellarSupportEnabled } from '../../selectors/multichain/feature-flags';
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
  const chainIds = DISCOVER_SEARCH_CHAIN_IDS;

  const trendingQuery = useQuery<TrendingAsset[], Error>({
    queryKey: [
      ...DISCOVER_SEARCH_QUERY_KEY_ROOT,
      'crypto',
      'trending',
      chainIds,
    ] as const,
    queryFn: async (): Promise<TrendingAsset[]> =>
      getTrendingTokens({
        chainIds,
        sort: 'h24_trending',
        minLiquidity: 200_000,
        minVolume24hUsd: 1_000_000,
        includeTokenSecurityData: true,
      }),
    enabled,
    staleTime: DISCOVER_SEARCH_STALE_TIME_MS,
    gcTime: DISCOVER_SEARCH_GC_TIME_MS,
  });

  const searchQuery = useInfiniteQuery({
    queryKey: [
      ...DISCOVER_SEARCH_QUERY_KEY_ROOT,
      'crypto',
      'search',
      trimmedQuery,
      chainIds,
    ] as const,
    queryFn: async ({ pageParam }): Promise<CryptoSearchPage> => {
      const response = await searchTokens(chainIds, trimmedQuery, {
        limit: DISCOVER_SEARCH_PAGE_SIZE,
        after: pageParam,
        includeMarketData: true,
        includeTokenSecurityData: true,
        serviceProfile: TOKEN_SEARCH_SERVICE_PROFILE,
      });

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
        pageInfo: response.pageInfo,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo?.hasNextPage
        ? (lastPage.pageInfo.endCursor ??
          lastPage.pageInfo.nextCursor ??
          undefined)
        : undefined,
    enabled: enabled && isSearch,
    staleTime: DISCOVER_SEARCH_STALE_TIME_MS,
    gcTime: DISCOVER_SEARCH_GC_TIME_MS,
  });

  if (isSearch) {
    // Active search: pass the API pages through in server relevance order —
    // no client-side merge of trending matches and no market-cap re-sort.
    // Cursor pages over live market data can repeat an asset, so exact
    // assetId repeats across pages are dropped (first occurrence wins) to
    // keep list rows unique; ordering is otherwise untouched.
    const pages = searchQuery.data?.pages ?? [];
    const seenAssetIds = new Set<string>();
    const data = pages
      .flatMap((page) => page.data)
      .filter((asset) => {
        if (seenAssetIds.has(asset.assetId)) {
          return false;
        }

        seenAssetIds.add(asset.assetId);
        return true;
      });
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
