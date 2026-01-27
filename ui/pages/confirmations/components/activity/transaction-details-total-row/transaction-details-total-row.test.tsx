import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsTotalRow } from './transaction-details-total-row';

const mockStore = configureMockStore([]);

const mockState = {
  metamask: {
    currentCurrency: 'usd',
    currencyRates: {
      ETH: { conversionRate: 2000 },
    },
  },
};

function createMockTransactionMeta(totalFiat?: string) {
  return {
    id: 'test-id',
    chainId: '0x1',
    status: TransactionStatus.confirmed,
    time: Date.now(),
    txParams: {
      from: '0x123',
      to: '0x456',
    },
    metamaskPay: totalFiat ? { totalFiat } : undefined,
  };
}

function render(totalFiat?: string) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={createMockTransactionMeta(totalFiat) as never}
    >
      <TransactionDetailsTotalRow />
    </TransactionDetailsProvider>,
    mockStore(mockState),
  );
}

describe('TransactionDetailsTotalRow', () => {
  it('renders with correct test id', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-total-row')).toBeInTheDocument();
  });

  it('renders dash when totalFiat is not provided', () => {
    const { getByText } = render();
    expect(getByText('-')).toBeInTheDocument();
  });

  it('renders formatted total when totalFiat is provided', () => {
    const { queryByText } = render('150.75');
    expect(queryByText('-')).not.toBeInTheDocument();
  });
});
