import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { OrderBookData } from '@metamask/perps-controller';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream/usePerpsLiveOrderBook';
import { ExpandableOrderBook } from './order-book';
import { OrderBookTable } from './order-book-table';

jest.mock('../../../../hooks/perps/stream/usePerpsLiveOrderBook');
jest.useFakeTimers();

const mockUsePerpsLiveOrderBook = jest.mocked(usePerpsLiveOrderBook);

const sampleOrderBook: OrderBookData = {
  bids: [
    {
      price: '104500.00',
      size: '1.5',
      total: '1.5',
      notional: '156750',
      totalNotional: '156750',
    },
    {
      price: '104490.00',
      size: '2.0',
      total: '3.5',
      notional: '208980',
      totalNotional: '365730',
    },
    {
      price: '104480.00',
      size: '0.8',
      total: '4.3',
      notional: '83584',
      totalNotional: '449314',
    },
  ],
  asks: [
    {
      price: '104510.00',
      size: '1.2',
      total: '1.2',
      notional: '125412',
      totalNotional: '125412',
    },
    {
      price: '104520.00',
      size: '1.8',
      total: '3.0',
      notional: '188136',
      totalNotional: '313548',
    },
    {
      price: '104530.00',
      size: '2.5',
      total: '5.5',
      notional: '261325',
      totalNotional: '574873',
    },
  ],
  spread: '10.00',
  spreadPercentage: '0.010',
  midPrice: '104505.00',
  lastUpdated: Date.now(),
  maxTotal: '5.5',
};

describe('OrderBookTable', () => {
  it('renders loading state when isLoading is true', () => {
    render(<OrderBookTable orderBook={null} symbol="BTC" isLoading />);

    expect(screen.getByText('Loading order book...')).toBeInTheDocument();
  });

  it('renders unavailable state when orderBook is null', () => {
    render(<OrderBookTable orderBook={null} symbol="BTC" />);

    expect(screen.getByText('Order book unavailable')).toBeInTheDocument();
  });

  it('renders bid and ask rows with correct test IDs', () => {
    render(<OrderBookTable orderBook={sampleOrderBook} symbol="BTC" />);

    expect(screen.getByTestId('perps-order-book-table')).toBeInTheDocument();
    expect(screen.getByTestId('perps-order-book-bid-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('perps-order-book-bid-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('perps-order-book-bid-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('perps-order-book-ask-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('perps-order-book-ask-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('perps-order-book-ask-row-2')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<OrderBookTable orderBook={sampleOrderBook} symbol="BTC" />);

    const totalHeaders = screen.getAllByText('Total (USD)');
    expect(totalHeaders).toHaveLength(2);
    expect(screen.getByText('Bid')).toBeInTheDocument();
    expect(screen.getByText('Ask')).toBeInTheDocument();
  });
});

describe('ExpandableOrderBook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsLiveOrderBook.mockReturnValue({
      orderBook: sampleOrderBook,
      isInitialLoading: false,
    });
  });

  it('renders collapsed by default with toggle icon button', () => {
    render(<ExpandableOrderBook symbol="BTC" />);

    const toggle = screen.getByTestId('perps-order-book-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByTestId('perps-order-book-table'),
    ).not.toBeInTheDocument();
  });

  it('does not show a label or spread preview when collapsed', () => {
    render(<ExpandableOrderBook symbol="BTC" />);

    expect(screen.queryByText('Order Book')).not.toBeInTheDocument();
    expect(screen.queryByText('Spread:')).not.toBeInTheDocument();
  });

  it('expands when toggle is clicked', () => {
    render(<ExpandableOrderBook symbol="BTC" />);

    fireEvent.click(screen.getByTestId('perps-order-book-toggle'));

    expect(screen.getByTestId('perps-order-book-table')).toBeInTheDocument();
  });

  it('collapses when toggle is clicked again', () => {
    render(<ExpandableOrderBook symbol="BTC" />);

    fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
    expect(screen.getByTestId('perps-order-book-table')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
    expect(
      screen.queryByTestId('perps-order-book-table'),
    ).not.toBeInTheDocument();
  });

  it('shows spread footer when expanded', () => {
    render(<ExpandableOrderBook symbol="BTC" />);

    fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
    expect(screen.getByText('Spread:')).toBeInTheDocument();
  });

  it('calls usePerpsLiveOrderBook with manageStream false when expanded', () => {
    render(<ExpandableOrderBook symbol="BTC" />);

    fireEvent.click(screen.getByTestId('perps-order-book-toggle'));

    expect(mockUsePerpsLiveOrderBook).toHaveBeenCalledWith(
      expect.objectContaining({
        symbol: 'BTC',
        levels: 20,
        manageStream: false,
      }),
    );
  });

  it('renders loading state when data is not ready', () => {
    mockUsePerpsLiveOrderBook.mockReturnValue({
      orderBook: null,
      isInitialLoading: true,
    });

    render(<ExpandableOrderBook symbol="BTC" />);

    fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
    expect(screen.getByText('Loading order book...')).toBeInTheDocument();
  });

  it('transitions to unavailable after timeout when data never arrives', () => {
    mockUsePerpsLiveOrderBook.mockReturnValue({
      orderBook: null,
      isInitialLoading: true,
    });

    render(<ExpandableOrderBook symbol="BTC" />);

    fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
    expect(screen.getByText('Loading order book...')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.getByText('Order book unavailable')).toBeInTheDocument();
  });
});
