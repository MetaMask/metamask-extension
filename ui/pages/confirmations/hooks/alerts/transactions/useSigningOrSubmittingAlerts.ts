import { useSelector } from 'react-redux';
import { getApprovedAndSignedTransactions } from '../../../../../selectors';
import { useMemo } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export function useSigningOrSubmittingAlerts() {
  const t = useI18nContext();

  const signingOrSubmittingTransactions = useSelector(
    getApprovedAndSignedTransactions,
  );

  const isSigningOrSubmitting = signingOrSubmittingTransactions.length > 0;

  return useMemo(() => {
    if (!isSigningOrSubmitting) {
      return [];
    }

    return [
      {
        isBlocking: true,
        key: 'signingOrSubmitting',
        message: t('isSigningOrSubmitting'),
        reason: 'Submit In Progress',
        severity: Severity.Danger,
      },
    ];
  }, [isSigningOrSubmitting]);
}
