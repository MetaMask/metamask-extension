import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { isBatchTransaction } from '../../../../../../shared/lib/transactions.utils';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { AccountTypeMessage } from './AccountTypeMessage';

export function useAccountTypeUpgrade(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions, txParams } = currentConfirmation ?? {};
  const { from, to } = txParams ?? {};
console.log('currentConfirmation', from, nestedTransactions, to);
  const isBatch = isBatchTransaction(from, nestedTransactions, to);
console.log('isBatch', isBatch);
  return useMemo(() => {
    if (!isBatch) {
      return [];
    }

    return [
      {
        field: RowAlertKey.AccountTypeUpgrade,
        key: RowAlertKey.AccountTypeUpgrade,
        content: AccountTypeMessage(),
        reason: t('alertAccountTypeUpgradeTitle'),
        severity: Severity.Info,
      },
    ];
  }, [isBatch, t]);
}
