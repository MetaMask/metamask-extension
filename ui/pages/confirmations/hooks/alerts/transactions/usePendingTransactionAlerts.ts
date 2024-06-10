import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  currentConfirmationSelector,
  submittedPendingTransactionsSelector,
} from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { REDESIGN_TRANSACTION_TYPES } from '../../../utils';

export function usePendingTransactionAlerts(): Alert[] {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const { type } = currentConfirmation ?? ({} as TransactionMeta);
  const pendingTransactions = useSelector(submittedPendingTransactionsSelector);

  const isValidType = REDESIGN_TRANSACTION_TYPES.includes(
    type as TransactionType,
  );

  const pendingTransactionCount = isValidType ? pendingTransactions.length : 0;

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
