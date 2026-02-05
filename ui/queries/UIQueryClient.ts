import { hydrate, QueryClient } from '@tanstack/query-core';
import { Json } from '@metamask/utils';
import { BackgroundRpcClient } from '../store/background-connection';

export let uiQueryClient: QueryClient;

export function createUIQueryClient(backgroundConnection: BackgroundRpcClient) {
  const activeSubscriptions = new Set<string>();

  async function sendBackgroundRequest(method: string, params: Json[]) {
    const result = await backgroundConnection[method](...params);

    console.log(method, params, result);
    return result;
  }

  const client: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }) => {
          const state = await sendBackgroundRequest('QueryService:fetch', [
            queryKey,
          ]);
          hydrate(client, state);
          return client.getQueryData(queryKey);
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
      },
    },
  });

  backgroundConnection.onNotification(async (data) => {
    const { method, params } = data;
    if (method === 'QueryService:cacheUpdate') {
      const { queryKeyHash, state } = params[0];
      if (activeSubscriptions.has(queryKeyHash)) {
        console.log('Hydrated cache', queryKeyHash);
        hydrate(client, state);
      }
    }
  });

  client.getQueryCache().subscribe((event) => {
    const { query } = event;
    if (!query) {
      return;
    }

    const hash = query.queryHash;
    const observerCount = query.getObserversCount();

    if (event.type === 'observerAdded' && observerCount === 1) {
      if (!activeSubscriptions.has(hash)) {
        activeSubscriptions.add(hash);
        sendBackgroundRequest('QueryService:subscribe', [query.queryKey]).then(
          (state) => {
            hydrate(client, state);
          },
        );
      }
    } else if (event.type === 'observerRemoved' && observerCount === 0) {
      if (activeSubscriptions.has(hash)) {
        activeSubscriptions.delete(hash);
        sendBackgroundRequest('QueryService:unsubscribe', [query.queryKey]);
      }
    }
  });

  // TODO: Cleanup this hack
  uiQueryClient = client;
}
