import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { selectHasSigningOrSubmittingTransactions } from '../../../../../selectors/transactions';

export function useSigningOrSubmittingAlerts(): Alert[] {
  const t = useI18nContext();

  const isSigningOrSubmitting = useSelector(
    selectHasSigningOrSubmittingTransactions,
  );

  return useMemo(() => {
    if (!isSigningOrSubmitting) {
      return [];
    }

    return [
      {
        isBlocking: true,
        key: 'signingOrSubmitting',
        message: t('isSigningOrSubmitting'),
        severity: Severity.Danger,
      },
    ];
  }, [isSigningOrSubmitting, t]);
}
