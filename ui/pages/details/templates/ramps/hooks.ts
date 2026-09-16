import { useMemo } from 'react';
import type { ActivityListItem } from '../../../../../shared/lib/activity/types';
import { useRampsOrders } from '../../../../hooks/ramps/useRampsOrders';
import { mapRampsOrderSafely } from '../../../../hooks/ramps/utils/mapRampsOrderSafely';

export type RampOrderActivityItem = Extract<
  ActivityListItem,
  { type: 'rampBuy' | 'rampSell' }
>;

/**
 * Looks up a ramps order by details-route identifier and maps it for the
 * activity details UI.
 *
 * @param txIdentifier - Settlement hash or internal ramps order code.
 * @returns The mapped ramp activity item, or undefined when not found /
 * unmappable.
 */
export function useRampsDetailsItem(
  txIdentifier: string | undefined,
): RampOrderActivityItem | undefined {
  const { orders, getOrderById } = useRampsOrders();

  return useMemo(() => {
    if (!txIdentifier) {
      return undefined;
    }

    const rampsOrderById = getOrderById(txIdentifier);
    const rampsOrder =
      rampsOrderById ??
      orders.find(
        (order) => order.txHash?.toLowerCase() === txIdentifier.toLowerCase(),
      );

    if (!rampsOrder) {
      return undefined;
    }

    const mapped = mapRampsOrderSafely(rampsOrder);

    if (!mapped || (mapped.type !== 'rampBuy' && mapped.type !== 'rampSell')) {
      return undefined;
    }

    return mapped;
  }, [getOrderById, orders, txIdentifier]);
}
