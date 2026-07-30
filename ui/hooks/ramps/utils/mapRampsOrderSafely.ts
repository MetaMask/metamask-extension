import { mapRampsOrder, type RampsOrderLike } from '@metamask/client-utils';
import {
  getInternalOrderCode,
  type RampsOrder,
} from '@metamask/ramps-controller';
import { getPendingOrderPreview } from './pendingOrderPreview';

/**
 * Seeds a missing chain id when the shared mapper would otherwise leave
 * `chainId` unresolved — right after a checkout redirect the callback order's
 * `network` / crypto fields may not be populated yet, so the caller supplies
 * the chain it already knows (e.g. the URL / user-selected token).
 *
 * String `network` values and cryptoCurrency fallbacks are handled inside
 * `mapRampsOrder` itself.
 *
 * @param order - The raw ramps order.
 * @param fallbackChainId - Chain to use when the order's is missing.
 * @returns The order with `network` seeded when needed.
 */
function withFallbackNetwork(
  order: RampsOrder,
  fallbackChainId?: string,
): RampsOrder {
  if (!fallbackChainId) {
    return order;
  }
  const { network } = order;
  if (typeof network === 'string' && network) {
    return order;
  }
  if (typeof network === 'object' && network?.chainId) {
    return order;
  }
  if (order.cryptoCurrency?.chainId || order.cryptoCurrency?.assetId) {
    return order;
  }
  return {
    ...order,
    network: {
      name: typeof network === 'object' ? (network?.name ?? '') : '',
      chainId: fallbackChainId,
    },
  };
}

// Keyed by internal order code, holding the first valid ('buy'/'sell')
// orderType seen for that order — see withStableOrderType below.
const knownOrderTypes = new Map<string, 'buy' | 'sell'>();

/**
 * An order's buy/sell direction can't legitimately change after creation, but
 * polling has been observed to return an inconsistent `orderType` across
 * successive fetches of the same order — this flickered the details screen
 * between "Buying" and "Selling". Pin to whichever valid value was seen first
 * for a given order code. Casing / DEPOSIT→buy normalization is handled by
 * `mapRampsOrder`.
 *
 * @param order - The raw ramps order.
 * @returns The order with `orderType` pinned to its first confirmed value.
 */
function withStableOrderType(order: RampsOrder): RampsOrder {
  const orderCode = getInternalOrderCode(order);
  const normalized =
    typeof order.orderType === 'string'
      ? order.orderType.toLowerCase()
      : undefined;
  const currentType =
    normalized === 'buy' || normalized === 'sell' ? normalized : undefined;
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
 * A newly-resolved order's own payload can still be empty (no token/amount/fees)
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
 * Maps a ramps order into the shared activity item shape, with extension-only
 * normalizations that `mapRampsOrder` does not cover (pending preview overlay,
 * stable buy/sell direction across polls, and a caller-supplied chain fallback).
 *
 * Returns `undefined` when the shared mapper filters the order out (hidden
 * statuses / `excludeFromPurchases`) or when mapping fails.
 *
 * @param order - The raw ramps order to map.
 * @param fallbackChainId - Chain to use when the order has none yet (e.g. a
 * just-resolved redirect order); passed through to network seeding.
 * @returns The mapped activity item, or undefined if the order can't be mapped.
 */
export function mapRampsOrderSafely(
  order: RampsOrder,
  fallbackChainId?: string,
): NonNullable<ReturnType<typeof mapRampsOrder>> | undefined {
  try {
    const normalizedOrder = withStableOrderType(
      withFallbackNetwork(withPendingOrderPreview(order), fallbackChainId),
    );
    const mapped = mapRampsOrder(normalizedOrder as unknown as RampsOrderLike);
    if (!mapped) {
      return undefined;
    }
    // `mapRampsOrder` sets `data.id` to `order.id ?? providerOrderId`, but
    // extension lookup (`getOrderById` / `getInternalOrderCode`) keys on the
    // internal order code — which is not always the same as raw `order.id`.
    // Normalize so list/details identifiers round-trip through getOrderById.
    if (mapped.type === 'rampBuy' || mapped.type === 'rampSell') {
      return {
        ...mapped,
        data: {
          ...mapped.data,
          id: getInternalOrderCode(order),
        },
      };
    }
    return mapped;
  } catch {
    return undefined;
  }
}
