import getFetchWithTimeout from '../fetch-with-timeout';
import { TEN_SECONDS_IN_MILLISECONDS } from '../transactions-controller-utils';

const TOKEN_SEARCH_BASE_URL = 'https://token.api.cx.metamask.io';

/**
 * A single token returned by GET /tokens/search.
 *
 * Mirrors the public API response, intentionally a permissive subset so the UI
 * can keep working if the API adds non-breaking fields.
 */
export type TokenSearchResult = {
  /** CAIP-19 asset id, e.g. `eip155:1/erc20:0xa0b…`. */
  assetId: string;
  symbol: string;
  decimals: number;
  name: string;
  /** Optional icon URL (only present on some entries). */
  iconUrl?: string;
  /** Free-form tags, e.g. `['stable_coin']`. */
  labels?: string[];
};

/**
 * Cursor-based page info from the search endpoint.
 */
export type TokenSearchPageInfo = {
  hasNextPage: boolean;
  endCursor: string;
};

/**
 * Raw response payload from GET /tokens/search.
 */
export type TokenSearchResponse = {
  data: TokenSearchResult[];
  count: number;
  totalCount: number;
  pageInfo: TokenSearchPageInfo;
};

/**
 * Options accepted by {@link searchTokens}.
 */
export type SearchTokensOptions = {
  /** User-provided query string (token symbol, name, or address). Required. */
  query: string;
  /**
   * CAIP-2 chain IDs to constrain the search to. When omitted, the API
   * defaults to all supported networks.
   */
  networks?: string[];
  /** Max number of results, defaults to 10 server-side. */
  first?: number;
  /** Base64 cursor returned by a previous response for paging. */
  after?: string;
  /** Whether to ask the API for security warnings on each token. */
  includeTokenSecurityData?: boolean;
  /** Optional abort signal to cancel a stale request. */
  signal?: AbortSignal;
};

/**
 * Builds the query string for a search request. Exposed for unit tests so the
 * mapping from UI state to API params can be asserted without a network round
 * trip.
 *
 * @param options - The same options accepted by {@link searchTokens}.
 * @returns The query string (without leading `?`) for the request.
 */
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

/**
 * Calls GET /tokens/search on the Token API.
 *
 * Throws when the request fails or the response is not OK. Returns an empty
 * page when called with an empty query — callers should typically skip the
 * call in that case rather than rely on this.
 *
 * @param options - The search options. {@see SearchTokensOptions}.
 * @returns The parsed search response.
 */
export const searchTokens = async (
  options: SearchTokensOptions,
): Promise<TokenSearchResponse> => {
  const trimmedQuery = options.query.trim();
  if (!trimmedQuery) {
    return {
      data: [],
      count: 0,
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: '' },
    };
  }

  const queryString = buildTokenSearchQueryString({
    ...options,
    query: trimmedQuery,
  });
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
