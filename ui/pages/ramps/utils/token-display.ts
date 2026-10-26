import { type RampsToken } from '@metamask/ramps-controller';
import { getTokenDisplaySymbol } from '@metamask/money-account-utils';
import { parseCaipAssetType, type CaipAssetType } from '@metamask/utils';

/**
 * Extracts the ERC-20 contract address from a CAIP-19 asset id.
 *
 * @param assetId - CAIP-19 asset id (e.g. "eip155:1/erc20:0x...").
 * @returns The contract address, or undefined for non-ERC-20 or invalid
 * asset ids.
 */
export function getErc20AddressFromAssetId(
  assetId: string,
): string | undefined {
  try {
    const { assetNamespace, assetReference } = parseCaipAssetType(
      assetId as CaipAssetType,
    );
    return assetNamespace === 'erc20' ? assetReference : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolves the user-facing symbol for a ramps catalog token.
 *
 * The ramps catalog reports registry symbols, which for mUSD is the uppercase
 * "MUSD". The branded casing is "mUSD" (the on-chain symbol and the casing
 * used across the product, e.g. locale strings). Canonicalise through the
 * shared helper so UI never leaks the registry casing (TRAM-3972).
 *
 * @param token - The ramps catalog token, if one is selected.
 * @returns The branded symbol for mUSD, the registry symbol for any other
 * token, or an empty string when no token/symbol is available.
 */
export function getRampsTokenDisplaySymbol(token?: RampsToken | null): string {
  if (!token?.symbol) {
    return '';
  }

  return (
    getTokenDisplaySymbol(
      getErc20AddressFromAssetId(token.assetId),
      token.symbol,
    ) ?? token.symbol
  );
}
