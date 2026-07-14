import React from 'react';
import { useSelector } from 'react-redux';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import {
  useMusdConversionConfirmTrace,
  useMusdConversionToastStatus,
} from '../../../hooks/musd';
import { useMerklClaimStatus } from '../../../hooks/musd/useMerklClaimStatus';
import { PerpsDepositToast } from '../perps/perps-deposit-toast';
import { usePerpsWithdrawTransactionToasts } from './usePerpsWithdrawTransactionToasts';
import { TransactionEventToastListener } from './transaction-event-toast-listener';

const PerpsWithdrawTransactionToastListener = () => {
  usePerpsWithdrawTransactionToasts();

  return null;
};

// Carried over from custom mUSD toasts. Should move telemetry out of toasts into a more appropriate location.
const MusdTelemetry = () => {
  const { activeTransactionId } = useMusdConversionToastStatus();
  useMusdConversionConfirmTrace(activeTransactionId ?? '');
  useMerklClaimStatus();
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
      <MusdTelemetry />
      <TransactionEventToastListener />
    </>
  );
}
