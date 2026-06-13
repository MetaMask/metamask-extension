'use no memo';

import { useMemo } from 'react';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionPayQuoteValidationError } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

export function usePayQuoteValidationAlert(): Alert[] {
  const t = useI18nContext();
  const quoteValidationError = useTransactionPayQuoteValidationError();

  return useMemo(() => {
    if (!quoteValidationError) {
      return [];
    }

    const message = t('alertPayQuoteValidationTitle');

    return [
      {
        key: AlertsName.PayQuoteValidation,
        reason: message,
        message,
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [quoteValidationError, t]);
}
