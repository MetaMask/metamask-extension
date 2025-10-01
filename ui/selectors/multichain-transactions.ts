import { Transaction } from '@metamask/keyring-api';
import type { DefaultRootState } from 'react-redux';
import type { MultichainState } from './multichain';
import {
  getAccountGroupWithInternalAccounts,
  getSelectedAccountGroup,
} from './multichain-accounts/account-tree';
import type {
  MultichainAccountsState,
  AccountGroupWithInternalAccounts,
} from './multichain-accounts/account-tree.types';

// Lightweight shape for nonEvmTransactions state map
type NonEvmTransactionsMap = Record<
  string,
  { transactions?: Transaction[]; next?: string | null; lastUpdated?: number }
>;

type RootState = MultichainState & MultichainAccountsState & DefaultRootState;

export function getSelectedAccountGroupMultichainTransactions(
  state: RootState,
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

  const transactions =
    selectedGroupAccountIds?.flatMap(
      (accountId) => nonEvmTransactionsByAccount[accountId]?.transactions ?? [],
    ) ?? [];

  return { transactions };
}
