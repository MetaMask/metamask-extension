import type { Position } from '@metamask/perps-controller';
// eslint-disable-next-line import/order
import { PerpsStreamManager } from './PerpsStreamManager';

// Polyfill crypto.randomUUID for jsdom
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('./CandleStreamChannel', () => ({
  CandleStreamChannel: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
  })),
}));

function makePosition(
  symbol: string,
  overrides: Partial<Position> = {},
): Position {
  return {
    symbol,
    size: '1.0',
    entryPrice: '100',
    markPrice: '105',
    unrealizedPnl: '5',
    unrealizedPnlPercent: '5',
    leverage: '10',
    liquidationPrice: '90',
    margin: '10',
    side: 'long',
    takeProfitPrice: undefined,
    stopLossPrice: undefined,
    ...overrides,
  } as Position;
}

describe('PerpsStreamManager', () => {
  let manager: PerpsStreamManager;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    manager = new PerpsStreamManager();
  });

  afterEach(() => {
    manager.reset();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('initializes all data channels with empty defaults', () => {
      expect(manager.positions.getCachedData()).toEqual([]);
      expect(manager.orders.getCachedData()).toEqual([]);
      expect(manager.account.getCachedData()).toBeNull();
      expect(manager.markets.getCachedData()).toEqual([]);
      expect(manager.prices.getCachedData()).toEqual([]);
      expect(manager.orderBook.getCachedData()).toBeNull();
      expect(manager.fills.getCachedData()).toEqual([]);
    });
  });

  describe('init', () => {
    it('returns early when address is empty', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      manager.init('');

      expect(manager.isInitialized()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No address provided'),
      );
      consoleSpy.mockRestore();
    });

    it('marks the manager as initialized for the given address', () => {
      manager.init('0xaaa');

      expect(manager.isInitialized('0xaaa')).toBe(true);
      expect(manager.getCurrentAddress()).toBe('0xaaa');
    });

    it('returns early when same address is already initialized', () => {
      manager.init('0xaaa');

      const clearSpy = jest.spyOn(manager, 'clearAllCaches');
      manager.init('0xaaa');

      expect(clearSpy).not.toHaveBeenCalled();
      clearSpy.mockRestore();
    });

    it('clears caches when address changes', () => {
      manager.init('0xold');

      const clearSpy = jest.spyOn(manager, 'clearAllCaches');
      manager.init('0xnew');

      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(manager.getCurrentAddress()).toBe('0xnew');
      clearSpy.mockRestore();
    });

    it('does not clear caches when initializing from null address', () => {
      const clearSpy = jest.spyOn(manager, 'clearAllCaches');

      manager.init('0xaaa');

      expect(clearSpy).not.toHaveBeenCalled();
      clearSpy.mockRestore();
    });
  });

  describe('handleBackgroundUpdate', () => {
    it('routes positions channel to positions.pushData', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      const positions = [makePosition('BTC')];
      manager.handleBackgroundUpdate({ channel: 'positions', data: positions });

      expect(cb).toHaveBeenCalledWith(positions);
    });

    it('routes orders channel to orders.pushData', () => {
      const cb = jest.fn();
      manager.orders.subscribe(cb);

      const orders = [{ id: '1' }];
      manager.handleBackgroundUpdate({ channel: 'orders', data: orders });

      expect(cb).toHaveBeenCalledWith(orders);
    });

    it('routes account channel to account.pushData', () => {
      const cb = jest.fn();
      manager.account.subscribe(cb);

      const account = { totalBalance: '1000' };
      manager.handleBackgroundUpdate({ channel: 'account', data: account });

      expect(cb).toHaveBeenCalledWith(account);
    });

    it('routes fills channel to fills.pushData', () => {
      const cb = jest.fn();
      manager.fills.subscribe(cb);

      const fills = [{ orderId: '1', symbol: 'BTC' }];
      manager.handleBackgroundUpdate({ channel: 'fills', data: fills });

      expect(cb).toHaveBeenCalledWith(fills);
    });

    it('routes prices channel to prices.pushData', () => {
      const cb = jest.fn();
      manager.prices.subscribe(cb);

      const prices = [{ symbol: 'BTC', price: '50000' }];
      manager.handleBackgroundUpdate({ channel: 'prices', data: prices });

      expect(cb).toHaveBeenCalledWith(prices);
    });

    it('routes orderBook channel to orderBook.pushData', () => {
      const cb = jest.fn();
      manager.orderBook.subscribe(cb);

      const orderBook = { bids: [], asks: [] };
      manager.handleBackgroundUpdate({ channel: 'orderBook', data: orderBook });

      expect(cb).toHaveBeenCalledWith(orderBook);
    });

    it('routes candles channel to candles.pushFromBackground', () => {
      const pushFromBackground = jest.fn();
      (
        manager.candles as unknown as { pushFromBackground: jest.Mock }
      ).pushFromBackground = pushFromBackground;

      const candleData = {
        open: '100',
        close: '110',
        high: '115',
        low: '98',
        volume: '1000',
        timestamp: 1000,
      };
      manager.handleBackgroundUpdate({
        channel: 'candles',
        data: candleData,
        symbol: 'BTC',
        interval: '1m' as import('@metamask/perps-controller').CandlePeriod,
      });

      expect(pushFromBackground).toHaveBeenCalledWith({
        symbol: 'BTC',
        interval: '1m',
        data: candleData,
      });
    });

    it('ignores candles channel without symbol or interval', () => {
      const pushFromBackground = jest.fn();
      (
        manager.candles as unknown as { pushFromBackground: jest.Mock }
      ).pushFromBackground = pushFromBackground;

      manager.handleBackgroundUpdate({ channel: 'candles', data: {} });

      expect(pushFromBackground).not.toHaveBeenCalled();
    });

    it('warns on unknown channel', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      manager.handleBackgroundUpdate({ channel: 'unknown', data: {} });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown channel'),
        'unknown',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('setOptimisticTPSL / applyOptimisticOverrides', () => {
    it('overrides position TP/SL in positions stream after block period', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC')],
      });

      expect(cb).toHaveBeenCalledTimes(1);
      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBe('120');
      expect(delivered[0].stopLossPrice).toBe('80');
    });

    it('blocks WebSocket pushes during WEBSOCKET_BLOCK_MS window', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC')],
      });

      expect(cb).not.toHaveBeenCalled();
    });

    it('allows WebSocket pushes after WEBSOCKET_BLOCK_MS', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC')],
      });

      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('clears override when WebSocket data matches expected values', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [
          makePosition('BTC', { takeProfitPrice: '120', stopLossPrice: '80' }),
        ],
      });

      cb.mockClear();

      jest.advanceTimersByTime(100);
      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [
          makePosition('BTC', { takeProfitPrice: '120', stopLossPrice: '80' }),
        ],
      });

      const second = cb.mock.calls[0][0] as Position[];
      expect(second[0].takeProfitPrice).toBe('120');
      expect(second[0].stopLossPrice).toBe('80');
    });

    it('does not apply overrides to positions without matching symbol', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('ETH')],
      });

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBeUndefined();
      expect(delivered[0].stopLossPrice).toBeUndefined();
    });

    it('expires overrides after TTL (30 seconds)', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(31000);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC')],
      });

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBeUndefined();
    });

    it('matches values by parseFloat equivalence', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120.00', '80.00');

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [
          makePosition('BTC', { takeProfitPrice: '120', stopLossPrice: '80' }),
        ],
      });

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBe('120');
      expect(delivered[0].stopLossPrice).toBe('80');
    });
  });

  describe('clearOptimisticTPSL', () => {
    it('removes the override for the given symbol', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');
      manager.clearOptimisticTPSL('BTC');

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC')],
      });

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBeUndefined();
    });
  });

  describe('pushPositionsWithOverrides', () => {
    it('applies overrides to manually pushed positions', () => {
      manager.setOptimisticTPSL('BTC', '150', '90');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.pushPositionsWithOverrides([makePosition('BTC')]);

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBe('150');
      expect(delivered[0].stopLossPrice).toBe('90');
    });

    it('does not clear overrides on push (REST may still be stale)', () => {
      manager.setOptimisticTPSL('BTC', '150', '90');

      manager.pushPositionsWithOverrides([
        makePosition('BTC', {
          takeProfitPrice: '150',
          stopLossPrice: '90',
        }),
      ]);

      const cb = jest.fn();
      manager.positions.subscribe(cb);
      manager.pushPositionsWithOverrides([makePosition('BTC')]);

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBe('150');
    });
  });

  describe('isInitialized', () => {
    it('returns true for the initialized address', () => {
      manager.init('0xaaa');
      expect(manager.isInitialized('0xaaa')).toBe(true);
    });

    it('returns false for a different address', () => {
      manager.init('0xaaa');
      expect(manager.isInitialized('0xbbb')).toBe(false);
    });

    it('works without an address argument', () => {
      expect(manager.isInitialized()).toBe(false);
      manager.init('0xaaa');
      expect(manager.isInitialized()).toBe(true);
    });
  });

  describe('getCurrentAddress', () => {
    it('returns null before initialization', () => {
      expect(manager.getCurrentAddress()).toBeNull();
    });

    it('returns the initialized address', () => {
      manager.init('0xabc');
      expect(manager.getCurrentAddress()).toBe('0xabc');
    });
  });

  describe('prewarm / cleanupPrewarm / isPrewarming', () => {
    it('starts prewarming all channels', () => {
      manager.prewarm();

      expect(manager.isPrewarming()).toBe(true);
      expect(manager.positions.isPrewarming()).toBe(true);
      expect(manager.orders.isPrewarming()).toBe(true);
      expect(manager.account.isPrewarming()).toBe(true);
      expect(manager.markets.isPrewarming()).toBe(true);
      expect(manager.prices.isPrewarming()).toBe(true);
      expect(manager.orderBook.isPrewarming()).toBe(true);
    });

    it('is idempotent — second prewarm is a no-op', () => {
      manager.prewarm();
      manager.prewarm();

      expect(manager.isPrewarming()).toBe(true);
    });

    it('stops prewarming on cleanupPrewarm', () => {
      manager.prewarm();
      manager.cleanupPrewarm();

      expect(manager.isPrewarming()).toBe(false);
    });

    it('cleanupPrewarm is safe to call when not prewarming', () => {
      expect(() => manager.cleanupPrewarm()).not.toThrow();
    });
  });

  describe('clearAllCaches', () => {
    it('resets all channel caches to initial values', () => {
      manager.positions.pushData([makePosition('BTC')]);
      manager.prices.pushData([
        {
          symbol: 'BTC',
          price: '50000',
        } as import('@metamask/perps-controller').PriceUpdate,
      ]);
      expect(manager.positions.getCachedData()).toHaveLength(1);
      expect(manager.prices.getCachedData()).toHaveLength(1);

      manager.clearAllCaches();

      expect(manager.positions.getCachedData()).toEqual([]);
      expect(manager.orders.getCachedData()).toEqual([]);
      expect(manager.account.getCachedData()).toBeNull();
      expect(manager.markets.getCachedData()).toEqual([]);
      expect(manager.prices.getCachedData()).toEqual([]);
      expect(manager.orderBook.getCachedData()).toBeNull();
      expect(manager.fills.getCachedData()).toEqual([]);
    });
  });

  describe('reset', () => {
    it('clears caches, prewarm, overrides, and address', () => {
      manager.init('0xaaa');
      manager.prewarm();
      manager.setOptimisticTPSL('BTC', '120', '80');
      manager.positions.pushData([makePosition('BTC')]);

      manager.reset();

      expect(manager.isPrewarming()).toBe(false);
      expect(manager.positions.getCachedData()).toEqual([]);
      expect(manager.isInitialized()).toBe(false);
      expect(manager.getCurrentAddress()).toBeNull();
    });
  });
});
