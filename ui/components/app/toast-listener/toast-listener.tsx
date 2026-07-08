import React from 'react';
import { useSelector } from 'react-redux';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { selectToastImplementation } from '../../../selectors/toast';
import {
  useMusdConversionConfirmTrace,
  useMusdConversionToastStatus,
} from '../../../hooks/musd';
import { PerpsDepositToast } from '../perps/perps-deposit-toast';
import { useSmartTransactionToasts } from './useSmartTransactionToasts';
import { usePerpsWithdrawTransactionToasts } from './usePerpsWithdrawTransactionToasts';
import { TransactionEventToastListener } from './transaction-event-toast-listener';

/** @deprecated Will be replaced by TransactionEventToastListener */
const SmartTransactionToastListener = () => {
  useSmartTransactionToasts();

  return null;
};

const PerpsWithdrawTransactionToastListener = () => {
  usePerpsWithdrawTransactionToasts();

  return null;
};

// Carried over from MusdConversionToast. Should move telemetry out of toasts into a more appropriate location.
const MusdConversionTelemetry = () => {
  const { activeTransactionId } = useMusdConversionToastStatus();
  useMusdConversionConfirmTrace(activeTransactionId ?? '');
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
      <MusdConversionTelemetry />

      {toastImplementation === 'messenger' && <TransactionEventToastListener />}
      {toastImplementation === 'redux' && <SmartTransactionToastListener />}
    </>
  );
}
