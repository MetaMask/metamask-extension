import { mapRampsOrder, type RampsOrderLike } from '@metamask/client-utils';
import {
  getInternalOrderCode,
  type RampsOrder,
} from '@metamask/ramps-controller';
import { getPendingOrderPreview } from './pendingOrderPreview';

/**
 * Seeds a chain id only when the order has no resolvable network/crypto chain
 * inputs yet (e.g. right after checkout redirect). Callers pass the chain they
 * already know from the URL / selected token. String networks and
 * cryptoCurrency fallbacks are handled by `mapRampsOrder` itself.
 *
 * @param order - The raw ramps order.
 * @param fallbackChainId - Chain to use when the order's is missing.
 * @returns The order, optionally with `network` seeded.
 */
function seedNetworkIfNeeded(
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

/**
 * Overlays build-quote preview amounts onto an order that still lacks
 * token/fiat fields. Real provider fields always win once populated.
 *
 * @param order - The raw ramps order.
 * @returns The order with preview fields filled when missing.
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
 * Thin extension adapter around shared `mapRampsOrder`. Applies only
 * extension-owned concerns (build-quote preview, details-route chain seed),
 * then returns the shared ActivityItem unchanged.
 *
 * @param order - The raw ramps order to map.
 * @param fallbackChainId - Optional chain for redirect stubs missing network.
 * @returns The mapped activity item, or undefined when filtered / unmappable.
 */
export function mapRampsOrderSafely(
  order: RampsOrder,
  fallbackChainId?: string,
): NonNullable<ReturnType<typeof mapRampsOrder>> | undefined {
  try {
    const prepared = seedNetworkIfNeeded(
      withPendingOrderPreview(order),
      fallbackChainId,
    );
    return mapRampsOrder(prepared as unknown as RampsOrderLike) ?? undefined;
  } catch {
    return undefined;
  }
}
