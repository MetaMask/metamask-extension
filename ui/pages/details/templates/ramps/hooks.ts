import { useMemo } from 'react';
import type { ActivityListItem } from '../../../../../shared/lib/activity/types';
import { useRampsOrders } from '../../../../hooks/ramps/useRampsOrders';
import {
  mapRampsOrderSafely,
  withEvmHashPrefix,
} from '../../../../hooks/ramps/utils/mapRampsOrderSafely';

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
    // The details-route identifier is the mapped item's hash: `0x`-prefixed
    // for EVM orders with bare provider hashes (e.g. Coinbase), bare for
    // non-EVM orders whose hashes pass through untouched. Compare both forms
    // of the raw order's txHash so either case resolves.
    const normalizedIdentifier = txIdentifier.toLowerCase();
    const rampsOrder =
      rampsOrderById ??
      orders.find((order) => {
        const rawHash = order.txHash?.toLowerCase();
        return (
          rawHash === normalizedIdentifier ||
          withEvmHashPrefix(rawHash)?.toLowerCase() === normalizedIdentifier
        );
      });

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
