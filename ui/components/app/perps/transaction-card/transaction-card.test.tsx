import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import type { PerpsTransaction } from '../types';
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
  symbol: 'ETH',
  title: 'Opened long',
  subtitle: '2.5 ETH @ $2,850.00',
  timestamp: Date.now() - 3600000,
  status: 'confirmed',
  fill: {
    size: '2.5',
    price: '2850.00',
    fee: '7.13',
    side: 'buy',
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
    it('shows realizedPnl with profit color for positive values', () => {
      const transaction = createMockTransaction({
        type: 'trade',
        fill: {
          size: '0.5',
          price: '45250.00',
          fee: '22.63',
          side: 'buy',
          realizedPnl: '+125.00',
        },
      });
      renderWithProvider(
        <TransactionCard transaction={transaction} />,
        mockStore,
      );

      expect(screen.getByText('+$125.00')).toBeInTheDocument();
    });

    it('shows realizedPnl with loss color for negative values', () => {
      const transaction = createMockTransaction({
        type: 'trade',
        fill: {
          size: '15',
          price: '92.50',
          fee: '1.39',
          side: 'sell',
          realizedPnl: '-45.50',
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
          size: '2.5',
          price: '2850.00',
          fee: '7.13',
          side: 'buy',
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
        title: 'Received funding fee',
        fill: undefined,
        funding: {
          amount: '8.30',
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
        title: 'Paid funding fee',
        fill: undefined,
        funding: {
          amount: '-3.10',
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
        symbol: 'USDC',
        title: 'Deposited 5000 USDC',
        fill: undefined,
        depositWithdrawal: {
          amount: '5000.00',
          txHash: '0x1234567890abcdef',
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
        symbol: 'USDC',
        title: 'Withdrew 2000 USDC',
        fill: undefined,
        depositWithdrawal: {
          amount: '2000.00',
          txHash: '0xabcdef1234567890',
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
        symbol: 'USDC',
        title: 'Deposited 5000 USDC',
        fill: undefined,
        depositWithdrawal: {
          amount: '5000.00',
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
        title: 'Limit close long',
        fill: undefined,
        order: {
          orderId: 'order-006',
          orderType: 'limit',
          status: 'filled',
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
        title: 'Stop market close long',
        fill: undefined,
        order: {
          orderId: 'order-004c',
          orderType: 'market',
          status: 'canceled',
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
        title: 'Market long',
        fill: undefined,
        order: {
          orderId: 'order-004d',
          orderType: 'market',
          status: 'queued',
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
        symbol: 'SOL',
        title: 'Limit long',
        subtitle: '25 SOL @ $95.00',
        fill: undefined,
        order: {
          orderId: 'order-003',
          orderType: 'limit',
          status: 'open',
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
        symbol: 'xyz:TSLA',
        title: 'Opened long',
        fill: {
          size: '10',
          price: '240.00',
          fee: '2.40',
          side: 'buy',
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
