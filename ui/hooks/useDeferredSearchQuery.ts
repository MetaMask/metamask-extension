import { useState } from 'react';
import { useDeferredValue } from './useDeferredValue';

export type UseDeferredSearchQueryResult = {
  query: string;
  setQuery: (query: string) => void;
  deferredQuery: string;
  isPending: boolean;
};

/**
 * Keeps search input updates on the urgent path while exposing a deferred query
 * for expensive filtering, sorting, or network-backed search work.
 * @param initialQuery
 */
export const useDeferredSearchQuery = (
  initialQuery = '',
): UseDeferredSearchQueryResult => {
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const isPending = query !== deferredQuery;

  return {
    query,
    setQuery,
    deferredQuery,
    isPending,
  };
};
