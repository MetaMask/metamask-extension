import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../constants/swaps';

/**
 * Checks whether the provided address is strictly equal to the address for
 * the default swaps token of the provided chain.
 *
 * @param {string} address - The string to compare to the default token address
 * @param {string} caipChainId - The CAIP-2 Chain ID of the default swaps token to check
 * @returns {boolean} Whether the address is the provided chain's default token address
 */
export function isSwapsDefaultTokenAddress(address, caipChainId) {
  if (!address || !caipChainId) {
    return false;
  }

  return address === SWAPS_CHAINID_DEFAULT_TOKEN_MAP[caipChainId]?.address;
}

/**
 * Checks whether the provided symbol is strictly equal to the symbol for
 * the default swaps token of the provided chain.
 *
 * @param {string} symbol - The string to compare to the default token symbol
 * @param {string} caipChainId - The CAIP-2 Chain ID of the default swaps token to check
 * @returns {boolean} Whether the symbl is the provided chain's default token symbol
 */
export function isSwapsDefaultTokenSymbol(symbol, caipChainId) {
  if (!symbol || !caipChainId) {
    return false;
  }

  return symbol === SWAPS_CHAINID_DEFAULT_TOKEN_MAP[caipChainId]?.symbol;
}
