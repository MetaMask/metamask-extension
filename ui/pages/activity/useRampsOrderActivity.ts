import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectRampsOrdersForSelectedAccount } from '../../selectors/rampsController';
import { mapRampsOrderSafely } from '../../hooks/ramps/utils/mapRampsOrderSafely';
import { activityMatchesAssetId, type ActivityListFilter } from './helpers';

const BUY_SELL_TYPES = new Set(['rampBuy', 'rampSell']);

export function useRampsOrderActivity(filters: ActivityListFilter) {
  const orders = useSelector(selectRampsOrdersForSelectedAccount);
  const assetId = 'assetId' in filters ? filters.assetId : undefined;
  const networks = 'networks' in filters ? filters.networks : undefined;
  const kindFilter = 'kindFilter' in filters ? filters.kindFilter : undefined;

  const items = useMemo(
    () =>
      orders
        .map((order) => mapRampsOrderSafely(order))
        .filter((item) => item !== undefined),
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
    return items.filter((item) => {
      if (!selectedNetworks.has(item.chainId)) {
        return false;
      }
      if (kindFilter === 'buySell') {
        return BUY_SELL_TYPES.has(item.type);
      }
      return true;
    });
  }, [assetId, items, kindFilter, networks]);
}
