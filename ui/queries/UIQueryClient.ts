import {
  hydrate,
  QueryClient,
  InvalidateQueryFilters,
  InvalidateOptions,
  QueryKey,
} from '@tanstack/query-core';
import { Json } from '@metamask/utils';
import { BackgroundRpcClient } from '../store/background-connection';
import { DATA_SERVICES } from '../../shared/constants/data-services';

export let uiQueryClient: QueryClient;

function getServiceFromQueryKey(queryKey: QueryKey) {
  return queryKey[0].split(':')[0];
}

export function createUIQueryClient(backgroundConnection: BackgroundRpcClient) {
  const subscriptions = new Set<string>();

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

          return await sendBackgroundRequest(potentialAction, [options]);
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

    if (!method.endsWith('cacheUpdate')) {
      return;
    }

    const { queryKeyHash, state } = params[0];
    if (subscriptions.has(queryKeyHash)) {
      console.log('Hydrated cache', queryKeyHash, state);
      hydrate(client, state);
    }
  });

  client.getQueryCache().subscribe((event) => {
    const { query } = event;
    if (!query) {
      return;
    }

    const hash = query.queryHash;
    const hasSubscription = subscriptions.has(hash);
    const observerCount = query.getObserversCount();

    const service = getServiceFromQueryKey(query.queryKey);

    if (
      !hasSubscription &&
      event.type === 'observerAdded' &&
      observerCount === 1
    ) {
      subscriptions.add(hash);

      sendBackgroundRequest(`${service}:subscribe`, [query.queryKey]).then(
        (state) => {
          hydrate(client, state);
        },
      );
    } else if (
      event.type === 'observerRemoved' &&
      observerCount === 0 &&
      hasSubscription
    ) {
      subscriptions.delete(hash);
      sendBackgroundRequest(`${service}:unsubscribe`, [query.queryKey]);
    }
  });

  const originalInvalidate = client.invalidateQueries.bind(client);
  client.invalidateQueries = async (
    filters?: InvalidateQueryFilters<unknown>,
    options?: InvalidateOptions,
  ) => {
    const queries = client.getQueryCache().findAll(filters);
    await Promise.all(
      queries.map((query) => {
        const service = getServiceFromQueryKey(query.queryKey);

        return sendBackgroundRequest(`${service}:invalidateQueries`, [
          filters,
          options,
        ]);
      }),
    );

    return originalInvalidate(filters, options);
  };

  // TODO: Cleanup this hack
  uiQueryClient = client;
}
