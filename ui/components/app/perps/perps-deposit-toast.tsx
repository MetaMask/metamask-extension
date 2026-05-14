import React, { type MutableRefObject, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
  selectPerpsLastDepositResult,
  selectPerpsShouldShowDepositToast,
} from '../../../selectors/perps-controller';
import { toast, ToastContent } from '../../ui/toast/toast';

const id = 'perps-deposit-toast';
const duration = 5 * SECOND;

const clearDepositResult = () =>
  submitRequestToBackground('perpsClearDepositResult', []).catch(
    () => undefined,
  );

type DepositResult = NonNullable<
  ReturnType<typeof selectPerpsLastDepositResult>
>;

const getDepositResultKey = (depositResult: DepositResult) =>
  depositResult.timestamp === undefined
    ? [
        depositResult.success,
        depositResult.error,
        depositResult.txHash,
        depositResult.amount,
        depositResult.asset,
      ].join(':')
    : `timestamp:${depositResult.timestamp}`;

const clearDepositResultForKey = (
  depositResultKey: string | null,
  clearedDepositResultKeyRef: MutableRefObject<string | null>,
) => {
  if (
    !depositResultKey ||
    clearedDepositResultKeyRef.current === depositResultKey
  ) {
    return;
  }

  clearedDepositResultKeyRef.current = depositResultKey;
  clearDepositResult();
};

export function PerpsDepositToast() {
  const t = useI18nContext();
  const depositInProgress = useSelector(selectPerpsDepositPending);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;
  const depositResultKey = lastDepositResult
    ? getDepositResultKey(lastDepositResult)
    : null;
  const latestDepositResultKeyRef = useRef<string | null>(null);
  const clearedDepositResultKeyRef = useRef<string | null>(null);

  useEffect(() => {
    latestDepositResultKeyRef.current = depositResultKey;
  }, [depositResultKey]);

  useEffect(
    () => () => {
      clearDepositResultForKey(
        latestDepositResultKeyRef.current,
        clearedDepositResultKeyRef,
      );
    },
    [],
  );

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
    const content = (
      <ToastContent title={title} description={description} dataTestId={id} />
    );
    const options = { id, duration };

    if (isSuccess) {
      toast.success(content, options);
    } else {
      toast.error(content, options);
    }

    return () => {
      toast.dismiss(id);
    };
  }, [
    depositResultKey,
    hasDepositResult,
    lastDepositResultError,
    lastDepositResultSuccess,
    t,
  ]);

  useEffect(() => {
    if (!depositResultKey) {
      return;
    }

    const timeoutId = setTimeout(
      () =>
        clearDepositResultForKey(
          depositResultKey,
          clearedDepositResultKeyRef,
        ),
      duration,
    );

    return () => {
      clearTimeout(timeoutId);
    };
  }, [depositResultKey]);

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
