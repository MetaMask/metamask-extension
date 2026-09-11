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
  let chunkError: unknown;

  for (
    let offset = 0;
    offset < assetIds.length;
    offset += tokenAssetBatchSize
  ) {
    const chunkAssetIds = assetIds.slice(offset, offset + tokenAssetBatchSize);

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
