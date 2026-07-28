import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RampsOrderStatus, type RampsOrder } from '@metamask/ramps-controller';
import { selectRampsOrdersForSelectedAccount } from '../../selectors/rampsController';
import { mapRampsOrderSafely } from '../../hooks/ramps/utils/mapRampsOrderSafely';
import { activityMatchesAssetId, type ActivityListFilter } from './helpers';

const BUY_SELL_TYPES = new Set(['rampBuy', 'rampSell']);

/**
 * A precreated order is an id we reserved before opening the provider's
 * checkout — the provider hasn't acknowledged it and its payload is empty, so
 * it would render as a blank "Buying" row. Checkout already confirmed itself
 * with the "opened in a new tab" toast, and the checkout watcher flips the
 * order to pending as soon as the provider redirects back, so nothing real is
 * hidden here.
 *
 * @param order - The raw ramps order.
 * @returns True when the order should appear in activity.
 */
function isAcknowledgedOrder(order: RampsOrder): boolean {
  if (order.excludeFromPurchases) {
    return false;
  }
  return order.status !== RampsOrderStatus.Precreated;
}

export function useRampsOrderActivity(filters: ActivityListFilter) {
  const orders = useSelector(selectRampsOrdersForSelectedAccount);
  const assetId = 'assetId' in filters ? filters.assetId : undefined;
  const networks = 'networks' in filters ? filters.networks : undefined;
  const kindFilter = 'kindFilter' in filters ? filters.kindFilter : undefined;

  const items = useMemo(
    () =>
      orders
        .filter(isAcknowledgedOrder)
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
