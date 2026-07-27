import { mapRampsOrder, type RampsOrderLike } from '@metamask/client-utils';
import type { RampsOrder } from '@metamask/ramps-controller';

/**
 * mapRampsOrder expects `order.network` as `{ chainId }`, but some providers
 * (observed on the Banxa-backed staging provider) send it as a bare chain-id
 * string instead. Normalize that shape before mapping so real orders don't
 * get dropped over a provider quirk `mapRampsOrder` doesn't account for.
 *
 * @param order - The raw ramps order's `network` field.
 * @returns The order with `network` coerced to `{ chainId }`.
 */
function withNormalizedNetwork(order: RampsOrder): RampsOrder {
  const { network } = order;
  if (typeof network === 'string') {
    return { ...order, network: { name: '', chainId: network } };
  }
  return order;
}

/**
 * mapRampsOrder compares `orderType` against the lowercase literal `'buy'`,
 * but the real API returns it upper-cased (e.g. `"BUY"`, `"SELL"`) — every
 * real buy order was silently mapped as a sell. Lowercase it before mapping.
 *
 * @param order - The raw ramps order's `orderType` field.
 * @returns The order with `orderType` lowercased.
 */
function withNormalizedOrderType(order: RampsOrder): RampsOrder {
  return typeof order.orderType === 'string'
    ? { ...order, orderType: order.orderType.toLowerCase() }
    : order;
}

/**
 * mapRampsOrder throws if it still can't resolve a chainId after
 * normalization (e.g. the field is missing outright, such as briefly after a
 * checkout redirect before the backend has filled it in). Callers render
 * lists/pages that shouldn't crash over one unmappable order.
 *
 * @param order - The raw ramps order to map.
 * @returns The mapped activity item, or undefined if the order can't be mapped.
 */
export function mapRampsOrderSafely(
  order: RampsOrder,
): ReturnType<typeof mapRampsOrder> | undefined {
  try {
    const normalizedOrder = withNormalizedOrderType(
      withNormalizedNetwork(order),
    );
    return mapRampsOrder(normalizedOrder as unknown as RampsOrderLike);
  } catch {
    return undefined;
  }
}
