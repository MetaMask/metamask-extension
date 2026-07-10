import { XlmScope } from '@metamask/keyring-api';
import { BigNumber } from 'bignumber.js';

/**
 * CAIP asset IDs for native assets on chains that expose a protocol-level
 * reserve balance (for example, Stellar's base reserve).
 */
export const NATIVE_RESERVE_SLIP44_IDS: Set<string> = new Set([
  `${XlmScope.Pubnet}/slip44:148`,
]);

/**
 * Account-scoped metadata for a multichain asset, when provided by the
 * account asset controller.
 */
export type AssetMetadata = { baseReserve?: string } | undefined;

/**
 * Validates if a string is a valid number string.
 *
 * @param value - Numeric string to validate.
 * @returns `true` when the string is a valid number string, otherwise `false`.
 */
function isValidNumberString(value?: string): boolean {
  if (value === undefined) {
    return false;
  }
  try {
    const parsed = new BigNumber(value);
    return parsed.isFinite() && !parsed.isNegative();
  } catch {
    return false;
  }
}

/**
 * Resolves the base reserve amount for a native asset that supports reserve
 * balance display.
 *
 * @param params - Parameters for computing the base reserve.
 * @param params.assetId - CAIP asset ID for the native asset.
 * @param params.assetMetadata - Optional asset metadata.
 * @returns The base reserve amount as a string, `'0'` when supported but
 * missing, or `undefined` when the asset does not support reserve balance.
 */
export function computeBaseReserve({
  assetId,
  assetMetadata,
}: {
  assetId: string;
  assetMetadata?: AssetMetadata;
}): string | undefined {
  if (!isSupportBaseReserve(assetId)) {
    return undefined;
  }

  return isValidNumberString(assetMetadata?.baseReserve)
    ? assetMetadata?.baseReserve
    : '0';
}

/**
 * Computes the spendable balance for a native asset that supports reserve
 * balance display.
 * if the total balance or base reserve is not a valid number, returns '0'.
 * if the spendable balance is negative, returns '0'.
 * otherwise, returns the spendable balance as a string.
 *
 * @param totalBalance - The total balance of the asset.
 * @param baseReserve - The base reserve of the asset.
 * @returns The spendable balance as a string.
 */
export function computeSpendableBalance(
  totalBalance: string,
  baseReserve: string,
): string {
  if (!isValidNumberString(totalBalance) || !isValidNumberString(baseReserve)) {
    return '0';
  }
  const total = new BigNumber(totalBalance);
  const reserved = new BigNumber(baseReserve);
  const spendable = total.minus(reserved);
  if (spendable.isNegative()) {
    return '0';
  }
  return spendable.toString();
}

/**
 * Determines whether a native asset exposes a protocol-level reserve balance.
 *
 * @param assetId - CAIP asset ID to check.
 * @returns `true` when the asset is a supported native reserve asset.
 */
export function isSupportBaseReserve(assetId: string): boolean {
  return NATIVE_RESERVE_SLIP44_IDS.has(assetId);
}
