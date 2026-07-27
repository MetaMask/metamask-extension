import React from 'react';
import { RouteWithMessenger } from '../../../layouts/route-with-messenger';
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
    <RouteWithMessenger
      path="toast-listener"
      capabilities={toastListenerCapabilities}
    >
      <TransactionEventToastListenerInner />
    </RouteWithMessenger>
  );
}
