import type { Order, Position } from '@metamask/perps-controller';
import {
  isOrderAssociatedWithFullPosition,
  shouldDisplayOrderInMarketDetailsOrders,
  buildDisplayOrdersWithSyntheticTpsl,
  normalizeMarketDetailsOrders,
  formatOrderLabel,
} from './orderUtils';

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  orderId: 'order-1',
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
  reduceOnly: false,
  ...overrides,
});

const makePosition = (overrides: Partial<Position> = {}): Position =>
  ({
    symbol: 'ETH',
    size: '1.0',
    entryPrice: '3000.00',
    leverage: '10',
    liquidationPrice: '2700.00',
    unrealizedPnl: '50.00',
    marginUsed: '300.00',
    ...overrides,
  }) as Position;

describe('orderUtils', () => {
  describe('isOrderAssociatedWithFullPosition', () => {
    it('returns false for non-reduce-only orders', () => {
      const order = makeOrder({ reduceOnly: false });
      const position = makePosition();
      expect(isOrderAssociatedWithFullPosition(order, position)).toBe(false);
    });

    it('returns true when isPositionTpsl is true', () => {
      const order = makeOrder({
        reduceOnly: true,
        isPositionTpsl: true,
      });
      expect(isOrderAssociatedWithFullPosition(order)).toBe(true);
    });

    it('returns false when no position provided and isPositionTpsl is not true', () => {
      const order = makeOrder({ reduceOnly: true });
      expect(isOrderAssociatedWithFullPosition(order)).toBe(false);
    });

    it('returns false when symbols do not match', () => {
      const order = makeOrder({
        reduceOnly: true,
        symbol: 'BTC',
        side: 'sell',
      });
      const position = makePosition({ symbol: 'ETH', size: '1.0' });
      expect(isOrderAssociatedWithFullPosition(order, position)).toBe(false);
    });

    it('returns false when isPositionTpsl is explicitly false', () => {
      const order = makeOrder({
        reduceOnly: true,
        isPositionTpsl: false,
        symbol: 'ETH',
        side: 'sell',
        size: '1.0',
      });
      const position = makePosition({ symbol: 'ETH', size: '1.0' });
      expect(isOrderAssociatedWithFullPosition(order, position)).toBe(false);
    });

    it('returns true when reduce-only order matches full position size (sell closing long)', () => {
      const order = makeOrder({
        reduceOnly: true,
        symbol: 'ETH',
        side: 'sell',
        size: '1.0',
        originalSize: '1.0',
      });
      const position = makePosition({ symbol: 'ETH', size: '1.0' });
      expect(isOrderAssociatedWithFullPosition(order, position)).toBe(true);
    });

    it('returns true when reduce-only order matches full position size (buy closing short)', () => {
      const order = makeOrder({
        reduceOnly: true,
        symbol: 'ETH',
        side: 'buy',
        size: '2.0',
        originalSize: '2.0',
      });
      const position = makePosition({ symbol: 'ETH', size: '-2.0' });
      expect(isOrderAssociatedWithFullPosition(order, position)).toBe(true);
    });

    it('returns false when order size does not match position size', () => {
      const order = makeOrder({
        reduceOnly: true,
        symbol: 'ETH',
        side: 'sell',
        size: '0.5',
        originalSize: '0.5',
      });
      const position = makePosition({ symbol: 'ETH', size: '1.0' });
      expect(isOrderAssociatedWithFullPosition(order, position)).toBe(false);
    });
  });

  describe('shouldDisplayOrderInMarketDetailsOrders', () => {
    it('includes non-reduce-only and limit orders', () => {
      expect(shouldDisplayOrderInMarketDetailsOrders(makeOrder())).toBe(true);
      expect(
        shouldDisplayOrderInMarketDetailsOrders(
          makeOrder({ orderType: 'limit', reduceOnly: false }),
        ),
      ).toBe(true);
    });

    it('includes trigger orders and partial reduce-only closes', () => {
      const triggerOrder = makeOrder({
        isTrigger: true,
        reduceOnly: false,
        triggerPrice: '3200.00',
      });
      expect(shouldDisplayOrderInMarketDetailsOrders(triggerOrder)).toBe(true);

      const partialClose = makeOrder({
        reduceOnly: true,
        symbol: 'ETH',
        side: 'sell',
        size: '0.5',
        originalSize: '0.5',
      });
      const position = makePosition({ symbol: 'ETH', size: '1.0' });
      expect(
        shouldDisplayOrderInMarketDetailsOrders(partialClose, position),
      ).toBe(true);
    });

    it('includes full-position reduce-only and isPositionTpsl orders', () => {
      const fullClose = makeOrder({
        reduceOnly: true,
        symbol: 'ETH',
        side: 'sell',
        size: '1.0',
        originalSize: '1.0',
      });
      const position = makePosition({ symbol: 'ETH', size: '1.0' });
      expect(shouldDisplayOrderInMarketDetailsOrders(fullClose, position)).toBe(
        true,
      );

      const positionTpsl = makeOrder({
        reduceOnly: true,
        isPositionTpsl: true,
      });
      expect(shouldDisplayOrderInMarketDetailsOrders(positionTpsl)).toBe(true);
    });
  });

  describe('buildDisplayOrdersWithSyntheticTpsl', () => {
    it('returns empty array for empty input', () => {
      expect(buildDisplayOrdersWithSyntheticTpsl([])).toEqual([]);
    });

    it('returns orders as-is when no TP/SL prices are set', () => {
      const order = makeOrder();
      const result = buildDisplayOrdersWithSyntheticTpsl([order]);
      expect(result).toHaveLength(1);
      expect(result[0].orderId).toBe('order-1');
    });

    it('adds synthetic TP row when takeProfitPrice is set on parent', () => {
      const order = makeOrder({
        takeProfitPrice: '3200.00',
        takeProfitOrderId: '',
      });
      const result = buildDisplayOrdersWithSyntheticTpsl([order]);
      expect(result).toHaveLength(2);
      expect(result[0].orderId).toBe('order-1');
      expect(result[1].isSynthetic).toBe(true);
      expect(result[1].detailedOrderType).toBe('Take Profit Limit');
      expect(result[1].triggerPrice).toBe('3200');
    });

    it('adds synthetic SL row when stopLossPrice is set on parent', () => {
      const order = makeOrder({
        stopLossPrice: '2800.00',
        stopLossOrderId: '',
      });
      const result = buildDisplayOrdersWithSyntheticTpsl([order]);
      expect(result).toHaveLength(2);
      expect(result[1].isSynthetic).toBe(true);
      expect(result[1].detailedOrderType).toBe('Stop Limit');
      expect(result[1].triggerPrice).toBe('2800');
    });

    it('adds both synthetic TP and SL rows when both are set', () => {
      const order = makeOrder({
        takeProfitPrice: '3200.00',
        stopLossPrice: '2800.00',
      });
      const result = buildDisplayOrdersWithSyntheticTpsl([order]);
      expect(result).toHaveLength(3);
      expect(result[1].detailedOrderType).toBe('Take Profit Limit');
      expect(result[2].detailedOrderType).toBe('Stop Limit');
    });

    it('uses market type for synthetic rows when parent is market order', () => {
      const order = makeOrder({
        orderType: 'market',
        takeProfitPrice: '3200.00',
      });
      const result = buildDisplayOrdersWithSyntheticTpsl([order]);
      expect(result[1].detailedOrderType).toBe('Take Profit Market');
      expect(result[1].orderType).toBe('market');
    });

    it('does not add synthetic row when real trigger order already exists', () => {
      const parentOrder = makeOrder({
        orderId: 'parent-1',
        side: 'buy',
        takeProfitPrice: '3200.00',
        takeProfitOrderId: 'tp-1',
      });
      const realTpOrder = makeOrder({
        orderId: 'tp-1',
        parentOrderId: 'parent-1',
        side: 'sell',
        symbol: 'ETH',
        reduceOnly: true,
        isTrigger: true,
        triggerPrice: '3200.00',
        price: '3200.00',
      });
      const result = buildDisplayOrdersWithSyntheticTpsl([
        parentOrder,
        realTpOrder,
      ]);
      const syntheticOrders = result.filter((o) => o.isSynthetic);
      expect(syntheticOrders).toHaveLength(0);
    });

    it('skips synthetic rows for trigger orders (no recursion)', () => {
      const triggerOrder = makeOrder({
        isTrigger: true,
        takeProfitPrice: '3200.00',
      });
      const result = buildDisplayOrdersWithSyntheticTpsl([triggerOrder]);
      expect(result).toHaveLength(1);
    });
  });

  describe('normalizeMarketDetailsOrders', () => {
    it('shows limit orders without position', () => {
      const limitOrder = makeOrder({
        orderType: 'limit',
        reduceOnly: false,
      });
      const result = normalizeMarketDetailsOrders({ orders: [limitOrder] });
      expect(result).toHaveLength(1);
      expect(result[0].orderId).toBe('order-1');
    });

    it('shows stop limit orders when not full-position TP/SL', () => {
      const stopLimitOrder = makeOrder({
        orderType: 'limit',
        isTrigger: true,
        triggerPrice: '3200.00',
        detailedOrderType: 'Stop Limit',
        reduceOnly: false,
      });
      const result = normalizeMarketDetailsOrders({
        orders: [stopLimitOrder],
      });
      expect(result).toHaveLength(1);
    });

    it('includes full-position TP/SL reduce-only orders', () => {
      const tpslOrder = makeOrder({
        reduceOnly: true,
        isPositionTpsl: true,
        isTrigger: true,
        triggerPrice: '3200.00',
        detailedOrderType: 'Take Profit Limit',
      });
      const result = normalizeMarketDetailsOrders({ orders: [tpslOrder] });
      expect(result).toHaveLength(1);
      expect(result[0].orderId).toBe('order-1');
    });

    it('shows partial-close reduce-only orders', () => {
      const partialClose = makeOrder({
        reduceOnly: true,
        symbol: 'ETH',
        side: 'sell',
        size: '0.5',
        originalSize: '0.5',
      });
      const position = makePosition({ symbol: 'ETH', size: '1.0' });
      const result = normalizeMarketDetailsOrders({
        orders: [partialClose],
        existingPosition: position,
      });
      expect(result).toHaveLength(1);
    });

    it('adds synthetic TP/SL rows and keeps them in the list', () => {
      const limitOrder = makeOrder({
        orderType: 'limit',
        reduceOnly: false,
        takeProfitPrice: '3200.00',
        stopLossPrice: '2800.00',
      });
      const result = normalizeMarketDetailsOrders({
        orders: [limitOrder],
      });
      expect(result).toHaveLength(3);
    });
  });

  describe('formatOrderLabel', () => {
    it('returns "Limit long" for a plain buy limit order', () => {
      const order = makeOrder({ side: 'buy', orderType: 'limit' });
      expect(formatOrderLabel(order)).toBe('Limit long');
    });

    it('returns "Limit short" for a plain sell limit order', () => {
      const order = makeOrder({ side: 'sell', orderType: 'limit' });
      expect(formatOrderLabel(order)).toBe('Limit short');
    });

    it('returns "Market long" for a plain buy market order', () => {
      const order = makeOrder({ side: 'buy', orderType: 'market' });
      expect(formatOrderLabel(order)).toBe('Market long');
    });

    it('returns "Market short" for a plain sell market order', () => {
      const order = makeOrder({ side: 'sell', orderType: 'market' });
      expect(formatOrderLabel(order)).toBe('Market short');
    });

    it('returns "Limit close long" for a reduce-only sell limit order', () => {
      const order = makeOrder({
        side: 'sell',
        orderType: 'limit',
        reduceOnly: true,
      });
      expect(formatOrderLabel(order)).toBe('Limit close long');
    });

    it('returns "Limit close short" for a reduce-only buy limit order', () => {
      const order = makeOrder({
        side: 'buy',
        orderType: 'limit',
        reduceOnly: true,
      });
      expect(formatOrderLabel(order)).toBe('Limit close short');
    });

    it('returns "Market close long" for a reduce-only sell market order', () => {
      const order = makeOrder({
        side: 'sell',
        orderType: 'market',
        reduceOnly: true,
      });
      expect(formatOrderLabel(order)).toBe('Market close long');
    });

    it('returns "Market close short" for a reduce-only buy market order', () => {
      const order = makeOrder({
        side: 'buy',
        orderType: 'market',
        reduceOnly: true,
      });
      expect(formatOrderLabel(order)).toBe('Market close short');
    });

    it('returns "Take profit limit close long" for a TP trigger (sell)', () => {
      const order = makeOrder({
        side: 'sell',
        orderType: 'limit',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Take Profit Limit',
      });
      expect(formatOrderLabel(order)).toBe('Take profit limit close long');
    });

    it('returns "Take profit market close short" for a TP trigger (buy)', () => {
      const order = makeOrder({
        side: 'buy',
        orderType: 'market',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Take Profit Market',
      });
      expect(formatOrderLabel(order)).toBe('Take profit market close short');
    });

    it('returns "Stop limit close long" for a SL trigger (sell)', () => {
      const order = makeOrder({
        side: 'sell',
        orderType: 'limit',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Stop Limit',
      });
      expect(formatOrderLabel(order)).toBe('Stop limit close long');
    });

    it('returns "Stop market close short" for a SL trigger (buy)', () => {
      const order = makeOrder({
        side: 'buy',
        orderType: 'market',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Stop Market',
      });
      expect(formatOrderLabel(order)).toBe('Stop market close short');
    });

    it('treats isTrigger alone as closing (no reduceOnly)', () => {
      const order = makeOrder({
        side: 'sell',
        orderType: 'market',
        isTrigger: true,
        detailedOrderType: 'Stop Market',
      });
      expect(formatOrderLabel(order)).toBe('Stop market close long');
    });
  });
});
