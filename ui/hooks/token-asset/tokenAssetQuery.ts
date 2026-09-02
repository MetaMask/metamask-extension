import type { TokenAsset } from '@metamask/assets-controllers';
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

export const getTokenAssetStaleTime = (query: {
  state: { data?: TokenAsset };
}) => {
  const token = query.state.data;
  if (token && !token.securityData) {
    return 0;
  }

  return cacheTimeMs;
};

export const getTokenAssetQueryKey = (assetId: CaipAssetType) =>
  [...tokenAssetQueryKeyRoot, normalizeTokenAssetId(assetId)] as const;

export const getDisabledTokenAssetQueryKey = () =>
  [...tokenAssetQueryKeyRoot, 'disabled'] as const;
