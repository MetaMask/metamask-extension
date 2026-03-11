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
