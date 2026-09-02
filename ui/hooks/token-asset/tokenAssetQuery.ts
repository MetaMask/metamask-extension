import { MINUTE } from '@metamask/controller-utils';
import { type CaipAssetType } from '@metamask/utils';
import { normalizeTokenAssetId } from '#shared/lib/asset-utils';

const tokenAssetQueryKeyRoot = [
  'metamask-extension',
  'tokenAsset',
  'v1',
] as const;

const cacheTimeMs = 15 * MINUTE;

export const tokenAssetGcTimeMs = cacheTimeMs;
export const tokenAssetStaleTimeMs = cacheTimeMs;

export const getTokenAssetQueryKey = (assetId: CaipAssetType) =>
  [...tokenAssetQueryKeyRoot, normalizeTokenAssetId(assetId)] as const;

export const getDisabledTokenAssetQueryKey = () =>
  [...tokenAssetQueryKeyRoot, 'disabled'] as const;

export function getUniqueTokenAssetIds(
  assetIds: CaipAssetType[],
): CaipAssetType[] {
  if (assetIds.length === 0) {
    return [];
  }

  return [
    ...new Set(assetIds.map((assetId) => normalizeTokenAssetId(assetId))),
  ].sort() as CaipAssetType[];
}
