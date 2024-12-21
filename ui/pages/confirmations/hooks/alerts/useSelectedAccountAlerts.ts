import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { getSelectedAccount } from '../../../../selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../types/confirm';
import { useConfirmContext } from '../../context/confirm';

export const useSelectedAccountAlerts = (): Alert[] => {
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext();
  const selectedAccount = useSelector(getSelectedAccount);

  const fromAccount =
    (currentConfirmation as SignatureRequestType)?.msgParams?.from ??
    (currentConfirmation as TransactionMeta)?.txParams?.from;
  const confirmationAccountSameAsSelectedAccount =
    !fromAccount ||
    fromAccount.toLowerCase() === selectedAccount?.address?.toLowerCase();

  return useMemo<Alert[]>((): Alert[] => {
    if (confirmationAccountSameAsSelectedAccount) {
      return [];
    }

    return [
      {
        key: 'selectedAccountWarning',
        reason: t('selectedAccountMismatch'),
        field: RowAlertKey.SigningInWith,
        severity: Severity.Warning,
        message: t('alertSelectedAccountWarning'),
      },
    ];
  }, [confirmationAccountSameAsSelectedAccount, t]);
};
