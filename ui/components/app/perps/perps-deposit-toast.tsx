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
  selectPerpsDepositInProgress,
  selectPerpsLastDepositResult,
  selectPerpsLastDepositTransactionId,
} from '../../../selectors/perps-controller';
import { Toast } from '../../multichain/toast';

export function PerpsDepositToast() {
  const t = useI18nContext();
  const depositInProgress = useSelector(selectPerpsDepositInProgress);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const lastDepositTransactionId = useSelector(
    selectPerpsLastDepositTransactionId,
  );
  const [dismissedPendingTransactionId, setDismissedPendingTransactionId] =
    useState<string | null>(null);
  const [dismissedCompletionTimestamp, setDismissedCompletionTimestamp] =
    useState<number | null>(null);

  const completionTimestamp =
    typeof lastDepositResult?.timestamp === 'number'
      ? lastDepositResult.timestamp
      : null;

  useEffect(() => {
    if (!depositInProgress) {
      setDismissedPendingTransactionId(null);
    } else if (
      lastDepositTransactionId &&
      lastDepositTransactionId !== dismissedPendingTransactionId
    ) {
      setDismissedPendingTransactionId(null);
    }
  }, [
    depositInProgress,
    dismissedPendingTransactionId,
    lastDepositTransactionId,
  ]);

  useEffect(() => {
    if (
      completionTimestamp &&
      completionTimestamp !== dismissedCompletionTimestamp
    ) {
      setDismissedCompletionTimestamp(null);
    }
  }, [completionTimestamp, dismissedCompletionTimestamp]);

  const dismissPendingToast = useCallback(() => {
    setDismissedPendingTransactionId(lastDepositTransactionId ?? 'pending');
  }, [lastDepositTransactionId]);

  const dismissCompletionToast = useCallback(() => {
    setDismissedCompletionTimestamp(completionTimestamp);
    submitRequestToBackground('perpsClearDepositResult', []).catch(() => {
      // Non-blocking: toast is already dismissed locally
    });
  }, [completionTimestamp]);

  const hasDismissedPendingToast =
    (lastDepositTransactionId ?? 'pending') === dismissedPendingTransactionId;
  const hasDismissedCompletionToast =
    completionTimestamp !== null &&
    completionTimestamp === dismissedCompletionTimestamp;

  if (lastDepositResult && !hasDismissedCompletionToast) {
    const isSuccess = lastDepositResult.success === true;
    return (
      <Toast
        key={`perps-deposit-toast-${completionTimestamp}`}
        dataTestId="perps-deposit-toast"
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
