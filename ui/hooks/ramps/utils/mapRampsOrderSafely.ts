import { mapRampsOrder, type RampsOrderLike } from '@metamask/client-utils';
import { getInternalOrderCode, type RampsOrder } from '@metamask/ramps-controller';
import { getPendingOrderPreview } from './pendingOrderPreview';

/**
 * mapRampsOrder expects `order.network` as `{ chainId }`, but some providers
 * (observed on the Banxa-backed staging provider) send it as a bare chain-id
 * string instead. Normalize that shape before mapping so real orders don't
 * get dropped over a provider quirk `mapRampsOrder` doesn't account for.
 *
 * A `fallbackChainId` seeds the chainId when the order has none yet — right
 * after a checkout redirect the callback order's `network.chainId` isn't
 * populated, so the caller supplies the chain it already knows (e.g. the URL /
 * user-selected token) to keep the details view from rendering blank.
 *
 * @param order - The raw ramps order.
 * @param fallbackChainId - Chain to use when the order's is missing.
 * @returns The order with `network` coerced to `{ chainId }`.
 */
function withNormalizedNetwork(
  order: RampsOrder,
  fallbackChainId?: string,
): RampsOrder {
  const { network } = order;
  if (typeof network === 'string') {
    return { ...order, network: { name: '', chainId: network } };
  }
  if (!network?.chainId && fallbackChainId) {
    return {
      ...order,
      network: { name: network?.name ?? '', chainId: fallbackChainId },
    };
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
 * A precreated order's own payload is still empty (no token/amount/fees)
 * until the provider fills it in — overlay what the user picked on the
 * build-quote screen (stashed via `setPendingOrderPreview`) so the activity
 * list/details view shows a best-effort amount instead of a blank one. Real
 * fields always win once the provider/polling populates them.
 *
 * @param order - The raw ramps order.
 * @returns The order with crypto/fiat fields filled from the preview, if any.
 */
function withPendingOrderPreview(order: RampsOrder): RampsOrder {
  if (order.cryptoCurrency && order.fiatCurrency) {
    return order;
  }
  const preview = getPendingOrderPreview(getInternalOrderCode(order));
  if (!preview) {
    return order;
  }
  return {
    ...order,
    cryptoCurrency: order.cryptoCurrency ?? preview.cryptoCurrency,
    cryptoAmount: order.cryptoCurrency
      ? order.cryptoAmount
      : preview.cryptoAmount,
    fiatCurrency: order.fiatCurrency ?? preview.fiatCurrency,
    fiatAmount: order.fiatCurrency ? order.fiatAmount : preview.fiatAmount,
    totalFeesFiat: order.fiatCurrency
      ? order.totalFeesFiat
      : preview.totalFeesFiat,
  };
}

/**
 * mapRampsOrder throws if it still can't resolve a chainId after
 * normalization (e.g. the field is missing outright, such as briefly after a
 * checkout redirect before the backend has filled it in). Callers render
 * lists/pages that shouldn't crash over one unmappable order.
 *
 * @param order - The raw ramps order to map.
 * @param fallbackChainId - Chain to use when the order has none yet (e.g. a
 * just-resolved redirect order); passed through to network normalization.
 * @returns The mapped activity item, or undefined if the order can't be mapped.
 */
export function mapRampsOrderSafely(
  order: RampsOrder,
  fallbackChainId?: string,
): ReturnType<typeof mapRampsOrder> | undefined {
  try {
    const normalizedOrder = withNormalizedOrderType(
      withNormalizedNetwork(withPendingOrderPreview(order), fallbackChainId),
    );
    return mapRampsOrder(normalizedOrder as unknown as RampsOrderLike);
  } catch {
    return undefined;
  }
}
