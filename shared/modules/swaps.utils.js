import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../constants/swaps';

/**
 * Checks whether the provided address is strictly equal to the address for
 * the default swaps token of the provided chain.
 *
 * @param {string} address - The string to compare to the default token address
 * @param {string} chainId - The hex encoded chain ID of the default swaps token to check
 * @returns {boolean} Whether the address is the provided chain's default token address
 */
export function isSwapsDefaultTokenAddress(address, chainId) {
  if (!address || !chainId) {
    return false;
  }

  return address === SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.address;
}

/**
 * Checks whether the provided symbol is strictly equal to the symbol for
 * the default swaps token of the provided chain.
 *
 * @param {string} symbol - The string to compare to the default token symbol
 * @param {string} chainId - The hex encoded chain ID of the default swaps token to check
 * @returns {boolean} Whether the symbl is the provided chain's default token symbol
 */
export function isSwapsDefaultTokenSymbol(symbol, chainId) {
  if (!symbol || !chainId) {
    return false;
  }

  return symbol === SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.symbol;
}
