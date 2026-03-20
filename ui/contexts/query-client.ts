import { QueryClient } from '@tanstack/react-query';
import {
  STALE_TIMES,
  GC_TIMES,
  shouldRetry,
  calculateRetryDelay,
} from '@metamask/core-backend';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.DEFAULT, // 30s — UI owns freshness by default
      cacheTime: GC_TIMES.DEFAULT, // 5min (TQ v4: cacheTime; renamed gcTime in v5)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: shouldRetry as (failureCount: number, error: unknown) => boolean,
      retryDelay: calculateRetryDelay as (failureCount: number) => number,
    },
  },
});
