import type {
  AccountGroupId,
  AccountWalletId,
} from '@metamask/account-tree-controller';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getMetaMaskAccounts } from '../selectors';
import { InternalAccountWithBalance } from '../selectors.types';
import {
  AccountTreeState,
  ConsolidatedAccountWallet,
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
 * Retrieve all wallets and their accounts with metadata in consolidated data structure.
 *
 * @param internalAccounts - All available internal accounts.
 * @param accountTree - Account tree state.
 * @returns Consolidated wallet collection with accounts metadata.
 */
export const getWalletsWithAccounts = createDeepEqualSelector(
  getMetaMaskAccounts,
  getAccountTree,
  (
    accountsById: Record<string, InternalAccountWithBalance>,
    accountTree: AccountTreeState,
  ): ConsolidatedWallets => {
    const { wallets } = accountTree;

    return Object.entries(wallets).reduce(
      (consolidatedWallets: ConsolidatedWallets, [walletId, wallet]) => {
        const consolidatedWallet: ConsolidatedAccountWallet = {
          id: walletId as AccountWalletId,
          metadata: wallet.metadata,
          groups: {},
        };

        Object.entries(wallet.groups).forEach(([groupId, group]) => {
          const accountsFromGroup = group.accounts.reduce(
            (accountsWithMetadata, accountId) => {
              const accountWithMetadata = accountsById[accountId];
              accountsWithMetadata.push(accountWithMetadata);
              return accountsWithMetadata;
            },
            [] as InternalAccountWithBalance[],
          );

          consolidatedWallet.groups[groupId as AccountGroupId] = {
            id: groupId as AccountGroupId,
            metadata: group.metadata,
            accounts: accountsFromGroup,
          };
        });

        consolidatedWallets[consolidatedWallet.id] = consolidatedWallet;

        return consolidatedWallets;
      },
      {} as ConsolidatedWallets,
    );
  },
);
