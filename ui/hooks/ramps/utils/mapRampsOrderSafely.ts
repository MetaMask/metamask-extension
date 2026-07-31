import { mapRampsOrder, type RampsOrderLike } from '@metamask/client-utils';
import type { RampsOrder } from '@metamask/ramps-controller';

/**
 * Seeds `network.chainId` when the order has no resolvable chain.
 *
 * @param order - The raw ramps order.
 * @param fallbackChainId - Chain to use when the order's is missing.
 * @returns The order, optionally with `network` seeded.
 */
function seedNetworkIfNeeded(
  order: RampsOrder,
  fallbackChainId?: string,
): RampsOrder {
  const { network } = order;
  if (typeof network === 'string' && network) {
    return order;
  }
  if (typeof network === 'object' && network?.chainId) {
    return order;
  }

  // Mapper requires `network` to be defined before reading cryptoCurrency.
  if (order.cryptoCurrency?.chainId || order.cryptoCurrency?.assetId) {
    if (network !== undefined && network !== null) {
      return order;
    }
    return {
      ...order,
      network: {
        name: '',
        chainId: order.cryptoCurrency.chainId ?? '',
      },
    };
  }

  if (!fallbackChainId) {
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
 * Coerces a missing `txHash` to `''` for the shared mapper.
 *
 * @param order - The raw ramps order.
 * @returns The order with `txHash` guaranteed to be a string.
 */
function withNormalizedTxHash(order: RampsOrder): RampsOrder {
  const txHash = order.txHash as string | null | undefined;
  return typeof txHash === 'string' ? order : { ...order, txHash: '' };
}

/**
 * Maps a ramps order to an activity item for the extension UI.
 *
 * @param order - The raw ramps order to map.
 * @param fallbackChainId - Optional chain when the order has none yet.
 * @returns The mapped activity item, or undefined when filtered / unmappable.
 */
export function mapRampsOrderSafely(
  order: RampsOrder,
  fallbackChainId?: string,
): NonNullable<ReturnType<typeof mapRampsOrder>> | undefined {
  try {
    const prepared = seedNetworkIfNeeded(
      withNormalizedTxHash(order),
      fallbackChainId,
    );
    const item =
      mapRampsOrder(prepared as unknown as RampsOrderLike) ?? undefined;
    if (!item || (item.type !== 'rampBuy' && item.type !== 'rampSell')) {
      return item;
    }

    const hasCryptoAmount =
      order.cryptoAmount !== null &&
      order.cryptoAmount !== undefined &&
      Number(order.cryptoAmount) > 0;
    const hasFiatAmount =
      order.fiatAmount !== null &&
      order.fiatAmount !== undefined &&
      Number(order.fiatAmount) > 0;

    return {
      ...item,
      data: {
        ...item.data,
        token: item.data.token
          ? {
              ...item.data.token,
              amount: hasCryptoAmount ? item.data.token.amount : undefined,
            }
          : undefined,
        fiat: hasFiatAmount ? item.data.fiat : undefined,
      },
    };
  } catch {
    return undefined;
  }
}
