import type { CaipAssetType } from '@metamask/utils';
import { buildAssetRoutePath } from '../../../../shared/lib/asset-route';

export const featureFlag = 'cashtagInjection';

export const swapRoute = '/cross-chain/swaps/prepare-bridge-page';

export function swapRouteSearchForDest(caipAssetId: string): `?${string}` {
  // Same query shape as deep links / useBridging destTokenAssetId.
  return `?to=${encodeURIComponent(caipAssetId)}`;
}

export function assetRoutePath(caipAssetId: string) {
  return buildAssetRoutePath(caipAssetId as CaipAssetType);
}
