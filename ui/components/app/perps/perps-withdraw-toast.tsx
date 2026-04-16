import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
} from '@metamask/design-system-react';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { submitRequestToBackground } from '../../../store/background-connection';
import { selectPerpsLastWithdrawResult } from '../../../selectors/perps-controller';
import { Toast } from '../../multichain/toast';

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

  if (dismissed || !lastWithdrawResult) {
    return null;
  }

  const isSuccess = lastWithdrawResult.success === true;
  const amountNum = parseFloat(lastWithdrawResult.amount);
  const amountLabel = Number.isFinite(amountNum)
    ? formatCurrency(amountNum, 'USD')
    : lastWithdrawResult.amount;

  const toastText = isSuccess
    ? t('perpsWithdrawToastSuccessTitle')
    : t('perpsWithdrawToastErrorTitle');

  const description = isSuccess
    ? t('perpsWithdrawToastSuccessDescription', [amountLabel])
    : lastWithdrawResult.error || t('perpsWithdrawFailed');

  const startAdornment = isSuccess ? (
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
  );

  return (
    <Toast
      key={`perps-withdraw-toast-${lastWithdrawResult.timestamp}`}
      dataTestId="perps-withdraw-toast"
      className="perps-toast self-center w-full max-w-[408px]"
      contentProps={{ className: 'items-center' }}
      text={toastText}
      description={description}
      startAdornment={startAdornment}
      onClose={dismissToast}
      autoHideTime={autoHideDelay}
      onAutoHideToast={dismissToast}
    />
  );
}
