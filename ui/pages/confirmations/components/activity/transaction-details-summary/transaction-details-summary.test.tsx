import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsSummary } from './transaction-details-summary';

const CHAIN_ID = '0x1';

const mockStore = configureMockStore([]);

function createMockState(transactions: Partial<TransactionMeta>[] = []) {
  return {
    metamask: {
      transactions,
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      allTokens: {},
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
  overrides: Partial<TransactionMeta> = {},
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
    ...overrides,
  };
}

function render(type: TransactionType = TransactionType.simpleSend) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={createMockTransactionMeta(type) as never}
    >
      <TransactionDetailsSummary />
    </TransactionDetailsProvider>,
    mockStore(createMockState()),
  );
}

describe('TransactionDetailsSummary', () => {
  beforeEach(() => {
    global.platform = { openTab: jest.fn() } as never;
  });

  it('renders with correct test id', () => {
    const { getByTestId } = render();
    expect(getByTestId('transaction-details-summary')).toBeInTheDocument();
  });

  it('renders summary label', () => {
    const { getByText } = render();
    expect(getByText('Summary')).toBeInTheDocument();
  });

  it('renders bridge title for bridge transactions', () => {
    const { getByText } = render(TransactionType.bridge);
    expect(getByText('Bridge')).toBeInTheDocument();
  });

  it('renders swap title for swap transactions', () => {
    const { getByText } = render(TransactionType.swap);
    expect(getByText('Swap')).toBeInTheDocument();
  });

  describe('mUSD conversion summary', () => {
    it('shows relay and receive lines, filtering out approval txs', () => {
      const approvalTx = createMockTransactionMeta(
        TransactionType.tokenMethodApprove,
        { id: 'approval-tx-id' },
      );

      const relayTx = createMockTransactionMeta(TransactionType.relayDeposit, {
        id: 'relay-tx-id',
        hash: '0xrelay',
      });

      const primaryTx = createMockTransactionMeta(
        TransactionType.musdConversion,
        {
          id: 'musd-tx-id',
          hash: '0xmusd',
          requiredTransactionIds: ['approval-tx-id', 'relay-tx-id'],
          metamaskPay: { tokenAddress: '0xtoken' },
        },
      );

      const state = createMockState([
        approvalTx,
        relayTx,
        primaryTx,
      ] as never[]);

      const { container } = renderWithProvider(
        <TransactionDetailsProvider transactionMeta={primaryTx as never}>
          <TransactionDetailsSummary />
        </TransactionDetailsProvider>,
        mockStore(state),
      );

      const summaryLines = container.querySelectorAll(
        '[data-testid="transaction-details-summary"] > div:last-child > div',
      );

      // Approval is filtered out; relay + receive (musdConversion) shown
      expect(summaryLines).toHaveLength(2);
    });

    it('shows relay and receive when there are no approval txs', () => {
      const relayTx = createMockTransactionMeta(TransactionType.relayDeposit, {
        id: 'relay-tx-id',
        hash: '0xrelay',
      });

      const primaryTx = createMockTransactionMeta(
        TransactionType.musdConversion,
        {
          id: 'musd-tx-id',
          hash: '0xmusd',
          requiredTransactionIds: ['relay-tx-id'],
          metamaskPay: { tokenAddress: '0xtoken' },
        },
      );

      const state = createMockState([relayTx, primaryTx] as never[]);

      const { container } = renderWithProvider(
        <TransactionDetailsProvider transactionMeta={primaryTx as never}>
          <TransactionDetailsSummary />
        </TransactionDetailsProvider>,
        mockStore(state),
      );

      const summaryLines = container.querySelectorAll(
        '[data-testid="transaction-details-summary"] > div:last-child > div',
      );

      // relay + receive
      expect(summaryLines).toHaveLength(2);
    });

    it('shows only the primary line when there are no required txs', () => {
      const primaryTx = createMockTransactionMeta(
        TransactionType.musdConversion,
        {
          id: 'musd-tx-id',
          hash: '0xmusd',
          metamaskPay: { tokenAddress: '0xtoken' },
        },
      );

      const state = createMockState([primaryTx] as never[]);

      const { container } = renderWithProvider(
        <TransactionDetailsProvider transactionMeta={primaryTx as never}>
          <TransactionDetailsSummary />
        </TransactionDetailsProvider>,
        mockStore(state),
      );

      const summaryLines = container.querySelectorAll(
        '[data-testid="transaction-details-summary"] > div:last-child > div',
      );

      // Only the primary musdConversion line
      expect(summaryLines).toHaveLength(1);
    });
  });
});
