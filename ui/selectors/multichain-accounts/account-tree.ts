import type {
  AccountGroupId,
  AccountWalletId,
} from '@metamask/account-tree-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getMetaMaskAccountsOrdered,
  getOrderedConnectedAccountsForActiveTab,
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
  (
    internalAccounts: MergedInternalAccount[],
    accountTree: AccountTreeState,
    connectedAccounts: InternalAccount[],
    selectedAccount: InternalAccount,
  ): ConsolidatedWallets => {
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
          const accountsFromGroup = group.accounts.reduce(
            (accountsWithMetadata, accountId) => {
              const accountWithMetadata = accountsById[accountId];

              accountWithMetadata.active = Boolean(
                selectedAccount.id === accountWithMetadata.id &&
                  connectedAccounts.find(
                    (connectedAccount) =>
                      connectedAccount.id === accountWithMetadata.id,
                  ),
              );

              accountsWithMetadata.push(accountWithMetadata);

              return accountsWithMetadata;
            },
            [] as MergedInternalAccount[],
          );

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
