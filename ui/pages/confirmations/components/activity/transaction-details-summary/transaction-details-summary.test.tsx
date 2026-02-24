import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useTokenWithBalance } from '../../../hooks/tokens/useTokenWithBalance';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetailsSummary } from './transaction-details-summary';

const CHAIN_ID = '0x1';

const mockStore = configureMockStore([]);

jest.mock('../../../hooks/tokens/useTokenWithBalance');

const mockState = {
  metamask: {
    transactions: [],
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

function createMockTransactionMeta(
  type: TransactionType,
  metamaskPay?: { chainId: string; tokenAddress: string },
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
    metamaskPay,
  };
}

function render(
  type: TransactionType = TransactionType.simpleSend,
  metamaskPay?: { chainId: string; tokenAddress: string },
) {
  return renderWithProvider(
    <TransactionDetailsProvider
      transactionMeta={createMockTransactionMeta(type, metamaskPay) as never}
    >
      <TransactionDetailsSummary />
    </TransactionDetailsProvider>,
    mockStore(mockState),
  );
}

describe('TransactionDetailsSummary', () => {
  const useTokenWithBalanceMock = jest.mocked(useTokenWithBalance);

  beforeEach(() => {
    global.platform = { openTab: jest.fn() } as never;
    useTokenWithBalanceMock.mockReturnValue(undefined);
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

  it('uses metamaskPay chain for relayDeposit source token lookup', () => {
    useTokenWithBalanceMock.mockReturnValue({
      address: '0xabc123',
      chainId: '0x89',
      symbol: 'USDC',
      decimals: 6,
      balance: '1',
      balanceFiat: '$1.00',
      balanceRaw: '1000000',
      tokenFiatAmount: 1,
    });

    render(TransactionType.relayDeposit, {
      chainId: '0x89',
      tokenAddress: '0xabc123',
    });

    expect(useTokenWithBalanceMock).toHaveBeenCalledWith('0xabc123', '0x89');
  });

  it('renders approve title with token symbol for tokenMethodApprove', () => {
    useTokenWithBalanceMock.mockReturnValue({
      address: '0x456',
      chainId: CHAIN_ID,
      symbol: 'USDC',
      decimals: 6,
      balance: '1',
      balanceFiat: '$1.00',
      balanceRaw: '1000000',
      tokenFiatAmount: 1,
    });

    const { getByText } = render(TransactionType.tokenMethodApprove);
    expect(getByText('Approve USDC')).toBeInTheDocument();
  });

  it('renders approve fallback title when token symbol is not resolved', () => {
    const { getByText } = render(TransactionType.tokenMethodApprove);
    expect(getByText('Approve')).toBeInTheDocument();
  });

  it('uses txParams.to as token address for tokenMethodApprove lookup', () => {
    render(TransactionType.tokenMethodApprove);
    expect(useTokenWithBalanceMock).toHaveBeenCalledWith('0x456', CHAIN_ID);
  });
});
