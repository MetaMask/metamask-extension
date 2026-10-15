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
  array,
  enums,
} from '@metamask/superstruct';
import { CaipAssetTypeStruct, type CaipChainId } from '@metamask/utils';
import { getClientHeaders } from '@metamask/bridge-controller';
import { v4 as uuidv4 } from 'uuid';
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';
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

export enum BridgeAssetSecurityDataType {
  INFO = 'Info',
  BENIGN = 'Benign',
  VERIFIED = 'Verified',
  WARNING = 'Warning',
  SPAM = 'Spam',
  MALICIOUS = 'Malicious',
}

export const BridgeAssetSecurityData = type({
  isVerified: optional(boolean()),
  securityData: optional(
    type({
      type: enums(Object.values(BridgeAssetSecurityDataType)),
      metadata: optional(
        type({
          features: array(
            type({
              featureId: string(),
              type: enums(Object.values(BridgeAssetSecurityDataType)),
              description: string(),
            }),
          ),
        }),
      ),
    }),
  ),
});

const BridgeAssetV2Schema = intersection([
  MinimalAssetSchema,
  BridgeAssetSecurityData,
  type({
    /**
     * URL for token icon
     */
    iconUrl: nullable(optional(string())),
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

type CacheMissTrace = {
  name: TraceName;
  data: Record<string, number | string | boolean>;
  isSuccess?: (response: unknown) => boolean;
  getEndData?: (response: unknown) => Record<string, number | string | boolean>;
};

const postWithCache = async <TResponse extends object>(
  url: Parameters<typeof handleFetch>[0],
  requestParams: Parameters<typeof handleFetch>[1],
  cacheMissTrace: CacheMissTrace | undefined,
  ...cacheParams: Parameters<typeof retrieveCachedResponse>
) => {
  const cachedResponse = await retrieveCachedResponse(...cacheParams);
  if (cachedResponse) {
    return cachedResponse as TResponse;
  }

  const traceId = cacheMissTrace ? uuidv4() : undefined;
  if (cacheMissTrace && traceId) {
    trace({
      name: cacheMissTrace.name,
      op: TraceOperation.BridgeDataFetch,
      id: traceId,
      data: cacheMissTrace.data,
      startTime: Date.now(),
    });
  }

  let traceResult: 'success' | 'cancelled' | 'error' = 'success';
  let response: TResponse | undefined;
  try {
    // If this fetch returns a non-200 response, the cache will not be updated
    response = (await handleFetch(url, requestParams)) as TResponse;

    if (cacheMissTrace?.isSuccess && !cacheMissTrace.isSuccess(response)) {
      traceResult = 'error';
      return response;
    }

    await updateCache(response, ...cacheParams);
    return response;
  } catch (error) {
    traceResult = requestParams?.signal?.aborted ? 'cancelled' : 'error';
    throw error;
  } finally {
    if (cacheMissTrace && traceId) {
      endTrace({
        name: cacheMissTrace.name,
        id: traceId,
        timestamp: Date.now(),
        data: {
          result: traceResult,
          ...(cacheMissTrace.getEndData?.(response) ?? {}),
        },
      });
    }
  }
};

const getBucket = (
  value: number,
  thresholds: readonly number[],
  labels: readonly string[],
): string => {
  const index = thresholds.findIndex((threshold) => value <= threshold);
  return labels[index === -1 ? labels.length - 1 : index];
};

const getQueryLengthBucket = (length: number): string =>
  getBucket(length, [2, 5, 10], ['0-2', '3-5', '6-10', '11+']);

const getResultCountBucket = (count: number): string =>
  getBucket(count, [0, 5, 20], ['0', '1-5', '6-20', '21+']);

/**
 * Fetches a list of tokens sorted by balance, popularity and other criteria from the bridge-api
 *
 * @param params - The parameters for the fetchPopularTokens function
 * @param params.jwt - The JWT token for authentication
 * @param params.chainIds - The chain IDs to fetch tokens for
 * @param params.assetsWithBalances - The user's balances sorted by amount. This is used to add balance information to the returned tokens. These assets are returned first in the list in the same order as the input.
 * @param params.clientId - The client ID for metrics
 * @param params.bridgeApiBaseUrl - The base URL for the bridge API
 * @param params.clientVersion - The client version for metrics (optional)
 * @param params.signal - The abort signal
 * @returns A list of sorted tokens
 */
export const fetchPopularTokens = async ({
  jwt,
  signal,
  chainIds,
  clientId,
  bridgeApiBaseUrl,
  clientVersion,
  assetsWithBalances,
}: {
  jwt?: string;
  signal?: AbortSignal;
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

  const tokens = await postWithCache<BridgeAssetV2[]>(
    url,
    {
      signal,
      method: 'POST',
      body: JSON.stringify({
        chainIds,
        includeAssets,
      }),
      headers: {
        ...getClientHeaders({ clientId, clientVersion, jwt }),
        'Content-Type': 'application/json',
      },
    },
    {
      name: TraceName.SwapPopularTokensFetch,
      data: {
        /* eslint-disable @typescript-eslint/naming-convention -- Sentry trace attributes use snake_case */
        chain_scope: chainIds.length > 1 ? 'multi_chain' : 'single_chain',
        chain_ids: chainIds.join(','),
        /* eslint-enable @typescript-eslint/naming-convention */
      },
      isSuccess: (response) => Array.isArray(response),
    },
    cacheKey,
  );

  return tokens
    .map((token: unknown) => (validateSwapsAssetV2Object(token) ? token : null))
    .filter((token): token is BridgeAssetV2 => token !== null);
};

/**
 * Fetches a list of matching tokens sorted by balance, popularity and other criteria from the bridge-api
 *
 * @param params - The parameters for the fetchTokensBySearchQuery function
 * @param params.jwt - The JWT token for authentication
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
  jwt,
  signal,
  chainIds,
  query,
  clientId,
  bridgeApiBaseUrl,
  clientVersion,
  assetsWithBalances,
  after,
}: {
  jwt?: string;
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

  const { data: tokens, pageInfo } = await postWithCache<{
    data: BridgeAssetV2[];
    pageInfo: { hasNextPage: boolean; endCursor?: string };
  }>(
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
      headers: {
        ...getClientHeaders({ clientId, clientVersion, jwt }),
        'Content-Type': 'application/json',
      },
    },
    !after && query.trim().length > 0
      ? {
          name: TraceName.SwapTokenSearch,
          data: {
            /* eslint-disable @typescript-eslint/naming-convention -- Sentry trace attributes use snake_case */
            chain_scope: chainIds.length > 1 ? 'multi_chain' : 'single_chain',
            query_length_bucket: getQueryLengthBucket(query.trim().length),
            /* eslint-enable @typescript-eslint/naming-convention */
          },
          getEndData: (response) => {
            const resultCount =
              typeof response === 'object' &&
              response !== null &&
              'data' in response &&
              Array.isArray(response.data)
                ? response.data.length
                : 0;
            // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry trace attribute
            return { result_count_bucket: getResultCountBucket(resultCount) };
          },
        }
      : undefined,
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
      .filter((token): token is BridgeAssetV2 => token !== null),
  };
};
