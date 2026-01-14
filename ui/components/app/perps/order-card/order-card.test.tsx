import React from 'react';
import { screen } from '@testing-library/react';
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

  it('displays buy side order correctly', () => {
    const order = createMockOrder({ side: 'buy', orderType: 'limit' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Limit buy')).toBeInTheDocument();
  });

  it('displays sell side order correctly', () => {
    const order = createMockOrder({ side: 'sell', orderType: 'limit' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Limit sell')).toBeInTheDocument();
  });

  it('displays market order type correctly', () => {
    const order = createMockOrder({ orderType: 'market', side: 'buy' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Market buy')).toBeInTheDocument();
  });

  it('displays the order size', () => {
    const order = createMockOrder({ symbol: 'ETH', size: '2.5' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('2.5 ETH')).toBeInTheDocument();
  });

  it('displays limit price for limit orders', () => {
    const order = createMockOrder({
      orderType: 'limit',
      price: '3500.00',
    });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('$3500.00')).toBeInTheDocument();
  });

  it('displays Market text for market orders', () => {
    const order = createMockOrder({
      orderType: 'market',
      price: '0',
    });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Market')).toBeInTheDocument();
  });

  it('displays open status correctly', () => {
    const order = createMockOrder({ status: 'open' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('displays filled status correctly', () => {
    const order = createMockOrder({ status: 'filled' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Filled')).toBeInTheDocument();
  });

  it('displays canceled status correctly', () => {
    const order = createMockOrder({ status: 'canceled' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Canceled')).toBeInTheDocument();
  });

  it('displays queued status correctly', () => {
    const order = createMockOrder({ status: 'queued' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('Queued')).toBeInTheDocument();
  });

  it('renders the token logo', () => {
    const order = createMockOrder({ symbol: 'SOL' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByTestId('perps-token-logo-SOL')).toBeInTheDocument();
  });
});

