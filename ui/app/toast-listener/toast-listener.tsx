import React from 'react';
import { useSelector } from 'react-redux';
import { getExtensionSkipTransactionStatusPage } from '../../../shared/lib/selectors/smart-transactions';
import { isInteractiveUI } from '../../../shared/lib/environment-type';
import { useSmartTransactionToasts } from './useSmartTransactionToasts';

const ToastListenerInner = () => {
  useSmartTransactionToasts();

  return null;
};

export function ToastListener() {
  const transactionToastEnabled = useSelector(
    getExtensionSkipTransactionStatusPage,
  );
  const isInteractive = isInteractiveUI();

  if (!transactionToastEnabled || !isInteractive) {
    return null;
  }

  return <ToastListenerInner />;
}
