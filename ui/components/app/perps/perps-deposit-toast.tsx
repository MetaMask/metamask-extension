import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
} from '@metamask/design-system-react';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
  selectPerpsLastDepositResult,
  selectPerpsLastDepositTransactionId,
  selectPerpsShouldShowDepositToast,
} from '../../../selectors/perps-controller';
import { Toast } from '../../multichain/toast';

export function PerpsDepositToast() {
  const t = useI18nContext();
  const depositInProgress = useSelector(selectPerpsDepositPending);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const lastDepositTransactionId = useSelector(
    selectPerpsLastDepositTransactionId,
  );
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const [dismissedPendingTransactionId, setDismissedPendingTransactionId] =
    useState<string | null>(null);
  const [dismissedCompletion, setDismissedCompletion] = useState(false);

  useEffect(() => {
    const hasNewPendingTransaction =
      depositInProgress &&
      lastDepositTransactionId &&
      lastDepositTransactionId !== dismissedPendingTransactionId;

    if (!depositInProgress || hasNewPendingTransaction) {
      setDismissedPendingTransactionId(null);
    }
  }, [
    depositInProgress,
    dismissedPendingTransactionId,
    lastDepositTransactionId,
  ]);

  useEffect(() => {
    setDismissedCompletion(false);
  }, [
    lastDepositResult?.timestamp,
    lastDepositResult?.success,
    lastDepositResult?.error,
  ]);

  const dismissPendingToast = useCallback(() => {
    setDismissedPendingTransactionId(lastDepositTransactionId ?? 'pending');
  }, [lastDepositTransactionId]);

  const dismissCompletionToast = useCallback(() => {
    setDismissedCompletion(true);
    submitRequestToBackground('perpsClearDepositResult', []).catch(() => {
      // Non-blocking: toast is already dismissed locally
    });
  }, []);

  const hasDismissedPendingToast =
    (lastDepositTransactionId ?? 'pending') === dismissedPendingTransactionId;

  if (lastDepositResult && shouldShowDepositToast && !dismissedCompletion) {
    const isSuccess = lastDepositResult.success === true;
    return (
      <Toast
        key={`perps-deposit-toast-${
          lastDepositResult.timestamp ?? lastDepositResult.error ?? 'result'
        }`}
        dataTestId="perps-deposit-toast"
        className="perps-toast self-center w-full max-w-[408px]"
        contentProps={{ className: 'items-center' }}
        text={
          isSuccess
            ? t('perpsDepositToastSuccessTitle')
            : t('perpsDepositToastErrorTitle')
        }
        description={
          isSuccess
            ? t('perpsDepositToastSuccessDescription')
            : lastDepositResult.error || t('perpsDepositToastErrorDescription')
        }
        startAdornment={
          isSuccess ? (
            <DsIcon
              name={DsIconName.Confirmation}
              color={DsIconColor.SuccessDefault}
              size={DsIconSize.Lg}
            />
          ) : (
            <DsIcon
              name={DsIconName.CircleX}
              color={DsIconColor.ErrorDefault}
              size={DsIconSize.Lg}
            />
          )
        }
        onClose={dismissCompletionToast}
        autoHideTime={5 * SECOND}
        onAutoHideToast={dismissCompletionToast}
      />
    );
  }

  if (!depositInProgress || hasDismissedPendingToast) {
    return null;
  }

  return (
    <Toast
      key={`perps-deposit-pending-toast-${
        lastDepositTransactionId ?? 'pending'
      }`}
      dataTestId="perps-deposit-toast"
      className="perps-toast self-center w-full max-w-[408px]"
      contentProps={{ className: 'items-center' }}
      text={t('perpsDepositToastPendingTitle')}
      description={t('perpsDepositToastPendingDescription')}
      startAdornment={
        <DsIcon
          name={DsIconName.Loading}
          color={DsIconColor.IconDefault}
          size={DsIconSize.Lg}
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
      }
      onClose={dismissPendingToast}
    />
  );
}
