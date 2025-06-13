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
  (
    internalAccounts: MergedInternalAccount[],
    accountTree: AccountTreeState,
    connectedAccounts: InternalAccount[],
    selectedAccountId: AccountId,
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
                connectedAccounts.find(
                  (connectedAccount) =>
                    connectedAccount.id === accountWithMetadata.id,
                ) && selectedAccountId === accountWithMetadata.id,
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
