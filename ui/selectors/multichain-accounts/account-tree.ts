import {
  AccountWalletType,
  type AccountGroupId,
  type AccountWalletId,
} from '@metamask/account-api';
import { createSelector } from 'reselect';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountGroupObject } from '@metamask/account-tree-controller';
import {
  type CaipAccountId,
  type CaipChainId,
  KnownCaipNamespace,
} from '@metamask/utils';
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
  getInternalAccounts,
  getInternalAccountsObject,
  getSelectedInternalAccount,
} from '../accounts';
import {
  AccountGroupWithInternalAccounts,
  AccountTreeState,
  ConsolidatedWallets,
  MultichainAccountGroupScopeToCaipAccountId,
  MultichainAccountGroupToScopesMap,
  MultichainAccountsState,
} from './account-tree.types';
import { getSanitizedChainId, extractWalletIdFromGroupId } from './utils';

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
 * Retrieve a multichain account group by its ID.
 *
 * @param accountTree - Account tree state.
 * @param accountId - The account group ID to find.
 * @returns The multichain account group object, or undefined if not found.
 */
export const getMultichainAccountGroupById = createDeepEqualSelector(
  getAccountTree,
  (_, accountId: AccountGroupId) => accountId,
  (accountTree: AccountTreeState, accountId: AccountGroupId) => {
    const { wallets } = accountTree;

    const walletId = extractWalletIdFromGroupId(accountId);
    const wallet = wallets[walletId as AccountWalletId];

    return wallet?.groups[accountId as AccountGroupId];
  },
);

/**
 * Retrieve all account groups from all wallets in the account tree.
 *
 * @param accountTree - Account tree state.
 * @returns Array of all account groups.
 */
export const getAllAccountGroups = createDeepEqualSelector(
  getAccountTree,
  (accountTree: AccountTreeState) => {
    const { wallets } = accountTree;

    return Object.values(wallets).flatMap((wallet) => {
      return Object.values(wallet.groups);
    });
  },
);

/**
 * Retrieve all multichain account groups (filtered by Entropy wallet type).
 *
 * @param accountGroups - Array of all account groups.
 * @returns Array of multichain account groups.
 */
export const getMultichainAccountGroups = createDeepEqualSelector(
  getAllAccountGroups,
  (accountGroups: AccountGroupObject[]) => {
    return accountGroups.filter((group) =>
      group.id.startsWith(AccountWalletType.Entropy),
    );
  },
);

/**
 * Retrieve all non-multichain account groups (filtered to exclude Entropy wallet type).
 *
 * @param accountGroups - Array of all account groups.
 * @returns Array of non-multichain account groups.
 */
export const getSingleAccountGroups = createDeepEqualSelector(
  getAllAccountGroups,
  (accountGroups: AccountGroupObject[]) => {
    return accountGroups.filter(
      (group) => !group.id.startsWith(AccountWalletType.Entropy),
    );
  },
);

/**
 * Create a map from CAIP-25 account IDs to multichain account group IDs.
 *
 * @param accountGroups - Array of all account groups.
 * @param internalAccounts - Array of internal accounts.
 * @returns Map from CAIP-25 account IDs to multichain account group IDs.
 */
export const getCaip25AccountIdToMultichainAccountGroupMap =
  createDeepEqualSelector(
    getAllAccountGroups,
    getInternalAccounts,
    (
      accountGroups: AccountGroupObject[],
      internalAccounts: InternalAccount[],
    ) => {
      const caip25AccountIdToMultichainAccountGroupMap: Map<
        CaipAccountId,
        AccountGroupId
      > = new Map();
      accountGroups.forEach((accountGroup) => {
        accountGroup.accounts.forEach((accountId) => {
          const internalAccount = internalAccounts.find(
            (account) => account.id === accountId,
          );
          if (!internalAccount) {
            return;
          }
          const [caip25Id] = internalAccount.scopes;
          if (caip25Id) {
            caip25AccountIdToMultichainAccountGroupMap.set(
              `${caip25Id}:${internalAccount.address}`,
              accountGroup.id,
            );
          }
        });
      });
      return caip25AccountIdToMultichainAccountGroupMap;
    },
  );

/**
 * Retrieve account groups with their internal accounts populated.
 *
 * @param accountGroups - Array of all account groups.
 * @param internalAccounts - Array of internal accounts.
 * @returns Array of account groups with internal accounts instead of account IDs.
 */
export const getAccountGroupWithInternalAccounts = createDeepEqualSelector(
  getAllAccountGroups,
  getInternalAccounts,
  (
    accountGroups: AccountGroupObject[],
    internalAccounts: InternalAccount[],
  ): AccountGroupWithInternalAccounts[] => {
    return accountGroups.map((accountGroup) => {
      return {
        ...accountGroup,
        accounts: accountGroup.accounts
          .map((accountId: string) => {
            const internalAccount = internalAccounts.find(
              (account) => account.id === accountId,
            );
            return internalAccount;
          })
          .filter(
            (account): account is InternalAccount => account !== undefined,
          ),
      };
    });
  },
);

/**
 * Create a map from multichain account group IDs to their scope mappings.
 *
 * @param multichainAccounts - Array of multichain account groups.
 * @param internalAccounts - Array of internal accounts.
 * @returns Map from multichain account group IDs to scope-to-CAIP account ID mappings.
 */
export const getMultichainAccountsToScopesMap = createDeepEqualSelector(
  getMultichainAccountGroups,
  getInternalAccounts,
  (
    multichainAccounts: AccountGroupObject[],
    internalAccounts: InternalAccount[],
  ) => {
    const multichainAccountsToScopesMap: MultichainAccountGroupToScopesMap =
      new Map();

    multichainAccounts.forEach((multichainAccount) => {
      const multichainAccountIdToCaip25Ids: MultichainAccountGroupScopeToCaipAccountId =
        new Map();

      Object.values(multichainAccount.accounts).forEach((internalAccountId) => {
        const internalAccount = internalAccounts.find(
          (account) => account.id === internalAccountId,
        );

        if (!internalAccount) {
          return;
        }
        const [caip25Id] = internalAccount.scopes;
        if (caip25Id) {
          const [namespace, reference] = caip25Id.split(':');
          multichainAccountIdToCaip25Ids.set(
            caip25Id,
            `${namespace}:${reference}:${internalAccount.address}`,
          );
        }
      });

      multichainAccountsToScopesMap.set(
        multichainAccount.id,
        multichainAccountIdToCaip25Ids,
      );
    });

    return multichainAccountsToScopesMap;
  },
);

/**
 * Get the CAIP-25 account ID for a specific account group and scope.
 *
 * @param multichainAccountsToScopesMap - Map of multichain account groups to their scopes.
 * @param accountGroup - The account group to search in.
 * @param scope - The CAIP chain ID scope to find.
 * @returns The CAIP-25 account ID, or undefined if not found.
 */
export const getCaip25IdByAccountGroupAndScope = createDeepEqualSelector(
  getMultichainAccountsToScopesMap,
  (_, accountGroup: AccountGroupObject, scope: CaipChainId) => ({
    accountGroup,
    scope,
  }),
  (
    multichainAccountsToScopesMap: MultichainAccountGroupToScopesMap,
    {
      accountGroup,
      scope,
    }: { accountGroup: AccountGroupObject; scope: CaipChainId },
  ) => {
    const multichainAccountGroup = multichainAccountsToScopesMap.get(
      accountGroup.id,
    );
    if (!multichainAccountGroup) {
      return undefined;
    }
    return multichainAccountGroup.get(scope);
  },
);

/**
 * Get account groups filtered by the provided scopes.
 *
 * @param accountGroupsWithInternalAccounts - Array of account groups with internal accounts.
 * @param scopes - Array of scope strings to filter by.
 * @returns Array of account groups that match the provided scopes.
 */
export const getAccountGroupsByScopes = createDeepEqualSelector(
  getAccountGroupWithInternalAccounts,
  (_, scopes: string[]) => scopes,
  (
    accountGroupsWithInternalAccounts: AccountGroupWithInternalAccounts[],
    scopes: string[],
  ) => {
    const { cleanedScopes, hasEvmScope } = scopes.reduce(
      (acc, scope) => {
        const [namespace] = scope.split(':');
        if (namespace === KnownCaipNamespace.Eip155) {
          acc.hasEvmScope = true;
        } else {
          acc.cleanedScopes.push(scope as CaipChainId);
        }
        return acc;
      },
      { cleanedScopes: [] as CaipChainId[], hasEvmScope: false },
    );

    // Can early return with all multichain account groups because they all have EVM scopes
    if (hasEvmScope) {
      return accountGroupsWithInternalAccounts;
    }

    const scopesToAccountGroupsMap = new Map<
      CaipChainId,
      AccountGroupWithInternalAccounts[]
    >();

    cleanedScopes.forEach((scope) => {
      const accountGroupsWithScope = accountGroupsWithInternalAccounts.filter(
        (accountGroup) =>
          accountGroup.accounts.some((internalAccount: InternalAccount) =>
            internalAccount.scopes.includes(scope),
          ),
      );
      scopesToAccountGroupsMap.set(scope, accountGroupsWithScope);
    });

    return Array.from(scopesToAccountGroupsMap.values()).flat();
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

  const sanitizedChainId = getSanitizedChainId(caipChainId);

  for (const account of group.accounts) {
    const internalAccount = internalAccounts[account];
    if (internalAccount?.scopes.includes(sanitizedChainId)) {
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

/**
 * Retrieve wallet from account tree state.
 *
 * @param state - Redux state.
 * @param state.metamask - MetaMask state object.
 * @param state.metamask.accountTree - Account tree state object.
 * @param walletId - The ID of the wallet to retrieve.
 * @returns Wallet object from account tree state.
 */
export const getWallet = createSelector(
  (state: MultichainAccountsState) => state.metamask?.accountTree?.wallets,
  (_, walletId: AccountWalletId) => walletId,
  (wallets, walletId: AccountWalletId) => {
    return wallets?.[walletId];
  },
);

/**
 * Get the number of internal accounts in a specific group.
 *
 * @param accountTree - Account tree state.
 * @param groupId - The account group ID.
 * @returns The number of accounts in the group, or 0 if the group is not found.
 */
export const getNetworkAddressCount = createSelector(
  getAccountTree,
  (_, accountGroupId: AccountGroupId) => accountGroupId,
  (accountTree: AccountTreeState, accountGroupId: AccountGroupId): number => {
    const { wallets } = accountTree;

    const walletId = extractWalletIdFromGroupId(accountGroupId);
    const wallet = wallets[walletId as AccountWalletId];

    if (!wallet?.groups[accountGroupId]) {
      return 0;
    }

    return wallet.groups[accountGroupId].accounts.length;
  },
);

/**
 * Returns all account groups that belong to a specific wallet ID.
 *
 * @param state - Redux state.
 * @param walletId - The wallet ID to filter account groups by.
 * @returns Object containing all account groups for the specified wallet.
 */
export const getMultichainAccountsByWalletId = createSelector(
  getAccountTree,
  (_: MultichainAccountsState, walletId: AccountWalletId) => walletId,
  (
    accountTree,
    walletId,
  ): Record<AccountGroupId, AccountGroupObject> | undefined => {
    const wallet = accountTree.wallets[walletId];

    return wallet?.groups;
  },
);

/**
 * Get all internal accounts from a specific account group by its ID.
 *
 * @param state - Redux state.
 * @param groupId - The ID of the account group.
 * @returns Array of internal accounts in the specified group, or empty array if not found.
 */
export const getInternalAccountsFromGroupById = createDeepEqualSelector(
  getAccountTree,
  getInternalAccountsObject,
  (_, groupId: AccountGroupId) => groupId,
  (
    accountTree: AccountTreeState,
    internalAccounts: Record<AccountId, InternalAccount>,
    groupId: AccountGroupId | null,
  ): InternalAccount[] => {
    if (!groupId) {
      return [];
    }

    const { wallets } = accountTree;
    const group = getGroupByGroupId(wallets, groupId);

    if (!group) {
      return [];
    }

    return group.accounts
      .map((accountId) => internalAccounts[accountId])
      .filter((account): account is InternalAccount => Boolean(account));
  },
);
