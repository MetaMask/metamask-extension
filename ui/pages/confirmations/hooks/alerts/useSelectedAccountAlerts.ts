import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  getAccountGroupWithInternalAccounts,
  getSelectedAccountGroup,
} from '../../../../selectors/multichain-accounts/account-tree';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../types/confirm';
import { useConfirmContext } from '../../context/confirm';

export const useSelectedAccountAlerts = (): Alert[] => {
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext();
  const selectedAccountGroupId = useSelector(getSelectedAccountGroup);
  const accountGroupWithInternalAccounts = useSelector(
    getAccountGroupWithInternalAccounts,
  );
  const selectedAccountGroupWithInternalAccounts =
    accountGroupWithInternalAccounts.find(
      (accountGroup) => accountGroup.id === selectedAccountGroupId,
    )?.accounts;

  const fromAccount =
    (currentConfirmation as SignatureRequestType)?.msgParams?.from ??
    (currentConfirmation as TransactionMeta)?.txParams?.from;

  const isAccountFromSelectedAccountGroup =
    selectedAccountGroupWithInternalAccounts?.find(
      (account) => account.address.toLowerCase() === fromAccount?.toLowerCase(),
    );

  const confirmationAccountSameAsSelectedAccount =
    !fromAccount || isAccountFromSelectedAccountGroup;

  return useMemo<Alert[]>((): Alert[] => {
    if (confirmationAccountSameAsSelectedAccount) {
      return [];
    }

    return [
      {
        key: 'selectedAccountWarning',
        reason: t('selectedAccountMismatch'),
        field: RowAlertKey.SigningInWith,
        severity: Severity.Info,
        message: t('alertSelectedAccountWarning'),
      },
    ];
  }, [confirmationAccountSameAsSelectedAccount, t]);
};
