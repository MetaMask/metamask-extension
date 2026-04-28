import type { Position } from '@metamask/perps-controller';
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

  describe('positions channel', () => {
    it('fetches positions via REST after WS grace period when no WS data arrives', async () => {
      jest.useFakeTimers();
      const mockPositions = [makePosition('BTC')];
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsGetPositions') {
          return Promise.resolve(mockPositions);
        }
        return Promise.resolve(undefined);
      });

      try {
        const cb = jest.fn();
        manager.positions.subscribe(cb);

        await jest.advanceTimersByTimeAsync(3_000);

        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsGetPositions',
          [],
        );
        expect(cb).toHaveBeenCalledWith(mockPositions);
      } finally {
        jest.useRealTimers();
        jest.useFakeTimers();
      }
    });

    it('skips REST fallback when WS pushes positions before grace period', async () => {
      jest.useFakeTimers();

      try {
        const cb = jest.fn();
        manager.positions.subscribe(cb);

        const wsPositions = [makePosition('ETH')];
        manager.positions.pushData(wsPositions);
        expect(cb).toHaveBeenCalledWith(wsPositions);

        mockSubmitRequestToBackground.mockClear();
        await jest.advanceTimersByTimeAsync(3_000);

        expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
          'perpsGetPositions',
          expect.anything(),
        );
      } finally {
        jest.useRealTimers();
        jest.useFakeTimers();
      }
    });

    it('notifies subscribers with empty positions when REST fallback fails', async () => {
      jest.useFakeTimers();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        mockSubmitRequestToBackground.mockImplementation((method: string) => {
          if (method === 'perpsGetPositions') {
            return Promise.reject(new Error('network'));
          }
          return Promise.resolve(undefined);
        });

        const cb = jest.fn();
        manager.positions.subscribe(cb);

        await jest.advanceTimersByTimeAsync(3_000);

        expect(cb).toHaveBeenCalledWith([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[PerpsStreamManager] Failed to fetch positions',
          expect.any(Error),
        );
      } finally {
        consoleErrorSpy.mockRestore();
        jest.useRealTimers();
        jest.useFakeTimers();
      }
    });
  });

  describe('orders channel', () => {
    it('fetches orders via REST after WS grace period when no WS data arrives', async () => {
      jest.useFakeTimers();
      const mockOrders = [{ id: 'order-1' }];
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsGetOpenOrders') {
          return Promise.resolve(mockOrders);
        }
        return Promise.resolve(undefined);
      });

      try {
        const cb = jest.fn();
        manager.orders.subscribe(cb);

        await jest.advanceTimersByTimeAsync(3_000);

        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsGetOpenOrders',
          [],
        );
        expect(cb).toHaveBeenCalledWith(mockOrders);
      } finally {
        jest.useRealTimers();
        jest.useFakeTimers();
      }
    });

    it('skips REST fallback when WS pushes orders before grace period', async () => {
      jest.useFakeTimers();

      try {
        const cb = jest.fn();
        manager.orders.subscribe(cb);

        const wsOrders = [{ id: 'ws-order-1' }] as never[];
        manager.orders.pushData(wsOrders);
        expect(cb).toHaveBeenCalledWith(wsOrders);

        mockSubmitRequestToBackground.mockClear();
        await jest.advanceTimersByTimeAsync(3_000);

        expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
          'perpsGetOpenOrders',
          expect.anything(),
        );
      } finally {
        jest.useRealTimers();
        jest.useFakeTimers();
      }
    });

    it('notifies subscribers with empty orders when REST fallback fails', async () => {
      jest.useFakeTimers();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        mockSubmitRequestToBackground.mockImplementation((method: string) => {
          if (method === 'perpsGetOpenOrders') {
            return Promise.reject(new Error('network'));
          }
          return Promise.resolve(undefined);
        });

        const cb = jest.fn();
        manager.orders.subscribe(cb);

        await jest.advanceTimersByTimeAsync(3_000);

        expect(cb).toHaveBeenCalledWith([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[PerpsStreamManager] Failed to fetch orders',
          expect.any(Error),
        );
      } finally {
        consoleErrorSpy.mockRestore();
        jest.useRealTimers();
        jest.useFakeTimers();
      }
    });
  });

  describe('markets channel', () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    afterEach(() => {
      mockSubmitRequestToBackground.mockReset();
      mockSubmitRequestToBackground.mockResolvedValue(undefined);
      jest.useFakeTimers();
    });

    it('notifies subscribers with empty markets when REST fallback fails without cache', async () => {
      jest.useFakeTimers();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        mockSubmitRequestToBackground.mockImplementation((method: string) => {
          if (method === 'perpsGetMarketDataWithPrices') {
            return Promise.reject(new Error('network'));
          }
          return Promise.resolve(undefined);
        });

        const onData = jest.fn();
        manager.markets.subscribe(onData);

        // Advance past WS grace period to trigger REST fallback
        await jest.advanceTimersByTimeAsync(3_000);

        expect(onData).toHaveBeenCalledWith([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[PerpsStreamManager] Failed to fetch markets',
          expect.any(Error),
        );
      } finally {
        consoleErrorSpy.mockRestore();
        jest.useRealTimers();
      }
    });

    it('skips REST fallback when WS delivers data within grace period', async () => {
      jest.useFakeTimers();

      try {
        mockSubmitRequestToBackground.mockResolvedValue(undefined);

        const onData = jest.fn();
        manager.markets.subscribe(onData);

        // WS pushes data before grace period expires
        const wsMarkets = [{ symbol: 'BTC', name: 'Bitcoin' }] as never[];
        manager.markets.pushData(wsMarkets);
        expect(onData).toHaveBeenCalledWith(wsMarkets);

        mockSubmitRequestToBackground.mockClear();

        // Advance past grace period — REST should NOT fire
        await jest.advanceTimersByTimeAsync(3_000);

        expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
          'perpsGetMarketDataWithPrices',
          expect.anything(),
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('preserves cached markets when reconnecting after data was already received', async () => {
      jest.useFakeTimers();

      try {
        const cachedMarkets = [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
          },
        ] as never[];

        mockSubmitRequestToBackground.mockImplementation((method: string) => {
          if (method === 'perpsGetMarketDataWithPrices') {
            return Promise.resolve(cachedMarkets);
          }
          return Promise.resolve(undefined);
        });

        const onData = jest.fn();
        const unsubscribe = manager.markets.subscribe(onData);

        // Advance past grace period for initial fetch
        await jest.advanceTimersByTimeAsync(3_000);

        expect(onData).toHaveBeenCalledWith(cachedMarkets);

        unsubscribe();
        mockSubmitRequestToBackground.mockClear();

        const onDataAfterReconnect = jest.fn();
        manager.markets.subscribe(onDataAfterReconnect);

        // Advance past grace period — REST should be skipped because cache exists
        await jest.advanceTimersByTimeAsync(3_000);

        // Subscriber should receive cached data immediately
        expect(onDataAfterReconnect).toHaveBeenCalledWith(cachedMarkets);
        // No additional REST call because cache is warm
        expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
          'perpsGetMarketDataWithPrices',
          expect.anything(),
        );
      } finally {
        jest.useRealTimers();
      }
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

    it('resets channels when address changes', () => {
      manager.init('0xold');

      const positionsResetSpy = jest.spyOn(manager.positions, 'reset');
      const accountResetSpy = jest.spyOn(manager.account, 'reset');
      manager.init('0xnew');

      expect(positionsResetSpy).toHaveBeenCalledTimes(1);
      expect(accountResetSpy).toHaveBeenCalledTimes(1);
      expect(manager.getCurrentAddress()).toBe('0xnew');
      positionsResetSpy.mockRestore();
      accountResetSpy.mockRestore();
    });

    it('does not clear caches when initializing from null address', () => {
      const clearSpy = jest.spyOn(manager, 'clearAllCaches');

      manager.init('0xaaa');

      expect(clearSpy).not.toHaveBeenCalled();
      clearSpy.mockRestore();
    });

    it('clears optimistic TP/SL overrides on address change', () => {
      manager.init('0xold');
      manager.setOptimisticTPSL('BTC', '120', '80');

      manager.init('0xnew');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC')],
      });

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBeUndefined();
      expect(delivered[0].stopLossPrice).toBeUndefined();
    });
  });

  describe('initForAddress', () => {
    beforeEach(() => {
      jest.useRealTimers();
      mockSubmitRequestToBackground.mockReset();
      mockSubmitRequestToBackground.mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.useFakeTimers();
    });

    it('calls perpsInit on first init and sets address', async () => {
      await manager.initForAddress('0xfirst');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith('perpsInit');
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsDisconnect',
      );
      expect(manager.isInitialized('0xfirst')).toBe(true);
    });

    it('returns immediately when already initialized for the same address', async () => {
      await manager.initForAddress('0xsame');
      mockSubmitRequestToBackground.mockClear();

      await manager.initForAddress('0xsame');

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('calls disconnect then init on account switch', async () => {
      await manager.initForAddress('0xfirst');
      mockSubmitRequestToBackground.mockClear();

      const callOrder: string[] = [];
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        callOrder.push(method);
        return Promise.resolve(undefined);
      });

      await manager.initForAddress('0xsecond');

      expect(callOrder).toContain('perpsDisconnect');
      expect(callOrder).toContain('perpsInit');
      expect(callOrder.indexOf('perpsDisconnect')).toBeLessThan(
        callOrder.indexOf('perpsInit'),
      );
      expect(manager.isInitialized('0xsecond')).toBe(true);
    });

    it('deduplicates concurrent calls for the same address', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(undefined);

      const p1 = manager.initForAddress('0xaaa');
      const p2 = manager.initForAddress('0xaaa');

      await Promise.all([p1, p2]);

      const initCalls = mockSubmitRequestToBackground.mock.calls.filter(
        ([m]: [string]) => m === 'perpsInit',
      );
      expect(initCalls).toHaveLength(1);
    });

    it('throws when address is empty', async () => {
      await expect(manager.initForAddress('')).rejects.toThrow(
        'No account selected',
      );
    });

    it('calls perpsDisconnect before second perpsInit when first init is still in flight', async () => {
      let releaseFirstInit: (() => void) | undefined;
      const firstInitBarrier = new Promise<void>((resolve) => {
        releaseFirstInit = resolve;
      });

      let perpsInitCount = 0;
      mockSubmitRequestToBackground.mockImplementation(
        async (method: string) => {
          if (method === 'perpsDisconnect') {
            return undefined;
          }
          if (method === 'perpsInit') {
            perpsInitCount += 1;
            if (perpsInitCount === 1) {
              await firstInitBarrier;
            }
            return undefined;
          }
          return undefined;
        },
      );

      const pFirst = manager.initForAddress('0xfirst');
      await Promise.resolve();
      await Promise.resolve();

      const pSecond = manager.initForAddress('0xsecond');
      await pSecond;

      const callOrder = mockSubmitRequestToBackground.mock.calls.map(
        ([m]: [string]) => m,
      );
      const disconnectIdx = callOrder.indexOf('perpsDisconnect');
      const secondInitIdx = callOrder.findIndex(
        (m, i) => m === 'perpsInit' && i > disconnectIdx,
      );
      expect(disconnectIdx).toBeGreaterThanOrEqual(0);
      expect(secondInitIdx).toBeGreaterThan(disconnectIdx);
      expect(manager.getCurrentAddress()).toBe('0xsecond');

      expect(releaseFirstInit).toBeDefined();
      if (releaseFirstInit === undefined) {
        throw new Error('releaseFirstInit not set by Promise executor');
      }
      releaseFirstInit();
      await pFirst;
      expect(manager.getCurrentAddress()).toBe('0xsecond');
    });

    it('clears pending init on perpsInit failure so the same address can be retried', async () => {
      let initAttempts = 0;
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsDisconnect') {
          return Promise.resolve(undefined);
        }
        if (method === 'perpsInit') {
          initAttempts += 1;
          if (initAttempts === 1) {
            return Promise.reject(new Error('init failed'));
          }
          return Promise.resolve(undefined);
        }
        return Promise.resolve(undefined);
      });

      await expect(manager.initForAddress('0xretry')).rejects.toThrow(
        'init failed',
      );

      await manager.initForAddress('0xretry');

      expect(manager.isInitialized('0xretry')).toBe(true);
      const initCalls = mockSubmitRequestToBackground.mock.calls.filter(
        ([m]: [string]) => m === 'perpsInit',
      );
      expect(initCalls).toHaveLength(2);
    });

    it('clears pending init on perpsDisconnect failure so switch can be retried', async () => {
      await manager.initForAddress('0xfirst');
      mockSubmitRequestToBackground.mockClear();

      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsDisconnect') {
          return Promise.reject(new Error('disconnect failed'));
        }
        return Promise.resolve(undefined);
      });

      await expect(manager.initForAddress('0xnext')).rejects.toThrow(
        'disconnect failed',
      );

      mockSubmitRequestToBackground.mockReset();
      mockSubmitRequestToBackground.mockResolvedValue(undefined);

      await manager.initForAddress('0xnext');
      expect(manager.isInitialized('0xnext')).toBe(true);
    });

    it('does not apply a superseded address when an older init completes later', async () => {
      let releaseFirstInit: (() => void) | undefined;
      const firstInitBarrier = new Promise<void>((resolve) => {
        releaseFirstInit = resolve;
      });

      let perpsInitCount = 0;
      mockSubmitRequestToBackground.mockImplementation(
        async (method: string) => {
          if (method === 'perpsDisconnect') {
            return undefined;
          }
          if (method === 'perpsInit') {
            perpsInitCount += 1;
            if (perpsInitCount === 1) {
              await firstInitBarrier;
            }
            return undefined;
          }
          return undefined;
        },
      );

      const pSlow = manager.initForAddress('0xslow');
      await Promise.resolve();
      await Promise.resolve();

      await manager.initForAddress('0xwins');

      expect(manager.getCurrentAddress()).toBe('0xwins');

      expect(releaseFirstInit).toBeDefined();
      if (releaseFirstInit === undefined) {
        throw new Error('releaseFirstInit not set by Promise executor');
      }
      releaseFirstInit();
      await pSlow;

      expect(manager.getCurrentAddress()).toBe('0xwins');
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

    it('updates lastStreamUpdateAt on every call', () => {
      expect(manager.getLastStreamUpdateAt()).toBe(0);

      manager.handleBackgroundUpdate({ channel: 'positions', data: [] });

      expect(manager.getLastStreamUpdateAt()).toBeGreaterThan(0);
    });

    it('updates lastStreamUpdateAt even for unknown channels', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      manager.handleBackgroundUpdate({ channel: 'unknown', data: {} });

      expect(manager.getLastStreamUpdateAt()).toBeGreaterThan(0);
      consoleSpy.mockRestore();
    });

    it('routes markets channel to markets.pushData', () => {
      const cb = jest.fn();
      manager.markets.subscribe(cb);

      const markets = [{ symbol: 'BTC', name: 'Bitcoin' }];
      manager.handleBackgroundUpdate({ channel: 'markets', data: markets });

      expect(cb).toHaveBeenCalledWith(markets);
    });

    it('handles connectionState channel silently (no-op)', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      manager.handleBackgroundUpdate({
        channel: 'connectionState',
        data: { connected: true },
      });

      expect(consoleSpy).not.toHaveBeenCalled();
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

  describe('clearAllOptimisticTPSL', () => {
    it('removes overrides for all symbols', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');
      manager.setOptimisticTPSL('ETH', '4000', '3000');
      manager.clearAllOptimisticTPSL();

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC'), makePosition('ETH')],
      });

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBeUndefined();
      expect(delivered[1].takeProfitPrice).toBeUndefined();
    });
  });

  describe('multiple simultaneous optimistic overrides', () => {
    it('applies overrides independently per symbol', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');
      manager.setOptimisticTPSL('ETH', '4000', '3000');

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC'), makePosition('ETH')],
      });

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBe('120');
      expect(delivered[0].stopLossPrice).toBe('80');
      expect(delivered[1].takeProfitPrice).toBe('4000');
      expect(delivered[1].stopLossPrice).toBe('3000');
    });

    it('clears only the matching symbol when WS confirms', () => {
      const cb = jest.fn();
      manager.positions.subscribe(cb);

      manager.setOptimisticTPSL('BTC', '120', '80');
      manager.setOptimisticTPSL('ETH', '4000', '3000');

      jest.advanceTimersByTime(3100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [
          makePosition('BTC', {
            takeProfitPrice: '120',
            stopLossPrice: '80',
          }),
          makePosition('ETH'),
        ],
      });

      cb.mockClear();
      jest.advanceTimersByTime(100);

      manager.handleBackgroundUpdate({
        channel: 'positions',
        data: [makePosition('BTC'), makePosition('ETH')],
      });

      const second = cb.mock.calls[0][0] as Position[];
      // BTC override was cleared (WS confirmed) — no longer overridden
      expect(second[0].takeProfitPrice).toBeUndefined();
      // ETH override is still active
      expect(second[1].takeProfitPrice).toBe('4000');
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

  describe('getLastStreamUpdateAt', () => {
    it('returns 0 before any updates', () => {
      expect(manager.getLastStreamUpdateAt()).toBe(0);
    });

    it('returns the timestamp of the most recent handleBackgroundUpdate', () => {
      manager.handleBackgroundUpdate({ channel: 'orders', data: [] });
      const t1 = manager.getLastStreamUpdateAt();
      expect(t1).toBeGreaterThan(0);

      jest.advanceTimersByTime(5000);

      manager.handleBackgroundUpdate({ channel: 'account', data: null });
      const t2 = manager.getLastStreamUpdateAt();
      expect(t2).toBeGreaterThan(t1);
    });
  });

  describe('account channel delayed REST fallback', () => {
    it('does not fetch account state immediately on subscribe', () => {
      const cb = jest.fn();
      manager.account.subscribe(cb);

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsGetAccountState',
        expect.anything(),
      );
    });

    it('fetches account state via REST after fallback delay when no WS data arrives', async () => {
      const mockAccount = { totalBalance: '100' };
      mockSubmitRequestToBackground.mockResolvedValueOnce(mockAccount);

      const cb = jest.fn();
      manager.account.subscribe(cb);

      jest.advanceTimersByTime(4000);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsGetAccountState',
        [],
      );
      expect(cb).toHaveBeenCalledWith(mockAccount);
    });

    it('skips REST fallback if WebSocket pushes account data before the delay', () => {
      const cb = jest.fn();
      manager.account.subscribe(cb);

      const wsAccount = { totalBalance: '200' };
      manager.handleBackgroundUpdate({ channel: 'account', data: wsAccount });

      expect(cb).toHaveBeenCalledWith(wsAccount);

      jest.advanceTimersByTime(4000);

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsGetAccountState',
        expect.anything(),
      );
    });

    it('notifies subscribers with null when REST fallback fails without cache', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        mockSubmitRequestToBackground.mockImplementation((method: string) => {
          if (method === 'perpsGetAccountState') {
            return Promise.reject(new Error('network'));
          }
          return Promise.resolve(undefined);
        });

        const onData = jest.fn();
        manager.account.subscribe(onData);

        await jest.advanceTimersByTimeAsync(3_000);

        expect(onData).toHaveBeenCalledWith(null);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[PerpsStreamManager] Failed to fetch account',
          expect.any(Error),
        );
      } finally {
        consoleErrorSpy.mockRestore();
      }
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

    it('does not prewarm fills channel (fills are REST-only)', () => {
      manager.prewarm();

      expect(manager.fills.isPrewarming()).toBe(false);
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

    it('resets lastStreamUpdateAt to 0', () => {
      manager.handleBackgroundUpdate({ channel: 'positions', data: [] });
      expect(manager.getLastStreamUpdateAt()).toBeGreaterThan(0);

      manager.clearAllCaches();

      expect(manager.getLastStreamUpdateAt()).toBe(0);
    });

    it('preserves the initialized address (unlike reset)', () => {
      manager.init('0xabc');
      manager.clearAllCaches();

      expect(manager.isInitialized('0xabc')).toBe(true);
      expect(manager.getCurrentAddress()).toBe('0xabc');
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

    it('resets lastStreamUpdateAt to 0', () => {
      manager.handleBackgroundUpdate({ channel: 'positions', data: [] });
      expect(manager.getLastStreamUpdateAt()).toBeGreaterThan(0);

      manager.reset();

      expect(manager.getLastStreamUpdateAt()).toBe(0);
    });
  });
});
