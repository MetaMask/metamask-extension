import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsHero } from './transaction-details-hero';

const mockStore = configureMockStore([]);

const mockState = {
  metamask: {
    currentCurrency: 'brl',
    currencyRates: {
      ETH: { conversionRate: 2000 },
    },
  },
};

function createMockTransactionMeta({
  targetFiat,
  type,
  nestedTransactions,
}: {
  targetFiat?: string;
  type?: TransactionType;
  nestedTransactions?: { data?: string; type?: TransactionType }[];
} = {}) {
  return {
    id: 'test-id',
    chainId: '0x1',
    status: TransactionStatus.confirmed,
    time: Date.now(),
    type,
    txParams: {
      from: '0x123',
      to: '0x456',
    },
    nestedTransactions,
    metamaskPay: targetFiat ? { targetFiat } : undefined,
  };
}

function render({
  targetFiat,
  type,
  nestedTransactions,
}: {
  targetFiat?: string;
  type?: TransactionType;
  nestedTransactions?: { data?: string; type?: TransactionType }[];
} = {}) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={
        createMockTransactionMeta({
          targetFiat,
          type,
          nestedTransactions,
        }) as never
      }
    >
      <TransactionDetailsHero />
    </TransactionDetailsProvider>,
    mockStore(mockState),
  );
}

describe('TransactionDetailsHero', () => {
  it('renders formatted fiat amount when targetFiat is provided', () => {
    const { getByTestId, getByText } = render({ targetFiat: '100.50' });
    expect(getByTestId('transaction-details-hero')).toBeInTheDocument();
    // metamaskPay fiat values are USD; override currency so BRL preference does not show R$
    expect(getByText(/\$100[.,]50/u)).toBeInTheDocument();
  });

  it('returns null when targetFiat is not provided', () => {
    const { container } = render();
    expect(container.firstChild).toBeNull();
  });

  it('returns null when targetFiat is zero', () => {
    const { container } = render({ targetFiat: '0' });
    expect(container.firstChild).toBeNull();
  });

  it('renders the nested transfer amount for a money account withdraw when targetFiat is missing', () => {
    const { getByTestId, getByText } = render({
      type: TransactionType.moneyAccountWithdraw,
      nestedTransactions: [
        { type: TransactionType.moneyAccountWithdraw, data: '0xwithdraw' },
        {
          type: TransactionType.tokenMethodTransfer,
          data: '0xa9059cbb0000000000000000000000002222222222222222222222222222222222222222000000000000000000000000000000000000000000000000000000000000c350',
        },
      ],
    });

    expect(getByTestId('transaction-details-hero')).toBeInTheDocument();
    expect(getByText('0.05 mUSD')).toBeInTheDocument();
  });

  it('returns null for a money account withdraw whose nested transfer amount is zero', () => {
    const { container } = render({
      type: TransactionType.moneyAccountWithdraw,
      nestedTransactions: [
        { type: TransactionType.moneyAccountWithdraw, data: '0xwithdraw' },
        {
          type: TransactionType.tokenMethodTransfer,
          data: '0xa9059cbb00000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000000000000000000000',
        },
      ],
    });

    expect(container.firstChild).toBeNull();
  });
});
