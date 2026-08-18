import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectRampsActivityItems } from '../../selectors/rampsController';
import {
  activityMatchesAssetId,
  type ActivityListFilter,
} from '../../pages/activity/helpers';

export function useRampsOrderActivity(filters: ActivityListFilter) {
  // Hidden statuses / excludeFromPurchases are filtered by mapRampsOrder.
  const items = useSelector(selectRampsActivityItems);
  const assetId = 'assetId' in filters ? filters.assetId : undefined;
  const networks = 'networks' in filters ? filters.networks : undefined;

  return useMemo(() => {
    if (assetId) {
      return items.filter((item) => activityMatchesAssetId(item, assetId));
    }
    if (!networks?.length) {
      return [];
    }
    const selectedNetworks = new Set(networks);
    return items.filter(
      (item) => item.chainId && selectedNetworks.has(item.chainId),
    );
  }, [assetId, items, networks]);
}
