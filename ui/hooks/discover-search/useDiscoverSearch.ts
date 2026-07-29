import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { DISCOVER_SEARCH_DEBOUNCE_MS } from './constants';
import type { DiscoverSearchResult } from './types';
import { useDiscoverCryptoSearch } from './useDiscoverCryptoSearch';
import { useDiscoverPerpsSearch } from './useDiscoverPerpsSearch';
import { useDiscoverStocksSearch } from './useDiscoverStocksSearch';

export type UseDiscoverSearchOptions = {
  query: string;
};

/**
 * Orchestrates Crypto, Perps, and Stocks feeds for Discover search (mobile Explore pattern).
 * @param options0
 * @param options0.query
 */
export const useDiscoverSearch = ({
  query,
}: UseDiscoverSearchOptions): DiscoverSearchResult => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(query),
      DISCOVER_SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [query]);

  const isDebouncing = query !== debouncedQuery;

  const cryptoSection = useDiscoverCryptoSearch({ query: debouncedQuery });
  const perps = useDiscoverPerpsSearch({
    query: debouncedQuery,
    enabled: isPerpsAvailable,
  });
  const stocks = useDiscoverStocksSearch({ query: debouncedQuery });

  return useMemo(
    () => ({
      crypto: {
        id: 'crypto' as const,
        titleKey: 'perpsFilterCrypto',
        items: cryptoSection.data,
        isLoading: isDebouncing || cryptoSection.isLoading,
        error: cryptoSection.error,
      },
      perps: {
        id: 'perps' as const,
        titleKey: 'perps',
        items: isPerpsAvailable ? perps.data : [],
        isLoading: isDebouncing || perps.isLoading,
        error: perps.error,
      },
      stocks: {
        id: 'stocks' as const,
        titleKey: 'perpsFilterStocks',
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
      isPerpsAvailable,
      perps.data,
      perps.error,
      perps.isLoading,
      stocks.data,
      stocks.error,
      stocks.isLoading,
    ],
  );
};
