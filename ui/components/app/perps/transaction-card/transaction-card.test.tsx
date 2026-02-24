import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import type { PerpsTransaction } from '../types';
import {
  FillType,
  PerpsOrderTransactionStatus,
  PerpsOrderTransactionStatusType,
} from '../types/transactionHistory';
import { TransactionCard } from './transaction-card';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const createMockTransaction = (
  overrides: Partial<PerpsTransaction> = {},
): PerpsTransaction => ({
  id: 'tx-test-001',
  type: 'trade',
  category: 'position_open',
  symbol: 'ETH',
  title: 'Opened long',
  subtitle: '2.5 ETH @ $2,850.00',
  timestamp: Date.now() - 3600000,
  fill: {
    shortTitle: 'Opened long',
    amount: '+$7,125.00',
    amountNumber: 7125,
    isPositive: true,
    size: '2.5',
    entryPrice: '2850.00',
    points: '0',
    pnl: '0',
    fee: '7.13',
    action: 'Opened',
    feeToken: 'USDC',
    fillType: FillType.Standard,
  },
  ...overrides,
});

describe('TransactionCard', () => {
  it('renders with correct data-testid', () => {
    const transaction = createMockTransaction({ id: 'tx-001' });
    renderWithProvider(
      <TransactionCard transaction={transaction} />,
      mockStore,
    );

    expect(screen.getByTestId('transaction-card-tx-001')).toBeInTheDocument();
  });

  it('displays the transaction title', () => {
    const transaction = createMockTransaction({ title: 'Opened long' });
    renderWithProvider(
      <TransactionCard transaction={transaction} />,
      mockStore,
    );

    expect(screen.getByText('Opened long')).toBeInTheDocument();
  });

  it('displays the token logo', () => {
    const transaction = createMockTransaction({ symbol: 'ETH' });
    renderWithProvider(
      <TransactionCard transaction={transaction} />,
      mockStore,
    );

    expect(screen.getByTestId('perps-token-logo-ETH')).toBeInTheDocument();
  });

  describe('Trade transactions', () => {
    it('shows pnl with profit color for positive values', () => {
      const transaction = createMockTransaction({
        type: 'trade',
        category: 'position_close',
        fill: {
          shortTitle: 'Closed short',
          amount: '+$125.00',
          amountNumber: 125,
          isPositive: true,
          size: '0.5',
          entryPrice: '45250.00',
          points: '0',
          pnl: '+125.00',
          fee: '22.63',
          action: 'Closed',
          feeToken: 'USDC',
          fillType: FillType.Standard,
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('+$125.00')).toBeInTheDocument();
    });

    it('shows pnl with loss color for negative values', () => {
      const transaction = createMockTransaction({
        type: 'trade',
        category: 'position_close',
        fill: {
          shortTitle: 'Closed long',
          amount: '-$45.50',
          amountNumber: -45.5,
          isPositive: false,
          size: '15',
          entryPrice: '92.50',
          points: '0',
          pnl: '-45.50',
          fee: '1.39',
          action: 'Closed',
          feeToken: 'USDC',
          fillType: FillType.Standard,
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('-$45.50')).toBeInTheDocument();
    });

    it('displays size and symbol in subtitle for trades', () => {
      const transaction = createMockTransaction({
        type: 'trade',
        symbol: 'ETH',
        fill: {
          shortTitle: 'Opened long',
          amount: '+$7,125.00',
          amountNumber: 7125,
          isPositive: true,
          size: '2.5',
          entryPrice: '2850.00',
          points: '0',
          pnl: '0',
          fee: '7.13',
          action: 'Opened',
          feeToken: 'USDC',
          fillType: FillType.Standard,
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('2.5 ETH')).toBeInTheDocument();
    });
  });

  describe('Funding transactions', () => {
    it('shows amount with positive sign and success color', () => {
      const transaction = createMockTransaction({
        type: 'funding',
        category: 'funding_fee',
        title: 'Received funding fee',
        fill: undefined,
        fundingAmount: {
          isPositive: true,
          fee: '+8.30',
          feeNumber: 8.3,
          rate: '0.0001',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('+$8.30')).toBeInTheDocument();
    });

    it('shows amount with negative sign and error color', () => {
      const transaction = createMockTransaction({
        type: 'funding',
        category: 'funding_fee',
        title: 'Paid funding fee',
        fill: undefined,
        fundingAmount: {
          isPositive: false,
          fee: '-3.10',
          feeNumber: -3.1,
          rate: '-0.00005',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('-$3.10')).toBeInTheDocument();
    });
  });

  describe('Deposit/withdrawal transactions', () => {
    it('shows deposit amount with positive sign', () => {
      const transaction = createMockTransaction({
        id: 'tx-deposit',
        type: 'deposit',
        category: 'deposit',
        symbol: 'USDC',
        title: 'Deposited 5000 USDC',
        fill: undefined,
        depositWithdrawal: {
          amount: '5000.00',
          amountNumber: 5000,
          isPositive: true,
          asset: 'USDC',
          txHash: '0x1234567890abcdef',
          status: 'completed',
          type: 'deposit',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('+$5000.00')).toBeInTheDocument();
    });

    it('shows withdrawal amount with negative sign', () => {
      const transaction = createMockTransaction({
        id: 'tx-withdrawal',
        type: 'withdrawal',
        category: 'withdrawal',
        symbol: 'USDC',
        title: 'Withdrew 2000 USDC',
        fill: undefined,
        depositWithdrawal: {
          amount: '2000.00',
          amountNumber: 2000,
          isPositive: false,
          asset: 'USDC',
          txHash: '0xabcdef1234567890',
          status: 'completed',
          type: 'withdrawal',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('-$2000.00')).toBeInTheDocument();
    });

    it('shows "Completed" status for deposits', () => {
      const transaction = createMockTransaction({
        type: 'deposit',
        category: 'deposit',
        symbol: 'USDC',
        title: 'Deposited 5000 USDC',
        fill: undefined,
        depositWithdrawal: {
          amount: '5000.00',
          amountNumber: 5000,
          isPositive: true,
          asset: 'USDC',
          txHash: '0x1234567890abcdef',
          status: 'completed',
          type: 'deposit',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Order transactions', () => {
    it('shows "Filled" status text for filled orders', () => {
      const transaction = createMockTransaction({
        type: 'order',
        category: 'limit_order',
        title: 'Limit close long',
        fill: undefined,
        order: {
          text: PerpsOrderTransactionStatus.Filled,
          statusType: PerpsOrderTransactionStatusType.Filled,
          type: 'limit',
          size: '$3,000.00',
          limitPrice: '3000.00',
          filled: '100%',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('Filled')).toBeInTheDocument();
    });

    it('shows "Canceled" status text for canceled orders', () => {
      const transaction = createMockTransaction({
        type: 'order',
        category: 'limit_order',
        title: 'Stop market close long',
        fill: undefined,
        order: {
          text: PerpsOrderTransactionStatus.Canceled,
          statusType: PerpsOrderTransactionStatusType.Canceled,
          type: 'market',
          size: '$550.00',
          limitPrice: '1.10',
          filled: '0%',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('Canceled')).toBeInTheDocument();
    });

    it('shows "Queued" status text for queued orders', () => {
      const transaction = createMockTransaction({
        type: 'order',
        category: 'limit_order',
        title: 'Market long',
        fill: undefined,
        order: {
          text: PerpsOrderTransactionStatus.Queued,
          statusType: PerpsOrderTransactionStatusType.Pending,
          type: 'market',
          size: '$4,350.00',
          limitPrice: '2900.00',
          filled: '0%',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('Queued')).toBeInTheDocument();
    });

    it('extracts size and symbol from subtitle for orders', () => {
      const transaction = createMockTransaction({
        type: 'order',
        category: 'limit_order',
        symbol: 'SOL',
        title: 'Limit long',
        subtitle: '25 SOL @ $95.00',
        fill: undefined,
        order: {
          text: PerpsOrderTransactionStatus.Open,
          statusType: PerpsOrderTransactionStatusType.Pending,
          type: 'limit',
          size: '$2,375.00',
          limitPrice: '95.00',
          filled: '0%',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      // Should show "25 SOL" without the price part
      expect(screen.getByText('25 SOL')).toBeInTheDocument();
    });
  });

  describe('Variant styling', () => {
    it('applies default styling by default', () => {
      const transaction = createMockTransaction();
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      const card = screen.getByTestId(`transaction-card-${transaction.id}`);
      expect(card).toHaveClass('bg-default');
    });

    it('applies muted styling when variant is muted', () => {
      const transaction = createMockTransaction();
      renderWithProvider(
        <TransactionCard transaction={transaction} variant="muted" />,
        mockStore,
      );

      const card = screen.getByTestId(`transaction-card-${transaction.id}`);
      expect(card).toHaveClass('bg-muted');
    });
  });

  describe('Click behavior', () => {
    it('is clickable when onClick is provided', () => {
      const handleClick = jest.fn();
      const transaction = createMockTransaction();
      renderWithProvider(
        <TransactionCard transaction={transaction} onClick={handleClick} />,
        mockStore,
      );

      const card = screen.getByTestId(`transaction-card-${transaction.id}`);
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(transaction);
    });

    it('has cursor-pointer class when onClick is provided', () => {
      const handleClick = jest.fn();
      const transaction = createMockTransaction();
      renderWithProvider(
        <TransactionCard transaction={transaction} onClick={handleClick} />,
        mockStore,
      );

      const card = screen.getByTestId(`transaction-card-${transaction.id}`);
      expect(card).toHaveClass('cursor-pointer');
    });

    it('does not have cursor-pointer class when onClick is not provided', () => {
      const transaction = createMockTransaction();
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      const card = screen.getByTestId(`transaction-card-${transaction.id}`);
      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  describe('HIP-3 assets', () => {
    it('displays correct symbol for HIP-3 assets', () => {
      const transaction = createMockTransaction({
        type: 'trade',
        category: 'position_open',
        symbol: 'xyz:TSLA',
        title: 'Opened long',
        fill: {
          shortTitle: 'Opened long',
          amount: '+$2,400.00',
          amountNumber: 2400,
          isPositive: true,
          size: '10',
          entryPrice: '240.00',
          points: '0',
          pnl: '0',
          fee: '2.40',
          action: 'Opened',
          feeToken: 'USDC',
          fillType: FillType.Standard,
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      // Should display "TSLA" not "xyz:TSLA" in subtitle
      expect(screen.getByText('10 TSLA')).toBeInTheDocument();
    });
  });
});
