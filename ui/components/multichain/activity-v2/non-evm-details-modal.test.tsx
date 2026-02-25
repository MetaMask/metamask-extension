import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/keyring-api';
import type { Transaction } from '@metamask/keyring-api';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';
import { NonEvmDetailsModal } from './non-evm-details-modal';

jest.mock('../../../ducks/bridge-status/selectors');

jest.mock('../../app/multichain-transaction-details-modal', () => ({
  MultichainTransactionDetailsModal: () => (
    <div data-testid="multichain-transaction-details-modal" />
  ),
}));

jest.mock(
  '../../app/multichain-bridge-transaction-details-modal/multichain-bridge-transaction-details-modal',
  () => () => <div data-testid="multichain-bridge-transaction-details-modal" />,
);

const mockStore = configureMockStore();

const mockSelectBridgeHistory =
  selectBridgeHistoryForAccountGroup as unknown as jest.Mock;

function renderWithStore(bridgeHistory: Record<string, unknown> = {}) {
  mockSelectBridgeHistory.mockReturnValue(bridgeHistory);

  const store = mockStore({ metamask: {} });

  const mockTransaction = {
    id: 'tx-1',
    chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    account: 'account-1',
    status: TransactionStatus.Confirmed,
    timestamp: 1708800000,
  } as unknown as Transaction;

  render(
    <Provider store={store}>
      <NonEvmDetailsModal transaction={mockTransaction} onClose={jest.fn()} />
    </Provider>,
  );
}

describe('NonEvmDetailsModal', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders the generic modal when there is no bridge history', () => {
    renderWithStore({});

    expect(
      screen.getByTestId('multichain-transaction-details-modal'),
    ).toBeInTheDocument();
  });

  it('renders the bridge modal when the transaction has cross-chain bridge history', () => {
    renderWithStore({
      'tx-1': {
        quote: { srcChainId: '0x1', destChainId: '0x2105' },
      },
    });

    expect(
      screen.getByTestId('multichain-bridge-transaction-details-modal'),
    ).toBeInTheDocument();
  });

  it('renders the generic modal when bridge history is same-chain (swap)', () => {
    renderWithStore({
      'tx-1': {
        quote: { srcChainId: '0x1', destChainId: '0x1' },
      },
    });
    expect(
      screen.getByTestId('multichain-transaction-details-modal'),
    ).toBeInTheDocument();
  });
});
