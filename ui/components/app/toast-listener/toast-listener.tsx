import React from 'react';
import { useSelector } from 'react-redux';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { selectToastImplementation } from '../../../selectors/toast';
import { PerpsDepositToast } from '../perps/perps-deposit-toast';
import { useSmartTransactionToasts } from './useSmartTransactionToasts';
import { usePerpsWithdrawTransactionToasts } from './usePerpsWithdrawTransactionToasts';
import { TransactionEventToastListener } from './transaction-event-toast-listener';

/**
 * @deprecated Redux-based smart transaction toasts. Rendered only via the
 * `'redux'` branch of `selectToastImplementation`, which is slated for removal.
 * Once that branch is gone, this component and `useSmartTransactionToasts`
 * should be deleted in favor of the messenger-based
 * `TransactionEventToastListener`.
 */
const SmartTransactionToastListener = () => {
  useSmartTransactionToasts();

  return null;
};

const PerpsWithdrawTransactionToastListener = () => {
  usePerpsWithdrawTransactionToasts();

  return null;
};

export function ToastListener() {
  const toastImplementation = useSelector(selectToastImplementation);
  const isUnlocked = useSelector(getIsUnlocked);
  const isInteractive = isInteractiveUI();

  if (!isInteractive) {
    return null;
  }

  return (
    <>
      {isUnlocked ? <PerpsDepositToast /> : null}
      <PerpsWithdrawTransactionToastListener />

      {toastImplementation === 'messenger' && <TransactionEventToastListener />}
      {toastImplementation === 'redux' && <SmartTransactionToastListener />}
    </>
  );
}
