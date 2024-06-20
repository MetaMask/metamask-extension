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

  const hasPendingTransactions =
    isValidType && Boolean(pendingTransactions.length);

  return useMemo(() => {
    if (!hasPendingTransactions) {
      return [];
    }

    return [
      {
        key: 'pendingTransactions',
        message: t('alertMessagePendingTransactions'),
        reason: t('alertReasonPendingTransactions'),
        severity: Severity.Warning,
      },
    ];
  }, [hasPendingTransactions]);
}
