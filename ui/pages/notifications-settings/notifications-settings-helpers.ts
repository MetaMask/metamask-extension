import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';

import { getAccountGroupWithInternalAccounts } from '../../selectors/multichain-accounts/account-tree';
import type { AccountGroupWithInternalAccounts } from '../../selectors/multichain-accounts/account-tree.types';

export type NotificationAccount = {
  id: string;
  address: string;
  name: string;
};

export type NotificationWalletGroup = {
  walletId: string;
  walletName: string;
  accounts: NotificationAccount[];
};

export function getNotificationWalletGroups(
  accountGroups: AccountGroupWithInternalAccounts[],
): NotificationWalletGroup[] {
  if (accountGroups.length === 0) {
    return [];
  }

  return accountGroups.reduce<NotificationWalletGroup[]>(
    (walletGroups, accountGroup) => {
      const evmAccount = accountGroup.accounts.find(
        (account) => Boolean(account.address) && isEvmAccountType(account.type),
      );

      if (!evmAccount?.address) {
        return walletGroups;
      }

      const existingWalletGroup = walletGroups.find(
        (walletGroup) => walletGroup.walletId === accountGroup.walletId,
      );

      const notificationAccount = {
        id: accountGroup.id,
        address: evmAccount.address,
        name: accountGroup.metadata.name,
      };

      if (existingWalletGroup) {
        existingWalletGroup.accounts.push(notificationAccount);
        return walletGroups;
      }

      walletGroups.push({
        walletId: accountGroup.walletId,
        walletName: accountGroup.walletName,
        accounts: [notificationAccount],
      });

      return walletGroups;
    },
    [],
  );
}

export function useNotificationAccountGroups(): NotificationWalletGroup[] {
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  return useMemo(
    () => getNotificationWalletGroups(accountGroups),
    [accountGroups],
  );
}
