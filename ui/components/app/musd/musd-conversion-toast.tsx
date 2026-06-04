/**
 * MusdConversionToast Component
 *
 * Toast shown during and after mUSD conversion (in-progress, success, failed).
 */

import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
  toast,
} from '@metamask/design-system-react';
import React, { useEffect } from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMusdConversionToastStatus } from '../../../hooks/musd/useMusdConversionToastStatus';
import { useMusdConversionConfirmTrace } from '../../../hooks/musd/useMusdConversionConfirmTrace';
import { SECOND } from '../../../../shared/constants/time';

type I18nTranslator = ReturnType<typeof useI18nContext>;

const getMusdConversionToastTitle = (
  toastState: string,
  sourceTokenSymbol: string | null,
  t: I18nTranslator,
) => {
  switch (toastState) {
    case 'in-progress':
      return t('musdConversionToastInProgress', [sourceTokenSymbol ?? 'Token']);
    case 'success':
      return t('musdConversionToastSuccess');
    case 'failed':
      return t('musdConversionToastFailed');
    default:
      return '';
  }
};

const getMusdConversionToastSeverity = (toastState: string) => {
  switch (toastState) {
    case 'in-progress':
      return 'default';
    case 'success':
      return 'success';
    default:
      return 'danger';
  }
};

const getMusdConversionToastAccessory = (toastState: string) => {
  switch (toastState) {
    case 'in-progress':
      return (
        <DsIcon
          name={DsIconName.Loading}
          color={DsIconColor.IconDefault}
          size={DsIconSize.Lg}
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
      );
    case 'success':
      return (
        <DsIcon
          name={DsIconName.Confirmation}
          color={DsIconColor.SuccessDefault}
          size={DsIconSize.Lg}
        />
      );
    default:
      return (
        <DsIcon
          name={DsIconName.CircleX}
          color={DsIconColor.ErrorDefault}
          size={DsIconSize.Lg}
        />
      );
  }
};

export function MusdConversionToast() {
  const t = useI18nContext();
  const { toastState, sourceTokenSymbol, activeTransactionId, dismissToast } =
    useMusdConversionToastStatus();

  // Track conversion confirmation time via Sentry trace (with quote details)
  useMusdConversionConfirmTrace(activeTransactionId ?? '');
  useEffect(() => {
    if (!toastState) {
      return undefined;
    }

    const isInProgress = toastState === 'in-progress';
    const timeoutMs = 5 * SECOND;
    const clearToast = isInProgress
      ? undefined
      : setTimeout(() => {
          dismissToast();
        }, timeoutMs);

    toast({
      severity: getMusdConversionToastSeverity(toastState),
      title: getMusdConversionToastTitle(
        toastState,
        sourceTokenSymbol ?? null,
        t,
      ),
      description:
        toastState === 'success'
          ? (t('musdConversionToastSuccessDescription') as string)
          : undefined,
      startAccessory: getMusdConversionToastAccessory(toastState),
      'data-testid': 'musd-conversion-toast',
      hasNoTimeout: isInProgress,
      onClose: dismissToast,
    });

    return () => {
      if (clearToast) {
        clearTimeout(clearToast);
      }
      toast.dismiss();
    };
  }, [dismissToast, sourceTokenSymbol, t, toastState]);

  return null;
}
