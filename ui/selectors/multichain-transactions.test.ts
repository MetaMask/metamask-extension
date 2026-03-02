import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { Transaction } from '@metamask/keyring-api';
import type { MetaMaskReduxState as _MetaMaskReduxState } from '../store/store';
import type { AccountTreeState } from './multichain-accounts/account-tree.types';
import { selectCurrentAccountNonEvmTransactions } from './multichain-transactions';

const groups = [
  { id: 'group-1', accounts: [{ id: 'acc-1' }, { id: 'acc-2' }] },
  { id: 'group-2', accounts: [{ id: 'acc-x' }] },
];

// Mock account-tree selectors used by the selectors under test
jest.mock('./multichain-accounts/account-tree', () => {
  return {
    getSelectedAccountGroup: jest.fn(() => 'group-1'),
    getAccountGroupWithInternalAccounts: jest.fn(() => groups),
  };
});

const SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOLANA_DEVNET = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
const BTC_MAINNET = 'bip122:000000000019d6689c085ae165831e93';

type NonEvmTransactionsMap =
  MultichainTransactionsControllerState['nonEvmTransactions'];

type MetaMaskReduxState = _MetaMaskReduxState & {
  metamask: { accountTree: AccountTreeState };
};

function buildState(
  nonEvmTransactions: unknown,
  enabledNetworkMap?: Record<string, Record<string, boolean>>,
): MetaMaskReduxState {
  return {
    metamask: {
      nonEvmTransactions: nonEvmTransactions as NonEvmTransactionsMap,
      enabledNetworkMap: enabledNetworkMap ?? {},
    },
  } as unknown as MetaMaskReduxState;
}

describe('selectCurrentAccountNonEvmTransactions', () => {
  it('returns transactions only for enabled non-EVM chains', () => {
    const solTx = { id: 'sol-1' } as unknown as Transaction;
    const btcTx = { id: 'btc-1' } as unknown as Transaction;

    const state = buildState(
      {
        'acc-1': {
          [SOLANA_MAINNET]: {
            transactions: [solTx],
            next: null,
            lastUpdated: 0,
          },
          [BTC_MAINNET]: {
            transactions: [btcTx],
            next: null,
            lastUpdated: 0,
          },
        },
      },
      {
        eip155: { '0x1': true },
        solana: { [SOLANA_MAINNET]: true },
        bip122: { [BTC_MAINNET]: false },
      },
    );

    const result = selectCurrentAccountNonEvmTransactions(state);
    // Only Solana is enabled, Bitcoin is disabled
    expect(result).toEqual([solTx]);
  });

  it('ignores accounts not in the selected group', () => {
    const myTx = { id: 'mine' } as unknown as Transaction;
    const otherTx = { id: 'not-mine' } as unknown as Transaction;

    const state = buildState(
      {
        'acc-1': {
          [SOLANA_MAINNET]: {
            transactions: [myTx],
            next: null,
            lastUpdated: 0,
          },
        },
        // acc-3 is not in group-1
        'acc-3': {
          [SOLANA_MAINNET]: {
            transactions: [otherTx],
            next: null,
            lastUpdated: 0,
          },
        },
      },
      {
        solana: { [SOLANA_MAINNET]: true },
      },
    );

    const result = selectCurrentAccountNonEvmTransactions(state);
    expect(result).toEqual([myTx]);
  });

  it('aggregates transactions across multiple accounts in the group', () => {
    const tx1 = { id: 'tx-1' } as unknown as Transaction;
    const tx2 = { id: 'tx-2' } as unknown as Transaction;

    const state = buildState(
      {
        'acc-1': {
          [SOLANA_MAINNET]: {
            transactions: [tx1],
            next: null,
            lastUpdated: 0,
          },
        },
        'acc-2': {
          [BTC_MAINNET]: {
            transactions: [tx2],
            next: null,
            lastUpdated: 0,
          },
        },
      },
      {
        solana: { [SOLANA_MAINNET]: true },
        bip122: { [BTC_MAINNET]: true },
      },
    );

    const result = selectCurrentAccountNonEvmTransactions(state);
    expect(result).toEqual([tx1, tx2]);
  });
});
