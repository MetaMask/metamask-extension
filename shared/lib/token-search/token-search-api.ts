import getFetchWithTimeout from '../fetch-with-timeout';
import { TEN_SECONDS_IN_MILLISECONDS } from '../transactions-controller-utils';

const TOKEN_SEARCH_BASE_URL = 'https://token.api.cx.metamask.io';
// A single-space query is the API browse mode and still returns cursor pages.
const TOKEN_BROWSE_QUERY = ' ';

export type TokenSearchResult = {
  assetId: string;
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

  return fetchTokenSearch({
    ...options,
    query: trimmedQuery,
  });
};

export const browseTokens = async (
  options: BrowseTokensOptions,
): Promise<TokenSearchResponse> =>
  fetchTokenSearch({
    ...options,
    query: TOKEN_BROWSE_QUERY,
  });
