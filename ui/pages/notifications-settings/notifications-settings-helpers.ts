import { isEvmAccountType } from '@metamask/keyring-api';

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
  notificationAddresses: string[],
): NotificationWalletGroup[] {
  if (accountGroups.length === 0 || notificationAddresses.length === 0) {
    return [];
  }

  const notificationAddressSet = new Set(
    notificationAddresses.map((address) => address.toLowerCase()),
  );

  return accountGroups.reduce<NotificationWalletGroup[]>(
    (walletGroups, accountGroup) => {
      const evmAccount = accountGroup.accounts.find(
        (account) =>
          Boolean(account.address) &&
          isEvmAccountType(account.type) &&
          notificationAddressSet.has(account.address.toLowerCase()),
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
