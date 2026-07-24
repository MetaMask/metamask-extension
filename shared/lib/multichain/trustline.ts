import { CaipAssetTypeStruct, parseCaipAssetType } from '@metamask/utils';
import type { CaipChainId } from '@metamask/utils';
import { XlmScope } from '@metamask/keyring-api';

/**
 * Account-scoped metadata for a trustline asset, when provided by the
 * account asset controller.
 */
export type TrustlineAssetMetadata = {
  limit?: string;
};

/**
 * One Stellar base reserve in XLM. Opening a new classic trustline locks this
 * additional amount on the account until the trustline is removed.
 *
 * @see https://developers.stellar.org/docs/learn/fundamentals/lumens#minimum-balance
 */
export const STELLAR_BASE_RESERVE_PER_SUBENTRY_XLM = '0.5';

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
  assetMetadata?: TrustlineAssetMetadata;
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

/**
 * Extra native reserve (in XLM) required when swapping into a classic asset
 * that does not yet have an active trustline on the account.
 *
 * Uses {@link isAssetRequireActivate}: missing enrichment is treated as
 * inactive so the reserve is overestimated until metadata is available.
 *
 * @param params - Destination asset identity and cached trustline metadata.
 * @param params.toAssetId - CAIP asset ID of the swap/bridge destination token.
 * @param params.toAssetMetadata - Trustline enrichment from StellarAssetsController.
 * @returns `'0.5'` when a new trustline would be required, otherwise `'0'`.
 */
export function getAdditionalReserveForMissingTrustline(params: {
  toAssetId?: string;
  toAssetMetadata?: TrustlineAssetMetadata;
}): string {
  return isAssetRequireActivate({
    assetId: params.toAssetId,
    assetMetadata: params.toAssetMetadata,
  })
    ? STELLAR_BASE_RESERVE_PER_SUBENTRY_XLM
    : '0';
}
