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

const DEBOUNCE_MS = 500;
const DISCONNECT_GRACE_MS = 5_000;

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
    it('calls perpsActivateCandleStream after debounce on first subscriber', () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();

      jest.advanceTimersByTime(DEBOUNCE_MS);

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
      jest.advanceTimersByTime(DEBOUNCE_MS);

      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      jest.advanceTimersByTime(DEBOUNCE_MS);

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

      jest.advanceTimersByTime(DEBOUNCE_MS);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
    });

    it('deactivates only the key whose last subscriber left after grace period', () => {
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

      jest.advanceTimersByTime(DEBOUNCE_MS);
      mockSubmitRequestToBackground.mockClear();

      unsubBtc();

      // Deactivation is deferred behind the disconnect grace timer
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        expect.anything(),
      );

      jest.advanceTimersByTime(DISCONNECT_GRACE_MS);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        [{ symbol: 'BTC', interval: CandlePeriod.OneHour }],
      );
    });

    it('cancels debounce and skips deactivation on rapid subscribe/unsubscribe', () => {
      const unsub = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      // Unsubscribe before debounce fires
      unsub();
      jest.advanceTimersByTime(DEBOUNCE_MS);

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        expect.anything(),
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

    it('reports whether cached candles exist for a symbol and interval', () => {
      expect(channel.hasCachedCandles('BTC', CandlePeriod.OneHour)).toBe(false);

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });

      expect(channel.hasCachedCandles('BTC', CandlePeriod.OneHour)).toBe(true);
      expect(channel.hasCachedCandles('ETH', CandlePeriod.OneHour)).toBe(false);
    });

    it('uses a light cold-start duration for a brand-new chart open', () => {
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        duration: TimeDuration.YearToDate,
        callback: jest.fn(),
      });

      jest.advanceTimersByTime(DEBOUNCE_MS);

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

    it('uses an even lighter duration when cached candles already exist', () => {
      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([100, 200]),
      });

      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        duration: TimeDuration.YearToDate,
        callback: jest.fn(),
      });

      jest.advanceTimersByTime(DEBOUNCE_MS);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        [
          expect.objectContaining({
            symbol: 'BTC',
            interval: CandlePeriod.OneHour,
            duration: TimeDuration.OneHour,
          }),
        ],
      );
    });
  });

  describe('unsubscribe', () => {
    it('cancels disconnect grace timer and keeps stream alive on re-subscribe', () => {
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      jest.advanceTimersByTime(DEBOUNCE_MS);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      mockSubmitRequestToBackground.mockClear();

      unsubscribe();

      // Deactivation should not fire immediately
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        expect.anything(),
      );

      // Re-subscribe before grace period expires — stream stays alive
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      jest.advanceTimersByTime(DISCONNECT_GRACE_MS);

      // No deactivation or re-activation should have occurred
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('deactivates and re-activates when re-subscribe happens after grace period', () => {
      const unsubscribe = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      jest.advanceTimersByTime(DEBOUNCE_MS);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      mockSubmitRequestToBackground.mockClear();

      unsubscribe();
      jest.advanceTimersByTime(DISCONNECT_GRACE_MS);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        [{ symbol: 'BTC', interval: CandlePeriod.OneHour }],
      );
      mockSubmitRequestToBackground.mockClear();

      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });

      jest.advanceTimersByTime(DEBOUNCE_MS);
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

      jest.advanceTimersByTime(DEBOUNCE_MS);
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

      jest.advanceTimersByTime(DEBOUNCE_MS);
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
      jest.advanceTimersByTime(DEBOUNCE_MS);
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
      jest.advanceTimersByTime(DEBOUNCE_MS);
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

    it('discards result when key is disconnected during fetch', async () => {
      const cb = jest.fn();
      const unsub = channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });
      jest.advanceTimersByTime(DEBOUNCE_MS);
      mockSubmitRequestToBackground.mockClear();

      channel.pushFromBackground({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: makeCandleData([500, 600, 700]),
      });
      cb.mockClear();

      let resolveHistorical!: (value: CandleData) => void;
      mockSubmitRequestToBackground.mockReturnValueOnce(
        new Promise<CandleData>((resolve) => {
          resolveHistorical = resolve;
        }),
      );

      const fetchPromise = channel.fetchHistoricalCandles(
        'BTC',
        CandlePeriod.OneHour,
        TimeDuration.OneDay,
      );

      unsub();
      // Advance past the grace period to actually disconnect
      jest.advanceTimersByTime(DISCONNECT_GRACE_MS);

      resolveHistorical(makeCandleData([200, 300, 400]));
      await fetchPromise;

      expect(cb).not.toHaveBeenCalled();
    });

    it('deduplicates candles by timestamp', async () => {
      const cb = jest.fn();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: cb,
      });
      jest.advanceTimersByTime(DEBOUNCE_MS);
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
      jest.advanceTimersByTime(DEBOUNCE_MS);
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
      jest.advanceTimersByTime(DEBOUNCE_MS);
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
      jest.advanceTimersByTime(DEBOUNCE_MS);
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
      jest.advanceTimersByTime(DEBOUNCE_MS);
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
      jest.advanceTimersByTime(DEBOUNCE_MS);
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

      jest.advanceTimersByTime(DEBOUNCE_MS);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      mockSubmitRequestToBackground.mockClear();

      channel.reconnect();
      jest.advanceTimersByTime(DEBOUNCE_MS);

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

      jest.advanceTimersByTime(DEBOUNCE_MS);
      unsubscribe();
      // Advance past the grace period so the channel fully disconnects
      jest.advanceTimersByTime(DISCONNECT_GRACE_MS);
      mockSubmitRequestToBackground.mockClear();

      channel.reconnect();
      jest.advanceTimersByTime(DEBOUNCE_MS);

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsActivateCandleStream',
        expect.anything(),
      );
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

      jest.advanceTimersByTime(DEBOUNCE_MS);
      channel.clearAll();

      mockSubmitRequestToBackground.mockClear();
      channel.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback: jest.fn(),
      });
      jest.advanceTimersByTime(DEBOUNCE_MS);
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
