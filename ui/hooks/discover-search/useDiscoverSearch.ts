import { useMemo } from 'react';

import { useDebouncedValue } from '../useDebouncedValue';
import { DISCOVER_SEARCH_DEBOUNCE_MS } from './constants';
import type { DiscoverSearchResult, DiscoverSearchTab } from './types';
import { useDiscoverCryptoSearch } from './useDiscoverCryptoSearch';
import { useDiscoverPerpsSearch } from './useDiscoverPerpsSearch';
import { useDiscoverStocksSearch } from './useDiscoverStocksSearch';

export type UseDiscoverSearchOptions = {
  query: string;
  activeTab: DiscoverSearchTab;
};

/**
 * Orchestrates Crypto, Perps, and Stocks feeds for Discover search (mobile Explore pattern).
 * @param options0
 * @param options0.query
 * @param options0.activeTab
 */
export const useDiscoverSearch = ({
  query,
  activeTab,
}: UseDiscoverSearchOptions): DiscoverSearchResult => {
  const debouncedQuery = useDebouncedValue(query, DISCOVER_SEARCH_DEBOUNCE_MS);
  const isDebouncing = query !== debouncedQuery;
  const isPerpsSearchActive = activeTab === 'all' || activeTab === 'perps';

  const cryptoSection = useDiscoverCryptoSearch({ query: debouncedQuery });
  const perps = useDiscoverPerpsSearch({
    query: debouncedQuery,
    enabled: isPerpsSearchActive,
  });
  const stocks = useDiscoverStocksSearch({ query: debouncedQuery });

  return useMemo(
    () => ({
      crypto: {
        id: 'crypto' as const,
        items: cryptoSection.data,
        isLoading: isDebouncing || cryptoSection.isLoading,
        error: cryptoSection.error,
        totalCount: cryptoSection.totalCount,
        hasNextPage: cryptoSection.hasNextPage,
        isFetchingNextPage: cryptoSection.isFetchingNextPage,
        fetchNextPage: cryptoSection.fetchNextPage,
      },
      perps: {
        id: 'perps' as const,
        items: perps.data,
        isLoading: isPerpsSearchActive && (isDebouncing || perps.isLoading),
        error: perps.error,
        totalCount: perps.totalCount,
      },
      stocks: {
        id: 'stocks' as const,
        items: stocks.data,
        isLoading: isDebouncing || stocks.isLoading,
        error: stocks.error,
        totalCount: stocks.totalCount,
        hasNextPage: stocks.hasNextPage,
        isFetchingNextPage: stocks.isFetchingNextPage,
        fetchNextPage: stocks.fetchNextPage,
      },
      isDebouncing,
    }),
    [
      cryptoSection.data,
      cryptoSection.error,
      cryptoSection.isLoading,
      cryptoSection.totalCount,
      cryptoSection.hasNextPage,
      cryptoSection.isFetchingNextPage,
      cryptoSection.fetchNextPage,
      isDebouncing,
      isPerpsSearchActive,
      perps.data,
      perps.error,
      perps.isLoading,
      perps.totalCount,
      stocks.data,
      stocks.error,
      stocks.isLoading,
      stocks.totalCount,
      stocks.hasNextPage,
      stocks.isFetchingNextPage,
      stocks.fetchNextPage,
    ],
  );
};
