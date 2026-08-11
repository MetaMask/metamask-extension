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
  const isPerpsSearchEnabled = enabled && isPerpsAvailable;
  const { markets, isInitialLoading, error } = usePerpsLiveMarketListData({
    activateStream: isPerpsSearchEnabled,
  });

  const data = useMemo(() => {
    if (!isPerpsSearchEnabled) {
      return [];
    }

    return filterMarketsByQuery(markets, query);
  }, [isPerpsSearchEnabled, markets, query]);

  return {
    data,
    isLoading: Boolean(isPerpsSearchEnabled && isInitialLoading),
    error: isPerpsSearchEnabled && error ? new Error(String(error)) : null,
  };
};
