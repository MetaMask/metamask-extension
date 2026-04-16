import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsHero } from './transaction-details-hero';

const mockStore = configureMockStore([]);

const mockState = {
  metamask: {
    currentCurrency: 'usd',
    currencyRates: {
      ETH: { conversionRate: 2000 },
    },
  },
};

function createMockTransactionMeta(targetFiat?: string) {
  return {
    id: 'test-id',
    chainId: '0x1',
    status: TransactionStatus.confirmed,
    time: Date.now(),
    txParams: {
      from: '0x123',
      to: '0x456',
    },
    metamaskPay: targetFiat ? { targetFiat } : undefined,
  };
}

function render(targetFiat?: string) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={createMockTransactionMeta(targetFiat) as never}
    >
      <TransactionDetailsHero />
    </TransactionDetailsProvider>,
    mockStore(mockState),
  );
}

describe('TransactionDetailsHero', () => {
  it('renders formatted fiat amount when targetFiat is provided', () => {
    const { getByTestId } = render('100.50');
    expect(getByTestId('transaction-details-hero')).toBeInTheDocument();
  });

  it('returns null when targetFiat is not provided', () => {
    const { container } = render();
    expect(container.firstChild).toBeNull();
  });

  it('returns null when targetFiat is zero', () => {
    const { container } = render('0');
    expect(container.firstChild).toBeNull();
  });
});
