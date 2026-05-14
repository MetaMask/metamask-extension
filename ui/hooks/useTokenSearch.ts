import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  searchTokens,
  type TokenSearchResponse,
} from '../../shared/lib/token-search/token-search-api';

const DEFAULT_PAGE_SIZE = 25;
/** How long results stay "fresh" before react-query will refetch on mount. */
const TOKEN_SEARCH_STALE_TIME_MS = 30_000;
/** How long inactive results stay cached before they're garbage collected. */
const TOKEN_SEARCH_GC_TIME_MS = 5 * 60_000;
/** Query-key prefix so this cache is distinguishable from other consumers. */
const TOKEN_SEARCH_QUERY_KEY_ROOT = [
  'metamask-extension',
  'tokenSearch',
  'v1',
] as const;

export type UseTokenSearchOptions = {
  /**
   * The (already debounced) query string to send to the API. Callers are
  */
  query: string;
  /**
   * CAIP-2 chain IDs to scope the search to. Pass `undefined` (or an empty
   * array) to let the API search across its default supported networks.
   */
  networks?: string[];
  /** Max results per page. Defaults to 25 (the API default is 10). */
  first?: number;
  /** When false, the hook becomes a no-op and never hits the API. */
  enabled?: boolean;
};

/**
 * Thin react-query wrapper around the Token API `/tokens/search` endpoint.

 *
 * @param options - Hook configuration.
 * @param options.query
 * @param options.networks
 * @param options.first
 * @param options.enabled
 * @returns The react-query result for the token-search request.
 */
export const useTokenSearch = ({
  query,
  networks,
  first = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseTokenSearchOptions): UseQueryResult<TokenSearchResponse, Error> => {
  const trimmedQuery = query.trim();

  const networksKey = useMemo(
    () => (networks && networks.length > 0 ? [...networks].sort() : []),
    [networks],
  );

  const isEnabled = enabled && trimmedQuery.length > 0;

  return useQuery<TokenSearchResponse, Error>({
    queryKey: [
      ...TOKEN_SEARCH_QUERY_KEY_ROOT,
      trimmedQuery,
      networksKey,
      first,
    ] as const,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      searchTokens({
        query: trimmedQuery,
        networks: networksKey.length > 0 ? networksKey : undefined,
        first,
        signal,
      }),
    enabled: isEnabled,
    keepPreviousData: true,
    retry: false,
    staleTime: TOKEN_SEARCH_STALE_TIME_MS,
    // `cacheTime` in v4 / `gcTime` in v5 — the project still types react-query
    // as v4 so we use the older name here.
    cacheTime: TOKEN_SEARCH_GC_TIME_MS,
  });
};
