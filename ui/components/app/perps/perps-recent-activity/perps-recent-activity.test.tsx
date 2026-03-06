import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PERPS_ACTIVITY_ROUTE } from '../../../../helpers/constants/routes';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import {
  FillType,
  PerpsOrderTransactionStatus,
  PerpsOrderTransactionStatusType,
  type PerpsTransaction,
} from '../types';
import { PerpsRecentActivity } from './perps-recent-activity';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockTransactions: PerpsTransaction[] = [
  {
    id: 'tx-001',
    type: 'trade',
    category: 'position_open',
    symbol: 'ETH',
    title: 'Opened long',
    subtitle: '2.5 ETH @ $2,850.00',
    timestamp: Date.now() - 1000,
    fill: {
      shortTitle: 'Opened long',
      amount: '-$7.13',
      amountNumber: -7.13,
      isPositive: false,
      size: '2.5',
      entryPrice: '$2,850.00',
      points: '0',
      pnl: '0',
      fee: '7.13',
      action: 'Opened',
      feeToken: 'USDC',
      fillType: FillType.Standard,
    },
  },
  {
    id: 'tx-002',
    type: 'trade',
    category: 'position_close',
    symbol: 'BTC',
    title: 'Closed short',
    subtitle: '0.5 BTC @ $45,250.00',
    timestamp: Date.now() - 2000,
    fill: {
      shortTitle: 'Closed short',
      amount: '+$125.00',
      amountNumber: 125,
      isPositive: true,
      size: '0.5',
      entryPrice: '$45,250.00',
      points: '0',
      pnl: '+$125.00',
      fee: '22.63',
      action: 'Closed',
      feeToken: 'USDC',
      fillType: FillType.Standard,
    },
  },
  {
    id: 'tx-003',
    type: 'funding',
    category: 'funding_fee',
    symbol: 'ETH',
    title: 'Received funding fee',
    subtitle: 'ETH',
    timestamp: Date.now() - 3000,
    fundingAmount: {
      isPositive: true,
      fee: '+$8.30',
      feeNumber: 8.3,
      rate: '0.01%',
    },
  },
  {
    id: 'tx-004',
    type: 'order',
    category: 'limit_order',
    symbol: 'SOL',
    title: 'Limit long',
    subtitle: '25 SOL @ $95.00',
    timestamp: Date.now() - 4000,
    order: {
      text: PerpsOrderTransactionStatus.Open,
      statusType: PerpsOrderTransactionStatusType.Pending,
      type: 'limit',
      size: '$2,375.00',
      limitPrice: '$95.00',
      filled: '0%',
    },
  },
  {
    id: 'tx-005',
    type: 'deposit',
    category: 'deposit',
    symbol: 'USDC',
    title: 'Deposited 5000 USDC',
    subtitle: 'Completed',
    timestamp: Date.now() - 5000,
    depositWithdrawal: {
      amount: '+$5,000.00',
      amountNumber: 5000,
      isPositive: true,
      asset: 'USDC',
      txHash: '0x123...',
      status: 'completed',
      type: 'deposit',
    },
  },
  {
    id: 'tx-006',
    type: 'trade',
    category: 'position_open',
    symbol: 'ARB',
    title: 'Opened long',
    subtitle: '1000 ARB @ $1.20',
    timestamp: Date.now() - 6000,
    fill: {
      shortTitle: 'Opened long',
      amount: '-$1.20',
      amountNumber: -1.2,
      isPositive: false,
      size: '1000',
      entryPrice: '$1.20',
      points: '0',
      pnl: '0',
      fee: '1.20',
      action: 'Opened',
      feeToken: 'USDC',
      fillType: FillType.Standard,
    },
  },
];

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsRecentActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct data-testid', () => {
    renderWithProvider(
      <PerpsRecentActivity transactions={mockTransactions} />,
      mockStore,
    );

    expect(screen.getByTestId('perps-recent-activity')).toBeInTheDocument();
  });

  it('shows "Recent Activity" header', () => {
    renderWithProvider(
      <PerpsRecentActivity transactions={mockTransactions} />,
      mockStore,
    );

    expect(
      screen.getByText(messages.perpsRecentActivity.message),
    ).toBeInTheDocument();
  });

  it('shows "See All" button', () => {
    renderWithProvider(
      <PerpsRecentActivity transactions={mockTransactions} />,
      mockStore,
    );

    expect(screen.getByText(messages.perpsSeeAll.message)).toBeInTheDocument();
  });

  it('limits displayed transactions to maxTransactions', () => {
    renderWithProvider(
      <PerpsRecentActivity
        transactions={mockTransactions}
        maxTransactions={3}
      />,
      mockStore,
    );

    // Should show only 3 transactions (tx-001, tx-002, tx-003 based on timestamp)
    expect(screen.getByTestId('transaction-card-tx-001')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-card-tx-002')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-card-tx-003')).toBeInTheDocument();
    expect(
      screen.queryByTestId('transaction-card-tx-004'),
    ).not.toBeInTheDocument();
  });

  it('defaults to showing 5 transactions when maxTransactions is not provided', () => {
    renderWithProvider(
      <PerpsRecentActivity transactions={mockTransactions} />,
      mockStore,
    );

    // Should show 5 transactions by default
    expect(screen.getByTestId('transaction-card-tx-001')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-card-tx-002')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-card-tx-003')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-card-tx-004')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-card-tx-005')).toBeInTheDocument();
    // 6th transaction should not be shown
    expect(
      screen.queryByTestId('transaction-card-tx-006'),
    ).not.toBeInTheDocument();
  });

  it('sorts transactions by timestamp with newest first', () => {
    renderWithProvider(
      <PerpsRecentActivity
        transactions={mockTransactions}
        maxTransactions={3}
      />,
      mockStore,
    );

    const cards = screen.getAllByTestId(/^transaction-card-/u);

    // First card should be tx-001 (most recent timestamp)
    expect(cards[0]).toHaveAttribute('data-testid', 'transaction-card-tx-001');
    // Second card should be tx-002
    expect(cards[1]).toHaveAttribute('data-testid', 'transaction-card-tx-002');
    // Third card should be tx-003
    expect(cards[2]).toHaveAttribute('data-testid', 'transaction-card-tx-003');
  });

  it('"See All" navigates to PERPS_ACTIVITY_ROUTE', () => {
    renderWithProvider(
      <PerpsRecentActivity transactions={mockTransactions} />,
      mockStore,
    );

    const seeAllButton = screen.getByText(messages.perpsSeeAll.message);
    fireEvent.click(seeAllButton);

    expect(mockNavigate).toHaveBeenCalledWith(PERPS_ACTIVITY_ROUTE);
  });

  it('calls onTransactionClick when a transaction is clicked', () => {
    const handleClick = jest.fn();
    renderWithProvider(
      <PerpsRecentActivity
        transactions={mockTransactions}
        onTransactionClick={handleClick}
      />,
      mockStore,
    );

    const firstCard = screen.getByTestId('transaction-card-tx-001');
    fireEvent.click(firstCard);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tx-001' }),
    );
  });

  it('renders transaction cards without onClick when onTransactionClick is not provided', () => {
    renderWithProvider(
      <PerpsRecentActivity transactions={mockTransactions} />,
      mockStore,
    );

    const card = screen.getByTestId('transaction-card-tx-001');
    // Without onClick, the card should not have cursor-pointer class
    expect(card).not.toHaveClass('cursor-pointer');
  });
});

describe('PerpsRecentActivity - Empty State', () => {
  it('shows empty state when no transactions', () => {
    renderWithProvider(<PerpsRecentActivity transactions={[]} />, mockStore);

    expect(
      screen.getByTestId('perps-recent-activity-empty'),
    ).toBeInTheDocument();
  });
});
