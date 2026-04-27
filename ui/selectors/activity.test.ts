import { AccountGroupId } from '@metamask/account-api';
import type { Transaction } from '@metamask/keyring-api';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';
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
        solana: { [MultichainNetworks.SOLANA]: true },
      },
      tokenScanCache: tokenScanCache ?? {},
    },
  } as unknown as MetaMaskReduxState;
}

describe('selectNonEvmTransactionsForActivity', () => {
  it('filters malicious non-EVM token transactions', () => {
    const maliciousTx = {
      id: 'bad-tx',
      chain: MultichainNetworks.SOLANA,
      from: [
        {
          asset: {
            fungible: true,
            type: `${MultichainNetworks.SOLANA}/token:BadMint111`,
          },
        },
      ],
      to: [],
    } as unknown as Transaction;
    const benignTx = {
      id: 'good-tx',
      chain: MultichainNetworks.SOLANA,
      from: [
        {
          asset: {
            fungible: true,
            type: `${MultichainNetworks.SOLANA}/token:GoodMint222`,
          },
        },
      ],
      to: [],
    } as unknown as Transaction;

    const state = buildState(
      {
        'acc-1': {
          [MultichainNetworks.SOLANA]: {
            transactions: [maliciousTx, benignTx],
            next: null,
            lastUpdated: 0,
          },
        },
      },
      {
        [generateTokenCacheKey(MultichainNetworks.SOLANA, 'BadMint111')]: {
          data: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Malicious',
          },
        },
      },
    );

    expect(selectNonEvmTransactionsForActivity(state)).toEqual([benignTx]);
  });
});
