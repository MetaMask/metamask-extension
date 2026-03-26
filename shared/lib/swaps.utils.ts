import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../constants/swaps';

type SwapsChainId = keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP;

/**
 * Checks whether the provided address is strictly equal to the address for
 * the default swaps token of the provided chain.
 *
 * @param address - The string to compare to the default token address
 * @param chainId - The hex encoded chain ID of the default swaps token to check
 * @returns Whether the address is the provided chain's default token address
 */
export function isSwapsDefaultTokenAddress(
  address: string,
  chainId: string,
): boolean {
  if (!address || !chainId) {
    return false;
  }

  return (
    address ===
    SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId as SwapsChainId]?.address
  );
}

/**
 * Checks whether the provided symbol is strictly equal to the symbol for
 * the default swaps token of the provided chain.
 *
 * @param symbol - The string to compare to the default token symbol
 * @param chainId - The hex encoded chain ID of the default swaps token to check
 * @returns Whether the symbol is the provided chain's default token symbol
 */
export function isSwapsDefaultTokenSymbol(
  symbol: string,
  chainId: string,
): boolean {
  if (!symbol || !chainId) {
    return false;
  }

  return (
    symbol === SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId as SwapsChainId]?.symbol
  );
}
