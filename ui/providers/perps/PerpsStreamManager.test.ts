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

const mockGetPerpsControllerCurrentAddress = jest.fn<string | null, []>(
  () => null,
);
const mockIsPerpsControllerInitialized = jest.fn<boolean, [string?]>(
  () => false,
);
const mockMarkPerpsControllerInitialized = jest.fn<void, [string]>();

jest.mock('./getPerpsController', () => ({
  getPerpsControllerCurrentAddress: () =>
    mockGetPerpsControllerCurrentAddress(),
  isPerpsControllerInitialized: (...args: [string?]) =>
    mockIsPerpsControllerInitialized(...args),
  markPerpsControllerInitialized: (...args: [string]) =>
    mockMarkPerpsControllerInitialized(...args),
}));

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

    mockGetPerpsControllerCurrentAddress.mockReturnValue(null);
    mockIsPerpsControllerInitialized.mockReturnValue(false);

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
    });
  });

  describe('init', () => {
    it('returns early when address is empty', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      manager.init('');

      expect(mockMarkPerpsControllerInitialized).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No address provided'),
      );
      consoleSpy.mockRestore();
    });

    it('returns early when same address is already initialized', () => {
      mockGetPerpsControllerCurrentAddress.mockReturnValue('0xaaa');
      mockIsPerpsControllerInitialized.mockReturnValue(true);

      manager.init('0xaaa');

      expect(mockMarkPerpsControllerInitialized).not.toHaveBeenCalled();
    });

    it('calls markPerpsControllerInitialized with the address', () => {
      manager.init('0xaaa');

      expect(mockMarkPerpsControllerInitialized).toHaveBeenCalledWith('0xaaa');
    });

    it('calls perpsSubscriberChange(1) on init', () => {
      manager.init('0xaaa');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsSubscriberChange',
        [1],
      );
    });

    it('clears caches when address changes', () => {
      mockGetPerpsControllerCurrentAddress.mockReturnValue('0xold');

      const clearSpy = jest.spyOn(manager, 'clearAllCaches');

      manager.init('0xnew');

      expect(clearSpy).toHaveBeenCalledTimes(1);
      clearSpy.mockRestore();
    });

    it('calls perpsSubscriberChange(-1) then (+1) when address changes', () => {
      mockGetPerpsControllerCurrentAddress.mockReturnValue('0xold');

      manager.init('0xnew');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsSubscriberChange',
        [-1],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsSubscriberChange',
        [1],
      );
    });

    it('does not clear caches when initializing from null address', () => {
      mockGetPerpsControllerCurrentAddress.mockReturnValue(null);

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
      (manager.candles as unknown as { pushFromBackground: jest.Mock }).pushFromBackground = pushFromBackground;

      const candleData = { open: '100', close: '110', high: '115', low: '98', volume: '1000', timestamp: 1000 };
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
      (manager.candles as unknown as { pushFromBackground: jest.Mock }).pushFromBackground = pushFromBackground;

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
        data: [makePosition('BTC', { takeProfitPrice: '120', stopLossPrice: '80' })],
      });

      cb.mockClear();

      jest.advanceTimersByTime(100);
      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC', { takeProfitPrice: '120', stopLossPrice: '80' })],
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
        data: [makePosition('BTC', { takeProfitPrice: '120', stopLossPrice: '80' })],
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
    it('delegates to isPerpsControllerInitialized', () => {
      mockIsPerpsControllerInitialized.mockReturnValue(true);
      expect(manager.isInitialized('0xaaa')).toBe(true);
      expect(mockIsPerpsControllerInitialized).toHaveBeenCalledWith('0xaaa');
    });

    it('works without an address argument', () => {
      mockIsPerpsControllerInitialized.mockReturnValue(false);
      expect(manager.isInitialized()).toBe(false);
    });
  });

  describe('getCurrentAddress', () => {
    it('delegates to getPerpsControllerCurrentAddress', () => {
      mockGetPerpsControllerCurrentAddress.mockReturnValue('0xabc');
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
      manager.prices.pushData([{ symbol: 'BTC', price: '50000' } as import('@metamask/perps-controller').PriceUpdate]);
      expect(manager.positions.getCachedData()).toHaveLength(1);
      expect(manager.prices.getCachedData()).toHaveLength(1);

      manager.clearAllCaches();

      expect(manager.positions.getCachedData()).toEqual([]);
      expect(manager.orders.getCachedData()).toEqual([]);
      expect(manager.account.getCachedData()).toBeNull();
      expect(manager.markets.getCachedData()).toEqual([]);
      expect(manager.prices.getCachedData()).toEqual([]);
      expect(manager.orderBook.getCachedData()).toBeNull();
    });
  });

  describe('reset', () => {
    it('clears caches, prewarm, and overrides', () => {
      manager.prewarm();
      manager.setOptimisticTPSL('BTC', '120', '80');
      manager.positions.pushData([makePosition('BTC')]);

      manager.reset();

      expect(manager.isPrewarming()).toBe(false);
      expect(manager.positions.getCachedData()).toEqual([]);
    });
  });
});
