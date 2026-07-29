import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { PerpsMarketData } from '@metamask/perps-controller';

import { filterMarketsByQuery } from '../../components/app/perps/utils';
import { usePerpsLiveMarketListData } from '../perps/stream/usePerpsLiveMarketListData';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';

export type UseDiscoverPerpsSearchOptions = {
  query: string;
  enabled?: boolean;
};

export type UseDiscoverPerpsSearchResult = {
  data: PerpsMarketData[];
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
  const { markets, isInitialLoading, error } = usePerpsLiveMarketListData();

  const data = useMemo(() => {
    if (!enabled || !isPerpsAvailable) {
      return [];
    }

    return filterMarketsByQuery(markets, query);
  }, [enabled, isPerpsAvailable, markets, query]);

  return {
    data,
    isLoading: Boolean(enabled && isPerpsAvailable && isInitialLoading),
    error: error ? new Error(String(error)) : null,
  };
};
