import React from 'react';
import { useSelector } from 'react-redux';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { PerpsDepositToast } from '../perps/perps-deposit-toast';
import { usePerpsWithdrawTransactionToasts } from './usePerpsWithdrawTransactionToasts';
import { TransactionEventToastListener } from './transaction-event-toast-listener';

const PerpsWithdrawTransactionToastListener = () => {
  usePerpsWithdrawTransactionToasts();

  return null;
};

export function ToastListener() {
  const isUnlocked = useSelector(getIsUnlocked);
  const isInteractive = isInteractiveUI();

  if (!isInteractive) {
    return null;
  }

  return (
    <>
      {isUnlocked ? <PerpsDepositToast /> : null}
      <PerpsWithdrawTransactionToastListener />
      <TransactionEventToastListener />
    </>
  );
}
