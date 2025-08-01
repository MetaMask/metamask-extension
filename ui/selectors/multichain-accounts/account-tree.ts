import type { AccountGroupId, AccountWalletId } from '@metamask/account-api';
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
 * Common function to create consolidated wallets with accounts.
 *
 * @param internalAccounts - All available internal accounts.
 * @param accountTree - Account tree state.
 * @param connectedAccounts - Connected accounts for active tab.
 * @param selectedAccount - Currently selected account.
 * @param pinnedAccounts - List of pinned account addresses.
 * @param hiddenAccounts - List of hidden account addresses.
 * @param getAccountsForGroup - Function to determine which accounts belong to each group.
 * @returns Consolidated wallet collection with accounts metadata.
 */
const createConsolidatedWallets = (
  internalAccounts: MergedInternalAccount[],
  accountTree: AccountTreeState,
  connectedAccounts: InternalAccount[],
  selectedAccount: InternalAccount,
  pinnedAccounts: string[],
  hiddenAccounts: string[],
  getAccountsForGroup: (
    groupAccounts: string[],
    groupIndex: number,
    allAccountIdsInWallet: string[],
    accountsById: Record<string, MergedInternalAccount>,
  ) => string[],
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

      // Collect all accountIds used in any group's accounts array for this wallet
      const allAccountIdsInWallet = Array.from(
        new Set(
          Object.values(wallet.groups).flatMap((group) => group.accounts),
        ),
      );

      Object.entries(wallet.groups).forEach(([groupId, group], groupIndex) => {
        const accountIds = getAccountsForGroup(
          group.accounts,
          groupIndex,
          allAccountIdsInWallet,
          accountsById,
        );

        const accountsFromGroup = accountIds.map((accountId) => {
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
};

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
    return createConsolidatedWallets(
      internalAccounts,
      accountTree,
      connectedAccounts,
      selectedAccount,
      pinnedAccounts,
      hiddenAccounts,
      // Standard behavior: use the group's original accounts
      (groupAccounts) => groupAccounts,
    );
  },
);

/**
 * This selector is a temporary solution to avoid a regression in the account order UI while Multichain Accounts V2 is not completed.
 * It takes the ordered accounts from the MetaMask state and combines them with the account tree data
 * bypassing the respective groups inside a wallet and just adding all accounts inside the first group.
 *
 * To use the correct and intended functionality for Multichain Accounts V2, use `getWalletsWithAccounts` instead.
 *
 * @param internalAccounts - All available internal accounts.
 * @param accountTree - Account tree state.
 * @returns Consolidated wallet collection with accounts metadata.
 */
export const getWalletsWithAccountsSimplified = createDeepEqualSelector(
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
    return createConsolidatedWallets(
      internalAccounts,
      accountTree,
      connectedAccounts,
      selectedAccount,
      pinnedAccounts,
      hiddenAccounts,
      // Simplified behavior: first group gets all accounts in order, others get empty arrays
      (_, groupIndex, allAccountIdsInWallet, accountsById) => {
        if (groupIndex === 0) {
          // For first group, include only those accountIds present in accountsById, preserving accountsById order
          return Object.keys(accountsById).filter((accountId) =>
            allAccountIdsInWallet.includes(accountId),
          );
        }
        return [];
      },
    );
  },
);

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
