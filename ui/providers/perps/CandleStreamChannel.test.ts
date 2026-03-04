import type { CandleData } from '@metamask/perps-controller';
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

// Mock submitRequestToBackground
const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

function makeCandle(time: number): CandleData['candles'][number] {
  return {
    time,
    open: '1',
    high: '2',
    low: '0.5',
    close: '1.5',
    volume: '100',
  };
}

function makeCandleData(times: number[]): CandleData {
  return { candles: times.map(makeCandle) } as CandleData;
}

describe('CandleStreamChannel', () => {
  let channel: CandleStreamChannel;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    channel = new CandleStreamChannel();
  });

  afterEach(() => {
    channel.clearAll();
    jest.useRealTimers();
  });

  describe('subscribe', () => {
    it('calls perpsActivateStreaming on first subscriber', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateStreaming',
        [
          expect.objectContaining({
            candle: expect.objectContaining({
              symbol: 'BTC',
              interval: CandlePeriod.OneHour,
            }),
          }),
        ],
      );
    });

    it('does not activate streaming twice for the same key', () => {
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

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    });

    it('activates streaming for different keys', () => {
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

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
    });

    it('delivers cached data immediately to a new subscriber', () => {
      const cb1 = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb1,
      });

      const data = makeCandleData([100, 200]);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data,
      });

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

    it('passes duration in perpsActivateStreaming call', () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        duration: TimeDuration.OneDay,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateStreaming',
        [
          expect.objectContaining({
            candle: expect.objectContaining({ duration: TimeDuration.OneDay }),
          }),
        ],
      );
    });
  });

  describe('unsubscribe', () => {
    it('re-activates streaming when last subscriber unsubscribes and re-subscribes', () => {
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      mockSubmitRequestToBackground.mockClear();

      unsubscribe();

      // Re-subscribe — should activate streaming again
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    });

    it('does not re-activate when other subscribers remain', () => {
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

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      mockSubmitRequestToBackground.mockClear();

      unsubscribe1();
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
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

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });
      expect(cb).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });

      unsubscribe();

      jest.advanceTimersByTime(10000);
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('pushFromBackground', () => {
    it('updates cache and notifies subscribers', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      const data = makeCandleData([100, 200]);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data,
      });

      expect(cb).toHaveBeenCalledWith(data);
    });

    it('does not notify subscribers for a different key', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      channel.pushFromBackground({
        symbol: 'ETH',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });

      expect(cb).not.toHaveBeenCalled();
    });

    it('creates a channel entry for an unknown key (for cache)', () => {
      const data = makeCandleData([100, 200]);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data,
      });

      // Subscribe after push — should get cached data
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      expect(cb).toHaveBeenCalledWith(data);
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

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200, 300]),
      });

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

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });
      expect(cb).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });
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

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });
      expect(cb).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });

      jest.advanceTimersByTime(200);
      const latestData = makeCandleData([100, 200, 300]);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: latestData,
      });

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

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });
      jest.advanceTimersByTime(500);

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200, 300]),
      });
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200, 300, 400]),
      });

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

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });
      expect(cb).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1100);
      const data2 = makeCandleData([100, 200]);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: data2,
      });
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenLastCalledWith(data2);
    });
  });

  describe('fetchHistoricalCandles', () => {
    it('returns early when no cache exists for the key', async () => {
      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsFetchHistoricalCandles',
        expect.anything(),
      );
    });

    it('returns early when cache has no candles', async () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      mockSubmitRequestToBackground.mockClear();

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: { candles: [] } as unknown as CandleData,
      });

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsFetchHistoricalCandles',
        expect.anything(),
      );
    });

    it('fetches older candles and merges them into cache', async () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });
      mockSubmitRequestToBackground.mockClear();

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([500, 600, 700]),
      });
      cb.mockClear();

      mockSubmitRequestToBackground.mockResolvedValueOnce(
        makeCandleData([200, 300, 400]),
      );

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsFetchHistoricalCandles',
        [
          expect.objectContaining({
            symbol: 'BTC',
            interval: CandlePeriod.OneHour,
            endTime: 499,
          }),
        ],
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
      mockSubmitRequestToBackground.mockClear();

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([300, 400, 500]),
      });
      cb.mockClear();

      mockSubmitRequestToBackground.mockResolvedValueOnce(
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
      mockSubmitRequestToBackground.mockClear();

      const existingTimes = Array.from({ length: 800 }, (_, i) => 1000 + i);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData(existingTimes),
      });
      cb.mockClear();

      const olderTimes = Array.from({ length: 400 }, (_, i) => 500 + i);
      mockSubmitRequestToBackground.mockResolvedValueOnce(
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
      mockSubmitRequestToBackground.mockClear();

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });
      cb.mockClear();

      mockSubmitRequestToBackground.mockResolvedValueOnce({ candles: [] });

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
      mockSubmitRequestToBackground.mockClear();

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });
      cb.mockClear();

      mockSubmitRequestToBackground.mockResolvedValueOnce(null);

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
      mockSubmitRequestToBackground.mockClear();

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });

      mockSubmitRequestToBackground.mockRejectedValueOnce(new Error('network'));

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
      mockSubmitRequestToBackground.mockClear();

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });

      mockSubmitRequestToBackground.mockResolvedValueOnce(null);

      await channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneHour,
      );

      const callArgs = mockSubmitRequestToBackground.mock.calls.find(
        (call) => call[0] === 'perpsFetchHistoricalCandles',
      );
      const limit = callArgs?.[1]?.[0]?.limit as number;
      expect(limit).toBeGreaterThanOrEqual(50);
      expect(limit).toBeLessThanOrEqual(500);
    });
  });

  describe('reconnect', () => {
    it('re-activates streaming for channels with active subscribers', () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      mockSubmitRequestToBackground.mockClear();

      channel.reconnect();

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateStreaming',
        expect.anything(),
      );
    });

    it('does not reconnect channels with no subscribers', () => {
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      unsubscribe();
      mockSubmitRequestToBackground.mockClear();

      channel.reconnect();

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('does not throw when there are no channels', () => {
      expect(() => channel.reconnect()).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('clears all channels', () => {
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

      // After clearAll, subscribe should re-activate for new entries
      mockSubmitRequestToBackground.mockClear();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    });

    it('clears pending throttle timers', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
        throttleMs: 5000,
      });

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100]),
      });

      jest.advanceTimersByTime(1000);
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });

      channel.clearAll();

      jest.advanceTimersByTime(10000);
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });
});
