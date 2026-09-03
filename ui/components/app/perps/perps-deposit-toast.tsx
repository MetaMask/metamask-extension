import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
  selectPerpsLastDepositResult,
  selectPerpsLastDepositTransactionId,
  selectPerpsShouldShowDepositToast,
} from '../../../selectors/perps-controller';
import { selectHyperliquidDepositPromptTxId } from '../../../selectors/perps/persisted-state';
import { setHyperliquidDepositPromptTxId } from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import { toast, ToastContent } from '../../ui/toast/toast';

const id = 'perps-deposit-toast';
const duration = 5 * SECOND;

const clearDepositResult = () =>
  submitRequestToBackground('perpsClearDepositResult', []).catch(
    () => undefined,
  );

export function PerpsDepositToast() {
  const t = useI18nContext();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const depositInProgress = useSelector(selectPerpsDepositPending);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const lastDepositTransactionId = useSelector(
    selectPerpsLastDepositTransactionId,
  );
  const hyperliquidDepositPromptTxId = useSelector(
    selectHyperliquidDepositPromptTxId,
  );
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;
  const lastDepositResultTimestamp = lastDepositResult?.timestamp;

  // Check if this deposit was initiated from the Hyperliquid deposit prompt
  const isHyperliquidDeposit =
    hyperliquidDepositPromptTxId !== null &&
    hyperliquidDepositPromptTxId === lastDepositTransactionId;

  useEffect(() => {
    if (!hasDepositResult) {
      return;
    }

    const isSuccess = lastDepositResultSuccess === true;

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

    // Clear the Hyperliquid deposit transaction ID after showing the toast
    if (isHyperliquidDeposit) {
      dispatch(setHyperliquidDepositPromptTxId(null));
    }

    const timeoutId = setTimeout(() => {
      clearDepositResult();
    }, duration);

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss(id);
    };
  }, [
    dispatch,
    hasDepositResult,
    isHyperliquidDeposit,
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
