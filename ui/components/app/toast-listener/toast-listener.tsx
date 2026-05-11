import React from 'react';
import { useSelector } from 'react-redux';
import { getExtensionSkipTransactionStatusPage } from '../../../../shared/lib/selectors/smart-transactions';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { useSmartTransactionToasts } from './useSmartTransactionToasts';
import { usePerpsWithdrawTransactionToasts } from './usePerpsWithdrawTransactionToasts';

const SmartTransactionToastListener = () => {
  useSmartTransactionToasts();

  return null;
};

const PerpsWithdrawTransactionToastListener = () => {
  usePerpsWithdrawTransactionToasts();

  return null;
};

export function ToastListener() {
  const transactionToastEnabled = useSelector(
    getExtensionSkipTransactionStatusPage,
  );
  const isInteractive = isInteractiveUI();

  if (!isInteractive) {
    return null;
  }

  return (
    <>
      <PerpsWithdrawTransactionToastListener />
      {transactionToastEnabled ? <SmartTransactionToastListener /> : null}
    </>
  );
}
