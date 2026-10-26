import { MINUTE } from '@metamask/controller-utils';
import { type CaipAssetType } from '@metamask/utils';
import { normalizeTokenAssetId } from '#shared/lib/asset-utils';

const queryKeyRoot = ['metamask-extension', 'tokenAsset', 'v1'] as const;

const cacheTimeMs = 15 * MINUTE;

export const queryGcTimeMs = cacheTimeMs;
export const queryStaleTimeMs = cacheTimeMs;

export const getTokenAssetQueryKey = (assetId: CaipAssetType) =>
  [...queryKeyRoot, normalizeTokenAssetId(assetId)] as const;

export const getDisabledTokenAssetQueryKey = () =>
  [...queryKeyRoot, 'disabled'] as const;

export function getUniqueTokenAssetIds(
  assetIds: CaipAssetType[],
): CaipAssetType[] {
  if (assetIds.length === 0) {
    return [];
  }

  return Array.from(new Set(assetIds.map(normalizeTokenAssetId))).toSorted();
}
