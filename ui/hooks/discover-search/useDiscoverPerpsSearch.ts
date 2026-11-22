import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Fuse, { type FuseOptions } from 'fuse.js';
import type { PerpsMarketData } from '@metamask/perps-controller';

import { filterMarketsByQuery } from '../../components/app/perps/utils';
import { usePerpsLiveMarketListData } from '../perps/stream/usePerpsLiveMarketListData';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';

const PERPS_FUSE_OPTIONS: FuseOptions<PerpsMarketData> = {
  shouldSort: true,
  threshold: 0.2,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ['symbol', 'name'],
};

export type UseDiscoverPerpsSearchOptions = {
  query: string;
  enabled?: boolean;
};

export type UseDiscoverPerpsSearchResult = {
  data: PerpsMarketData[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Perps Discover feed: client-side filter over live market list data.
 * @param options0
 * @param options0.query
 * @param options0.enabled
 */
export const useDiscoverPerpsSearch = ({
  query,
  enabled = true,
}: UseDiscoverPerpsSearchOptions): UseDiscoverPerpsSearchResult => {
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);
  const isPerpsSearchEnabled = enabled && isPerpsAvailable;
  const { markets, isInitialLoading, error } = usePerpsLiveMarketListData({
    activateStream: isPerpsSearchEnabled,
  });

  const data = useMemo(() => {
    if (!isPerpsSearchEnabled) {
      return [];
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [...markets].sort(
        (left, right) =>
          (Number.parseFloat(right.change24hPercent) || 0) -
          (Number.parseFloat(left.change24hPercent) || 0),
      );
    }

    const queryFiltered = filterMarketsByQuery(markets, trimmedQuery);
    // Fuse.js v3 returns market data directly, despite its bundled v6 types.
    return new Fuse(queryFiltered, PERPS_FUSE_OPTIONS).search(
      trimmedQuery,
    ) as unknown as PerpsMarketData[];
  }, [isPerpsSearchEnabled, markets, query]);

  return {
    data,
    totalCount: data.length,
    isLoading: Boolean(isPerpsSearchEnabled && isInitialLoading),
    error: isPerpsSearchEnabled && error ? new Error(String(error)) : null,
  };
};
