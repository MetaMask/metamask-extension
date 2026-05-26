import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsBridgeFeeRow } from './transaction-details-bridge-fee-row';

const mockStore = configureMockStore([]);

const mockState = {
  metamask: {
    currentCurrency: 'usd',
    currencyRates: {
      ETH: { conversionRate: 2000 },
    },
  },
};

function createMockTransactionMeta(bridgeFeeFiat?: string) {
  return {
    id: 'test-id',
    chainId: '0x1',
    status: TransactionStatus.confirmed,
    time: Date.now(),
    txParams: {
      from: '0x123',
      to: '0x456',
    },
    metamaskPay: bridgeFeeFiat ? { bridgeFeeFiat } : undefined,
  };
}

function render(bridgeFeeFiat?: string) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={createMockTransactionMeta(bridgeFeeFiat) as never}
    >
      <TransactionDetailsBridgeFeeRow />
    </TransactionDetailsProvider>,
    mockStore(mockState),
  );
}

describe('TransactionDetailsBridgeFeeRow', () => {
  it('returns null when bridgeFeeFiat is not provided', () => {
    const { container } = render();
    expect(container.firstChild).toBeNull();
  });

  it('renders with correct test id when bridgeFeeFiat is provided', () => {
    const { getByTestId } = render('2.50');
    expect(
      getByTestId('transaction-details-bridge-fee-row'),
    ).toBeInTheDocument();
  });
});
