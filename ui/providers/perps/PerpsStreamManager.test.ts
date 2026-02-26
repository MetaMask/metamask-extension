import type { Position } from '@metamask/perps-controller';

// Polyfill crypto.randomUUID for jsdom
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

// --- Mocks must be declared before importing the module under test ---

const mockGetPerpsController = jest.fn();
const mockGetPerpsControllerCurrentAddress = jest.fn(() => null as string | null);
const mockIsPerpsControllerInitialized = jest.fn(() => false);
const mockIsPerpsControllerInitializationCancelledError = jest.fn(
  () => false,
);

jest.mock('./getPerpsController', () => ({
  getPerpsController: (...args: unknown[]) => mockGetPerpsController(...args),
  getPerpsControllerCurrentAddress: () =>
    mockGetPerpsControllerCurrentAddress(),
  isPerpsControllerInitialized: (...args: unknown[]) =>
    mockIsPerpsControllerInitialized(...args),
  isPerpsControllerInitializationCancelledError: (...args: unknown[]) =>
    mockIsPerpsControllerInitializationCancelledError(...args),
}));

jest.mock('./CandleStreamChannel', () => ({
  CandleStreamChannel: jest.fn().mockImplementation(() => ({
    setController: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

import { PerpsStreamManager } from './PerpsStreamManager';

type MockController = {
  subscribeToPositions: jest.Mock;
  subscribeToOrders: jest.Mock;
  subscribeToAccount: jest.Mock;
  getActiveProviderOrNull: jest.Mock;
};

function createMockController(): MockController {
  return {
    subscribeToPositions: jest.fn(() => jest.fn()),
    subscribeToOrders: jest.fn(() => jest.fn()),
    subscribeToAccount: jest.fn(() => jest.fn()),
    getActiveProviderOrNull: jest.fn(() => null),
  };
}

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
  let controller: MockController;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    controller = createMockController();
    mockGetPerpsController.mockResolvedValue(controller);
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
    });
  });

  describe('init', () => {
    it('returns early when address is empty', async () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      await manager.init('');

      expect(mockGetPerpsController).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No address provided'),
      );
      consoleSpy.mockRestore();
    });

    it('returns early when same address is already initialized', async () => {
      mockGetPerpsControllerCurrentAddress.mockReturnValue('0xaaa');
      mockIsPerpsControllerInitialized.mockReturnValue(true);

      await manager.init('0xaaa');

      expect(mockGetPerpsController).not.toHaveBeenCalled();
    });

    it('calls getPerpsController with the address', async () => {
      await manager.init('0xaaa');

      expect(mockGetPerpsController).toHaveBeenCalledWith('0xaaa');
    });

    it('wires positions channel to controller', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
    });

    it('wires orders channel to controller', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.orders.subscribe(cb);

      expect(controller.subscribeToOrders).toHaveBeenCalledTimes(1);
    });

    it('wires account channel to controller', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.account.subscribe(cb);

      expect(controller.subscribeToAccount).toHaveBeenCalledTimes(1);
    });

    it('wires markets channel to fetch from active provider', async () => {
      const mockProvider = {
        getMarketDataWithPrices: jest.fn().mockResolvedValue([
          { symbol: 'BTC', price: '50000' },
        ]),
      };
      controller.getActiveProviderOrNull.mockReturnValue(mockProvider);

      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.markets.subscribe(cb);

      await jest.advanceTimersByTimeAsync(0);

      expect(mockProvider.getMarketDataWithPrices).toHaveBeenCalledTimes(1);
    });

    it('clears caches and prewarm when address changes', async () => {
      mockGetPerpsControllerCurrentAddress.mockReturnValue('0xold');

      const clearSpy = jest.spyOn(manager, 'clearAllCaches');

      await manager.init('0xnew');

      expect(clearSpy).toHaveBeenCalledTimes(1);
      clearSpy.mockRestore();
    });

    it('does not clear caches when initializing from null address', async () => {
      mockGetPerpsControllerCurrentAddress.mockReturnValue(null);

      const clearSpy = jest.spyOn(manager, 'clearAllCaches');

      await manager.init('0xaaa');

      expect(clearSpy).not.toHaveBeenCalled();
      clearSpy.mockRestore();
    });

    it('rethrows cancellation errors', async () => {
      const cancelError = new Error('cancelled');
      mockGetPerpsController.mockRejectedValue(cancelError);
      mockIsPerpsControllerInitializationCancelledError.mockReturnValue(true);

      await expect(manager.init('0xaaa')).rejects.toThrow('cancelled');
    });

    it('rethrows non-cancellation errors', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      mockGetPerpsController.mockRejectedValue(new Error('network'));
      mockIsPerpsControllerInitializationCancelledError.mockReturnValue(false);

      await expect(manager.init('0xaaa')).rejects.toThrow('network');
      consoleSpy.mockRestore();
    });

    it('markets connectFn handles missing provider gracefully', async () => {
      controller.getActiveProviderOrNull.mockReturnValue(null);

      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.markets.subscribe(cb);

      await jest.advanceTimersByTimeAsync(0);

      expect(cb).not.toHaveBeenCalled();
    });

    it('markets connectFn handles provider error gracefully', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      const mockProvider = {
        getMarketDataWithPrices: jest.fn().mockRejectedValue(new Error('fail')),
      };
      controller.getActiveProviderOrNull.mockReturnValue(mockProvider);

      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.markets.subscribe(cb);

      await jest.advanceTimersByTimeAsync(0);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch markets'),
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('setOptimisticTPSL / applyOptimisticOverrides', () => {
    it('overrides position TP/SL in positions stream', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      const positionsCallback = controller.subscribeToPositions.mock
        .calls[0][0].callback as (data: Position[]) => void;

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(3100);

      positionsCallback([makePosition('BTC')]);

      expect(cb).toHaveBeenCalledTimes(1);
      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBe('120');
      expect(delivered[0].stopLossPrice).toBe('80');
    });

    it('blocks WebSocket pushes during WEBSOCKET_BLOCK_MS window', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      const positionsCallback = controller.subscribeToPositions.mock
        .calls[0][0].callback as (data: Position[]) => void;

      manager.setOptimisticTPSL('BTC', '120', '80');

      positionsCallback([makePosition('BTC')]);

      expect(cb).not.toHaveBeenCalled();
    });

    it('allows WebSocket pushes after WEBSOCKET_BLOCK_MS', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      const positionsCallback = controller.subscribeToPositions.mock
        .calls[0][0].callback as (data: Position[]) => void;

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(3100);

      positionsCallback([makePosition('BTC')]);

      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('clears override when WebSocket data matches expected values', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      const positionsCallback = controller.subscribeToPositions.mock
        .calls[0][0].callback as (data: Position[]) => void;

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(3100);

      positionsCallback([
        makePosition('BTC', {
          takeProfitPrice: '120',
          stopLossPrice: '80',
        }),
      ]);

      cb.mockClear();

      jest.advanceTimersByTime(100);
      positionsCallback([
        makePosition('BTC', {
          takeProfitPrice: '120',
          stopLossPrice: '80',
        }),
      ]);

      const second = cb.mock.calls[0][0] as Position[];
      expect(second[0].takeProfitPrice).toBe('120');
      expect(second[0].stopLossPrice).toBe('80');
    });

    it('does not apply overrides to positions without matching symbol', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      const positionsCallback = controller.subscribeToPositions.mock
        .calls[0][0].callback as (data: Position[]) => void;

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(3100);

      positionsCallback([makePosition('ETH')]);

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBeUndefined();
      expect(delivered[0].stopLossPrice).toBeUndefined();
    });

    it('expires overrides after TTL (30 seconds)', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      const positionsCallback = controller.subscribeToPositions.mock
        .calls[0][0].callback as (data: Position[]) => void;

      manager.setOptimisticTPSL('BTC', '120', '80');

      jest.advanceTimersByTime(31000);

      positionsCallback([makePosition('BTC')]);

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBeUndefined();
    });

    it('matches values by parseFloat equivalence', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      const positionsCallback = controller.subscribeToPositions.mock
        .calls[0][0].callback as (data: Position[]) => void;

      manager.setOptimisticTPSL('BTC', '120.00', '80.00');

      jest.advanceTimersByTime(3100);

      positionsCallback([
        makePosition('BTC', {
          takeProfitPrice: '120',
          stopLossPrice: '80',
        }),
      ]);

      const delivered = cb.mock.calls[0][0] as Position[];
      expect(delivered[0].takeProfitPrice).toBe('120');
      expect(delivered[0].stopLossPrice).toBe('80');
    });
  });

  describe('clearOptimisticTPSL', () => {
    it('removes the override for the given symbol', async () => {
      await manager.init('0xaaa');

      const cb = jest.fn();
      manager.positions.subscribe(cb);

      const positionsCallback = controller.subscribeToPositions.mock
        .calls[0][0].callback as (data: Position[]) => void;

      manager.setOptimisticTPSL('BTC', '120', '80');
      manager.clearOptimisticTPSL('BTC');

      jest.advanceTimersByTime(3100);

      positionsCallback([makePosition('BTC')]);

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
    it('starts prewarming all channels', async () => {
      await manager.init('0xaaa');

      manager.prewarm();

      expect(manager.isPrewarming()).toBe(true);
      expect(manager.positions.isPrewarming()).toBe(true);
      expect(manager.orders.isPrewarming()).toBe(true);
      expect(manager.account.isPrewarming()).toBe(true);
      expect(manager.markets.isPrewarming()).toBe(true);
    });

    it('is idempotent — second prewarm is a no-op', async () => {
      await manager.init('0xaaa');

      manager.prewarm();
      manager.prewarm();

      expect(manager.isPrewarming()).toBe(true);
    });

    it('stops prewarming on cleanupPrewarm', async () => {
      await manager.init('0xaaa');

      manager.prewarm();
      manager.cleanupPrewarm();

      expect(manager.isPrewarming()).toBe(false);
    });

    it('cleanupPrewarm is safe to call when not prewarming', () => {
      expect(() => manager.cleanupPrewarm()).not.toThrow();
    });
  });

  describe('clearAllCaches', () => {
    it('resets all channel caches to initial values', async () => {
      await manager.init('0xaaa');

      manager.positions.pushData([makePosition('BTC')]);
      expect(manager.positions.getCachedData()).toHaveLength(1);

      manager.clearAllCaches();

      expect(manager.positions.getCachedData()).toEqual([]);
      expect(manager.orders.getCachedData()).toEqual([]);
      expect(manager.account.getCachedData()).toBeNull();
      expect(manager.markets.getCachedData()).toEqual([]);
    });
  });

  describe('reset', () => {
    it('clears caches, prewarm, and overrides', async () => {
      await manager.init('0xaaa');

      manager.prewarm();
      manager.setOptimisticTPSL('BTC', '120', '80');
      manager.positions.pushData([makePosition('BTC')]);

      manager.reset();

      expect(manager.isPrewarming()).toBe(false);
      expect(manager.positions.getCachedData()).toEqual([]);
    });
  });
});
