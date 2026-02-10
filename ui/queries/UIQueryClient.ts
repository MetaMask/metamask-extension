import { hydrate, QueryClient } from '@tanstack/query-core';
import { Json } from '@metamask/utils';
import { BackgroundRpcClient } from '../store/background-connection';
import { DATA_SERVICES } from '../../shared/constants/data-services';

export let uiQueryClient: QueryClient;

export function createUIQueryClient(backgroundConnection: BackgroundRpcClient) {
  const activeSubscriptions = new Set<string>();

  async function sendBackgroundRequest(method: string, params: Json[]) {
    try {
      const result = await backgroundConnection[method](...params);

      console.log(method, params, result);

      return result;
    } catch (error) {
      console.error(method, params, error);
    }
  }

  const client: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async (options) => {
          const { queryKey } = options;

          const potentialAction = queryKey?.[0];

          if (!DATA_SERVICES.includes(potentialAction?.split(':')?.[0])) {
            throw new Error('Queries must use data service actions.');
          }

          const state = await sendBackgroundRequest(potentialAction, [options]);

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
    if (method.endsWith('cacheUpdate')) {
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

    const service = query.queryKey[0].split(':')[0];

    if (event.type === 'observerAdded' && observerCount === 1) {
      if (!activeSubscriptions.has(hash)) {
        activeSubscriptions.add(hash);
        sendBackgroundRequest(`${service}:subscribe`, [query.queryKey]).then(
          (state) => {
            hydrate(client, state);
          },
        );
      }
    } else if (event.type === 'observerRemoved' && observerCount === 0) {
      if (activeSubscriptions.has(hash)) {
        activeSubscriptions.delete(hash);
        sendBackgroundRequest(`${service}:unsubscribe`, [query.queryKey]);
      }
    }
  });

  // TODO: Cleanup this hack
  uiQueryClient = client;
}
