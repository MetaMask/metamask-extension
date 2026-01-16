import { useState, useCallback, useMemo } from 'react';
import type { PerpsMarketData } from '../../components/app/perps/types';
import { filterMarketsByQuery } from '../../components/app/perps/utils';

interface UsePerpsSearchParams {
  /**
   * Markets to filter
   */
  markets: PerpsMarketData[];
  /**
   * Initial search visibility
   * @default false
   */
  initialSearchVisible?: boolean;
}

interface UsePerpsSearchReturn {
  /**
   * Current search query
   */
  searchQuery: string;
  /**
   * Update search query
   */
  setSearchQuery: (query: string) => void;
  /**
   * Whether search bar is visible
   */
  isSearchVisible: boolean;
  /**
   * Show/hide search bar
   */
  setIsSearchVisible: (visible: boolean) => void;
  /**
   * Toggle search visibility
   */
  toggleSearchVisibility: () => void;
  /**
   * Markets filtered by search query
   */
  filteredMarkets: PerpsMarketData[];
  /**
   * Clear search and hide search bar
   */
  clearSearch: () => void;
}

/**
 * Hook for managing market search state and filtering
 *
 * Responsibilities:
 * - Manages search query state
 * - Manages search visibility state
 * - Filters markets by symbol/name
 * - Type-safe field access
 *
 * @example
 * ```tsx
 * const { markets } = usePerpsMarkets();
 * const {
 *   searchQuery,
 *   setSearchQuery,
 *   isSearchVisible,
 *   toggleSearchVisibility,
 *   filteredMarkets,
 * } = usePerpsSearch({ markets });
 * ```
 */
export const usePerpsSearch = ({
  markets,
  initialSearchVisible = false,
}: UsePerpsSearchParams): UsePerpsSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(initialSearchVisible);

  const toggleSearchVisibility = useCallback(() => {
    setIsSearchVisible((prev) => !prev);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchVisible(false);
  }, []);

  // Filter markets based on search query
  const filteredMarkets = useMemo(() => {
    if (!isSearchVisible || !searchQuery.trim()) {
      return markets;
    }

    return filterMarketsByQuery(markets, searchQuery);
  }, [markets, searchQuery, isSearchVisible]);

  return {
    searchQuery,
    setSearchQuery,
    isSearchVisible,
    setIsSearchVisible,
    toggleSearchVisibility,
    filteredMarkets,
    clearSearch,
  };
};
