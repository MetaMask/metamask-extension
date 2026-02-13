import {
  isCaipAssetType,
  KnownCaipNamespace,
  parseCaipAssetType,
} from '@metamask/utils';
import { decimalToPrefixedHex } from '../../../modules/conversion.utils';
import { ASSET_ROUTE, Route } from './route';

export enum AssetQueryParams {
  AssetId = 'assetId',
}

export default new Route({
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

    const asset = parseCaipAssetType(assetId);

    const { chain, chainId: caipChainId, assetReference } = asset;

    const isEvmNamespace = chain.namespace === KnownCaipNamespace.Eip155;
    const isNative = asset.assetNamespace === 'slip44';

    const assetPath = () => {
      // Asset Path Format: /asset/{hex-chainId}
      if (isEvmNamespace && isNative) {
        return `${ASSET_ROUTE}/${decimalToPrefixedHex(chain.reference)}`;
      }

      // Asset Path Format: /asset/{hex-chainId}/{hex-address}
      if (isEvmNamespace && !isNative) {
        return `${ASSET_ROUTE}/${decimalToPrefixedHex(chain.reference)}/${assetReference}`;
      }

      // Non-EVM Asset Asset Path Format: /asset/{caip-chainId}/{caip-asset-type}
      // Example: /asset/solana:XXX/encoded(solana:XXX/token:XXX)
      return `${ASSET_ROUTE}/${caipChainId}/${encodeURIComponent(assetId)}`;
    };

    return { path: assetPath(), query: new URLSearchParams() };
  },
});
