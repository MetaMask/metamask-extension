import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isCorrectDeveloperTransactionType } from '../../../../../../shared/lib/confirmation.utils';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { submittedPendingTransactionsSelector } from '../../../../../selectors';
import { useConfirmContext } from '../../../context/confirm';
import { PendingTransactionAlertMessage } from './PendingTransactionAlertMessage';

export function usePendingTransactionAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const { type } = currentConfirmation ?? ({} as TransactionMeta);
  const pendingTransactions = useSelector(submittedPendingTransactionsSelector);

  const isValidType = isCorrectDeveloperTransactionType(type);

  const hasPendingTransactions =
    isValidType && Boolean(pendingTransactions.length);

  return useMemo(() => {
    if (!hasPendingTransactions) {
      return [];
    }

    return [
      {
        field: RowAlertKey.Speed,
        key: 'pendingTransactions',
        message: PendingTransactionAlertMessage(),
        reason: t('alertReasonPendingTransactions'),
        severity: Severity.Warning,
      },
    ];
  }, [hasPendingTransactions]);
}
