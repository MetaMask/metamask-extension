import React from 'react';
import { RouteMessengerProvider } from '../../../contexts/route-messenger';
import { useActivityCacheInvalidation } from '../../../hooks/activity/useActivityCacheInvalidation';
import {
  toastListenerCapabilities,
  useTransactionEventToasts,
} from './useTransactionEventToasts';

const TransactionEventToastListenerInner = () => {
  useTransactionEventToasts();
  useActivityCacheInvalidation();
  return null;
};

export function TransactionEventToastListener() {
  return (
    <RouteMessengerProvider
      path="toast-listener"
      capabilities={toastListenerCapabilities}
    >
      <TransactionEventToastListenerInner />
    </RouteMessengerProvider>
  );
}
