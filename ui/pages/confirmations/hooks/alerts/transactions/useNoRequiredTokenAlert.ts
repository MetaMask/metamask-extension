'use no memo';

import { useMemo } from 'react';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

export function useNoRequiredTokenAlert(): Alert[] {
  const t = useI18nContext();
  const { payToken } = useTransactionPayToken();
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const showAlert = Boolean(payToken) && !primaryRequiredToken;

  return useMemo(() => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        key: AlertsName.NoRequiredToken,
        field: RowAlertKey.PayWith,
        message: t('alertNoRequiredTokenMessage'),
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [showAlert, t]);
}
