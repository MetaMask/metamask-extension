import { isStrictHexString } from '@metamask/utils';
import { convertHexToDecimal } from '@metamask/controller-utils';
import { CHAIN_IDS, MAX_SAFE_CHAIN_ID } from '../constants/network';

/**
 * Checks whether the given number primitive chain ID is safe.
 * Because some cryptographic libraries we use expect the chain ID to be a
 * number primitive, it must not exceed a certain size.
 *
 * @param chainId - The chain ID to check for safety.
 * @returns Whether the given chain ID is safe.
 */
export function isSafeChainId(chainId: unknown): boolean {
  return isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;
}

/**
 * Checks whether the given value is a 0x-prefixed, non-zero, non-zero-padded,
 * hexadecimal string.
 *
 * @param value - The value to check.
 * @returns True if the value is a correctly formatted hex string,
 * false otherwise.
 */
export function isPrefixedFormattedHexString(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }
  return /^0x[1-9a-f]+[0-9a-f]*$/iu.test(value);
}

/**
 * Check if token detection is enabled for certain networks
 *
 * @param chainId - ChainID of network
 * @returns Whether the current network supports token detection
 */
export function isTokenDetectionEnabledForNetwork(chainId: string | undefined) {
  switch (chainId) {
    case CHAIN_IDS.MAINNET:
    case CHAIN_IDS.BSC:
    case CHAIN_IDS.POLYGON:
    case CHAIN_IDS.AVALANCHE:
    case CHAIN_IDS.LINEA_GOERLI:
    case CHAIN_IDS.LINEA_MAINNET:
    case CHAIN_IDS.ARBITRUM:
    case CHAIN_IDS.OPTIMISM:
    case CHAIN_IDS.BASE:
    case CHAIN_IDS.ZKSYNC_ERA:
      return true;
    default:
      return false;
  }
}

/**
 * Like {@link Number.isSafeInteger}, but types the input as a `number` if it is
 * indeed a safe integer.
 *
 * @param value - The value to check.
 * @returns True if the value is a safe integer, false otherwise.
 */
function isSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value);
}

export function shouldShowLineaMainnet(): boolean {
  return new Date().getTime() > Date.UTC(2023, 6, 11, 18);
}

/**
 * TODO: Delete when ready to remove `networkVersion` from provider object
 * Convert the given value into a valid network ID. The ID is accepted
 * as either a number, a decimal string, or a 0x-prefixed hex string.
 *
 * @param value - The network ID to convert, in an unknown format.
 * @returns A valid network ID (as a decimal string)
 * @throws If the given value cannot be safely parsed.
 */
export function convertNetworkId(value: unknown): string {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return `${value}`;
  } else if (isStrictHexString(value)) {
    return `${convertHexToDecimal(value)}`;
  } else if (typeof value === 'string' && /^\d+$/u.test(value)) {
    return value;
  }
  throw new Error(`Cannot parse as a valid network ID: '${value}'`);
}
