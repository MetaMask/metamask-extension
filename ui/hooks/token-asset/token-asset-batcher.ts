import {
  fetchTokenAssets,
  type TokenAsset,
} from '@metamask/assets-controllers';
import {
  isCaipAssetType,
  parseCaipAssetType,
  type CaipAssetType,
} from '@metamask/utils';
import { create } from '#shared/lib/create-batcher';
import { normalizeTokenAssetId } from '#shared/lib/asset-utils';
import { apiClient } from '../../helpers/api-client';

const tokenAssetBatchSize = 25;

let supportedNetworksCache: {
  fullSupport: string[];
  partialSupport: string[];
} | null = null;
const getSupportedNetworksCached = async () => {
  if (supportedNetworksCache) {
    return supportedNetworksCache;
  }

  const { fullSupport, partialSupport } =
    await apiClient.tokens.fetchTokenV2SupportedNetworks();
  supportedNetworksCache = { fullSupport, partialSupport };
  return supportedNetworksCache;
};

async function filterSupportedAssetIds(assetIds: CaipAssetType[]) {
  try {
    const { fullSupport, partialSupport } = await getSupportedNetworksCached();
    const supportedChainIds = new Set([...fullSupport, ...partialSupport]);

    return assetIds.filter(
      (assetId) =>
        isCaipAssetType(assetId) &&
        supportedChainIds.has(parseCaipAssetType(assetId).chainId),
    );
  } catch {
    return assetIds;
  }
}

async function fetchTokenAssetBatch(assetIds: CaipAssetType[]) {
  const supportedAssetIds = await filterSupportedAssetIds(assetIds);

  if (supportedAssetIds.length === 0) {
    return [];
  }

  const tokens: TokenAsset[] = [];
  let chunkError: unknown;

  for (
    let offset = 0;
    offset < supportedAssetIds.length;
    offset += tokenAssetBatchSize
  ) {
    const chunkAssetIds = supportedAssetIds.slice(
      offset,
      offset + tokenAssetBatchSize,
    );

    try {
      const chunkTokens = await fetchTokenAssets(chunkAssetIds, {
        includeTokenSecurityData: true,
      });
      tokens.push(...chunkTokens);
    } catch (error) {
      chunkError ??= error;
    }
  }

  if (chunkError !== undefined && tokens.length === 0) {
    throw chunkError;
  }

  return tokens;
}

const tokenAssetBatcher = create<CaipAssetType, TokenAsset>({
  fetcher: fetchTokenAssetBatch,
  resolver: (tokens, assetId) =>
    tokens.find(
      (token) =>
        isCaipAssetType(token.assetId) &&
        normalizeTokenAssetId(token.assetId) === normalizeTokenAssetId(assetId),
    ) ?? null,
  getKey: normalizeTokenAssetId,
});

export async function fetchTokenAsset(assetId: CaipAssetType) {
  return (await tokenAssetBatcher.fetch(assetId)) ?? null;
}
