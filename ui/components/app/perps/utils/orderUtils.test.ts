import type { Order, Position } from '@metamask/perps-controller';
import {
  isOrderAssociatedWithFullPosition,
  shouldDisplayOrderInMarketDetailsOrders,
  buildDisplayOrdersWithSyntheticTpsl,
  normalizeMarketDetailsOrders,
  resolveOrderDisplayPriceAndLabel,
  getValidTriggerPrice,
  getValidOrderPrice,
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
  describe('getValidTriggerPrice', () => {
    it('returns parsed trigger price for valid value', () => {
      expect(getValidTriggerPrice(makeOrder({ triggerPrice: '100.5' }))).toBe(
        100.5,
      );
    });

    it('returns null for undefined trigger price', () => {
      expect(getValidTriggerPrice(makeOrder({ triggerPrice: undefined }))).toBe(
        null,
      );
    });

    it('returns null for zero trigger price', () => {
      expect(getValidTriggerPrice(makeOrder({ triggerPrice: '0' }))).toBe(null);
    });

    it('returns null for negative trigger price', () => {
      expect(getValidTriggerPrice(makeOrder({ triggerPrice: '-10' }))).toBe(
        null,
      );
    });
  });

  describe('getValidOrderPrice', () => {
    it('returns parsed price for valid value', () => {
      expect(getValidOrderPrice(makeOrder({ price: '3000.50' }))).toBe(3000.5);
    });

    it('returns null for empty price', () => {
      expect(getValidOrderPrice(makeOrder({ price: '' }))).toBe(null);
    });
  });

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
    it('shows non-reduce-only orders', () => {
      const order = makeOrder({ reduceOnly: false });
      expect(shouldDisplayOrderInMarketDetailsOrders(order)).toBe(true);
    });

    it('shows limit orders', () => {
      const order = makeOrder({ orderType: 'limit', reduceOnly: false });
      expect(shouldDisplayOrderInMarketDetailsOrders(order)).toBe(true);
    });

    it('shows trigger orders that are not position-attached', () => {
      const order = makeOrder({
        isTrigger: true,
        reduceOnly: false,
        triggerPrice: '3200.00',
      });
      expect(shouldDisplayOrderInMarketDetailsOrders(order)).toBe(true);
    });

    it('shows reduce-only orders not associated with full position', () => {
      const order = makeOrder({
        reduceOnly: true,
        symbol: 'ETH',
        side: 'sell',
        size: '0.5',
        originalSize: '0.5',
      });
      const position = makePosition({ symbol: 'ETH', size: '1.0' });
      expect(shouldDisplayOrderInMarketDetailsOrders(order, position)).toBe(
        true,
      );
    });

    it('hides reduce-only orders associated with full position', () => {
      const order = makeOrder({
        reduceOnly: true,
        symbol: 'ETH',
        side: 'sell',
        size: '1.0',
        originalSize: '1.0',
      });
      const position = makePosition({ symbol: 'ETH', size: '1.0' });
      expect(shouldDisplayOrderInMarketDetailsOrders(order, position)).toBe(
        false,
      );
    });

    it('hides orders with isPositionTpsl true', () => {
      const order = makeOrder({
        reduceOnly: true,
        isPositionTpsl: true,
      });
      expect(shouldDisplayOrderInMarketDetailsOrders(order)).toBe(false);
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

    it('hides full-position TP/SL reduce-only orders', () => {
      const tpslOrder = makeOrder({
        reduceOnly: true,
        isPositionTpsl: true,
        isTrigger: true,
        triggerPrice: '3200.00',
        detailedOrderType: 'Take Profit Limit',
      });
      const result = normalizeMarketDetailsOrders({ orders: [tpslOrder] });
      expect(result).toHaveLength(0);
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

    it('adds synthetic TP/SL rows and filters them through position check', () => {
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

  describe('resolveOrderDisplayPriceAndLabel', () => {
    it('returns trigger price for trigger orders', () => {
      const order = makeOrder({
        isTrigger: true,
        triggerPrice: '3200.00',
        price: '3000.00',
      });
      const result = resolveOrderDisplayPriceAndLabel(order);
      expect(result.priceValue).toBe(3200);
      expect(result.labelKey).toBe('perpsTriggerPrice');
    });

    it('returns limit price for limit orders', () => {
      const order = makeOrder({
        orderType: 'limit',
        price: '3000.00',
      });
      const result = resolveOrderDisplayPriceAndLabel(order);
      expect(result.priceValue).toBe(3000);
      expect(result.labelKey).toBe('perpsLimitPrice');
    });

    it('returns market price for market orders', () => {
      const order = makeOrder({
        orderType: 'market',
        price: '3000.00',
      });
      const result = resolveOrderDisplayPriceAndLabel(order);
      expect(result.priceValue).toBe(3000);
      expect(result.labelKey).toBe('perpsMarket');
    });

    it('returns trigger price for TPSL order types', () => {
      const order = makeOrder({
        detailedOrderType: 'Take Profit Limit',
        triggerPrice: '3500.00',
        price: '3000.00',
      });
      const result = resolveOrderDisplayPriceAndLabel(order);
      expect(result.priceValue).toBe(3500);
      expect(result.labelKey).toBe('perpsTriggerPrice');
    });
  });

  describe('formatOrderLabel', () => {
    it('formats limit long', () => {
      const order = makeOrder({ orderType: 'limit', side: 'buy' });
      expect(formatOrderLabel(order)).toBe('Limit long');
    });

    it('formats limit short', () => {
      const order = makeOrder({ orderType: 'limit', side: 'sell' });
      expect(formatOrderLabel(order)).toBe('Limit short');
    });

    it('formats market long', () => {
      const order = makeOrder({ orderType: 'market', side: 'buy' });
      expect(formatOrderLabel(order)).toBe('Market long');
    });

    it('formats limit close long for reduce-only sell', () => {
      const order = makeOrder({
        orderType: 'limit',
        side: 'sell',
        reduceOnly: true,
      });
      expect(formatOrderLabel(order)).toBe('Limit close long');
    });

    it('formats stop market close short for reduce-only trigger buy', () => {
      const order = makeOrder({
        side: 'buy',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Stop Market',
      });
      expect(formatOrderLabel(order)).toBe('Stop Market close short');
    });

    it('formats take profit limit close long for reduce-only trigger sell', () => {
      const order = makeOrder({
        side: 'sell',
        isTrigger: true,
        reduceOnly: true,
        detailedOrderType: 'Take Profit Limit',
      });
      expect(formatOrderLabel(order)).toBe('Take Profit Limit close long');
    });

    it('formats stop market long for non-reduce-only trigger buy (stop-entry)', () => {
      const order = makeOrder({
        side: 'buy',
        isTrigger: true,
        reduceOnly: false,
        detailedOrderType: 'Stop Market',
      });
      expect(formatOrderLabel(order)).toBe('Stop Market long');
    });

    it('formats stop limit short for non-reduce-only trigger sell (stop-entry)', () => {
      const order = makeOrder({
        side: 'sell',
        isTrigger: true,
        reduceOnly: false,
        detailedOrderType: 'Stop Limit',
      });
      expect(formatOrderLabel(order)).toBe('Stop Limit short');
    });
  });
});
