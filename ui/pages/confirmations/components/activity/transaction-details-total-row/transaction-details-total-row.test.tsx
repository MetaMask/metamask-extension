import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
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

function createMockTransactionMeta({
  totalFiat,
  targetFiat,
  type,
}: {
  totalFiat?: string;
  targetFiat?: string;
  type?: TransactionType;
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
    metamaskPay:
      totalFiat || targetFiat ? { totalFiat, targetFiat } : undefined,
  };
}

function render(
  args: {
    totalFiat?: string;
    targetFiat?: string;
    type?: TransactionType;
  } = {},
) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={createMockTransactionMeta(args) as never}
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
    const { queryByText } = render({ totalFiat: '150.75' });
    expect(queryByText('-')).not.toBeInTheDocument();
  });

  it('renders "Total" label and uses totalFiat for non-perpsWithdraw transactions', () => {
    const { getByText, queryByText } = render({
      totalFiat: '150.75',
      targetFiat: '100',
      type: TransactionType.perpsDeposit,
    });
    expect(getByText(messages.total.message)).toBeInTheDocument();
    expect(queryByText(messages.receivedTotal.message)).not.toBeInTheDocument();
    expect(getByText('$150.75')).toBeInTheDocument();
  });

  it('renders "Received total" label and uses targetFiat for perpsWithdraw transactions', () => {
    const { getByText, queryByText } = render({
      totalFiat: '150.75',
      targetFiat: '100',
      type: TransactionType.perpsWithdraw,
    });
    expect(getByText(messages.receivedTotal.message)).toBeInTheDocument();
    expect(queryByText(messages.total.message)).not.toBeInTheDocument();
    expect(getByText('$100.00')).toBeInTheDocument();
    expect(queryByText('$150.75')).not.toBeInTheDocument();
  });
});
