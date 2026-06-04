import { useSelector } from 'react-redux';
import React, { useEffect } from 'react';
import { toast } from '@metamask/design-system-react';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
  selectPerpsLastDepositResult,
  selectPerpsShouldShowDepositToast,
} from '../../../selectors/perps-controller';

const id = 'perps-deposit-toast';
const duration = 5 * SECOND;

const clearDepositResult = () =>
  submitRequestToBackground('perpsClearDepositResult', []).catch(
    () => undefined,
  );

export function PerpsDepositToast() {
  const t = useI18nContext();
  const depositInProgress = useSelector(selectPerpsDepositPending);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;
  const lastDepositResultTimestamp = lastDepositResult?.timestamp;

  useEffect(() => {
    if (!hasDepositResult) {
      return;
    }

    const isSuccess = lastDepositResultSuccess === true;
    const title = isSuccess
      ? t('perpsDepositToastSuccessTitle')
      : t('perpsDepositToastErrorTitle');
    const description = isSuccess
      ? t('perpsDepositToastSuccessDescription')
      : lastDepositResultError || t('perpsDepositToastErrorDescription');
    toast({
      severity: isSuccess ? 'success' : 'danger',
      title,
      description,
      'data-testid': id,
    });

    const timeoutId = setTimeout(() => {
      clearDepositResult();
    }, duration);

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss();
    };
  }, [
    hasDepositResult,
    lastDepositResultError,
    lastDepositResultSuccess,
    lastDepositResultTimestamp,
    t,
  ]);

  useEffect(() => {
    if (hasDepositResult) {
      return;
    }

    if (!shouldShowDepositToast) {
      toast.dismiss();
      return;
    }

    if (!depositInProgress) {
      toast.dismiss();
      return;
    }

    toast({
      severity: 'default',
      title: t('perpsDepositToastPendingTitle'),
      description: t('perpsDepositToastPendingDescription'),
      'data-testid': id,
      hasNoTimeout: true,
    });

    return () => {
      toast.dismiss();
    };
  }, [depositInProgress, hasDepositResult, shouldShowDepositToast, t]);

  return null;
}
