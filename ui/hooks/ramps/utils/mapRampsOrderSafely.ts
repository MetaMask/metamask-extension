import { mapRampsOrder, type RampsOrderLike } from '@metamask/client-utils';
import {
  getInternalOrderCode,
  type RampsOrder,
} from '@metamask/ramps-controller';
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

// Keyed by internal order code, holding the first valid ('buy'/'sell')
// orderType seen for that order — see withStableOrderType below.
const knownOrderTypes = new Map<string, 'buy' | 'sell'>();

/**
 * An order's buy/sell direction can't legitimately change after creation, but
 * polling has been observed to return an inconsistent `orderType` across
 * successive fetches of the same order (the sibling casing bug fixed by
 * `withNormalizedOrderType` above is one flavor of this same upstream data
 * inconsistency) — this flickered the details screen between "Buying" and
 * "Selling" for a single order. Pin to whichever valid value was seen first
 * for a given order code instead of trusting every poll's value blindly.
 *
 * @param order - The order, already orderType-casing-normalized.
 * @returns The order with `orderType` pinned to its first confirmed value.
 */
function withStableOrderType(order: RampsOrder): RampsOrder {
  const orderCode = getInternalOrderCode(order);
  const currentType =
    order.orderType === 'buy' || order.orderType === 'sell'
      ? order.orderType
      : undefined;
  const knownType = knownOrderTypes.get(orderCode);

  if (!knownType) {
    if (currentType) {
      knownOrderTypes.set(orderCode, currentType);
    }
    return order;
  }
  return currentType === knownType ? order : { ...order, orderType: knownType };
}

/**
 * Ramps orders report `cryptoAmount` in human units (e.g. `0.01176` ETH), but
 * activity formatters treat `TokenAmount.amount` as base units whenever
 * `decimals` is set — so `5` USDC with 6 decimals becomes `0.000005` and
 * renders as `0 USDC`. Drop decimals so the human amount is shown as-is.
 *
 * @param mapped - The activity item produced by mapRampsOrder.
 * @returns The same item with human-readable token amounts preserved.
 */
function withHumanReadableTokenAmount(
  mapped: NonNullable<ReturnType<typeof mapRampsOrder>>,
): NonNullable<ReturnType<typeof mapRampsOrder>> {
  if (mapped.type !== 'rampBuy' && mapped.type !== 'rampSell') {
    return mapped;
  }

  const { token } = mapped.data;
  if (!token || token.decimals === undefined) {
    return mapped;
  }

  const { decimals: _decimals, ...tokenWithoutDecimals } = token;
  return {
    ...mapped,
    data: {
      ...mapped.data,
      token: tokenWithoutDecimals,
    },
  };
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
    const normalizedOrder = withStableOrderType(
      withNormalizedOrderType(
        withNormalizedNetwork(withPendingOrderPreview(order), fallbackChainId),
      ),
    );
    return withHumanReadableTokenAmount(
      mapRampsOrder(normalizedOrder as unknown as RampsOrderLike),
    );
  } catch {
    return undefined;
  }
}
