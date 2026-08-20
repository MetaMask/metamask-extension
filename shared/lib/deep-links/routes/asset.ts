import { isCaipAssetType } from '@metamask/utils';
import { buildAssetRoutePath } from '../../asset-route';
import { Route } from './route';

export enum AssetQueryParams {
  AssetId = 'assetId',
}

export const asset = new Route({
  pathname: '/asset',
  getTitle: (_: URLSearchParams) => 'deepLink_theAssetPage',
  handler: function handler(params: URLSearchParams) {
    const assetId = params.get(AssetQueryParams.AssetId);
    if (!assetId) {
      throw new Error('Missing assetId parameter');
    }

    if (!isCaipAssetType(assetId)) {
      throw new Error('Invalid assetId parameter');
    }

    return { path: buildAssetRoutePath(assetId), query: new URLSearchParams() };
  },
});
