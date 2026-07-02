import { ORDER_SLIPPAGE_CONFIG } from '@metamask/perps-controller';
import { formStateToOrderParams } from './order-params';
import type { OrderFormState } from './order-entry.types';

const baseFormState: OrderFormState = {
  asset: 'ETH',
  direction: 'long',
  closePercent: 100,
  amount: '100',
  leverage: 3,
  balancePercent: 0,
  takeProfitPrice: '',
  stopLossPrice: '',
  limitPrice: '',
  type: 'market',
  autoCloseEnabled: false,
};

describe('formStateToOrderParams', () => {
  describe('market orders', () => {
    it('sets isBuy to true for long direction', () => {
      const result = formStateToOrderParams(baseFormState, 2000);
      expect(result.isBuy).toBe(true);
    });

    it('sets isBuy to false for short direction', () => {
      const state: OrderFormState = { ...baseFormState, direction: 'short' };
      const result = formStateToOrderParams(state, 2000);
      expect(result.isBuy).toBe(false);
    });

    it('calculates position size from margin, leverage, and price', () => {
      // size = (100 * 3) / 2000 = 0.15
      const result = formStateToOrderParams(baseFormState, 2000);
      expect(result.size).toBe('0.15');
    });

    it('sets size to 0 when currentPrice is 0', () => {
      const result = formStateToOrderParams(baseFormState, 0);
      expect(result.size).toBe('0');
    });

    it('uses DefaultMarketSlippageBps when no override provided', () => {
      const result = formStateToOrderParams(baseFormState, 2000);
      expect(result.maxSlippageBps).toBe(
        ORDER_SLIPPAGE_CONFIG.DefaultMarketSlippageBps,
      );
    });

    it('uses provided maxSlippageBps override for market orders', () => {
      const result = formStateToOrderParams(
        baseFormState,
        2000,
        'new',
        undefined,
        500,
      );
      expect(result.maxSlippageBps).toBe(500);
    });

    it('does not set price field for market orders', () => {
      const result = formStateToOrderParams(baseFormState, 2000);
      expect(result.price).toBeUndefined();
    });

    it('strips commas from amount and exposes as usdAmount', () => {
      const state: OrderFormState = { ...baseFormState, amount: '1,000' };
      const result = formStateToOrderParams(state, 2000);
      expect(result.usdAmount).toBe('1000');
    });

    it('sets symbol from formState asset', () => {
      const result = formStateToOrderParams(baseFormState, 2000);
      expect(result.symbol).toBe('ETH');
    });

    it('sets orderType from formState type', () => {
      const result = formStateToOrderParams(baseFormState, 2000);
      expect(result.orderType).toBe('market');
    });

    it('sets leverage and currentPrice', () => {
      const result = formStateToOrderParams(baseFormState, 2000);
      expect(result.leverage).toBe(3);
      expect(result.currentPrice).toBe(2000);
      expect(result.priceAtCalculation).toBe(2000);
    });

    it('treats non-numeric amount as 0 margin for size calculation', () => {
      const state: OrderFormState = { ...baseFormState, amount: '' };
      const result = formStateToOrderParams(state, 2000);
      expect(result.size).toBe('0');
    });
  });

  describe('limit orders', () => {
    const limitFormState: OrderFormState = {
      ...baseFormState,
      type: 'limit',
      limitPrice: '1950',
    };

    it('uses DefaultLimitSlippageBps for limit orders', () => {
      const result = formStateToOrderParams(limitFormState, 2000);
      expect(result.maxSlippageBps).toBe(
        ORDER_SLIPPAGE_CONFIG.DefaultLimitSlippageBps,
      );
    });

    it('sets price from limitPrice for limit orders', () => {
      const result = formStateToOrderParams(limitFormState, 2000);
      expect(result.price).toBe('1950');
    });

    it('strips commas from limitPrice', () => {
      const state: OrderFormState = {
        ...limitFormState,
        limitPrice: '1,950.50',
      };
      const result = formStateToOrderParams(state, 2000);
      expect(result.price).toBe('1950.50');
    });

    it('does not set price when limitPrice is empty', () => {
      const state: OrderFormState = { ...limitFormState, limitPrice: '' };
      const result = formStateToOrderParams(state, 2000);
      expect(result.price).toBeUndefined();
    });

    it('ignores maxSlippageBps override for limit orders', () => {
      const result = formStateToOrderParams(
        limitFormState,
        2000,
        'new',
        undefined,
        999,
      );
      expect(result.maxSlippageBps).toBe(
        ORDER_SLIPPAGE_CONFIG.DefaultLimitSlippageBps,
      );
    });
  });

  describe('close mode', () => {
    it('uses existingPositionSize as size in close mode', () => {
      const result = formStateToOrderParams(
        baseFormState,
        2000,
        'close',
        '2.5',
      );
      expect(result.size).toBe('2.5');
    });

    it('uses absolute value of existingPositionSize for short positions', () => {
      const result = formStateToOrderParams(
        baseFormState,
        2000,
        'close',
        '-0.5',
      );
      expect(result.size).toBe('0.5');
    });

    it('sets reduceOnly to true in close mode', () => {
      const result = formStateToOrderParams(
        baseFormState,
        2000,
        'close',
        '2.5',
      );
      expect(result.reduceOnly).toBe(true);
    });

    it('sets isFullClose to true in close mode', () => {
      const result = formStateToOrderParams(
        baseFormState,
        2000,
        'close',
        '2.5',
      );
      expect(result.isFullClose).toBe(true);
    });

    it('falls back to calculated size when existingPositionSize is not provided in close mode', () => {
      // (100 * 3) / 2000 = 0.15
      const result = formStateToOrderParams(baseFormState, 2000, 'close');
      expect(result.size).toBe('0.15');
    });
  });

  describe('TP/SL when autoCloseEnabled', () => {
    it('includes takeProfitPrice when autoCloseEnabled and takeProfitPrice is set', () => {
      const state: OrderFormState = {
        ...baseFormState,
        autoCloseEnabled: true,
        takeProfitPrice: '2500',
      };
      const result = formStateToOrderParams(state, 2000);
      expect(result.takeProfitPrice).toBe('2500');
    });

    it('strips commas from takeProfitPrice', () => {
      const state: OrderFormState = {
        ...baseFormState,
        autoCloseEnabled: true,
        takeProfitPrice: '2,500.00',
      };
      const result = formStateToOrderParams(state, 2000);
      expect(result.takeProfitPrice).toBe('2500.00');
    });

    it('includes stopLossPrice when autoCloseEnabled and stopLossPrice is set', () => {
      const state: OrderFormState = {
        ...baseFormState,
        autoCloseEnabled: true,
        stopLossPrice: '1800',
      };
      const result = formStateToOrderParams(state, 2000);
      expect(result.stopLossPrice).toBe('1800');
    });

    it('strips commas from stopLossPrice', () => {
      const state: OrderFormState = {
        ...baseFormState,
        autoCloseEnabled: true,
        stopLossPrice: '1,800.00',
      };
      const result = formStateToOrderParams(state, 2000);
      expect(result.stopLossPrice).toBe('1800.00');
    });

    it('does not include takeProfitPrice when autoCloseEnabled is false', () => {
      const state: OrderFormState = {
        ...baseFormState,
        autoCloseEnabled: false,
        takeProfitPrice: '2500',
      };
      const result = formStateToOrderParams(state, 2000);
      expect(result.takeProfitPrice).toBeUndefined();
    });

    it('does not include stopLossPrice when autoCloseEnabled is false', () => {
      const state: OrderFormState = {
        ...baseFormState,
        autoCloseEnabled: false,
        stopLossPrice: '1800',
      };
      const result = formStateToOrderParams(state, 2000);
      expect(result.stopLossPrice).toBeUndefined();
    });

    it('does not include takeProfitPrice when it is an empty string', () => {
      const state: OrderFormState = {
        ...baseFormState,
        autoCloseEnabled: true,
        takeProfitPrice: '',
      };
      const result = formStateToOrderParams(state, 2000);
      expect(result.takeProfitPrice).toBeUndefined();
    });

    it('does not include stopLossPrice when it is an empty string', () => {
      const state: OrderFormState = {
        ...baseFormState,
        autoCloseEnabled: true,
        stopLossPrice: '',
      };
      const result = formStateToOrderParams(state, 2000);
      expect(result.stopLossPrice).toBeUndefined();
    });
  });

  describe('mode defaults', () => {
    it('defaults to new mode when mode is not provided', () => {
      const result = formStateToOrderParams(baseFormState, 2000);
      expect(result.reduceOnly).toBeUndefined();
      expect(result.isFullClose).toBeUndefined();
    });

    it('does not set reduceOnly in new mode', () => {
      const result = formStateToOrderParams(baseFormState, 2000, 'new');
      expect(result.reduceOnly).toBeUndefined();
    });

    it('does not set isFullClose in new mode', () => {
      const result = formStateToOrderParams(baseFormState, 2000, 'new');
      expect(result.isFullClose).toBeUndefined();
    });
  });
});
