import type { CandleData, PerpsController } from '@metamask/perps-controller';
import {
  CandlePeriod,
  TimeDuration,
} from '../../components/app/perps/constants/chartConfig';
import { CandleStreamChannel } from './CandleStreamChannel';

// Polyfill crypto.randomUUID for jsdom
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

function makeCandle(time: number): CandleData['candles'][number] {
  return { time, open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 };
}

function makeCandleData(times: number[]): CandleData {
  return { candles: times.map(makeCandle) } as CandleData;
}

type MockController = {
  subscribeToCandles: jest.Mock;
  fetchHistoricalCandles: jest.Mock;
};

function createMockController(): MockController {
  return {
    subscribeToCandles: jest.fn(() => jest.fn()),
    fetchHistoricalCandles: jest.fn(),
  };
}

describe('CandleStreamChannel', () => {
  let channel: CandleStreamChannel;
  let controller: MockController;

  beforeEach(() => {
    jest.useFakeTimers();
    channel = new CandleStreamChannel();
    controller = createMockController();
    channel.setController(controller as unknown as PerpsController);
  });

  afterEach(() => {
    channel.clearAll();
    jest.useRealTimers();
  });

  describe('setController', () => {
    it('sets the controller reference used by connect', () => {
      const fresh = new CandleStreamChannel();
      const cb = jest.fn();

      fresh.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      expect(controller.subscribeToCandles).not.toHaveBeenCalled();

      fresh.setController(controller as unknown as PerpsController);
      fresh.subscribe({
        symbol: 'ETH',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);
      fresh.clearAll();
    });
  });

  describe('subscribe', () => {
    it('opens a controller subscription on first subscriber', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToCandles).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC',
          interval: CandlePeriod.OneHour,
        }),
      );
    });

    it('does not open a second controller subscription for the same key', () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);
    });

    it('opens separate subscriptions for different keys', () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      channel.subscribe({
        symbol: 'ETH',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(2);
    });

    it('delivers cached data immediately to a new subscriber', () => {
      const cb1 = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb1,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      const data = makeCandleData([100, 200]);
      sourceCallback(data);

      const cb2 = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb2,
      });

      expect(cb2).toHaveBeenCalledWith(data);
    });

    it('does not deliver when there is no cache', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      expect(cb).not.toHaveBeenCalled();
    });

    it('does not connect when no controller is set', () => {
      const fresh = new CandleStreamChannel();
      const cb = jest.fn();
      fresh.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      expect(controller.subscribeToCandles).not.toHaveBeenCalled();
      fresh.clearAll();
    });

    it('passes onError to the controller subscription', () => {
      const onError = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
        onError,
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledWith(
        expect.objectContaining({ onError }),
      );
    });

    it('passes duration to the controller subscription', () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        duration: TimeDuration.OneDay,
        callback: jest.fn(),
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledWith(
        expect.objectContaining({ duration: TimeDuration.OneDay }),
      );
    });
  });

  describe('unsubscribe', () => {
    it('disconnects from controller when last subscriber unsubscribes', () => {
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);

      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      unsubscribe();
      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not disconnect when other subscribers remain', () => {
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);

      const unsubscribe1 = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      unsubscribe1();
      expect(unsub).not.toHaveBeenCalled();
    });

    it('is safe to call unsubscribe multiple times', () => {
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });

    it('clears pending throttle timer on unsubscribe', () => {
      const cb = jest.fn();
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
        throttleMs: 5000,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;

      sourceCallback(makeCandleData([100]));
      expect(cb).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      sourceCallback(makeCandleData([100, 200]));

      unsubscribe();

      jest.advanceTimersByTime(10000);
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('notifySubscribers (throttling)', () => {
    it('delivers without throttle when throttleMs is 0', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
        throttleMs: 0,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;

      sourceCallback(makeCandleData([100]));
      sourceCallback(makeCandleData([100, 200]));
      sourceCallback(makeCandleData([100, 200, 300]));

      expect(cb).toHaveBeenCalledTimes(3);
    });

    it('delivers first update immediately then throttles subsequent ones', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
        throttleMs: 2000,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;

      sourceCallback(makeCandleData([100]));
      expect(cb).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      sourceCallback(makeCandleData([100, 200]));
      expect(cb).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1500);
      expect(cb).toHaveBeenCalledTimes(2);
    });

    it('delivers latest cached data when throttle timer fires', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
        throttleMs: 2000,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;

      sourceCallback(makeCandleData([100]));
      expect(cb).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      sourceCallback(makeCandleData([100, 200]));

      jest.advanceTimersByTime(200);
      const latestData = makeCandleData([100, 200, 300]);
      sourceCallback(latestData);

      jest.advanceTimersByTime(1300);
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenLastCalledWith(latestData);
    });

    it('does not schedule duplicate throttle timers', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
        throttleMs: 2000,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;

      sourceCallback(makeCandleData([100]));
      jest.advanceTimersByTime(500);

      sourceCallback(makeCandleData([100, 200]));
      sourceCallback(makeCandleData([100, 200, 300]));
      sourceCallback(makeCandleData([100, 200, 300, 400]));

      jest.advanceTimersByTime(1500);
      expect(cb).toHaveBeenCalledTimes(2);
    });

    it('delivers immediately once throttle window has elapsed', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
        throttleMs: 1000,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;

      sourceCallback(makeCandleData([100]));
      expect(cb).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1100);
      const data2 = makeCandleData([100, 200]);
      sourceCallback(data2);
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenLastCalledWith(data2);
    });
  });

  describe('fetchHistoricalCandles', () => {
    it('returns early when no controller is set', async () => {
      const fresh = new CandleStreamChannel();
      await fresh.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      expect(controller.fetchHistoricalCandles).not.toHaveBeenCalled();
      fresh.clearAll();
    });

    it('returns early when no cache exists for the key', async () => {
      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      expect(controller.fetchHistoricalCandles).not.toHaveBeenCalled();
    });

    it('returns early when cache has no candles', async () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      sourceCallback({ candles: [] } as unknown as CandleData);

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      expect(controller.fetchHistoricalCandles).not.toHaveBeenCalled();
    });

    it('fetches older candles and merges them into cache', async () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      sourceCallback(makeCandleData([500, 600, 700]));
      cb.mockClear();

      controller.fetchHistoricalCandles.mockResolvedValue(
        makeCandleData([200, 300, 400]),
      );

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      expect(controller.fetchHistoricalCandles).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC',
          interval: CandlePeriod.OneHour,
          endTime: 499,
        }),
      );

      expect(cb).toHaveBeenCalledTimes(1);
      const merged = cb.mock.calls[0][0] as CandleData;
      expect(merged.candles.map((c) => c.time)).toEqual([
        200, 300, 400, 500, 600, 700,
      ]);
    });

    it('deduplicates candles by timestamp', async () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      sourceCallback(makeCandleData([300, 400, 500]));
      cb.mockClear();

      controller.fetchHistoricalCandles.mockResolvedValue(
        makeCandleData([200, 300, 400]),
      );

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      const merged = cb.mock.calls[0][0] as CandleData;
      expect(merged.candles.map((c) => c.time)).toEqual([200, 300, 400, 500]);
    });

    it('caps candles at MAX_CANDLES_IN_MEMORY (1000)', async () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      const existingTimes = Array.from({ length: 800 }, (_, i) => 1000 + i);
      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      sourceCallback(makeCandleData(existingTimes));
      cb.mockClear();

      const olderTimes = Array.from({ length: 400 }, (_, i) => 500 + i);
      controller.fetchHistoricalCandles.mockResolvedValue(
        makeCandleData(olderTimes),
      );

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.Max,
      );

      const merged = cb.mock.calls[0][0] as CandleData;
      expect(merged.candles).toHaveLength(1000);
      expect(merged.candles[merged.candles.length - 1].time).toBe(1799);
    });

    it('returns early when fetch returns no candles', async () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      sourceCallback(makeCandleData([100]));
      cb.mockClear();

      controller.fetchHistoricalCandles.mockResolvedValue({
        candles: [],
      });

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      expect(cb).not.toHaveBeenCalled();
    });

    it('returns early when fetch returns null', async () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      sourceCallback(makeCandleData([100]));
      cb.mockClear();

      controller.fetchHistoricalCandles.mockResolvedValue(null);

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      expect(cb).not.toHaveBeenCalled();
    });

    it('logs error and does not throw on fetch failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      sourceCallback(makeCandleData([100]));

      controller.fetchHistoricalCandles.mockRejectedValue(new Error('network'));

      await expect(
        channel.fetchHistoricalCandles(
          'BTC',
          CandlePeriod.OneHour,
          TimeDuration.OneDay,
        ),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('fetchHistoricalCandles failed'),
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('clamps fetch limit between 50 and 500', async () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      sourceCallback(makeCandleData([100]));

      controller.fetchHistoricalCandles.mockResolvedValue(null);

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneHour,
      );

      const limit = controller.fetchHistoricalCandles.mock.calls[0][0]
        .limit as number;
      expect(limit).toBeGreaterThanOrEqual(50);
      expect(limit).toBeLessThanOrEqual(500);
    });
  });

  describe('reconnect', () => {
    it('re-establishes subscriptions for channels with active subscribers', () => {
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);

      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);

      channel.reconnect();

      expect(unsub).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(2);
    });

    it('does not reconnect channels with no subscribers', () => {
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);

      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      unsubscribe();
      controller.subscribeToCandles.mockClear();

      channel.reconnect();

      expect(controller.subscribeToCandles).not.toHaveBeenCalled();
    });

    it('does nothing when no controller is set', () => {
      const fresh = new CandleStreamChannel();
      fresh.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(() => fresh.reconnect()).not.toThrow();
      fresh.clearAll();
    });

    it('reconnects channels that have no existing source unsub', () => {
      controller.subscribeToCandles.mockReturnValue(null);

      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);

      channel.reconnect();
      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearAll', () => {
    it('disconnects all channels and clears the controller', () => {
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);

      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      channel.subscribe({
        symbol: 'ETH',
        interval: CandlePeriod.OneDay,
        callback: jest.fn(),
      });

      channel.clearAll();

      expect(unsub).toHaveBeenCalledTimes(2);
    });

    it('clears pending throttle timers', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
        throttleMs: 5000,
      });

      const sourceCallback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: CandleData) => void;
      sourceCallback(makeCandleData([100]));

      jest.advanceTimersByTime(1000);
      sourceCallback(makeCandleData([100, 200]));

      channel.clearAll();

      jest.advanceTimersByTime(10000);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('prevents new subscriptions from connecting after clear', () => {
      channel.clearAll();

      const fresh = new CandleStreamChannel();
      fresh.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(controller.subscribeToCandles).not.toHaveBeenCalled();
      fresh.clearAll();
    });
  });
});
