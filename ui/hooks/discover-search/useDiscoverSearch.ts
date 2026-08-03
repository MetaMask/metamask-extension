import { useEffect, useMemo, useState } from 'react';

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
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(query),
      DISCOVER_SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [query]);

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
        items: cryptoSection.data,
        isLoading: isDebouncing || cryptoSection.isLoading,
        error: cryptoSection.error,
      },
      perps: {
        items: perps.data,
        isLoading: isPerpsSearchActive && (isDebouncing || perps.isLoading),
        error: perps.error,
      },
      stocks: {
        items: stocks.data,
        isLoading: isDebouncing || stocks.isLoading,
        error: stocks.error,
      },
      isDebouncing,
    }),
    [
      cryptoSection.data,
      cryptoSection.error,
      cryptoSection.isLoading,
      isDebouncing,
      isPerpsSearchActive,
      perps.data,
      perps.error,
      perps.isLoading,
      stocks.data,
      stocks.error,
      stocks.isLoading,
    ],
  );
};
