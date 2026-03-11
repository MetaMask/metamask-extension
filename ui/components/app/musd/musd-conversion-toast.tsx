/**
 * MusdConversionToast Component
 *
 * Toast shown during and after mUSD conversion (in-progress, success, failed).
 */

import React from 'react';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
} from '@metamask/design-system-react';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMusdConversionToastStatus } from '../../../hooks/musd/useMusdConversionToastStatus';
import { useMusdConversionConfirmTrace } from '../../../hooks/musd/useMusdConversionConfirmTrace';
import { Toast } from '../../multichain/toast';

export function MusdConversionToast() {
  const t = useI18nContext();
  const { toastState, sourceTokenSymbol, dismissToast } =
    useMusdConversionToastStatus();

  // Track conversion confirmation time via Sentry trace
  useMusdConversionConfirmTrace();

  const autoHideDelay = 5 * SECOND;

  if (!toastState) {
    return null;
  }

  const isInProgress = toastState === 'in-progress';
  const isSuccess = toastState === 'success';

  const toastText = (() => {
    switch (toastState) {
      case 'in-progress':
        return t('musdConversionToastInProgress', [
          sourceTokenSymbol ?? 'Token',
        ]);
      case 'success':
        return t('musdConversionToastSuccess');
      case 'failed':
        return t('musdConversionToastFailed');
      default:
        return '';
    }
  })();

  const startAdornment = (() => {
    if (isInProgress) {
      return (
        <DsIcon
          name={DsIconName.Loading}
          color={DsIconColor.IconDefault}
          size={DsIconSize.Lg}
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
      );
    }
    if (isSuccess) {
      return (
        <DsIcon
          name={DsIconName.Confirmation}
          color={DsIconColor.SuccessDefault}
          size={DsIconSize.Lg}
        />
      );
    }
    return (
      <DsIcon
        name={DsIconName.CircleX}
        color={DsIconColor.ErrorDefault}
        size={DsIconSize.Lg}
      />
    );
  })();

  return (
    <Toast
      key="musd-conversion-toast"
      dataTestId="musd-conversion-toast"
      text={toastText}
      startAdornment={startAdornment}
      onClose={dismissToast}
      {...(!isInProgress && {
        autoHideTime: autoHideDelay,
        onAutoHideToast: dismissToast,
      })}
    />
  );
}
