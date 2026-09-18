import type { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { ConsolidatedWallets } from '../../../selectors/multichain-accounts/account-tree.types';

export type EvmAccountGroupedByWallet = {
  id: AccountGroupId;
  name: string;
  address: string;
  type: string;
};

export type EvmWalletWithAccounts = {
  id: AccountWalletId;
  name: string;
  accounts: EvmAccountGroupedByWallet[];
};

/**
 * Groups EVM accounts from consolidated wallets by wallet, skipping wallets
 * that have no EVM accounts. Uses `isEvmAccountType` for account detection.
 *
 * @param wallets - Consolidated wallets from `getWalletsWithAccounts`.
 * @returns Wallets with their EVM accounts, preserving wallet order.
 */
export function getEvmAccountsGroupedByWallet(
  wallets: ConsolidatedWallets,
): EvmWalletWithAccounts[] {
  return Object.values(wallets).reduce(
    (acc: EvmWalletWithAccounts[], wallet) => {
      const accounts: EvmAccountGroupedByWallet[] = [];

      Object.values(wallet.groups).forEach((group) => {
        const evmAccount = group.accounts.find((account) =>
          isEvmAccountType(account.type),
        );

        if (evmAccount) {
          accounts.push({
            id: group.id,
            name: group.metadata.name,
            address: evmAccount.address,
            type: evmAccount.type,
          });
        }
      });

      if (accounts.length > 0) {
        acc.push({
          id: wallet.id,
          name: wallet.metadata.name,
          accounts,
        });
      }

      return acc;
    },
    [],
  );
}
