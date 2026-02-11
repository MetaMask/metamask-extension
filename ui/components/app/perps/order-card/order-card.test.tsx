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

  it('renders the token logo', () => {
    const order = createMockOrder({ symbol: 'SOL' });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByTestId('perps-token-logo-SOL')).toBeInTheDocument();
  });

  describe('cancel button', () => {
    it('does not render cancel button when onCancel is not provided', () => {
      const order = createMockOrder({ orderId: 'order-no-cancel' });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(
        screen.queryByTestId('order-cancel-order-no-cancel'),
      ).not.toBeInTheDocument();
    });

    it('renders cancel button when onCancel is provided', () => {
      const order = createMockOrder({ orderId: 'order-with-cancel' });
      const onCancel = jest.fn();
      renderWithProvider(
        <OrderCard order={order} onCancel={onCancel} />,
        mockStore,
      );

      expect(
        screen.getByTestId('order-cancel-order-with-cancel'),
      ).toBeInTheDocument();
    });

    it('calls onCancel with the order when cancel button is clicked', () => {
      const order = createMockOrder({ orderId: 'order-cancel-test' });
      const onCancel = jest.fn();
      renderWithProvider(
        <OrderCard order={order} onCancel={onCancel} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('order-cancel-order-cancel-test'));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(order);
    });

    it('does not trigger card click when cancel button is clicked', () => {
      const order = createMockOrder({ orderId: 'order-stop-prop' });
      const onClick = jest.fn();
      const onCancel = jest.fn();
      renderWithProvider(
        <OrderCard order={order} onClick={onClick} onCancel={onCancel} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('order-cancel-order-stop-prop'));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
