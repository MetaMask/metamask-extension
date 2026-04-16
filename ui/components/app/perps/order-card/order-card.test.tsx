import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import type { Order } from '../types';
import { OrderCard } from './order-card';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  orderId: 'test-order-001',
  symbol: 'ETH',
  side: 'buy',
  orderType: 'limit',
  size: '1.0',
  originalSize: '1.0',
  price: '3000.00',
  filledSize: '0',
  remainingSize: '1.0',
  status: 'open',
  timestamp: Date.now(),
  ...overrides,
});

describe('OrderCard', () => {
  it('renders the order card with correct data-testid', () => {
    const order = createMockOrder({ orderId: 'order-123' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByTestId('order-card-order-123')).toBeInTheDocument();
  });

  it('displays the correct symbol name', () => {
    const order = createMockOrder({ symbol: 'BTC' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('displays HIP-3 symbol without prefix', () => {
    const order = createMockOrder({ symbol: 'xyz:TSLA' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('TSLA')).toBeInTheDocument();
  });

  it('displays Long for buy side order', () => {
    const order = createMockOrder({ side: 'buy' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Long')).toBeInTheDocument();
  });

  it('displays Short for sell side order', () => {
    const order = createMockOrder({ side: 'sell' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Short')).toBeInTheDocument();
  });

  it('displays the order type', () => {
    const order = createMockOrder({ orderType: 'limit' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Limit')).toBeInTheDocument();
  });

  it('displays the order size with symbol', () => {
    const order = createMockOrder({ symbol: 'ETH', size: '2.5' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('2.5 ETH')).toBeInTheDocument();
  });

  it('displays formatted USD value for limit orders', () => {
    const order = createMockOrder({
      orderType: 'limit',
      size: '1.0',
      price: '3500.00',
    });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    // formatCurrencyWithMinThreshold formats with commas
    expect(screen.getByText('$3,500.00')).toBeInTheDocument();
  });

  it('displays Market label when order value is zero', () => {
    const order = createMockOrder({
      orderType: 'market',
      price: '0',
      size: '1.0',
    });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    // "Market" appears in both the value slot and the order type slot
    const marketElements = screen.getAllByText('Market');
    expect(marketElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the token logo', () => {
    const order = createMockOrder({ symbol: 'SOL' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByTestId('perps-token-logo-SOL')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const order = createMockOrder();
    const onClick = jest.fn();
    renderWithProvider(
      <OrderCard order={order} onClick={onClick} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('order-card-test-order-001'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(order);
  });
});
