import type { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountId } from '@metamask/accounts-controller';
import { CaipChainId } from '@metamask/utils';
import { AccountGroupObject } from '@metamask/account-tree-controller';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getMetaMaskAccountsOrdered,
  getOrderedConnectedAccountsForActiveTab,
  getPinnedAccountsList,
  getHiddenAccountsList,
} from '../selectors';
import { MergedInternalAccount } from '../selectors.types';
import {
  getInternalAccountsObject,
  getSelectedInternalAccount,
} from '../accounts';
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
export const getAccountTree = createDeepEqualSelector(
  (state: MultichainAccountsState) => state.metamask.accountTree,
  (accountTree: AccountTreeState): AccountTreeState => accountTree,
);

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
        type: wallet.type,
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
          type: group.type,
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

/**
 * Get a group by its ID from the account tree.
 *
 * @param wallets - The wallets object from the account tree.
 * @param groupId - The ID of the group to get.
 * @returns The group object, or null if not found.
 */
const getGroupByGroupId = (
  wallets: AccountTreeState['wallets'],
  groupId: AccountGroupId,
) => {
  for (const wallet of Object.values(wallets)) {
    if (wallet.groups[groupId]) {
      return wallet.groups[groupId];
    }
  }
  return null;
};

/**
 * Get an internal account from a group by its CAIP chain ID.
 *
 * @param group - The group object to search in.
 * @param caipChainId - The CAIP chain ID to search for.
 * @param internalAccounts - The internal accounts object.
 * @returns The internal account object, or null if not found.
 */
const getInternalAccountFromGroup = (
  group: AccountGroupObject | null,
  caipChainId: CaipChainId,
  internalAccounts: Record<AccountId, InternalAccount>,
) => {
  if (!group) {
    return null;
  }

  for (const account of group.accounts) {
    const internalAccount = internalAccounts[account];
    if (internalAccount?.scopes.includes(caipChainId)) {
      return internalAccount;
    }
  }

  return null;
};

/**
 * Get an internal account from the account tree by its group ID and CAIP chain ID.
 *
 * @param groupId - The ID of the group to search in.
 * @param caipChainId - The CAIP chain ID to search for.
 * @returns The internal account object, or null if not found.
 */
export const getInternalAccountByGroupAndCaip = createDeepEqualSelector(
  getAccountTree,
  getInternalAccountsObject,
  (_, groupId: AccountGroupId, caipChainId: CaipChainId) => ({
    groupId,
    caipChainId,
  }),
  (
    accountTree: AccountTreeState,
    internalAccounts: Record<AccountId, InternalAccount>,
    {
      groupId,
      caipChainId,
    }: { groupId: AccountGroupId; caipChainId: CaipChainId },
  ) => {
    const { wallets } = accountTree;
    const group = getGroupByGroupId(wallets, groupId);

    return getInternalAccountFromGroup(group, caipChainId, internalAccounts);
  },
);

/**
 * Get the selected account group from the account tree.
 *
 * @param accountTree - The account tree state.
 * @returns The selected account group, or null if not found.
 */
export const getSelectedAccountGroup = createDeepEqualSelector(
  getAccountTree,
  (accountTree: AccountTreeState) => accountTree.selectedAccountGroup,
);

/**
 * Get an internal account from the account tree by its selected account group and CAIP chain ID.
 *
 * @param caipChainId - The CAIP chain ID to search for.
 * @returns The internal account object, or null if not found.
 */
export const getInternalAccountBySelectedAccountGroupAndCaip =
  createDeepEqualSelector(
    getAccountTree,
    getInternalAccountsObject,
    getSelectedAccountGroup,
    (_, caipChainId: CaipChainId) => caipChainId,
    (
      accountTree: AccountTreeState,
      internalAccounts: Record<AccountId, InternalAccount>,
      selectedAccountGroup: AccountGroupId | null,
      caipChainId: CaipChainId,
    ) => {
      if (!selectedAccountGroup) {
        return null;
      }

      const { wallets } = accountTree;
      const group = getGroupByGroupId(wallets, selectedAccountGroup);

      return getInternalAccountFromGroup(group, caipChainId, internalAccounts);
    },
  );
