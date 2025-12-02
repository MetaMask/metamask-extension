import { Transaction, isEvmAccountType } from '@metamask/keyring-api';
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
// accountId -> chainId -> TransactionStateEntry
type NonEvmTransactionsMap = Record<
  string,
  Record<
    string,
    { transactions?: Transaction[]; next?: string | null; lastUpdated?: number }
  >
>;

type RootState = MultichainState & MultichainAccountsState & DefaultRootState;

/**
 * Gets all EVM account addresses from the selected account group.
 *
 * @param state - The Redux state.
 * @returns EVM addresses in the selected account group.
 */
export function getSelectedAccountGroupEvmAddresses(
  state: MultichainAccountsState,
): string[] {
  const selectedGroupId = getSelectedAccountGroup(state);
  const groupsWithAccounts = getAccountGroupWithInternalAccounts(
    state,
  ) as AccountGroupWithInternalAccounts[];
  const selectedGroup = groupsWithAccounts.find(
    (group) => group.id === selectedGroupId,
  );

  if (!selectedGroup?.accounts) {
    return [];
  }

  return selectedGroup.accounts
    .filter((account) => isEvmAccountType(account.type))
    .map((account) => account.address.toLowerCase());
}

export function getSelectedAccountGroupMultichainTransactions(
  state: RootState,
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
