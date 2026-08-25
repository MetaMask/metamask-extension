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
    subscribeToMessengerEvent(
      event as NamespacedName,
      callback as (data: Json) => void,
    )
      .then((unsubscribe) => subscriptions.set(callback, unsubscribe))
      .catch(console.error);
  },
  unsubscribe: (_event: string, callback: DataServiceHandler) => {
    const unsubscribe = subscriptions.get(callback);
    unsubscribe?.().catch(console.error);
  },
};

export const queryClient = createUIQueryClient(DATA_SERVICES, adapter);
