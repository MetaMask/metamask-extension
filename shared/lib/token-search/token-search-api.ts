import type { CaipAssetType } from '@metamask/utils';
import getFetchWithTimeout from '../fetch-with-timeout';
import { TEN_SECONDS_IN_MILLISECONDS } from '../transactions-controller-utils';

const TOKEN_SEARCH_BASE_URL = 'https://token.api.cx.metamask.io';
const TOKEN_V3_BASE_URL = 'https://tokens.api.cx.metamask.io';
const DEFAULT_BROWSE_OCCURRENCE_FLOOR = 3;
const EVM_CHAIN_NAMESPACE = 'eip155:';

export type TokenSearchResult = {
  assetId: CaipAssetType;
  symbol: string;
  decimals: number;
  name: string;
  iconUrl?: string;
  labels?: string[];
};

export type TokenSearchPageInfo = {
  hasNextPage: boolean;
  endCursor: string;
};

export type TokenSearchResponse = {
  data: TokenSearchResult[];
  count: number;
  totalCount: number;
  pageInfo: TokenSearchPageInfo;
};

export type SearchTokensOptions = {
  query: string;
  networks?: string[];
  first?: number;
  after?: string;
  includeTokenSecurityData?: boolean;
  signal?: AbortSignal;
};

export type BrowseTokensOptions = Omit<SearchTokensOptions, 'query'>;

type ChainAssetsResponse = {
  data?: TokenSearchResult[];
  count?: number;
  totalCount?: number;
  pageInfo?: Partial<TokenSearchPageInfo>;
};

type BrowseCursorState = Record<string, string | undefined>;

export const buildTokenSearchQueryString = (
  options: Omit<SearchTokensOptions, 'signal'>,
): string => {
  const params = new URLSearchParams();
  params.set('query', options.query);
  if (options.networks && options.networks.length > 0) {
    params.set('networks', options.networks.join(','));
  }
  if (typeof options.first === 'number') {
    params.set('first', String(options.first));
  }
  if (options.after) {
    params.set('after', options.after);
  }
  if (options.includeTokenSecurityData) {
    params.set('includeTokenSecurityData', 'true');
  }
  return params.toString();
};

const fetchTokenSearch = async (
  options: SearchTokensOptions,
): Promise<TokenSearchResponse> => {
  const queryString = buildTokenSearchQueryString(options);
  const url = `${TOKEN_SEARCH_BASE_URL}/tokens/search?${queryString}`;

  const fetchWithTimeout = getFetchWithTimeout(TEN_SECONDS_IN_MILLISECONDS);
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: { 'X-Client-Id': 'extension' },
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(
      `Token search failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as TokenSearchResponse;
};

const getEmptyTokenSearchResponse = (): TokenSearchResponse => ({
  data: [],
  count: 0,
  totalCount: 0,
  pageInfo: { hasNextPage: false, endCursor: '' },
});

const parseBrowseCursorState = (cursor?: string): BrowseCursorState => {
  if (!cursor) {
    return {};
  }

  try {
    const parsed = JSON.parse(cursor) as BrowseCursorState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const searchTokens = async (
  options: SearchTokensOptions,
): Promise<TokenSearchResponse> => {
  const trimmedQuery = options.query.trim();
  if (!trimmedQuery) {
    return getEmptyTokenSearchResponse();
  }

  return fetchTokenSearch({
    ...options,
    query: trimmedQuery,
  });
};

export const browseTokens = async (
  options: BrowseTokensOptions,
): Promise<TokenSearchResponse> => {
  if (!options.networks || options.networks.length === 0) {
    return getEmptyTokenSearchResponse();
  }

  const fetchWithTimeout = getFetchWithTimeout(TEN_SECONDS_IN_MILLISECONDS);
  const cursorState = parseBrowseCursorState(options.after);

  const settledResponses = await Promise.allSettled(
    options.networks.map(async (chainId) => {
      const url = new URL(`${TOKEN_V3_BASE_URL}/v3/chains/${chainId}/assets`);
      if (typeof options.first === 'number') {
        url.searchParams.set('first', String(options.first));
      }
      if (chainId.startsWith(EVM_CHAIN_NAMESPACE)) {
        url.searchParams.set(
          'occurrenceFloor',
          String(DEFAULT_BROWSE_OCCURRENCE_FLOOR),
        );
      }

      const chainCursor = cursorState[chainId];
      if (chainCursor) {
        url.searchParams.set('after', chainCursor);
      }

      const response = await fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers: { 'X-Client-Id': 'extension' },
        signal: options.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Token browse failed: ${response.status} ${response.statusText}`,
        );
      }

      return [chainId, (await response.json()) as ChainAssetsResponse] as const;
    }),
  );

  const responses = settledResponses
    .filter(
      (
        response,
      ): response is PromiseFulfilledResult<
        readonly [string, ChainAssetsResponse]
      > => response.status === 'fulfilled',
    )
    .map((response) => response.value);

  if (responses.length === 0) {
    const firstRejected = settledResponses.find(
      (response): response is PromiseRejectedResult =>
        response.status === 'rejected',
    );
    if (firstRejected) {
      throw firstRejected.reason;
    }

    return getEmptyTokenSearchResponse();
  }

  const data = responses.flatMap(([, response]) => response.data ?? []);
  const totalCount = responses.reduce(
    (sum, [, response]) => sum + (response.totalCount ?? response.count ?? 0),
    0,
  );

  const nextCursorState = Object.fromEntries(
    responses
      .filter(([, response]) => response.pageInfo?.hasNextPage)
      .map(([chainId, response]) => [chainId, response.pageInfo?.endCursor]),
  );

  return {
    data,
    count: data.length,
    totalCount,
    pageInfo: {
      hasNextPage: Object.keys(nextCursorState).length > 0,
      endCursor:
        Object.keys(nextCursorState).length > 0
          ? JSON.stringify(nextCursorState)
          : '',
    },
  };
};
