import React, { useEffect } from 'react';
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
  const lastDepositTransactionId = useSelector(
    selectPerpsLastDepositTransactionId,
  );
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;
  const lastDepositResultTimestamp = lastDepositResult?.timestamp;

  useEffect(() => {
    if (!shouldShowDepositToast) {
      toast.dismiss(id);
      return;
    }

    if (hasDepositResult) {
      const isSuccess = lastDepositResultSuccess === true;
      const title = isSuccess
        ? t('perpsDepositToastSuccessTitle')
        : t('perpsDepositToastErrorTitle');
      const description = isSuccess
        ? t('perpsDepositToastSuccessDescription')
        : lastDepositResultError || t('perpsDepositToastErrorDescription');
      const content = (
        <ToastContent title={title} description={description} dataTestId={id} />
      );
      const options = { id, duration };

      if (isSuccess) {
        toast.success(content, options);
      } else {
        toast.error(content, options);
      }

      let clearDepositResultRequested = false;
      const clearDepositResultOnce = () => {
        if (clearDepositResultRequested) {
          return;
        }

        clearDepositResultRequested = true;
        clearDepositResult();
      };

      const timeoutId = setTimeout(clearDepositResultOnce, duration);

      return () => {
        clearTimeout(timeoutId);
        toast.dismiss(id);
        clearDepositResultOnce();
      };
    }

    if (!depositInProgress) {
      toast.dismiss(id);
      return;
    }

    toast.loading(
      <ToastContent
        title={t('perpsDepositToastPendingTitle')}
        description={t('perpsDepositToastPendingDescription')}
        dataTestId={id}
      />,
      {
        id,
        duration: Infinity,
      },
    );

    return () => {
      toast.dismiss(id);
    };
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
