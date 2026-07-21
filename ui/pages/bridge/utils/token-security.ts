import {
  fetchTokenAssets,
  type TokenAsset,
} from '@metamask/assets-controllers';
import {
  KnownCaipNamespace,
  parseCaipAssetType,
  type CaipAssetType,
} from '@metamask/utils';
import { getCacheKey, retrieveCachedResponse, updateCache } from './cache';

const TOKEN_SECURITY_CACHE_KEY = 'fetchTokenAssets';
const inFlightRequests = new Map<string, Promise<TokenAsset[]>>();

export function getTokenSecurityAssetKey(
  assetId: CaipAssetType,
): CaipAssetType {
  const { chain } = parseCaipAssetType(assetId);
  return chain.namespace === KnownCaipNamespace.Eip155
    ? (assetId.toLowerCase() as CaipAssetType)
    : assetId;
}

function isTokenAsset(value: unknown): value is TokenAsset {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'assetId' in value &&
    typeof value.assetId === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'symbol' in value &&
    typeof value.symbol === 'string' &&
    'decimals' in value &&
    typeof value.decimals === 'number'
  );
}

function getUniqueSortedAssetIds(
  assetIds: CaipAssetType[],
): CaipAssetType[] {
  const uniqueAssetIds = new Map<CaipAssetType, CaipAssetType>();
  assetIds.forEach((assetId) => {
    const assetKey = getTokenSecurityAssetKey(assetId);
    uniqueAssetIds.set(assetKey, assetKey);
  });

  return [...uniqueAssetIds.values()].sort((first, second) =>
    getTokenSecurityAssetKey(first).localeCompare(
      getTokenSecurityAssetKey(second),
    ),
  );
}

export async function fetchCachedTokenAssets(
  assetIds: CaipAssetType[],
): Promise<TokenAsset[]> {
  const uniqueAssetIds = getUniqueSortedAssetIds(assetIds);
  if (uniqueAssetIds.length === 0) {
    return [];
  }

  const cacheKey = getCacheKey(TOKEN_SECURITY_CACHE_KEY, {
    assetIds: uniqueAssetIds.map(getTokenSecurityAssetKey),
    includeTokenSecurityData: true,
  });
  const inFlightRequest = inFlightRequests.get(cacheKey);
  if (inFlightRequest) {
    return await inFlightRequest;
  }

  const request = (async () => {
    const cachedResponse = await retrieveCachedResponse(cacheKey);
    if (
      Array.isArray(cachedResponse) &&
      cachedResponse.every(isTokenAsset)
    ) {
      return cachedResponse;
    }

    try {
      const tokens = await fetchTokenAssets(uniqueAssetIds, {
        includeTokenSecurityData: true,
      });
      if (tokens.length > 0) {
        await updateCache(tokens, cacheKey);
      }
      return tokens;
    } catch {
      return [];
    }
  })().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, request);
  return await request;
}
