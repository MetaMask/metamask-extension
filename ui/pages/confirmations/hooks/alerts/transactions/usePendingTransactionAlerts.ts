import useCurrentConfirmation from '../../useCurrentConfirmation';
import { useSelector } from 'react-redux';
import { submittedPendingTransactionsSelector } from '../../../../../selectors';
import { useMemo } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';

export function usePendingTransactionAlerts(): Alert[] {
  const t = useI18nContext();
  const pendingTransactions = useSelector(submittedPendingTransactionsSelector);
  const pendingTransactionCount = pendingTransactions.length;

  return useMemo(() => {
    if (pendingTransactionCount === 0) {
      return [];
    }

    const message = `${
      pendingTransactionCount === 1
        ? t('pendingTransactionSingle', [pendingTransactionCount])
        : t('pendingTransactionMultiple', [pendingTransactionCount])
    } ${t('pendingTransactionInfo')}`;

    return [
      {
        key: 'pendingTransactions',
        message,
        reason: 'Pending Transactions',
        severity: Severity.Warning,
      },
    ];
  }, [pendingTransactionCount]);
}
