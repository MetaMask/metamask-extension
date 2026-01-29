import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { handleFetch } from '@metamask/controller-utils';

const DEBOUNCE_WAIT = 300;

// Utility to create stable array reference to prevent unnecessary re-renders
const useStableArray = (array) => {
  const stableArrayRef = useRef(array);

  if (JSON.stringify(stableArrayRef.current) !== JSON.stringify(array)) {
    stableArrayRef.current = array;
  }

  return stableArrayRef.current;
};

function getTokenSearchURL(chainIds, query, limit = 10) {
  const encodedQuery = encodeURIComponent(query);
  const encodedChainIds = chainIds
    .map((id) => encodeURIComponent(id))
    .join(',');
  return `https://token.api.cx.metamask.io/tokens/search?chainIds=${encodedChainIds}&query=${encodedQuery}&limit=${limit}`;
}

// Placeholder search function with performance measurement
const searchTokens = async (chainIds, query, options = {}) => {
  const startTime = performance.now();

  try {
    console.log(
      `API search request for "${query}" on ${chainIds.length} chains`,
    );

    const tokenSearchURL = getTokenSearchURL(chainIds, query, options.limit);
    const result = await handleFetch(tokenSearchURL);
    console.log('🚀 ~ searchTokens ~ result:', result);

    let finalResult;
    // The API returns an object with structure: { count: number, data: array, pageInfo: object }
    if (result && typeof result === 'object' && Array.isArray(result.data)) {
      finalResult = {
        count: result.count || result.data.length,
        data: result.data,
      };
    } else {
      // Handle non-expected responses
      finalResult = { count: 0, data: [] };
    }

    const duration = performance.now() - startTime;
    console.log(
      `API search  ==== "${query}": ${duration.toFixed(2)}ms, ${finalResult.data.length} results`,
    );
    return { data: finalResult };
  } catch (error) {
    const duration = performance.now() - startTime;
    console.log(
      `API search "${query}" failed: ${duration.toFixed(2)}ms, error: ${error.message}`,
    );
    // Return empty results on error for testing
    return { data: { count: 0, data: [] } };
  }
};

export const useSearchRequest = (options) => {
  const { chainIds = [], query = '', limit = 50 } = options || {};

  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stabilize the chainIds array reference to prevent unnecessary re-memoization
  const stableChainIds = useStableArray(chainIds);

  // Memoize the options object to ensure stable reference
  const memoizedOptions = useMemo(
    () => ({
      chainIds: stableChainIds,
      query: query.trim(),
      limit,
    }),
    [stableChainIds, query, limit],
  );

  const searchTokensRequest = useCallback(async () => {
    if (!memoizedOptions.query) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await searchTokens(
        memoizedOptions.chainIds,
        memoizedOptions.query,
        {
          limit: memoizedOptions.limit,
        },
      );

      setResults(searchResults || null);
    } catch (err) {
      setError(err);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [memoizedOptions]);

  const debouncedSearchTokensRequest = useMemo(
    () => debounce(searchTokensRequest, DEBOUNCE_WAIT),
    [searchTokensRequest],
  );

  // Automatically trigger search when query changes
  useEffect(() => {
    // Cancel any pending debounced calls from previous render
    debouncedSearchTokensRequest.cancel();

    // Trigger search if query is not empty
    if (memoizedOptions.query) {
      setIsLoading(true);
      debouncedSearchTokensRequest();
    } else {
      setIsLoading(false);
      setResults(null);
    }

    // Cleanup: cancel on unmount or when dependencies change
    return () => {
      debouncedSearchTokensRequest.cancel();
    };
  }, [debouncedSearchTokensRequest, memoizedOptions.query]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearchTokensRequest.cancel();
    };
  }, [debouncedSearchTokensRequest]);

  return {
    results: results?.data || [],
    isLoading,
    error,
    search: debouncedSearchTokensRequest,
  };
};
