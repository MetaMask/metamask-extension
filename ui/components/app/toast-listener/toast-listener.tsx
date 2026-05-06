import React from 'react';
import { useSelector } from 'react-redux';
import { getExtensionSkipTransactionStatusPage } from '../../../../shared/lib/selectors/smart-transactions';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { PerpsDepositToast } from '../perps/perps-deposit-toast';
import { useSmartTransactionToasts } from './useSmartTransactionToasts';

const SmartTransactionToastListener = () => {
  useSmartTransactionToasts();

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
      <PerpsDepositToast />
      {transactionToastEnabled ? <SmartTransactionToastListener /> : null}
    </>
  );
}
