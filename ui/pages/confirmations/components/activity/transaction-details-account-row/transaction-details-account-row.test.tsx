import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsAccountRow } from './transaction-details-account-row';

const FROM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const UNKNOWN_FROM_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const INTERNAL_ACCOUNT_NAME = 'Test Account';
const ACCOUNT_GROUP_NAME = 'Account 1';
const SELECTED_ACCOUNT_GROUP_NAME = 'Account 2';
const WALLET_ID = 'entropy:wallet';
const ACCOUNT_GROUP_ID = `${WALLET_ID}/0`;
const SELECTED_ACCOUNT_GROUP_ID = `${WALLET_ID}/1`;

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

function createAccountGroup(id: string, name: string, accounts: string[]) {
  return {
    id,
    type: 'multichain-account',
    accounts,
    metadata: {
      name,
      pinned: false,
      hidden: false,
      lastSelected: 0,
    },
  };
}

function createMockState({
  accounts = {
    'account-1': {
      id: 'account-1',
      address: FROM_ADDRESS,
      metadata: { name: INTERNAL_ACCOUNT_NAME },
    },
  },
  selectedAccount = 'account-1',
  selectedAccountGroup = ACCOUNT_GROUP_ID,
  groups = {
    [ACCOUNT_GROUP_ID]: createAccountGroup(
      ACCOUNT_GROUP_ID,
      ACCOUNT_GROUP_NAME,
      ['account-1'],
    ),
  },
}: {
  accounts?: Record<string, unknown>;
  selectedAccount?: string;
  selectedAccountGroup?: string;
  groups?: Record<string, unknown>;
} = {}) {
  return {
    metamask: {
      internalAccounts: {
        accounts,
        selectedAccount,
      },
      selectedAccountGroup,
      accountTree: {
        wallets: {
          [WALLET_ID]: {
            id: WALLET_ID,
            type: 'entropy',
            groups,
            metadata: { name: 'Wallet 1' },
          },
        },
      },
    },
  };
}

const mockState = createMockState();

function render(
  state: Record<string, unknown> = mockState,
  includeMetamaskPay = true,
  transactionMeta = createMockTransactionMeta(includeMetamaskPay),
) {
  return renderWithProvider(
    <TransactionDetailsProvider transactionMeta={transactionMeta as never}>
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
    it('renders account group name when available', () => {
      const { getByText } = render();
      expect(getByText(ACCOUNT_GROUP_NAME)).toBeInTheDocument();
    });

    it('renders selected account group name when the transaction account name is unavailable', () => {
      const state = createMockState({
        accounts: {
          'selected-account': {
            id: 'selected-account',
            address: UNKNOWN_FROM_ADDRESS,
            metadata: { name: INTERNAL_ACCOUNT_NAME },
          },
        },
        selectedAccount: 'selected-account',
        selectedAccountGroup: SELECTED_ACCOUNT_GROUP_ID,
        groups: {
          [SELECTED_ACCOUNT_GROUP_ID]: createAccountGroup(
            SELECTED_ACCOUNT_GROUP_ID,
            SELECTED_ACCOUNT_GROUP_NAME,
            ['selected-account'],
          ),
        },
      });
      const transactionMeta = {
        ...createMockTransactionMeta(true),
        txParams: {
          from: FROM_ADDRESS,
          to: '0x456',
        },
      };

      const { getByText, queryByText } = render(state, true, transactionMeta);

      expect(getByText(SELECTED_ACCOUNT_GROUP_NAME)).toBeInTheDocument();
      expect(queryByText(FROM_ADDRESS)).not.toBeInTheDocument();
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

    it('renders selected account group name when the account address is missing', () => {
      const transactionMeta = {
        ...createMockTransactionMeta(true),
        txParams: {
          from: '',
          to: '0x456',
        },
      };

      const { getByText } = render(mockState, true, transactionMeta);

      expect(getByText(ACCOUNT_GROUP_NAME)).toBeInTheDocument();
    });

    it('renders first account group name when the selected account group is unavailable', () => {
      const state = createMockState({
        selectedAccount: '',
        selectedAccountGroup: '',
      });
      const transactionMeta = {
        ...createMockTransactionMeta(true),
        txParams: {
          from: '',
          to: '0x456',
        },
      };

      const { getByText } = render(state, true, transactionMeta);

      expect(getByText(ACCOUNT_GROUP_NAME)).toBeInTheDocument();
    });

    it('does not render when an account name cannot be resolved', () => {
      const state = createMockState({
        accounts: {},
        selectedAccount: '',
        selectedAccountGroup: '',
        groups: {},
      });
      const transactionMeta = {
        ...createMockTransactionMeta(true),
        txParams: {
          from: '',
          to: '0x456',
        },
      };

      const { queryByTestId } = render(state, true, transactionMeta);

      expect(
        queryByTestId('transaction-details-account-row'),
      ).not.toBeInTheDocument();
    });
  });
});
