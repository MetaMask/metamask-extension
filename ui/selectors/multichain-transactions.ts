import { createSelector } from 'reselect';
import { Transaction } from '@metamask/keyring-api';
import type { MultichainState } from './multichain';
import {
  getAccountGroupWithInternalAccounts,
  getSelectedAccountGroup,
} from './multichain-accounts/account-tree';
import type {
  MultichainAccountsState,
  AccountGroupWithInternalAccounts,
} from './multichain-accounts/account-tree.types';
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

export function getSelectedAccountGroupMultichainTransactions(
  state: MetaMaskReduxState,
  nonEvmChainIds?: string[],
): { transactions: Transaction[] } {
  const nonEvmTransactionsByAccount = (state as MultichainState).metamask
    .nonEvmTransactions as NonEvmTransactionsMap;

  const selectedGroupId = getSelectedAccountGroup(
    state as unknown as MultichainAccountsState,
  );

  const groupsWithAccounts = getAccountGroupWithInternalAccounts(
    state as unknown as MultichainAccountsState,
  ) as AccountGroupWithInternalAccounts[];

  const selectedGroup = groupsWithAccounts.find(
    (group) => group.id === selectedGroupId,
  );

  const selectedGroupAccountIds = selectedGroup?.accounts.map(
    (account) => account.id,
  );

  const transactions: Transaction[] = [];

  if (selectedGroupAccountIds && selectedGroupAccountIds.length > 0) {
    for (const accountId of selectedGroupAccountIds) {
      const byChain = nonEvmTransactionsByAccount?.[accountId] ?? {};

      for (const chainId of nonEvmChainIds ?? []) {
        const entry = byChain?.[chainId];
        if (entry?.transactions && Array.isArray(entry.transactions)) {
          transactions.push(...entry.transactions);
        }
      }
    }
  }

  return { transactions };
}

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
