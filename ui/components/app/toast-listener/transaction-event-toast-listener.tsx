import React from 'react';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { RouteWithMessenger } from '../../../layouts/route-with-messenger';
import { toastListenerCapabilities } from './messenger';
import { useTransactionEventToasts } from './useTransactionEventToasts';

const TransactionEventToastListenerInner = () => {
  useTransactionEventToasts();
  return null;
};

export function TransactionEventToastListener() {
  if (!isInteractiveUI()) {
    return null;
  }

  return (
    <RouteWithMessenger
      path="toast-listener"
      capabilities={toastListenerCapabilities}
    >
      <TransactionEventToastListenerInner />
    </RouteWithMessenger>
  );
}
