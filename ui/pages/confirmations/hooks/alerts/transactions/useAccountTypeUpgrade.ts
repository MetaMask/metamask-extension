import { useMemo } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useIsUpgradeTransaction } from '../../../components/confirm/info/hooks/useIsUpgradeTransaction';
import { AccountTypeMessage } from './AccountTypeMessage';

export function useAccountTypeUpgrade(): Alert[] {
  const t = useI18nContext();
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
