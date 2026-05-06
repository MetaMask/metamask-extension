import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
  selectPerpsLastDepositResult,
  selectPerpsLastDepositTransactionId,
  selectPerpsShouldShowDepositToast,
} from '../../../selectors/perps-controller';
import { toast, ToastContent } from '../../ui/toast/toast';

const PERPS_DEPOSIT_TOAST_ID = 'perps-deposit-toast';
const COMPLETION_TOAST_DURATION = 5 * SECOND;

export function PerpsDepositToast() {
  const t = useI18nContext();
  const depositInProgress = useSelector(selectPerpsDepositPending);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const lastDepositTransactionId = useSelector(
    selectPerpsLastDepositTransactionId,
  );
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const clearDepositResultTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;
  const lastDepositResultTimestamp = lastDepositResult?.timestamp;

  useEffect(() => {
    return () => {
      if (clearDepositResultTimeoutRef.current) {
        clearTimeout(clearDepositResultTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldShowDepositToast) {
      toast.dismiss(PERPS_DEPOSIT_TOAST_ID);
      return;
    }

    if (hasDepositResult) {
      if (clearDepositResultTimeoutRef.current) {
        clearTimeout(clearDepositResultTimeoutRef.current);
      }

      const isSuccess = lastDepositResultSuccess === true;
      const title = isSuccess
        ? t('perpsDepositToastSuccessTitle')
        : t('perpsDepositToastErrorTitle');
      const description = isSuccess
        ? t('perpsDepositToastSuccessDescription')
        : lastDepositResultError || t('perpsDepositToastErrorDescription');
      const content = (
        <ToastContent
          dataTestId={PERPS_DEPOSIT_TOAST_ID}
          title={title}
          description={description}
        />
      );
      const options = {
        id: PERPS_DEPOSIT_TOAST_ID,
        duration: COMPLETION_TOAST_DURATION,
      };

      if (isSuccess) {
        toast.success(content, options);
      } else {
        toast.error(content, options);
      }

      clearDepositResultTimeoutRef.current = setTimeout(() => {
        submitRequestToBackground('perpsClearDepositResult', []).catch(
          () => undefined,
        );
        clearDepositResultTimeoutRef.current = null;
      }, COMPLETION_TOAST_DURATION);
      return;
    }

    if (!depositInProgress) {
      toast.dismiss(PERPS_DEPOSIT_TOAST_ID);
      return;
    }

    toast.loading(
      <ToastContent
        dataTestId={PERPS_DEPOSIT_TOAST_ID}
        title={t('perpsDepositToastPendingTitle')}
        description={t('perpsDepositToastPendingDescription')}
      />,
      {
        id: PERPS_DEPOSIT_TOAST_ID,
        duration: Infinity,
      },
    );
  }, [
    depositInProgress,
    hasDepositResult,
    lastDepositResultError,
    lastDepositResultSuccess,
    lastDepositResultTimestamp,
    lastDepositTransactionId,
    shouldShowDepositToast,
    t,
  ]);

  return null;
}
