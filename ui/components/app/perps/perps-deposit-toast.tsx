import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { SECOND } from '../../../../shared/constants/time';
import { HYPERLIQUID_DEPOSIT_PROMPT } from '../../../../shared/constants/hyperliquid-deposit-prompt';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
  selectPerpsLastDepositEntryPoint,
  selectPerpsLastDepositResult,
  selectPerpsShouldShowDepositToast,
} from '../../../selectors/perps-controller';
import { toast, ToastContent } from '../../ui/toast/toast';

const id = 'perps-deposit-toast';
const duration = 5 * SECOND;

const clearDepositResult = () => {
  submitRequestToBackground('perpsClearDepositResult', []).catch(
    () => undefined,
  );
  submitRequestToBackground('setLastPerpsDepositEntryPoint', [null]).catch(
    () => undefined,
  );
};

export function PerpsDepositToast() {
  const t = useI18nContext();
  const depositInProgress = useSelector(selectPerpsDepositPending);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const entryPoint = useSelector(selectPerpsLastDepositEntryPoint);
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;

  useEffect(() => {
    if (!hasDepositResult) {
      return;
    }

    const isSuccess = lastDepositResultSuccess === true;
    const isHyperliquidDeposit = entryPoint === HYPERLIQUID_DEPOSIT_PROMPT;
    let title = t('perpsDepositToastSuccessTitle');
    let description: string;

    if (isSuccess && isHyperliquidDeposit) {
      description = t('hyperliquidDepositToastSuccessDescription');
    } else if (isSuccess) {
      description = t('perpsDepositToastSuccessDescription');
    } else {
      title = t('perpsDepositToastErrorTitle');
      description =
        lastDepositResultError || t('perpsDepositToastErrorDescription');
    }
    const content = (
      <ToastContent title={title} description={description} dataTestId={id} />
    );
    const options = { id, duration };

    if (isSuccess) {
      toast.success(content, options);
    } else {
      toast.error(content, options);
    }

    const timeoutId = setTimeout(() => {
      clearDepositResult();
    }, duration);

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss(id);
    };
  }, [
    entryPoint,
    hasDepositResult,
    lastDepositResultError,
    lastDepositResultSuccess,
    t,
  ]);

  useEffect(() => {
    if (hasDepositResult) {
      return;
    }

    if (!shouldShowDepositToast) {
      toast.dismiss(id);
      return;
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
  }, [depositInProgress, hasDepositResult, shouldShowDepositToast, t]);

  return null;
}
