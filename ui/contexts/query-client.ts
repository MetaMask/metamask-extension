import { createUIQueryClient } from '@metamask/react-data-query';
import type { DataServiceGranularCacheUpdatedPayload } from '@metamask/base-data-service';
import { NamespacedName } from '@metamask/messenger';
import { Json } from '@metamask/utils';
import { DATA_SERVICES } from '../../shared/constants/data-services';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../store/background-connection';

type DataServiceHandler = (
  payload: DataServiceGranularCacheUpdatedPayload,
) => void;

const subscriptions = new Map();

const adapter = {
  call: (method: string, ...params: Json[]) =>
    submitRequestToBackground<Json>('messengerCall', [method, params]),
  subscribe: (event: string, callback: DataServiceHandler) => {
    // MessengerSubscriptions forwards each event's arguments as one array.
    // `cacheUpdated` publishes a single payload object; passing the array
    // through makes `hydrate` read `.mutations` on undefined (query-core 5.103).
    subscribeToMessengerEvent(event as NamespacedName, (payload) => {
      const update = Array.isArray(payload) ? payload[0] : payload;
      if (!update || typeof update !== 'object') {
        return;
      }
      callback(update as DataServiceGranularCacheUpdatedPayload);
    })
      .then((unsubscribe) => subscriptions.set(callback, unsubscribe))
      .catch(console.error);
  },
  unsubscribe: (_event: string, callback: DataServiceHandler) => {
    const unsubscribe = subscriptions.get(callback);
    unsubscribe?.().catch(console.error);
  },
};

export const queryClient = createUIQueryClient(DATA_SERVICES, adapter);
