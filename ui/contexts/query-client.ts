import type { DataServiceGranularCacheUpdatedPayload } from '@metamask/base-data-service';
import { createUIQueryClient } from '@metamask/react-data-query';
import { Json } from '@metamask/utils';
import { DATA_SERVICES } from '../../shared/constants/data-services';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../store/background-connection';

type DataServiceGranularCacheUpdatedHandler = (
  payload: DataServiceGranularCacheUpdatedPayload,
) => void;

type UnsubscribeFunction = () => Promise<void>;

const subscriptions = new Map<
  DataServiceGranularCacheUpdatedHandler,
  UnsubscribeFunction
>();

export const queryClient = createUIQueryClient(DATA_SERVICES, {
  call: (actionType, ...params) => {
    return submitRequestToBackground('messengerCall', [actionType, params]);
  },
  subscribe(eventType, handler) {
    // Type assertion: At the moment we have to assume that this handler
    // receives a JSON payload. We may fix this in a future update.
    subscribeToMessengerEvent(eventType, handler as (data: Json) => void)
      .then((unsubscribe) => subscriptions.set(handler, unsubscribe))
      .catch(console.error);
  },
  unsubscribe(_eventType, handler) {
    const unsubscribe = subscriptions.get(handler);
    unsubscribe?.().catch(console.error);
  },
});
