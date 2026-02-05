import { QueryClient } from '@tanstack/react-query';
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';

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
});

// Sync query client across contexts (popup, sidepanel, background)
broadcastQueryClient({
  // @ts-expect-error - fixed once @tanstack/react-query is updated
  queryClient,
  broadcastChannel: 'demo-query-sync',
});

// Debug
if (process.env.METAMASK_DEBUG) {
  queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === 'added' || event?.type === 'updated') {
      console.log('>>> Query Client Cache update:', {
        type: event.type,
        queryKey: event.query.queryKey,
        hasData: Boolean(event.query.state.data),
      });
    }
  });
}
