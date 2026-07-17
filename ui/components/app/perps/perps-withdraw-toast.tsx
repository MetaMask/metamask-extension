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
import { useToaster } from 'react-hot-toast';
import { toast } from '../../ui/toast/toast';

const TOAST_ID = 'perps-withdraw-toast';
const TOAST_DURATION = 5 * SECOND;

const clearWithdrawResult = () =>
  submitRequestToBackground('perpsClearWithdrawResult', []).catch(
    () => undefined,
  );

export function PerpsWithdrawToast() {
  const t = useI18nContext();
  const { toasts } = useToaster();
  const { formatCurrency } = useFormatters();
  const lastWithdrawResult = useSelector(selectPerpsLastWithdrawResult);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [lastWithdrawResult?.timestamp]);

  const dismissToast = useCallback(() => {
    setDismissed(true);
    clearWithdrawResult();
  }, []);

  useEffect(() => {
    if (dismissed || !lastWithdrawResult) {
      toast.remove(TOAST_ID);
      return undefined;
    }

    const isSuccess = lastWithdrawResult.success === true;
    const amountNum = parseFloat(lastWithdrawResult.amount);
    const amountLabel = Number.isFinite(amountNum)
      ? formatCurrency(amountNum, 'USD')
      : lastWithdrawResult.amount;

    const title = isSuccess
      ? t('perpsWithdrawToastSuccessTitle')
      : t('perpsWithdrawToastErrorTitle');

    const description = isSuccess
      ? t('perpsWithdrawToastSuccessDescription', [amountLabel])
      : lastWithdrawResult.error || t('perpsWithdrawFailed');

    const content = {
      title,
      description,
      id: TOAST_ID,
    };
    const options = {
      duration: TOAST_DURATION,
      removeDelay: 0,
      icon: isSuccess ? (
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
    };

    if (isSuccess) {
      toast.success(content, options);
    } else {
      toast.error(content, options);
    }

    const timeoutId = setTimeout(dismissToast, TOAST_DURATION);

    return () => {
      clearTimeout(timeoutId);
      toast.remove(TOAST_ID);
    };
  }, [dismissed, dismissToast, formatCurrency, lastWithdrawResult, t]);

  useEffect(() => {
    const item = toasts.find((entry) => entry.id === TOAST_ID);
    if (!dismissed && lastWithdrawResult && item?.dismissed) {
      dismissToast();
    }
  }, [dismissToast, dismissed, lastWithdrawResult, toasts]);

  return null;
}
