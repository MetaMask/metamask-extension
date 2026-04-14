import React, { useCallback, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
} from '@metamask/design-system-react';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  selectPerpsDepositInProgress,
  selectPerpsLastDepositResult,
  selectPerpsLastDepositTransactionId,
} from '../../../selectors/perps-controller';
import { Toast } from '../../multichain/toast';

const dismissedPendingTransactionIds = new Set<string>();
const dismissedCompletionTimestamps = new Set<number>();

export function resetPerpsDepositToastDismissalState() {
  dismissedPendingTransactionIds.clear();
  dismissedCompletionTimestamps.clear();
}

export function PerpsDepositToast() {
  const t = useI18nContext();
  const depositInProgress = useSelector(selectPerpsDepositInProgress);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const lastDepositTransactionId = useSelector(
    selectPerpsLastDepositTransactionId,
  );
  const [, forceRender] = useReducer((count) => count + 1, 0);

  const completionTimestamp =
    typeof lastDepositResult?.timestamp === 'number'
      ? lastDepositResult.timestamp
      : null;

  const hasDismissedPendingToast = Boolean(
    lastDepositTransactionId &&
      dismissedPendingTransactionIds.has(lastDepositTransactionId),
  );
  const hasDismissedCompletionToast = Boolean(
    completionTimestamp &&
      dismissedCompletionTimestamps.has(completionTimestamp),
  );

  const dismissPendingToast = useCallback(() => {
    if (lastDepositTransactionId) {
      dismissedPendingTransactionIds.add(lastDepositTransactionId);
    }
    forceRender();
  }, [lastDepositTransactionId]);

  const dismissCompletionToast = useCallback(() => {
    if (completionTimestamp) {
      dismissedCompletionTimestamps.add(completionTimestamp);
    }
    forceRender();
  }, [completionTimestamp]);

  const completionToast = useMemo(() => {
    if (!lastDepositResult || hasDismissedCompletionToast) {
      return null;
    }

    const isSuccess = lastDepositResult.success === true;

    return {
      text: isSuccess
        ? t('perpsDepositToastSuccessTitle')
        : t('perpsDepositToastErrorTitle'),
      description: isSuccess
        ? t('perpsDepositToastSuccessDescription')
        : lastDepositResult.error || t('perpsDepositToastErrorDescription'),
      startAdornment: isSuccess ? (
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
      ),
    };
  }, [hasDismissedCompletionToast, lastDepositResult, t]);

  if (completionToast) {
    return (
      <Toast
        key={`perps-deposit-toast-${completionTimestamp}`}
        dataTestId="perps-deposit-toast"
        text={completionToast.text}
        description={completionToast.description}
        startAdornment={completionToast.startAdornment}
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
