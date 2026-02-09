import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsModal } from './transaction-details-modal';

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

function render(
  type: TransactionType = TransactionType.simpleSend,
  onClose = jest.fn(),
) {
  return {
    onClose,
    ...renderWithProvider(
      <TransactionDetailsModal
        transactionMeta={createMockTransactionMeta(type) as never}
        onClose={onClose}
      />,
      mockStore(mockState),
    ),
  };
}

describe('TransactionDetailsModal', () => {
  beforeEach(() => {
    global.platform = { openTab: jest.fn() } as never;
  });

  it('renders with correct test id', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-modal')).toBeInTheDocument();
  });

  it('renders default title for simple send transactions', () => {
    const { getByRole } = render(TransactionType.simpleSend);
    expect(getByRole('heading', { name: 'transaction' })).toBeInTheDocument();
  });

  it('renders mUSD Conversion title for musdConversion transactions', () => {
    const { getByRole } = render(TransactionType.musdConversion);
    expect(
      getByRole('heading', { name: 'mUSD Conversion' }),
    ).toBeInTheDocument();
  });

  it('renders Funded Perps title for perpsDeposit transactions', () => {
    const { getByRole } = render(TransactionType.perpsDeposit);
    expect(
      getByRole('heading', { name: 'Funded perps account' }),
    ).toBeInTheDocument();
  });

  it('renders TransactionDetails component', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const { getByLabelText, onClose } = render();
    fireEvent.click(getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
