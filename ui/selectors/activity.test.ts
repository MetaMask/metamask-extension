import { AccountGroupId } from '@metamask/account-api';
import type { Transaction } from '@metamask/keyring-api';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { MetaMaskReduxState as _MetaMaskReduxState } from '../store/store';
import { generateTokenCacheKey } from '../helpers/utils/token-scan';
import type { AccountTreeState } from './multichain-accounts/account-tree.types';
import { selectNonEvmTransactionsForActivity } from './activity';

const groups = [
  { id: 'group-1', accounts: [{ id: 'acc-1' }, { id: 'acc-2' }] },
  { id: 'group-2', accounts: [{ id: 'acc-x' }] },
];

jest.mock('./multichain-accounts/account-tree', () => {
  return {
    getSelectedAccountGroup: jest.fn(() => 'group-1'),
    getAccountGroupWithInternalAccounts: jest.fn(() => groups),
  };
});

const SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

type NonEvmTransactionsMap =
  MultichainTransactionsControllerState['nonEvmTransactions'];

type MetaMaskReduxState = _MetaMaskReduxState & {
  metamask: {
    selectedAccountGroup: AccountGroupId;
    accountTree: AccountTreeState;
  };
};

function buildState(
  nonEvmTransactions: unknown,
  tokenScanCache?: Record<
    string,
    {
      data?: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type?: string;
      };
    }
  >,
): MetaMaskReduxState {
  return {
    metamask: {
      nonEvmTransactions: nonEvmTransactions as NonEvmTransactionsMap,
      enabledNetworkMap: {
        solana: { [SOLANA_MAINNET]: true },
      },
      tokenScanCache: tokenScanCache ?? {},
    },
  } as unknown as MetaMaskReduxState;
}

describe('selectNonEvmTransactionsForActivity', () => {
  it('filters malicious non-EVM token transactions', () => {
    const maliciousTx = {
      id: 'bad-tx',
      chain: SOLANA_MAINNET,
      from: [
        {
          asset: {
            fungible: true,
            type: `${SOLANA_MAINNET}/token:BadMint111`,
          },
        },
      ],
      to: [],
    } as unknown as Transaction;
    const benignTx = {
      id: 'good-tx',
      chain: SOLANA_MAINNET,
      from: [
        {
          asset: {
            fungible: true,
            type: `${SOLANA_MAINNET}/token:GoodMint222`,
          },
        },
      ],
      to: [],
    } as unknown as Transaction;

    const state = buildState(
      {
        'acc-1': {
          [SOLANA_MAINNET]: {
            transactions: [maliciousTx, benignTx],
            next: null,
            lastUpdated: 0,
          },
        },
      },
      {
        [generateTokenCacheKey(SOLANA_MAINNET, 'BadMint111')]: {
          data: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Malicious',
          },
        },
      },
    );

    expect(selectNonEvmTransactionsForActivity(state)).toEqual([benignTx]);
  });

  it('keeps native-only and uncached token transactions visible', () => {
    const nativeOnlyTx = {
      id: 'native-tx',
      chain: SOLANA_MAINNET,
      from: [
        {
          asset: {
            fungible: true,
            type: `${SOLANA_MAINNET}/slip44:501`,
          },
        },
      ],
      to: [],
    } as unknown as Transaction;
    const uncachedTokenTx = {
      id: 'uncached-token-tx',
      chain: SOLANA_MAINNET,
      from: [
        {
          asset: {
            fungible: true,
            type: `${SOLANA_MAINNET}/token:UnknownMint333`,
          },
        },
      ],
      to: [],
    } as unknown as Transaction;

    const state = buildState({
      'acc-1': {
        [SOLANA_MAINNET]: {
          transactions: [nativeOnlyTx, uncachedTokenTx],
          next: null,
          lastUpdated: 0,
        },
      },
    });

    expect(selectNonEvmTransactionsForActivity(state)).toEqual([
      nativeOnlyTx,
      uncachedTokenTx,
    ]);
  });
});
