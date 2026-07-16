import { CaipAssetTypeStruct, parseCaipAssetType } from '@metamask/utils';
import type { CaipChainId } from '@metamask/utils';
import { XlmScope } from '@metamask/keyring-api';

/**
 * Account-scoped metadata for a trustline asset, when provided by the
 * account asset controller.
 */
type AssetMetadata = {
  limit?: string;
};

/**
 * CAIP asset namespace used for classic trustline assets on each supported
 * chain (for example, Stellar's `asset` namespace).
 */
export const TRUSTLINE_ASSET_NAMESPACE: Record<CaipChainId, string> = {
  [XlmScope.Pubnet]: 'asset',
};

/**
 * Determines whether a CAIP asset ID refers to a classic trustline asset.
 *
 * @param assetId - CAIP asset ID to check.
 * @returns `true` when the asset uses a supported trustline namespace.
 */
export function isTrustlineAsset(assetId: string): boolean {
  if (!assetId || !CaipAssetTypeStruct.is(assetId)) {
    return false;
  }

  const { assetNamespace, chainId } = parseCaipAssetType(assetId);

  return assetNamespace === TRUSTLINE_ASSET_NAMESPACE[chainId];
}

/**
 * Determines whether a classic trustline asset should be treated as inactive
 * and require activation before use.
 *
 * When asset metadata is unavailable (for example, on first import), the
 * asset is assumed inactive.
 *
 * @param params - Parameters for checking if an asset requires activation.
 * @param params.assetId - CAIP asset ID for the asset to check.
 * @param params.assetMetadata - Optional asset metadata.
 * @returns `true` when the asset is a trustline asset that is inactive.
 */
export function isAssetRequireActivate(params: {
  assetId?: string;
  assetMetadata?: AssetMetadata;
}): boolean {
  const { assetId, assetMetadata } = params;

  if (!isTrustlineAsset(assetId ?? '')) {
    return false;
  }

  // TODO: different network can apply different logic here,
  // Today we only support Stellar, so we only check the limit.
  if (assetMetadata !== undefined) {
    return assetMetadata.limit === undefined || assetMetadata.limit === '0';
  }

  // default to true because the imported token doesn't have assetMetadata at first,
  // we assume it is inactive
  return true;
}
