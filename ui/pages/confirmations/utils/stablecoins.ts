import type { Hex } from '@metamask/utils';

/**
 * Returns true when the token is listed for its chain in the `stableTokens`
 * remote feature flag.
 *
 * The map from `selectStablecoins` is already lowercased, so only the
 * requested chain ID and address need normalising. Addresses arrive
 * checksummed from several callsites and chain IDs are not guaranteed to be
 * lowercase, so neither can be compared as-is.
 *
 * @param stablecoins - Lowercased chain ID to addresses map.
 * @param chainId - Chain ID of the token to look up.
 * @param address - Address of the token to look up.
 */
export function isListedStablecoin(
  stablecoins: Record<Hex, Hex[]>,
  chainId: string,
  address: string,
): boolean {
  const listed = stablecoins[chainId.toLowerCase() as Hex];

  if (!listed) {
    return false;
  }

  return listed.includes(address.toLowerCase() as Hex);
}
