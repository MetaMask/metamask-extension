import React from 'react';
import { RouteWithMessenger } from '../../../layouts/route-with-messenger';
import {
  toastListenerCapabilities,
  useTransactionEventToasts,
} from './useTransactionEventToasts';
import { useResolveSmartTransactionApprovals } from './useResolveSmartTransactionApprovals';

const TransactionEventToastListenerInner = () => {
  useTransactionEventToasts();
  useResolveSmartTransactionApprovals();
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
