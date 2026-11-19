import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import {
  useMusdConversionConfirmTrace,
  useMusdConversionToastStatus,
} from '../../../hooks/musd';
import { useI18nContext } from '../../../hooks/useI18nContext';
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

const CashtagWidgetToastListener = () => {
  const location = useLocation();
  const t = useI18nContext();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('fromXWidget') === '1') {
      toast.success(<ToastContent title={t('cashtagWidgetOpenedToast')} />, {
        id: 'cashtag-widget-opened-toast',
      });
    }
  }, [location, t]);

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
      {isUnlocked ? <CashtagWidgetToastListener /> : null}
    </>
  );
}
