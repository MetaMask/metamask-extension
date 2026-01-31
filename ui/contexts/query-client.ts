import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable automatic refetching
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Cache data for 5 minutes
      cacheTime: 5 * 60 * 1000,
      // Consider data fresh for 10 seconds
      staleTime: 10 * 1000,
    },
  },
} as const);
