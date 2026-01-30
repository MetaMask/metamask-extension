import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsSummary } from './transaction-details-summary';

const CHAIN_ID = '0x1';

const mockStore = configureMockStore([]);

const mockState = {
  metamask: {
    transactions: [],
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
    allTokens: {},
    tokenBalances: {},
    tokensChainsCache: {},
    networkConfigurationsByChainId: {
      [CHAIN_ID]: {
        chainId: CHAIN_ID,
        name: 'Ethereum',
        nativeCurrency: 'ETH',
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
      },
    },
  },
};

function createMockTransactionMeta(type: TransactionType) {
  return {
    id: 'test-id',
    chainId: CHAIN_ID,
    status: TransactionStatus.confirmed,
    time: Date.now(),
    type,
    txParams: {
      from: '0x123',
      to: '0x456',
    },
  };
}

function render(type: TransactionType = TransactionType.simpleSend) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={createMockTransactionMeta(type) as never}
    >
      <TransactionDetailsSummary />
    </TransactionDetailsProvider>,
    mockStore(mockState),
  );
}

describe('TransactionDetailsSummary', () => {
  beforeEach(() => {
    global.platform = { openTab: jest.fn() } as never;
  });

  it('renders with correct test id', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-summary')).toBeInTheDocument();
  });

  it('renders summary label', () => {
    const { getByText } = render();
    expect(getByText('Summary')).toBeInTheDocument();
  });

  it('renders bridge title for bridge transactions', () => {
    const { getByText } = render(TransactionType.bridge);
    expect(getByText('Bridge')).toBeInTheDocument();
  });

  it('renders swap title for swap transactions', () => {
    const { getByText } = render(TransactionType.swap);
    expect(getByText('Swap')).toBeInTheDocument();
  });
});
