import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsAccountRow } from './transaction-details-account-row';

const FROM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const ACCOUNT_NAME = 'Test Account';

const mockStore = configureMockStore([]);

const mockTransactionMeta = {
  id: 'test-id',
  chainId: '0x1',
  status: TransactionStatus.confirmed,
  time: Date.now(),
  txParams: {
    from: FROM_ADDRESS,
    to: '0x456',
  },
};

const mockState = {
  metamask: {
    internalAccounts: {
      accounts: {
        'account-1': {
          id: 'account-1',
          address: FROM_ADDRESS,
          metadata: { name: ACCOUNT_NAME },
        },
      },
      selectedAccount: 'account-1',
    },
  },
};

function render(state: Record<string, unknown> = mockState) {
  return renderWithProvider(
    <TransactionDetailsProvider transactionMeta={mockTransactionMeta as never}>
      <TransactionDetailsAccountRow />
    </TransactionDetailsProvider>,
    mockStore(state),
  );
}

describe('TransactionDetailsAccountRow', () => {
  it('renders account name when available', () => {
    const { getByText } = render();
    expect(getByText(ACCOUNT_NAME)).toBeInTheDocument();
  });

  it('renders address when account name is not found', () => {
    const stateWithoutAccount = {
      metamask: {
        internalAccounts: {
          accounts: {},
          selectedAccount: '',
        },
      },
    };

    const { getByText } = render(stateWithoutAccount);
    expect(getByText(FROM_ADDRESS)).toBeInTheDocument();
  });

  it('renders with correct test id', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-account-row')).toBeInTheDocument();
  });
});
