import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsNetworkFeeRow } from './transaction-details-network-fee-row';

const mockStore = configureMockStore([]);

const mockState = {
  metamask: {
    currentCurrency: 'usd',
    currencyRates: {
      ETH: { conversionRate: 2000 },
    },
  },
};

function createMockTransactionMeta(networkFeeFiat?: string) {
  return {
    id: 'test-id',
    chainId: '0x1',
    status: TransactionStatus.confirmed,
    time: Date.now(),
    txParams: {
      from: '0x123',
      to: '0x456',
    },
    metamaskPay: networkFeeFiat ? { networkFeeFiat } : undefined,
  };
}

function render(networkFeeFiat?: string) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={createMockTransactionMeta(networkFeeFiat) as never}
    >
      <TransactionDetailsNetworkFeeRow />
    </TransactionDetailsProvider>,
    mockStore(mockState),
  );
}

describe('TransactionDetailsNetworkFeeRow', () => {
  it('renders with correct test id', () => {
    const { getByTestId } = render();
    expect(
      getByTestId('transaction-details-network-fee-row'),
    ).toBeInTheDocument();
  });

  it('renders dash when networkFeeFiat is not provided', () => {
    const { getByText } = render();
    expect(getByText('-')).toBeInTheDocument();
  });

  it('renders formatted fee when networkFeeFiat is provided', () => {
    const { queryByText } = render('5.25');
    expect(queryByText('-')).not.toBeInTheDocument();
  });
});
