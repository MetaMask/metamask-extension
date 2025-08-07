import {
  AccountWalletCategory,
  type AccountGroupId,
  type AccountWalletId,
} from '@metamask/account-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountGroupObject } from '@metamask/account-tree-controller';
import {
  type CaipAccountId,
  type CaipChainId,
  CaipNamespace,
  isCaipNamespace,
  KnownCaipNamespace,
} from '@metamask/utils';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getMetaMaskAccountsOrdered,
  getOrderedConnectedAccountsForActiveTab,
  getPinnedAccountsList,
  getHiddenAccountsList,
} from '../selectors';
import { MergedInternalAccount } from '../selectors.types';
import { getInternalAccounts, getSelectedInternalAccount } from '../accounts';
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

export const getMultichainAccountGroupById = createDeepEqualSelector(
  getAccountTree,
  (_, accountId: AccountGroupId) => accountId,
  (accountTree: AccountTreeState, accountId: AccountGroupId) => {
    const { wallets } = accountTree;

    const [walletId] = accountId.split('/');
    const wallet = wallets[walletId as AccountWalletId];

    console.log('wallet', wallet);

    return wallet?.groups[accountId as AccountGroupId];
  },
);

export const getAccountGroups = createDeepEqualSelector(
  getAccountTree,
  (accountTree: AccountTreeState) => {
    const { wallets } = accountTree;

    return Object.values(wallets).flatMap((wallet) => {
      return Object.values(wallet.groups);
    });
  },
);

export const getMultichainAccountGroups = createDeepEqualSelector(
  getAccountGroups,
  (accountGroups: AccountGroupObject[]) => {
    return accountGroups.filter((group) =>
      group.id.startsWith(AccountWalletCategory.Entropy),
    );
  },
);

export const getNonMultichainAccountGroups = createDeepEqualSelector(
  getAccountGroups,
  (accountGroups: AccountGroupObject[]) => {
    return accountGroups.filter(
      (group) => !group.id.startsWith(AccountWalletCategory.Entropy),
    );
  },
);

type MultichainAccountId = AccountGroupObject['id'];
type MultichainAccountGroupToScopesMap = Map<
  MultichainAccountId,
  MultichainAccountGroupScopeToCaipAccountId
>;
type MultichainAccountGroupScopeToCaipAccountId = Map<
  CaipChainId,
  CaipAccountId
>;

export const getCaip25AccountIdToMultichainAccountGroupMap =
  createDeepEqualSelector(
    getAccountGroups,
    getInternalAccounts,
    (
      accountGroups: AccountGroupObject[],
      internalAccounts: InternalAccount[],
    ) => {
      const caip25AccountIdToMultichainAccountGroupMap: Map<
        CaipAccountId,
        MultichainAccountId
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

export type AccountGroupWithInternalAccounts = Omit<
  AccountGroupObject,
  'accounts'
> & {
  accounts: InternalAccount[];
};

export const getAccountGroupWithInternalAccounts = createDeepEqualSelector(
  getAccountGroups,
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
          .filter((account) => account !== undefined),
      };
    });
  },
);

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

export const getCaip25IdByAccountGroupAndScope = createDeepEqualSelector(
  getMultichainAccountsToScopesMap,
  (_, accountGroup: AccountGroupObject, scope: CaipChainId) => ({
    accountGroup,
    scope,
  }),
  (
    multichainAccountsToScopesMap: MultichainAccountGroupToScopesMap,
    { accountGroup, scope },
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

export const getMultichainAccountGroupsByScopes = createDeepEqualSelector(
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
          accountGroup.accounts.some((internalAccount) =>
            internalAccount.scopes.includes(scope),
          ),
      );
      scopesToAccountGroupsMap.set(scope, accountGroupsWithScope);
    });

    return Array.from(scopesToAccountGroupsMap.values()).flat();
  },
);
