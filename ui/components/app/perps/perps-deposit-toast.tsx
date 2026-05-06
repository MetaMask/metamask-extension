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
  const lastShownPendingToastKeyRef = useRef<string | null>(null);
  const lastShownCompletionToastKeyRef = useRef<string | null>(null);
  const clearDepositResultTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

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
      lastShownPendingToastKeyRef.current = null;
      return;
    }

    if (lastDepositResult) {
      const completionToastKey = [
        lastDepositResult.timestamp ?? 'no-timestamp',
        lastDepositResult.success,
        lastDepositResult.error ?? '',
      ].join(':');

      if (lastShownCompletionToastKeyRef.current === completionToastKey) {
        return;
      }

      if (clearDepositResultTimeoutRef.current) {
        clearTimeout(clearDepositResultTimeoutRef.current);
      }

      lastShownCompletionToastKeyRef.current = completionToastKey;
      lastShownPendingToastKeyRef.current = null;

      const isSuccess = lastDepositResult.success === true;
      const title = isSuccess
        ? t('perpsDepositToastSuccessTitle')
        : t('perpsDepositToastErrorTitle');
      const description = isSuccess
        ? t('perpsDepositToastSuccessDescription')
        : lastDepositResult.error || t('perpsDepositToastErrorDescription');
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

    lastShownCompletionToastKeyRef.current = null;

    if (!depositInProgress) {
      toast.dismiss(PERPS_DEPOSIT_TOAST_ID);
      lastShownPendingToastKeyRef.current = null;
      return;
    }

    const pendingToastKey = lastDepositTransactionId ?? 'pending';

    if (lastShownPendingToastKeyRef.current === pendingToastKey) {
      return;
    }

    lastShownPendingToastKeyRef.current = pendingToastKey;
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
    lastDepositResult,
    lastDepositTransactionId,
    shouldShowDepositToast,
    t,
  ]);

  return null;
}
