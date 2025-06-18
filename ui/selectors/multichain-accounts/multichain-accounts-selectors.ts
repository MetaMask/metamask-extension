import type {
  AccountGroupId,
  AccountWalletId,
} from '@metamask/account-tree-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountId } from '@metamask/accounts-controller';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getMetaMaskAccountsOrdered,
  getOrderedConnectedAccountsForActiveTab,
  getPinnedAccountsList,
  getHiddenAccountsList,
} from '../selectors';
import { MergedInternalAccount } from '../selectors.types';
import {
  AccountTreeState,
  ConsolidatedWallets,
  MultichainAccountsState,
} from './multichain-accounts-selectors.types';

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
 * Retrieve currently selected account ID from state.
 *
 * @param state - Redux state.
 * @param state.metamask - MetaMask state object.
 * @param state.metamask.internalAccounts - Internal accounts object.
 * @param state.metamask.internalAccounts.selectedAccount - Selected Account ID.
 * @returns Selected account ID.
 */
export const getSelectedAccount = (state: MultichainAccountsState): AccountId =>
  state.metamask.internalAccounts.selectedAccount;

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
  getSelectedAccount,
  getPinnedAccountsList,
  getHiddenAccountsList,
  (
    internalAccounts: MergedInternalAccount[],
    accountTree: AccountTreeState,
    connectedAccounts: InternalAccount[],
    selectedAccountId: AccountId,
    pinnedAccounts: string[],
    hiddenAccounts: string[],
  ): ConsolidatedWallets => {
    // Precompute lookups for pinned and hidden accounts
    const pinnedAccountsSet = new Set(pinnedAccounts);
    const hiddenAccountsSet = new Set(hiddenAccounts);

    // Precompute connected account IDs for faster lookup
    const connectedAccountIds = new Set(
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
              connectedAccountIds.has(accountWithMetadata.id) &&
              selectedAccountId === accountWithMetadata.id;

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
