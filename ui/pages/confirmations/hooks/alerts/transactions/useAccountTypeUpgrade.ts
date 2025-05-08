import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { isBatchTransaction } from '../../../../../../shared/lib/transactions.utils';
import { AccountTypeMessage } from './AccountTypeMessage';
import { useIsUpgradeTransaction } from '../../../components/confirm/info/hooks/useIsUpgradeTransaction';

export function useAccountTypeUpgrade(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions } = currentConfirmation ?? {};
  const { isUpgrade } = useIsUpgradeTransaction();

  return useMemo(() => {
    if (!isUpgrade) {
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
  }, [isUpgrade, t]);
}
