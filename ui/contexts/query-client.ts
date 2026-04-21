import { createUIQueryClient } from '@metamask/react-data-query';
import { NamespacedName } from '@metamask/messenger';
import { Json } from '@metamask/utils';
import { DATA_SERVICES } from '../../shared/constants/data-services';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../store/background-connection';

type JsonSubscriptionCallback = (data: Json) => void;

const subscriptions = new Map();

const adapter = {
  call: (method: string, ...params: Json[]) =>
    submitRequestToBackground<Json>('messengerCall', [method, params]),
  subscribe: (event: string, callback: JsonSubscriptionCallback) => {
    subscribeToMessengerEvent(event as NamespacedName, callback)
      .then((unsubscribe) => subscriptions.set(callback, unsubscribe))
      .catch(console.error);
  },
  unsubscribe: (_event: string, callback: JsonSubscriptionCallback) => {
    const unsubscribe = subscriptions.get(callback);
    unsubscribe?.().catch(console.error);
  },
};

export const queryClient = createUIQueryClient(DATA_SERVICES, adapter);
