import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { Transaction } from '@metamask/keyring-api';
import type { DefaultRootState } from 'react-redux';
import type { MultichainState } from './multichain';
import type { MultichainAccountsState } from './multichain-accounts/account-tree.types';
import { getSelectedAccountGroupMultichainTransactions } from './multichain-transactions';

// Mock account-tree selectors used by the selector under test
jest.mock('./multichain-accounts/account-tree', () => ({
  getSelectedAccountGroup: jest.fn(() => 'group-1'),
  getAccountGroupWithInternalAccounts: jest.fn(() => [
    { id: 'group-1', accounts: [{ id: 'acc-1' }, { id: 'acc-2' }] },
    { id: 'group-2', accounts: [{ id: 'acc-x' }] },
  ]),
}));

describe('getSelectedAccountGroupMultichainTransactions', () => {
  const SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  const SOLANA_DEVNET = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';

  type RootState = MultichainState & MultichainAccountsState & DefaultRootState;
  type NonEvmTransactionsMap =
    MultichainTransactionsControllerState['nonEvmTransactions'];

  function buildState(nonEvmTransactions: unknown): RootState {
    return {
      metamask: {
        nonEvmTransactions: nonEvmTransactions as NonEvmTransactionsMap,
      },
    } as unknown as RootState;
  }

  it('returns empty transactions when nonEvmChainIds is undefined', () => {
    const tx1 = { id: 'a1' } as unknown as Transaction;
    const state = buildState({
      'acc-1': {
        [SOLANA_MAINNET]: {
          transactions: [tx1],
          next: null,
          lastUpdated: 0,
        },
      },
    });

    const result = getSelectedAccountGroupMultichainTransactions(
      state,
      undefined,
    );
    expect(result).toEqual({ transactions: [] });
  });

  it('aggregates transactions for specified chain IDs across accounts in the selected group', () => {
    const a1 = { id: 'a1' } as unknown as Transaction;
    const a2 = { id: 'a2' } as unknown as Transaction;
    const a3 = { id: 'a3' } as unknown as Transaction;
    const b1 = { id: 'b1' } as unknown as Transaction;
    const other = { id: 'other' } as unknown as Transaction;

    const state = buildState({
      'acc-1': {
        [SOLANA_MAINNET]: {
          transactions: [a1, a2],
          next: null,
          lastUpdated: 0,
        },
        [SOLANA_DEVNET]: {
          transactions: [a3],
          next: null,
          lastUpdated: 0,
        },
      },
      'acc-2': {
        [SOLANA_MAINNET]: {
          transactions: [b1],
          next: null,
          lastUpdated: 0,
        },
        'bitcoin:mainnet': {
          transactions: [other],
          next: null,
          lastUpdated: 0,
        },
      },
      // This account is not in the selected group and should be ignored
      'acc-3': {
        [SOLANA_MAINNET]: {
          transactions: [{ id: 'ignored' } as unknown as Transaction],
          next: null,
          lastUpdated: 0,
        },
      },
    });

    const result = getSelectedAccountGroupMultichainTransactions(state, [
      SOLANA_MAINNET,
    ]);

    expect(result.transactions).toEqual([a1, a2, b1]);
  });

  it('ignores unknown chain IDs and missing entries gracefully', () => {
    const a1 = { id: 'a1' } as unknown as Transaction;
    const state = buildState({
      'acc-1': {
        [SOLANA_MAINNET]: {
          transactions: [a1],
          next: null,
          lastUpdated: 0,
        },
        // entry without transactions
        'unknown:chain': {
          transactions: [],
          next: null,
          lastUpdated: 0,
        },
      },
      'acc-2': {
        // no chains for this account
      },
    });

    const result = getSelectedAccountGroupMultichainTransactions(state, [
      SOLANA_MAINNET,
      'unknown:chain',
      'nonexistent:chain',
    ]);
    expect(result.transactions).toEqual([a1]);
  });
});
