import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsAccountRow } from './transaction-details-account-row';

const FROM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const ACCOUNT_NAME = 'Test Account';

const mockStore = configureMockStore([]);

function createMockTransactionMeta(includeMetamaskPay = false) {
  return {
    id: 'test-id',
    chainId: '0x1',
    status: TransactionStatus.confirmed,
    time: Date.now(),
    txParams: {
      from: FROM_ADDRESS,
      to: '0x456',
    },
    ...(includeMetamaskPay && {
      metamaskPay: {
        chainId: '0x1',
        tokenAddress: '0xtoken',
        targetFiat: '100',
        networkFeeFiat: '5',
        bridgeFeeFiat: '2',
        totalFiat: '107',
      },
    }),
  };
}

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

function render(
  state: Record<string, unknown> = mockState,
  includeMetamaskPay = true,
) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={createMockTransactionMeta(includeMetamaskPay) as never}
    >
      <TransactionDetailsAccountRow />
    </TransactionDetailsProvider>,
    mockStore(state),
  );
}

describe('TransactionDetailsAccountRow', () => {
  it('returns null when metamaskPay is absent', () => {
    const { container } = render(mockState, false);
    expect(container).toBeEmptyDOMElement();
  });

  describe('with metamaskPay data', () => {
    it('renders account name when available', () => {
      const { getByText } = render();
      expect(getByText(ACCOUNT_NAME)).toBeInTheDocument();
    });

    it('renders with correct test id', () => {
      const { getByTestId } = render();
      expect(
        getByTestId('transaction-details-account-row'),
      ).toBeInTheDocument();
    });

    it('renders Account label', () => {
      const { getByText } = render();
      expect(getByText(messages.account.message)).toBeInTheDocument();
    });
  });
});
