import { AccountGroupId } from '@metamask/account-api';
import {
  type Transaction,
  TransactionStatus as KeyringTransactionStatus,
  TransactionType as KeyringTransactionType,
} from '@metamask/keyring-api';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import type { TransactionGroup } from '../../shared/lib/multichain/types';
import type { MetaMaskReduxState as _MetaMaskReduxState } from '../store/store';
import { generateTokenCacheKey } from '../helpers/utils/token-scan';
import type { AccountTreeState } from './multichain-accounts/account-tree.types';
import {
  selectLocalActivityItems,
  selectNonEvmActivityItems,
  selectNonEvmTransactionsForActivity,
} from './activity';

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

describe('selectNonEvmActivityItems', () => {
  it('maps filtered keyring transactions into activity items', () => {
    const receiveTx = {
      id: 'receive-id',
      chain: MultichainNetworks.SOLANA,
      account: '00000000-0000-4000-8000-000000000000',
      status: KeyringTransactionStatus.Confirmed,
      timestamp: 1716367781,
      type: KeyringTransactionType.Receive,
      from: [{ address: 'from-address', asset: null }],
      to: [
        {
          address: 'to-address',
          asset: {
            fungible: true,
            type: `${MultichainNetworks.SOLANA}/slip44:501`,
            unit: 'SOL',
            amount: '1',
          },
        },
      ],
      fees: [],
      events: [],
    } as Transaction;

    const state = buildState({
      'acc-1': {
        [MultichainNetworks.SOLANA]: {
          transactions: [receiveTx],
          next: null,
          lastUpdated: 0,
        },
      },
    });

    expect(selectNonEvmActivityItems(state)).toEqual([
      {
        type: 'receive',
        chainId: MultichainNetworks.SOLANA,
        status: 'success',
        timestamp: 1716367781000,
        data: {
          hash: 'receive-id',
          from: 'from-address',
          to: 'to-address',
          tokenSymbol: 'SOL',
        },
      },
    ]);
  });
});

describe('selectLocalActivityItems', () => {
  it('maps local transaction groups into activity items', () => {
    const pendingTransaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'send-id',
      hash: '0xsend',
      networkClientId: 'mainnet',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      type: TransactionType.simpleSend,
      txParams: {
        from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
        to: '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc',
        value: '0x1',
      },
    };
    const confirmedTransaction = {
      ...pendingTransaction,
      id: 'confirmed-id',
      hash: '0xconfirmed',
      status: TransactionStatus.confirmed,
    };

    expect(
      selectLocalActivityItems.resultFunc([
        {
          hasCancelled: false,
          hasRetried: false,
          initialTransaction: pendingTransaction,
          nonce: '0x1',
          primaryTransaction: pendingTransaction,
          transactions: [pendingTransaction],
        } as unknown as TransactionGroup,
        {
          hasCancelled: false,
          hasRetried: false,
          initialTransaction: confirmedTransaction,
          nonce: '0x2',
          primaryTransaction: confirmedTransaction,
          transactions: [confirmedTransaction],
        } as unknown as TransactionGroup,
      ], {}),
    ).toEqual([
      {
        type: 'send',
        chainId: 'eip155:1',
        status: 'success',
        timestamp: 1716367781000,
        data: {
          hash: '0xsend',
          from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
          to: '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc',
          tokenSymbol: 'ETH',
        },
      },
      {
        type: 'send',
        chainId: 'eip155:1',
        status: 'success',
        timestamp: 1716367781000,
        data: {
          hash: '0xconfirmed',
          from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
          to: '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc',
          tokenSymbol: 'ETH',
        },
      },
    ]);
  });

  it('uses matched transaction history symbols for local swaps', () => {
    const transaction = {
      chainId: CHAIN_IDS.ARBITRUM,
      id: 'swap-id',
      hash: '0xswap',
      networkClientId: 'arbitrum-mainnet',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      type: TransactionType.swap,
      txParams: {
        from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
        to: '0x9dda6ef3d919c9bc8885d5560999a3640431e8e6',
        value: '0x0',
      },
    };

    expect(
      selectLocalActivityItems.resultFunc(
        [
          {
            hasCancelled: false,
            hasRetried: false,
            initialTransaction: transaction,
            nonce: '0x1',
            primaryTransaction: transaction,
            transactions: [transaction],
          } as unknown as TransactionGroup,
        ],
        {
          'swap-id': {
            quote: {
              srcAsset: { symbol: 'USDC' },
              destAsset: { symbol: 'ETH' },
            },
          },
        },
      ),
    ).toEqual([
      {
        type: 'swap',
        chainId: 'eip155:42161',
        status: 'success',
        timestamp: 1716367781000,
        data: {
          hash: '0xswap',
          sourceTokenSymbol: 'USDC',
          destinationTokenSymbol: 'ETH',
        },
      },
    ]);
  });
});
