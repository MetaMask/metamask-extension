import type {
  AccountGroupId,
  AccountWalletId,
} from '@metamask/account-tree-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getMetaMaskAccountsOrdered,
  getOrderedConnectedAccountsForActiveTab,
  getPinnedAccountsList,
  getHiddenAccountsList,
} from '../selectors';
import { MergedInternalAccount } from '../selectors.types';
import { getSelectedInternalAccount } from '../accounts';
import {
  AccountTreeState,
  ConsolidatedWallets,
  MultichainAccountsState,
} from './account-tree.types';

/**
 * Retrieve account tree state.
 *
 * @param state - Redux state.
 * @param state.metamask - MetaMask state object.
 * @param state.metamask.accountTree - Account tree state object.
 * @returns Account tree state.
 */
export const getAccountTree = (
  state: MultichainAccountsState,
): AccountTreeState => state.metamask.accountTree;

/**
 * Retrieve all wallets and their accounts with metadata in consolidated data structure.
 *
 * @param internalAccounts - All available internal accounts.
 * @param accountTree - Account tree state.
 * @returns Consolidated wallet collection with accounts metadata.
 */
export const getWalletsWithAccounts = createDeepEqualSelector(
  getMetaMaskAccountsOrdered,
  getAccountTree,
  getOrderedConnectedAccountsForActiveTab,
  getSelectedInternalAccount,
  getPinnedAccountsList,
  getHiddenAccountsList,
  (
    internalAccounts: MergedInternalAccount[],
    accountTree: AccountTreeState,
    connectedAccounts: InternalAccount[],
    selectedAccount: InternalAccount,
    pinnedAccounts: string[],
    hiddenAccounts: string[],
  ): ConsolidatedWallets => {
    // Precompute lookups for pinned and hidden accounts
    const pinnedAccountsSet = new Set(pinnedAccounts);
    const hiddenAccountsSet = new Set(hiddenAccounts);

    // Precompute connected account IDs for faster lookup
    const connectedAccountIdsSet = new Set(
      connectedAccounts.map((account) => account.id),
    );

    // Create a mapping of accounts by ID for quick access
    const accountsById = internalAccounts.reduce(
      (accounts: Record<string, MergedInternalAccount>, account) => {
        accounts[account.id] = account;
        return accounts;
      },
      {},
    );

    const { wallets } = accountTree;

    return Object.entries(wallets).reduce(
      (consolidatedWallets: ConsolidatedWallets, [walletId, wallet]) => {
        consolidatedWallets[walletId as AccountWalletId] = {
          id: walletId as AccountWalletId,
          metadata: wallet.metadata,
          groups: {},
        };

        Object.entries(wallet.groups).forEach(([groupId, group]) => {
          const accountsFromGroup = group.accounts.map((accountId) => {
            const accountWithMetadata = { ...accountsById[accountId] };

            // Set flags for pinned, hidden, and active accounts
            accountWithMetadata.pinned = pinnedAccountsSet.has(
              accountWithMetadata.address,
            );
            accountWithMetadata.hidden = hiddenAccountsSet.has(
              accountWithMetadata.address,
            );
            accountWithMetadata.active =
              selectedAccount.id === accountWithMetadata.id &&
              connectedAccountIdsSet.has(accountWithMetadata.id);

            return accountWithMetadata;
          });

          consolidatedWallets[walletId as AccountWalletId].groups[
            groupId as AccountGroupId
          ] = {
            id: groupId as AccountGroupId,
            metadata: group.metadata,
            accounts: accountsFromGroup,
          };
        });

        return consolidatedWallets;
      },
      {} as ConsolidatedWallets,
    );
  },
);

export type WalletMetadata = {
  id: string;
  name: string;
};

/**
 * Retrieve the wallet ID and name for an account with a given address.
 *
 * @param walletsWithAccounts - The consolidated wallets with accounts.
 * @param address - The address of the account to find.
 * @returns The wallet ID and name for the account, or null if not found.
 */
export const getWalletIdAndNameByAccountAddress = createDeepEqualSelector(
  getWalletsWithAccounts,
  (_, address: string) => address,
  (walletsWithAccounts: ConsolidatedWallets, address: string) => {
    // Find the wallet that contains the account with the given address
    for (const [walletId, wallet] of Object.entries(walletsWithAccounts)) {
      for (const group of Object.values(wallet.groups)) {
        const account = group.accounts.find(
          (acc) => acc.address.toLowerCase() === address.toLowerCase(),
        );
        if (account) {
          return {
            id: walletId,
            name: wallet.metadata.name,
          };
        }
      }
    }

    return null;
  },
);
