import { XlmScope } from '@metamask/keyring-api';

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
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return false;
  }
  return true;
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
  const isAssetSupportBaseReserve = isSupportBaseReserve(assetId);

  return isAssetSupportBaseReserve
    ? isValidNumberString(assetMetadata?.baseReserve)
      ? assetMetadata?.baseReserve
      : '0'
    : undefined;
}

/**
 * Computes the spendable balance for a native asset that supports reserve
 * balance display.
 *
 * @param totalBalance - The total balance of the asset.
 * @param baseReserve - The base reserve of the asset.
 * @returns The spendable balance as a number.
 */
export function computeSpendableBalance(
  totalBalance: string,
  baseReserve: string,
): number {
  const total = Number.parseFloat(totalBalance);
  const reserved = Number.parseFloat(baseReserve);
  const spendable = Math.max(
    0,
    (Number.isFinite(total) ? total : 0) -
      (Number.isFinite(reserved) ? reserved : 0),
  );
  return spendable;
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
