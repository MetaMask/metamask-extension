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
    it('calls perpsActivateCandleStream on first subscriber', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        [
          expect.objectContaining({
            symbol: 'BTC',
            interval: CandlePeriod.OneHour,
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

    it('deactivates only the key whose last subscriber left', () => {
      const unsubBtc = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      channel.subscribe({
        symbol: 'ETH',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      mockSubmitRequestToBackground.mockClear();

      unsubBtc();

      // Deactivation is deferred — not fired yet
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();

      // Advance past the 500ms grace period
      jest.advanceTimersByTime(500);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        [{ symbol: 'BTC', interval: CandlePeriod.OneHour }],
      );
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

    it('passes duration in perpsActivateCandleStream call', () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        duration: TimeDuration.OneDay,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        [
          expect.objectContaining({
            symbol: 'BTC',
            interval: CandlePeriod.OneHour,
            duration: TimeDuration.OneDay,
          }),
        ],
      );
    });

    it('uses OneDay duration on reconnect when cache already exists', () => {
      const unsub1 = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        duration: TimeDuration.OneWeek,
        callback: jest.fn(),
      });

      // Populate cache via pushFromBackground
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });

      mockSubmitRequestToBackground.mockClear();

      // Tear down all subscriptions so the channel disconnects
      unsub1();
      jest.advanceTimersByTime(500);

      // Re-subscribe — cache exists and is fresh, activation is deferred
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        duration: TimeDuration.OneWeek,
        callback: jest.fn(),
      });

      // Advance past the deferred activation delay (2000ms)
      jest.advanceTimersByTime(2000);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        [
          expect.objectContaining({
            symbol: 'BTC',
            interval: CandlePeriod.OneHour,
            duration: TimeDuration.OneDay,
          }),
        ],
      );
    });
  });

  describe('unsubscribe', () => {
    it('deactivates after grace period when last subscriber leaves', () => {
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      mockSubmitRequestToBackground.mockClear();

      unsubscribe();
      // Not fired yet within grace period
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        [{ symbol: 'BTC', interval: CandlePeriod.OneHour }],
      );
    });

    it('cancels deactivation when a new subscriber arrives within grace period', () => {
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      mockSubmitRequestToBackground.mockClear();

      unsubscribe();

      // Re-subscribe before the grace period fires — should cancel deactivation
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      jest.advanceTimersByTime(500);

      // No deactivation, no re-activation — stream was preserved
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        expect.anything(),
      );
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );
    });

    it('re-activates streaming when last subscriber unsubscribes after grace period then re-subscribes', () => {
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      mockSubmitRequestToBackground.mockClear();

      unsubscribe();
      jest.advanceTimersByTime(500);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        [{ symbol: 'BTC', interval: CandlePeriod.OneHour }],
      );
      mockSubmitRequestToBackground.mockClear();

      // Re-subscribe after grace period — should activate streaming again
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );
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
        '[CandleStreamChannel] fetchHistoricalCandles failed for key:',
        'BTC-1h',
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

  describe('connect error handling', () => {
    it('calls onError on all subscribers when perpsActivateCandleStream rejects', async () => {
      const error = new Error('rate limit exceeded');
      mockSubmitRequestToBackground.mockRejectedValueOnce(error);

      const onError1 = jest.fn();
      const onError2 = jest.fn();

      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
        onError: onError1,
      });
      // Second subscriber for the same key — connect is already in-flight
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
        onError: onError2,
      });

      // Flush the microtask queue so the Promise rejection propagates
      await Promise.resolve();

      expect(onError1).toHaveBeenCalledWith(error);
      expect(onError2).toHaveBeenCalledWith(error);
    });

    it('wraps non-Error rejections in an Error object', async () => {
      mockSubmitRequestToBackground.mockRejectedValueOnce('string rejection');

      const onError = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
        onError,
      });

      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      const [err] = onError.mock.calls[0] as [Error];
      expect(err.message).toBe('string rejection');
    });

    it('does not call onError when activation succeeds', async () => {
      const onError = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
        onError,
      });

      await Promise.resolve();

      expect(onError).not.toHaveBeenCalled();
    });

    it('sets isConnected to false after activation failure so re-subscribe can retry', async () => {
      mockSubmitRequestToBackground.mockRejectedValueOnce(
        new Error('network error'),
      );

      const cb = jest.fn();
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
        onError: jest.fn(),
      });

      await Promise.resolve();
      // Clear the activation call from the first subscribe
      mockSubmitRequestToBackground.mockClear();

      // Unsubscribe so the channel is torn down
      unsubscribe();
      jest.advanceTimersByTime(500);

      // Re-subscribe — channel was disconnected, so it should try to activate again
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );
    });

    it('does not call onError when subscriber is not provided an onError callback', async () => {
      mockSubmitRequestToBackground.mockRejectedValueOnce(
        new Error('unexpected'),
      );

      // Should not throw even without onError
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      await expect(Promise.resolve()).resolves.toBeUndefined();
    });
  });

  describe('fresh-cache deferred activation', () => {
    it('defers perpsActivateCandleStream when cache is fresh', () => {
      // First subscribe + populate cache
      const unsub = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });

      // Tear down so channel disconnects
      unsub();
      jest.advanceTimersByTime(500);
      mockSubmitRequestToBackground.mockClear();

      // Re-subscribe — cache is fresh, should NOT call activate immediately
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );

      // After deferred activation delay (2000ms), it should fire
      jest.advanceTimersByTime(2000);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );
    });

    it('delivers cached data immediately even when activation is deferred', () => {
      const cb1 = jest.fn();
      const unsub = channel.subscribe({
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

      unsub();
      jest.advanceTimersByTime(500);

      // Re-subscribe with fresh cache — should get cached data immediately
      const cb2 = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb2,
      });

      expect(cb2).toHaveBeenCalledWith(data);
    });

    it('activates immediately when cache is stale (> 30s old)', () => {
      const unsub = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });

      unsub();
      jest.advanceTimersByTime(500);
      mockSubmitRequestToBackground.mockClear();

      // Advance past the cache freshness window (30s)
      jest.advanceTimersByTime(30_000);

      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      // Should activate immediately since cache is stale
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );
    });

    it('cancels deferred activation if subscriber leaves before it fires', () => {
      const unsub1 = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });

      unsub1();
      jest.advanceTimersByTime(500);
      mockSubmitRequestToBackground.mockClear();

      // Re-subscribe with fresh cache (deferred activation scheduled)
      const unsub2 = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      // Leave before deferred activation fires
      unsub2();
      jest.advanceTimersByTime(500); // disconnect grace
      jest.advanceTimersByTime(2000); // deferred activation window

      // Should NOT have called activate — subscriber left
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );
    });

    it('activates immediately on first visit (no cache)', () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      // No cache populated — should activate immediately
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );
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
        'perpsActivateCandleStream',
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
