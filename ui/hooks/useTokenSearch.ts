import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  searchTokens,
  type TokenSearchResponse,
  type TokenSearchResult,
} from '../../shared/lib/token-search/token-search-api';

const DEFAULT_DEBOUNCE_MS = 300;
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
  /** Raw user input (trimmed before being sent to the API). */
  query: string;
  /**
   * CAIP-2 chain IDs to scope the search to. Pass `undefined` (or an empty
   * array) to let the API search across its default supported networks.
   */
  networks?: string[];
  /** Max results per page. Defaults to 25 (the API default is 10). */
  first?: number;
  /** Override the debounce duration in milliseconds. */
  debounceMs?: number;
  /** When false, the hook becomes a no-op and never hits the API. */
  enabled?: boolean;
};

export type UseTokenSearchState = {
  /** Current results, or `[]` while loading / when the query is empty. */
  results: TokenSearchResult[];
  isLoading: boolean;
  error: Error | null;
  /** True when the current results array is non-empty. */
  hasResults: boolean;
  /** True when a non-empty query has been entered (post-trim). */
  hasQuery: boolean;
  hasNextPage: boolean;
};

/**
 * Drives the API-backed token search field on the Manage Tokens page.
 *
 * Implementation notes:
 *
 *  - Built on top of TanStack Query (`useQuery`) so identical searches are
 *    deduped/cached automatically, in-flight requests get a `signal`, and
 *    stale results can't overwrite a fresher one when the query key changes.
 *  - The user's keystrokes are debounced into a "committed" query before that
 *    is folded into the react-query key, so we don't burn an API call on
 *    every character.
 *  - Empty queries short-circuit the request entirely via `enabled: false`.
 *
 * @param options - Hook configuration.
 * @returns The current search state. {@see UseTokenSearchState}.
 */
export const useTokenSearch = ({
  query,
  networks,
  first = DEFAULT_PAGE_SIZE,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  enabled = true,
}: UseTokenSearchOptions): UseTokenSearchState => {
  const trimmedQuery = query.trim();

  // Debounced version of the user's query. We start blank so that the very
  // first render (mount with a non-empty query) still has to wait one debounce
  // window before firing — otherwise the debounce wouldn't apply to the
  // initial keystroke that triggered the hook.
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    if (debounceMs <= 0) {
      setDebouncedQuery(trimmedQuery);
      return undefined;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [trimmedQuery, debounceMs]);

  // Stable, JSON-friendly view of the networks list for the query key.
  const networksKey = useMemo(
    () => (networks && networks.length > 0 ? [...networks].sort() : []),
    [networks],
  );

  const isEnabled = enabled && debouncedQuery.length > 0;

  const {
    data,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: [
      ...TOKEN_SEARCH_QUERY_KEY_ROOT,
      debouncedQuery,
      networksKey,
      first,
    ] as const,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      searchTokens({
        query: debouncedQuery,
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

  const response = data as TokenSearchResponse | undefined;

  // Surface results based on the *raw* (post-trim) query, not the debounced
  // value, so clearing the input wipes the visible results immediately even
  // though `keepPreviousData` still has the prior page cached.
  const showResults = enabled && trimmedQuery.length > 0;
  const results = showResults ? response?.data ?? [] : [];
  const hasNextPage = showResults
    ? Boolean(response?.pageInfo?.hasNextPage)
    : false;

  return {
    results,
    isLoading: isEnabled && isFetching,
    error: (queryError as Error | null) ?? null,
    hasResults: results.length > 0,
    hasQuery: trimmedQuery.length > 0,
    hasNextPage,
  };
};
