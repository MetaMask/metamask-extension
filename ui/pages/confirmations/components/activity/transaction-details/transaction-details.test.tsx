import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetails } from './transaction-details';

const CHAIN_ID = '0x1';
const TOKEN_ADDRESS = '0xtoken123';

const mockStore = configureMockStore([]);

function createMockState(includeToken = false) {
  return {
    metamask: {
      transactions: [],
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      allTokens: includeToken
        ? {
            [CHAIN_ID]: {
              '0xaccount': [
                {
                  address: TOKEN_ADDRESS,
                  symbol: 'USDC',
                  decimals: 6,
                },
              ],
            },
          }
        : {},
      tokenBalances: {},
      tokensChainsCache: {},
      networkConfigurationsByChainId: {
        [CHAIN_ID]: {
          chainId: CHAIN_ID,
          name: 'Ethereum',
          nativeCurrency: 'ETH',
          blockExplorerUrls: ['https://etherscan.io'],
          defaultBlockExplorerUrlIndex: 0,
        },
      },
    },
  };
}

function createMockTransactionMeta(
  type: TransactionType,
  includeMetamaskPay = false,
) {
  return {
    id: 'test-id',
    chainId: CHAIN_ID,
    status: TransactionStatus.confirmed,
    time: Date.now(),
    type,
    txParams: {
      from: '0x123',
      to: '0x456',
    },
    ...(includeMetamaskPay && {
      metamaskPay: {
        chainId: CHAIN_ID,
        tokenAddress: TOKEN_ADDRESS,
        targetFiat: '100',
        networkFeeFiat: '5',
        bridgeFeeFiat: '2',
        totalFiat: '107',
      },
    }),
  };
}

function render(
  type: TransactionType = TransactionType.simpleSend,
  includeMetamaskPay = false,
) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={
        createMockTransactionMeta(type, includeMetamaskPay) as never
      }
    >
      <TransactionDetails />
    </TransactionDetailsProvider>,
    mockStore(createMockState(includeMetamaskPay)),
  );
}

describe('TransactionDetails', () => {
  beforeEach(() => {
    global.platform = { openTab: jest.fn() } as never;
  });

  it('renders with correct test id', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details')).toBeInTheDocument();
  });

  it('renders status row', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-status-row')).toBeInTheDocument();
  });

  it('renders date row', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-date-row')).toBeInTheDocument();
  });

  it('renders account row', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-account-row')).toBeInTheDocument();
  });

  it('renders network fee row', () => {
    const { getByTestId } = render();
    expect(
      getByTestId('transaction-details-network-fee-row'),
    ).toBeInTheDocument();
  });

  it('renders total row', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-total-row')).toBeInTheDocument();
  });

  it('renders summary section', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-summary')).toBeInTheDocument();
  });

  describe('without metamaskPay data', () => {
    it('does not render hero section', () => {
      const { queryByTestId } = render();
      expect(queryByTestId('transaction-details-hero')).not.toBeInTheDocument();
    });

    it('does not render paid with row', () => {
      const { queryByTestId } = render();
      expect(
        queryByTestId('transaction-details-paid-with-row'),
      ).not.toBeInTheDocument();
    });

    it('does not render bridge fee row', () => {
      const { queryByTestId } = render();
      expect(
        queryByTestId('transaction-details-bridge-fee-row'),
      ).not.toBeInTheDocument();
    });
  });

  describe('with metamaskPay data', () => {
    it('renders hero section when metamaskPay targetFiat is present', () => {
      const { getByTestId } = render(TransactionType.perpsDeposit, true);
      expect(getByTestId('transaction-details-hero')).toBeInTheDocument();
    });

    it('renders bridge fee row when metamaskPay bridgeFeeFiat is present', () => {
      const { getByTestId } = render(TransactionType.perpsDeposit, true);
      expect(
        getByTestId('transaction-details-bridge-fee-row'),
      ).toBeInTheDocument();
    });
  });
});
