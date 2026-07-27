import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectRampsOrdersForSelectedAccount } from '../../selectors/rampsController';
import { mapRampsOrderSafely } from '../../hooks/ramps/utils/mapRampsOrderSafely';
import { activityMatchesAssetId, type ActivityListFilter } from './helpers';

export function useRampsOrderActivity(filters: ActivityListFilter) {
  const orders = useSelector(selectRampsOrdersForSelectedAccount);
  const assetId = 'assetId' in filters ? filters.assetId : undefined;
  const networks = 'networks' in filters ? filters.networks : undefined;

  const items = useMemo(
    () => orders.map(mapRampsOrderSafely).filter((item) => item !== undefined),
    [orders],
  );

  return useMemo(() => {
    if (assetId) {
      return items.filter((item) => activityMatchesAssetId(item, assetId));
    }

    if (!networks?.length) {
      return [];
    }

    const selectedNetworks = new Set(networks);
    return items.filter((item) => selectedNetworks.has(item.chainId));
  }, [assetId, items, networks]);
}
