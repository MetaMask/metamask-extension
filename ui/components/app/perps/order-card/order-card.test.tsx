import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import type { Order } from '../types';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
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

  describe('order label (formatOrderLabel)', () => {
    it('displays "Limit long" for a plain buy limit order', () => {
      const order = createMockOrder({ side: 'buy', orderType: 'limit' });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(screen.getByText('Limit long')).toBeInTheDocument();
    });

    it('displays "Limit short" for a plain sell limit order', () => {
      const order = createMockOrder({ side: 'sell', orderType: 'limit' });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(screen.getByText('Limit short')).toBeInTheDocument();
    });

    it('displays "Market long" for a plain buy market order', () => {
      const order = createMockOrder({
        side: 'buy',
        orderType: 'market',
        price: '0',
      });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(screen.getByText('Market long')).toBeInTheDocument();
    });

    it('displays "Limit close long" for a reduce-only sell limit order', () => {
      const order = createMockOrder({
        side: 'sell',
        orderType: 'limit',
        reduceOnly: true,
      });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(screen.getByText('Limit close long')).toBeInTheDocument();
    });

    it('displays "Limit close short" for a reduce-only buy limit order', () => {
      const order = createMockOrder({
        side: 'buy',
        orderType: 'limit',
        reduceOnly: true,
      });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(screen.getByText('Limit close short')).toBeInTheDocument();
    });

    it('displays "Take profit limit close long" for a TP trigger (sell side)', () => {
      const order = createMockOrder({
        side: 'sell',
        orderType: 'limit',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Take Profit Limit',
      });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(
        screen.getByText('Take profit limit close long'),
      ).toBeInTheDocument();
    });

    it('shows market symbol only after size for TP/SL, not before the label', () => {
      const order = createMockOrder({
        side: 'sell',
        orderType: 'limit',
        symbol: 'ETH',
        size: '1.5',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Take Profit Limit',
        triggerPrice: '3200',
        price: '3200',
      });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(
        screen.getByText('Take profit limit close long'),
      ).toBeInTheDocument();
      expect(screen.getByText('1.5 ETH')).toBeInTheDocument();
      expect(screen.queryByText(/^ETH$/u)).not.toBeInTheDocument();
    });

    it('shows "Trigger price" subtitle for TP/SL orders', () => {
      const order = createMockOrder({
        side: 'sell',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Take Profit Limit',
        triggerPrice: '3200',
        price: '3200',
      });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(
        screen.getByText(messages.perpsTriggerPrice.message),
      ).toBeInTheDocument();
    });

    it('displays "Stop market close short" for a SL trigger (buy side)', () => {
      const order = createMockOrder({
        side: 'buy',
        orderType: 'market',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Stop Market',
      });
      renderWithProvider(<OrderCard order={order} />, mockStore);

      expect(screen.getByText('Stop market close short')).toBeInTheDocument();
    });
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

    // formatPerpsFiatMinimal strips .00 for whole-dollar amounts (mobile parity)
    expect(screen.getByText('$3,500')).toBeInTheDocument();
  });

  it('keeps meaningful decimals for limit order USD values', () => {
    const order = createMockOrder({
      orderType: 'limit',
      size: '1.0',
      price: '3500.10',
    });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    // fiatStyleStripping preserves .10 (only .00 is stripped)
    expect(screen.getByText('$3,500.10')).toBeInTheDocument();
  });

  it('displays TP/SL trigger price, not size × price notional', () => {
    const order = createMockOrder({
      orderType: 'limit',
      side: 'sell',
      isTrigger: true,
      reduceOnly: true,
      detailedOrderType: 'Take Profit Limit',
      triggerPrice: '3200.00',
      price: '3200.00',
      size: '2.0',
    });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    // formatPerpsFiatUniversal strips trailing zeros for whole-dollar prices
    expect(screen.getByText('$3,200')).toBeInTheDocument();
    expect(screen.queryByText('$6,400.00')).not.toBeInTheDocument();
  });

  it('renders sub-cent trigger prices (PUMP) with real decimals instead of "<$0.01"', () => {
    const order = createMockOrder({
      symbol: 'PUMP',
      orderType: 'limit',
      side: 'sell',
      isTrigger: true,
      detailedOrderType: 'Stop Market',
      triggerPrice: '0.001824',
      price: '0.001824',
      size: '6590',
    });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText('$0.001824')).toBeInTheDocument();
    expect(screen.queryByText('<$0.01')).not.toBeInTheDocument();
  });

  it('displays Market label when order value is zero', () => {
    const order = createMockOrder({
      orderType: 'market',
      price: '0',
      size: '1.0',
    });
    renderWithProvider(<OrderCard order={order} />, mockStore);

    expect(screen.getByText(messages.perpsMarket.message)).toBeInTheDocument();
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
