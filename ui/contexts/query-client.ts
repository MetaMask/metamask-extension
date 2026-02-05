import { QueryClient } from '@tanstack/react-query';
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import browser from 'webextension-polyfill';

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

if (typeof browser !== 'undefined' && browser.storage?.local) {
  const extensionStorage = {
    getItem: async (key: string) => {
      const result = await browser.storage.local.get(key);
      return result[key] ?? null;
    },
    setItem: async (key: string, value: string) => {
      await browser.storage.local.set({ [key]: value });
    },
    removeItem: async (key: string) => {
      await browser.storage.local.remove(key);
    },
  };

  const persister = createAsyncStoragePersister({
    storage: extensionStorage,
    key: 'DEMO_PERSISTENCE',
  });

  // Optional: To demonstrate persistence
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  });
}

// Optional: To demonstrate cross-UI process sync
broadcastQueryClient({
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
