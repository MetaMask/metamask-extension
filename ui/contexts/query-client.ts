import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable automatic refetching by default
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Cache data for 5 minutes by default
      cacheTime: 5 * 60 * 1000,
      // Consider data fresh for 10 seconds by default
      staleTime: 10 * 1000,
    },
  },
} as const);
