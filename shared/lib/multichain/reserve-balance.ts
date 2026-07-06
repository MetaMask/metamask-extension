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
 * Parses a string as a non-negative finite number and returns the original
 * string when valid.
 *
 * @param value - Numeric string to validate.
 * @returns The original string when valid, otherwise `undefined`.
 */
function parseFloatSafe(value?: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return value;
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
    ? (parseFloatSafe(assetMetadata?.baseReserve) ?? '0')
    : undefined;
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
