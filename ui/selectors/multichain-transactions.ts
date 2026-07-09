import { createSelector } from 'reselect';
import { Transaction } from '@metamask/keyring-api';
import {
  getAccountGroupWithInternalAccounts,
  getSelectedAccountGroup,
} from './multichain-accounts/account-tree';
import { selectNonEvmChainIds } from './multichain/networks';
import { MetaMaskReduxState } from '.';

// Lightweight shape for nonEvmTransactions state map
// accountId -> chainId -> TransactionStateEntry
type NonEvmTransactionsMap = Record<
  string,
  Record<
    string,
    { transactions?: Transaction[]; next?: string | null; lastUpdated?: number }
  >
>;

const selectNonEvmTransactions = (state: MetaMaskReduxState) =>
  state.metamask.nonEvmTransactions as NonEvmTransactionsMap;

const selectCurrentAccountIds = createSelector(
  getSelectedAccountGroup,
  getAccountGroupWithInternalAccounts,
  (selectedGroupId, groups): string[] => {
    const group = groups.find((g) => g.id === selectedGroupId);
    return group?.accounts.map((a) => a.id) ?? [];
  },
);

/**
 * A non-EVM account of the selected group, expressed both as the raw address
 * (for client-side filtering) and as the CAIP-10 account address the Accounts
 * API expects (chain-agnostic `<namespace>:0:<address>`, mirroring EVM's
 * `eip155:0:<address>` wildcard-reference form).
 */
export type NonEvmGroupAccount = {
  address: string;
  accountApiAddress: string;
};

/**
 * Non-EVM accounts of the currently selected account group.
 *
 * The selected *internal account* is usually the group's EVM account, so we read
 * the whole group (same SRP/entropy) to find its non-EVM account(s). Used to
 * request non-EVM history from the Accounts API for the selected group.
 */
export const selectSelectedAccountGroupNonEvmAccounts = createSelector(
  getSelectedAccountGroup,
  getAccountGroupWithInternalAccounts,
  (selectedGroupId, groups): NonEvmGroupAccount[] => {
    const group = groups.find((g) => g.id === selectedGroupId);
    return (group?.accounts ?? [])
      .map((account) => {
        const namespace = account.scopes?.[0]?.split(':')[0];
        // EVM accounts (or accounts with no CAIP scope) are handled elsewhere.
        if (!namespace || namespace === 'eip155') {
          return undefined;
        }
        return {
          address: account.address,
          accountApiAddress: `${namespace}:0:${account.address}`,
        };
      })
      .filter((account): account is NonEvmGroupAccount => account !== undefined);
  },
);

export const selectCurrentAccountNonEvmTransactions = createSelector(
  selectNonEvmTransactions,
  selectCurrentAccountIds,
  selectNonEvmChainIds,
  (txMap, accountIds, chainIds): Transaction[] => {
    const transactions: Transaction[] = [];
    for (const accountId of accountIds) {
      const byChain = txMap?.[accountId] ?? {};
      for (const chainId of chainIds) {
        const entry = byChain?.[chainId];
        if (entry?.transactions?.length) {
          transactions.push(...entry.transactions);
        }
      }
    }
    return transactions;
  },
);
