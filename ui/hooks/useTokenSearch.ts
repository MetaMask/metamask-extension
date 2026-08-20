import { useMemo } from 'react';
import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  browseTokens,
  searchTokens,
  type TokenSearchResponse,
} from '../../shared/lib/token-search/token-search-api';

const DEFAULT_PAGE_SIZE = 25;
const TOKEN_SEARCH_STALE_TIME_MS = 30_000;
const TOKEN_SEARCH_GC_TIME_MS = 5 * 60_000;
const TOKEN_SEARCH_QUERY_KEY_ROOT = [
  'metamask-extension',
  'tokenSearch',
  'v1',
] as const;

export type UseTokenSearchOptions = {
  query: string;
  networks?: string[];
  first?: number;
  enabled?: boolean;
  enableTokenBrowse?: boolean;
};

export type UseTokenSearchResult = Omit<
  UseInfiniteQueryResult<TokenSearchResponse, Error>,
  'data'
> & {
  data?: TokenSearchResponse;
};

const getEmptyTokenSearchResponse = (): TokenSearchResponse => ({
  data: [],
  count: 0,
  totalCount: 0,
  pageInfo: { hasNextPage: false, endCursor: '' },
});

const mergeTokenSearchPages = (
  pages: TokenSearchResponse[],
): TokenSearchResponse => {
  if (pages.length === 0) {
    return getEmptyTokenSearchResponse();
  }

  const data = pages.flatMap((page) => page.data);
  const lastPage = pages[pages.length - 1];

  return {
    data,
    count: data.length,
    totalCount: lastPage?.totalCount ?? data.length,
    pageInfo: lastPage?.pageInfo ?? getEmptyTokenSearchResponse().pageInfo,
  };
};

export const useTokenSearch = ({
  query,
  networks,
  first = DEFAULT_PAGE_SIZE,
  enabled = true,
  enableTokenBrowse = false,
}: UseTokenSearchOptions): UseTokenSearchResult => {
  const trimmedQuery = query.trim();

  const networksKey = useMemo(
    () => (networks && networks.length > 0 ? [...networks].sort() : []),
    [networks],
  );

  const isBrowseMode = enableTokenBrowse && trimmedQuery.length === 0;
  const isEnabled = enabled && (isBrowseMode || trimmedQuery.length > 0);

  const queryResult = useInfiniteQuery<TokenSearchResponse, Error>({
    queryKey: [
      ...TOKEN_SEARCH_QUERY_KEY_ROOT,
      isBrowseMode ? 'browse' : 'search',
      trimmedQuery,
      networksKey,
      first,
    ] as const,
    queryFn: async ({
      signal,
      pageParam,
    }: {
      signal?: AbortSignal;
      pageParam?: string;
    }) => {
      if (isBrowseMode) {
        return browseTokens({
          networks: networksKey.length > 0 ? networksKey : undefined,
          first,
          after: pageParam,
          signal,
        });
      }

      return searchTokens({
        query: trimmedQuery,
        networks: networksKey.length > 0 ? networksKey : undefined,
        first,
        after: pageParam,
        signal,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage
        ? lastPage.pageInfo.endCursor || undefined
        : undefined,
    enabled: isEnabled,
    keepPreviousData: true,
    retry: false,
    staleTime: TOKEN_SEARCH_STALE_TIME_MS,
    cacheTime: TOKEN_SEARCH_GC_TIME_MS,
  });

  const data = useMemo(
    () =>
      queryResult.data
        ? mergeTokenSearchPages(queryResult.data.pages)
        : undefined,
    [queryResult.data],
  );

  return {
    ...queryResult,
    data,
  };
};
