import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsDateRow } from './transaction-details-date-row';

const mockStore = configureMockStore([]);

const TIMESTAMP = new Date('2024-03-15T14:30:00').getTime();

const mockTransactionMeta = {
  id: 'test-id',
  chainId: '0x1',
  status: TransactionStatus.confirmed,
  time: TIMESTAMP,
  txParams: {
    from: '0x123',
    to: '0x456',
  },
};

const mockState = {
  metamask: {},
};

function render() {
  return renderWithProvider(
    <TransactionDetailsProvider transactionMeta={mockTransactionMeta as never}>
      <TransactionDetailsDateRow />
    </TransactionDetailsProvider>,
    mockStore(mockState),
  );
}

describe('TransactionDetailsDateRow', () => {
  it('renders date row with correct test id', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-date-row')).toBeInTheDocument();
  });

  it('renders formatted date', () => {
    const { getByText } = render();
    expect(getByText('Mar 15, 2024')).toBeInTheDocument();
  });
});
