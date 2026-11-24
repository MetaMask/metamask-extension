import React, { useEffect, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useMusdConversionConfirmTrace,
  useMusdConversionToastStatus,
} from '../../../hooks/musd';
import { toast, ToastContent } from '../../ui/toast/toast';
import { MoneyAccountToastListener } from '../money/money-account-toast/money-account-toast-listener';
import { PerpsDepositToast } from '../perps/perps-deposit-toast';
import { RampsOrderToastListener } from '../ramps/ramps-order-toast-listener';
import { TransactionEventToastListener } from './transaction-event-toast-listener';

// Carried over from custom mUSD toasts. Should move telemetry out of toasts into a more appropriate location.
const MusdTelemetry = () => {
  const { activeTransactionId } = useMusdConversionToastStatus();
  useMusdConversionConfirmTrace(activeTransactionId ?? '');
  return null;
};

const useIsOnline = () => {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true,
  );
};

const OfflineToastListener = () => {
  const t = useI18nContext();
  const isOnline = useIsOnline();

  useEffect(() => {
    if (isOnline) {
      toast.dismiss('offline-toast');
    } else {
      toast.error(<ToastContent title={t('offlineToast')} />, {
        id: 'offline-toast',
        duration: Infinity,
      });
    }
  }, [isOnline, t]);

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
      <MusdTelemetry />
      <TransactionEventToastListener />
      <MoneyAccountToastListener />
      {isUnlocked ? <RampsOrderToastListener /> : null}
      <OfflineToastListener />
    </>
  );
}
