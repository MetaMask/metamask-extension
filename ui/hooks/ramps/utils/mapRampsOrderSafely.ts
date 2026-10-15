import { mapRampsOrder, type RampsOrderLike } from '@metamask/client-utils';
import type { RampsOrder } from '@metamask/ramps-controller';
import { hasPositiveNumericAmount } from './hasPositiveNumericAmount';

/**
 * Seeds `network` when the order only has chain info on `cryptoCurrency`.
 *
 * The shared mapper requires `network` to be defined before reading
 * `cryptoCurrency`. Orders that still cannot resolve a chainId are left as-is
 * so `mapRampsOrder` returns null.
 *
 * @param order - The raw ramps order.
 * @returns The order, optionally with `network` seeded from crypto metadata.
 */
function seedNetworkIfNeeded(order: RampsOrder): RampsOrder {
  const { network } = order;
  if (typeof network === 'string' && network) {
    return order;
  }
  if (typeof network === 'object' && network?.chainId) {
    return order;
  }

  if (!order.cryptoCurrency?.chainId && !order.cryptoCurrency?.assetId) {
    return order;
  }

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

/**
 * Returns the `0x`-prefixed form of a bare 64-character hex hash, identity
 * otherwise.
 *
 * Coinbase (and possibly other providers) return settlement hashes without
 * the `0x` prefix, while EVM consumers (`getExplorerTxUrl`, the Transaction
 * ID row, and settlement dedupe) require `0x`-prefixed strict hex. Non-EVM
 * chains use bare hashes natively (Bitcoin, Tron), so callers must not apply
 * this to hashes on non-EVM chains.
 *
 * @param hash - The provider's raw tx hash.
 * @returns The hash, `0x`-prefixed when it is a bare 64-character hex string.
 */
export function withEvmHashPrefix(
  hash: string | undefined,
): string | undefined {
  return hash && /^[\da-f]{64}$/iu.test(hash) ? `0x${hash}` : hash;
}

/**
 * Normalizes a mapped order's settlement hash for downstream EVM consumers.
 *
 * Non-EVM chains use bare hashes natively (Bitcoin, Tron), so their hashes
 * pass through untouched. An all-zero hash is a provider placeholder, not a
 * settlement, so it maps to undefined.
 *
 * @param hash - The mapped item's hash, already filtered for placeholders.
 * @param chainId - The mapped item's resolved CAIP chain id.
 * @returns The hash, `0x`-prefixed when it is a bare EVM hash.
 */
function normalizeItemHash(
  hash: string | undefined,
  chainId: string | undefined,
): string | undefined {
  if (!hash || !chainId?.startsWith('eip155:')) {
    return hash;
  }
  const prefixed = withEvmHashPrefix(hash);
  return prefixed && /^0x0+$/iu.test(prefixed) ? undefined : prefixed;
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
 * Returns undefined when the shared mapper cannot resolve a required chainId
 * or otherwise filters the order out.
 *
 * @param order - The raw ramps order to map.
 * @returns The mapped activity item, or undefined when filtered / unmappable.
 */
export function mapRampsOrderSafely(
  order: RampsOrder,
): NonNullable<ReturnType<typeof mapRampsOrder>> | undefined {
  try {
    const prepared = seedNetworkIfNeeded(withNormalizedTxHash(order));
    const item =
      mapRampsOrder(prepared as unknown as RampsOrderLike) ?? undefined;
    if (!item || (item.type !== 'rampBuy' && item.type !== 'rampSell')) {
      return item;
    }

    const hasCryptoAmount = hasPositiveNumericAmount(order.cryptoAmount);
    const hasFiatAmount = hasPositiveNumericAmount(order.fiatAmount);

    return {
      ...item,
      hash: normalizeItemHash(item.hash, item.chainId),
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
