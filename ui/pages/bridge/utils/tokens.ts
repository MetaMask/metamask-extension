import { handleFetch } from '@metamask/controller-utils';
import type { Infer } from '@metamask/superstruct';
import {
  string,
  boolean,
  number,
  type,
  is,
  nullable,
  optional,
  intersection,
} from '@metamask/superstruct';
import {
  CaipAssetTypeStruct,
  type CaipChainId,
  CaipChainIdStruct,
} from '@metamask/utils';
import { getCacheKey, updateCache, retrieveCachedResponse } from './cache';

const MinimalAssetSchema = type({
  /**
   * Case-sensitive for non-EVM chains, case-insensitive for EVM chains
   */
  assetId: CaipAssetTypeStruct,
  /**
   * The symbol of token object
   */
  symbol: string(),
  /**
   * The name for the network
   */
  name: string(),
  decimals: number(),
});

const BridgeAssetV2Schema = intersection([
  MinimalAssetSchema,
  type({
    /**
     * The chainId of the token
     */
    chainId: CaipChainIdStruct,
    /**
     * URL for token icon
     */
    image: optional(string()),
    noFee: optional(
      type({
        isDestination: nullable(optional(boolean())),
        isSource: nullable(optional(boolean())),
      }),
    ),
  }),
]);

/**
 * This is the interface for the asset object returned by the bridge-api popular and search token endpoints
 */
export type BridgeAssetV2 = Infer<typeof BridgeAssetV2Schema>;
export type MinimalAsset = Infer<typeof MinimalAssetSchema>;

const validateSwapsAssetV2Object = (
  data: unknown,
): data is Infer<typeof BridgeAssetV2Schema> => {
  return is(data, BridgeAssetV2Schema);
};

export const validateMinimalAssetObject = (
  data: unknown,
): data is Infer<typeof MinimalAssetSchema> => {
  return is(data, MinimalAssetSchema);
};

const toMinimalAsset = (token: BridgeAssetV2): MinimalAsset => {
  const { assetId, symbol, name, decimals } = token;
  return { assetId, symbol, name, decimals };
};

const postWithCache = async (
  url: Parameters<typeof handleFetch>[0],
  requestParams: Parameters<typeof handleFetch>[1],
  ...cacheParams: Parameters<typeof retrieveCachedResponse>
) => {
  const cachedResponse = await retrieveCachedResponse(...cacheParams);
  if (cachedResponse) {
    return cachedResponse;
  }
  // If this fetch returns a non-200 response, the cache will not be updated
  const response = await handleFetch(url, requestParams);

  await updateCache(response, ...cacheParams);
  return response;
};

const getHeaders = (clientId: string, clientVersion?: string) => {
  return {
    'X-Client-Id': clientId,
    ...(clientVersion ? { 'Client-Version': clientVersion } : {}),
    'Content-Type': 'application/json',
  };
};

/**
 * Fetches a list of tokens sorted by balance, popularity and other criteria from the bridge-api
 *
 * @param params - The parameters for the fetchPopularTokens function
 * @param params.chainIds - The chain IDs to fetch tokens for
 * @param params.assetsWithBalances - The user's balances sorted by amount. This is used to add balance information to the returned tokens. These assets are returned first in the list in the same order as the input.
 * @param params.clientId - The client ID for metrics
 * @param params.bridgeApiBaseUrl - The base URL for the bridge API
 * @param params.clientVersion - The client version for metrics (optional)
 * @param params.signal - The abort signal
 * @returns A list of sorted tokens
 */
export const fetchPopularTokens = async ({
  signal,
  chainIds,
  clientId,
  bridgeApiBaseUrl,
  clientVersion,
  assetsWithBalances,
}: {
  signal: AbortSignal;
  chainIds: CaipChainId[];
  clientId: string;
  bridgeApiBaseUrl: string;
  clientVersion?: string;
  assetsWithBalances?: BridgeAssetV2[];
}): Promise<BridgeAssetV2[]> => {
  const url = `${bridgeApiBaseUrl}/getTokens/popular`;
  // Only the minimum asset fields are passed to the bridge-api to avoid creating a new cache entry if
  // token sorting has not changed
  const includeAssets =
    assetsWithBalances && assetsWithBalances.length > 0
      ? assetsWithBalances.map(toMinimalAsset)
      : undefined;
  const cacheKey = getCacheKey(url, {
    chainIds,
    includeAssets,
  });

  const tokens = await postWithCache(
    url,
    {
      signal,
      method: 'POST',
      body: JSON.stringify({
        chainIds,
        includeAssets,
      }),
      headers: getHeaders(clientId, clientVersion),
    },
    cacheKey,
  );

  return tokens
    .map((token: unknown) => (validateSwapsAssetV2Object(token) ? token : null))
    .filter(Boolean);
};

/**
 * Fetches a list of matching tokens sorted by balance, popularity and other criteria from the bridge-api
 *
 * @param params - The parameters for the fetchTokensBySearchQuery function
 * @param params.chainIds - The chain IDs to fetch tokens for
 * @param params.query - The search query
 * @param params.clientId - The client ID for metrics
 * @param params.bridgeApiBaseUrl - The base URL for the bridge API
 * @param params.clientVersion - The client version for metrics (optional)
 * @param params.assetsWithBalances - The assets to include in the search
 * @param params.after - The cursor to start from
 * @param params.signal - The abort signal
 * @returns A list of sorted tokens
 */
export const fetchTokensBySearchQuery = async ({
  signal,
  chainIds,
  query,
  clientId,
  bridgeApiBaseUrl,
  clientVersion,
  assetsWithBalances,
  after,
}: {
  signal: AbortSignal;
  chainIds: CaipChainId[];
  query: string;
  clientId: string;
  bridgeApiBaseUrl: string;
  clientVersion?: string;
  assetsWithBalances?: BridgeAssetV2[];
  after?: string;
}): Promise<{
  hasNextPage: boolean;
  endCursor?: string;
  tokens: BridgeAssetV2[];
}> => {
  const url = `${bridgeApiBaseUrl}/getTokens/search`;
  // Only the minimum asset fields are passed to the bridge-api to avoid creating a new cache entry if
  // token sorting has not changed
  const includeAssets =
    assetsWithBalances && assetsWithBalances.length > 0
      ? assetsWithBalances.map(toMinimalAsset)
      : undefined;

  const cacheKey = getCacheKey(url, {
    chainIds,
    includeAssets,
    searchQuery: query,
  });

  const { data: tokens, pageInfo } = await postWithCache(
    url,
    {
      method: 'POST',
      body: JSON.stringify({
        chainIds,
        includeAssets,
        after,
        query,
      }),
      signal,
      headers: getHeaders(clientId, clientVersion),
    },
    cacheKey,
    after,
  );
  const { hasNextPage, endCursor } = pageInfo;

  return {
    hasNextPage,
    endCursor,
    tokens: tokens
      .map((token: unknown) =>
        validateSwapsAssetV2Object(token) ? token : null,
      )
      .filter(Boolean),
  };
};
