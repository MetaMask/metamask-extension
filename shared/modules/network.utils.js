import {
  MAX_SAFE_CHAIN_ID,
  BSC_CHAIN_ID,
  POLYGON_CHAIN_ID,
  AVALANCHE_CHAIN_ID,
  MAINNET_CHAIN_ID,
} from '../constants/network';

/**
 * Checks whether the given number primitive chain ID is safe.
 * Because some cryptographic libraries we use expect the chain ID to be a
 * number primitive, it must not exceed a certain size.
 *
 * @param {number} chainId - The chain ID to check for safety.
 * @returns {boolean} Whether the given chain ID is safe.
 */
export function isSafeChainId(chainId) {
  return (
    Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID
  );
}

/**
 * Checks whether the given value is a 0x-prefixed, non-zero, non-zero-padded,
 * hexadecimal string.
 *
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value is a correctly formatted hex string,
 * false otherwise.
 */
export function isPrefixedFormattedHexString(value) {
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
export function isTokenDetectionEnabledForNetwork(chainId) {
  switch (chainId) {
    case MAINNET_CHAIN_ID:
    case BSC_CHAIN_ID:
    case POLYGON_CHAIN_ID:
    case AVALANCHE_CHAIN_ID:
      return true;
    default:
      return false;
  }
}
