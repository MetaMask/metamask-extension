import {
  fetchTokenAssets,
  type TokenAsset,
} from '@metamask/assets-controllers';
import { isCaipAssetType, type CaipAssetType } from '@metamask/utils';
import { create } from '#shared/lib/create-batcher';
import { normalizeTokenAssetId } from '#shared/lib/asset-utils';

const tokenAssetBatchSize = 25;

async function fetchTokenAssetBatch(assetIds: CaipAssetType[]) {
  const tokens: TokenAsset[] = [];

  for (
    let offset = 0;
    offset < assetIds.length;
    offset += tokenAssetBatchSize
  ) {
    const chunkAssetIds = assetIds.slice(offset, offset + tokenAssetBatchSize);
    const chunkTokens = await fetchTokenAssets(chunkAssetIds, {
      includeTokenSecurityData: true,
    });
    tokens.push(...chunkTokens);
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
