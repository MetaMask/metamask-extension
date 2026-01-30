import { decimalToPrefixedHex } from '../../../modules/conversion.utils';
import { parseAssetID } from './helpers';
import { ASSET_ROUTE, Route } from './route';

export enum AssetQueryParams {
  AssetId = 'assetId',
}

const EVM_NAMESPACE = 'eip155';
const EVM_NATIVE_NAMESPACE = 'slip44';
const EVM_NFT_NAMESPACES = new Set(['erc721', 'erc1155']);

export default new Route({
  pathname: '/asset',
  getTitle: (_: URLSearchParams) => 'deepLink_theAssetPage',
  handler: function handler(params: URLSearchParams) {
    const assetId = params.get(AssetQueryParams.AssetId);
    if (!assetId) {
      throw new Error('Missing assetId parameter');
    }

    const parsed = parseAssetID(assetId);
    if (!parsed) {
      throw new Error('Invalid assetId parameter');
    }

    const { chainId, assetNamespace, assetReference, tokenId, assetType } =
      parsed;
    const resolvedChainId =
      chainId.namespace === EVM_NAMESPACE
        ? decimalToPrefixedHex(chainId.blockchainId)
        : chainId.id;

    let assetParam: string;
    let tokenIdParam: string | undefined;

    if (chainId.namespace === EVM_NAMESPACE) {
      if (assetNamespace === EVM_NATIVE_NAMESPACE) {
        assetParam = '';
      } else if (EVM_NFT_NAMESPACES.has(assetNamespace)) {
        if (!tokenId) {
          throw new Error('Missing tokenId parameter for NFT asset');
        }
        assetParam = assetReference;
        tokenIdParam = tokenId;
      } else if (assetNamespace === 'erc20') {
        assetParam = assetReference;
      } else {
        throw new Error(`Unsupported asset namespace: ${assetNamespace}`);
      }
    } else {
      assetParam = parsed.assetId ?? assetType;
    }

    const encodedAsset = encodeURIComponent(assetParam);
    const path = tokenIdParam
      ? `${ASSET_ROUTE}/${resolvedChainId}/${encodedAsset}/${encodeURIComponent(
          tokenIdParam,
        )}`
      : `${ASSET_ROUTE}/${resolvedChainId}/${encodedAsset}`;

    return { path, query: new URLSearchParams() };
  },
});
