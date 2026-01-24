import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsPaidWithRow } from './transaction-details-paid-with-row';

const CHAIN_ID = '0x1';
const TOKEN_ADDRESS = '0xabc123';
const TOKEN_SYMBOL = 'USDC';

const mockStore = configureMockStore([]);

const mockState = {
  metamask: {
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
    allTokens: {
      [CHAIN_ID]: {
        '0x123': [
          {
            address: TOKEN_ADDRESS,
            symbol: TOKEN_SYMBOL,
            decimals: 6,
          },
        ],
      },
    },
    tokenBalances: {},
    tokensChainsCache: {},
    networkConfigurationsByChainId: {
      [CHAIN_ID]: {
        chainId: CHAIN_ID,
        name: 'Ethereum',
        nativeCurrency: 'ETH',
      },
    },
  },
};

function createMockTransactionMeta(chainId?: string, tokenAddress?: string) {
  return {
    id: 'test-id',
    chainId: CHAIN_ID,
    status: TransactionStatus.confirmed,
    time: Date.now(),
    txParams: {
      from: '0x123',
      to: '0x456',
    },
    metamaskPay:
      chainId && tokenAddress ? { chainId, tokenAddress } : undefined,
  };
}

function render(chainId?: string, tokenAddress?: string) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={
        createMockTransactionMeta(chainId, tokenAddress) as never
      }
    >
      <TransactionDetailsPaidWithRow />
    </TransactionDetailsProvider>,
    mockStore(mockState),
  );
}

describe('TransactionDetailsPaidWithRow', () => {
  it('returns null when metamaskPay is not provided', () => {
    const { container } = render();
    expect(container.firstChild).toBeNull();
  });

  it('returns null when token is not found', () => {
    const { container } = render(CHAIN_ID, '0xunknown');
    expect(container.firstChild).toBeNull();
  });

  it('renders with correct test id when token is found', () => {
    const { getByTestId } = render(CHAIN_ID, TOKEN_ADDRESS);
    expect(
      getByTestId('transaction-details-paid-with-row'),
    ).toBeInTheDocument();
  });

  it('renders token symbol', () => {
    const { getByText } = render(CHAIN_ID, TOKEN_ADDRESS);
    expect(getByText(TOKEN_SYMBOL)).toBeInTheDocument();
  });
});
