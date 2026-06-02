import { useSelector } from 'react-redux';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
  toast,
} from '@metamask/design-system-react';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { submitRequestToBackground } from '../../../store/background-connection';
import { selectPerpsLastWithdrawResult } from '../../../selectors/perps-controller';
import React, { useCallback, useEffect, useState } from 'react';

/**
 * Home-screen toast for Perps withdrawal completion.
 *
 * `PerpsController` sets `lastWithdrawResult` when `withdraw` finishes; the
 * withdraw page navigates here on success so users see confirmation after leaving
 * the flow. Dismissal clears controller state via `perpsClearWithdrawResult`.
 */
export function PerpsWithdrawToast() {
  const t = useI18nContext();
  const { formatCurrency } = useFormatters();
  const lastWithdrawResult = useSelector(selectPerpsLastWithdrawResult);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [lastWithdrawResult?.timestamp]);

  const dismissToast = useCallback(() => {
    setDismissed(true);
    submitRequestToBackground('perpsClearWithdrawResult', []).catch(() => {
      // Non-blocking: toast is already dismissed locally
    });
  }, []);

  const autoHideDelay = 5 * SECOND;

  useEffect(() => {
    if (dismissed || !lastWithdrawResult) {
      return undefined;
    }

    const isSuccess = lastWithdrawResult.success === true;
    const amountNum = parseFloat(lastWithdrawResult.amount);
    const amountLabel = Number.isFinite(amountNum)
      ? formatCurrency(amountNum, 'USD')
      : lastWithdrawResult.amount;

    const timeoutId = setTimeout(() => {
      dismissToast();
    }, autoHideDelay);

    toast({
      severity: isSuccess ? 'success' : 'danger',
      title: isSuccess
        ? t('perpsWithdrawToastSuccessTitle')
        : t('perpsWithdrawToastErrorTitle'),
      description: isSuccess
        ? t('perpsWithdrawToastSuccessDescription', [amountLabel])
        : lastWithdrawResult.error || t('perpsWithdrawFailed'),
      startAccessory: isSuccess ? (
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
      'data-testid': 'perps-withdraw-toast',
      className: 'perps-toast self-center w-full max-w-[408px]',
      onClose: dismissToast,
      hasNoTimeout: true,
    });

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss();
    };
  }, [autoHideDelay, dismissed, dismissToast, formatCurrency, lastWithdrawResult, t]);

  return null;
}
