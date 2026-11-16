import { renderHook } from '@testing-library/react';
import { useOHLCVPriceData } from './useOHLCVPriceData';
import type { OHLCVBar } from './useOHLCVChart';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Arbitrary base time in milliseconds (OHLCV bar `time` is ms).
const BASE_TIME = 1_700_000_000_000;

describe('useOHLCVPriceData', () => {
  const createBar = (
    time: number,
    open: number,
    close: number,
    high = Math.max(open, close),
    low = Math.min(open, close),
    volume = 100,
  ): OHLCVBar => ({ time, open, high, low, close, volume });

  describe('price calculation', () => {
    it('returns undefined values when ohlcvData is empty', () => {
      const { result } = renderHook(() => useOHLCVPriceData([]));

      expect(result.current.price).toBeUndefined();
      expect(result.current.percentChange).toBeUndefined();
      expect(result.current.timestamp).toBeUndefined();
    });

    it('returns latest close price as price', () => {
      const bars = [
        createBar(BASE_TIME, 100, 105),
        createBar(BASE_TIME + HOUR_MS, 105, 110),
        createBar(BASE_TIME + 2 * HOUR_MS, 110, 120),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.price).toBe(120); // Latest bar's close
    });

    it('returns latest bar timestamp', () => {
      const bars = [
        createBar(BASE_TIME, 100, 105),
        createBar(BASE_TIME + HOUR_MS, 105, 110),
        createBar(BASE_TIME + 2 * HOUR_MS, 110, 120),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.timestamp).toBe(BASE_TIME + 2 * HOUR_MS);
    });
  });

  describe('percentChange calculation (last 24H)', () => {
    it('measures change against the close ~24h before the last bar, ignoring older bars', () => {
      // Last bar at BASE_TIME + 48h. The bar exactly 24h earlier (close 100) is
      // the baseline; the even older bar (close 50) must be ignored.
      const bars = [
        createBar(BASE_TIME, 40, 50), // > 24h old → ignored
        createBar(BASE_TIME + DAY_MS, 90, 100), // 24h before last → baseline
        createBar(BASE_TIME + 2 * DAY_MS, 110, 120), // latest
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      // ((120 - 100) / 100) * 100 = 20%, not measured from the close of 50.
      expect(result.current.percentChange).toBe(20);
    });

    it('calculates negative percent change correctly', () => {
      const bars = [
        createBar(BASE_TIME + DAY_MS, 110, 100), // baseline close 100
        createBar(BASE_TIME + 2 * DAY_MS, 90, 80), // latest close 80
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      // ((80 - 100) / 100) * 100 = -20%
      expect(result.current.percentChange).toBe(-20);
    });

    it('falls back to the first bar close when history is shorter than 24h', () => {
      // All bars are within 24h, so the first bar's close is the baseline.
      const bars = [
        createBar(BASE_TIME, 95, 100),
        createBar(BASE_TIME + HOUR_MS, 100, 110),
        createBar(BASE_TIME + 2 * HOUR_MS, 110, 120),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      // ((120 - 100) / 100) * 100 = 20%
      expect(result.current.percentChange).toBe(20);
    });

    it('returns 0 percent change when the 24h-ago close equals the latest close', () => {
      const bars = [
        createBar(BASE_TIME + DAY_MS, 90, 100), // baseline close 100
        createBar(BASE_TIME + 2 * DAY_MS, 105, 100), // latest close 100
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.percentChange).toBe(0);
    });

    it('returns undefined percent change when the baseline close is 0', () => {
      // Guard against division by zero.
      const bars = [
        createBar(BASE_TIME + DAY_MS, 0, 0), // baseline close 0
        createBar(BASE_TIME + 2 * DAY_MS, 100, 150), // latest
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.percentChange).toBeUndefined();
    });
  });

  describe('single bar', () => {
    it('handles single bar data (baseline is its own close)', () => {
      const bars = [createBar(BASE_TIME, 100, 105)];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.price).toBe(105);
      expect(result.current.percentChange).toBe(0);
      expect(result.current.timestamp).toBe(BASE_TIME);
    });
  });

  describe('memoization', () => {
    it('returns same reference when data unchanged', () => {
      const bars = [
        createBar(BASE_TIME, 100, 105),
        createBar(BASE_TIME + HOUR_MS, 105, 110),
      ];

      const { result, rerender } = renderHook(() => useOHLCVPriceData(bars));
      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
    });

    it('returns new reference when data changes', () => {
      const bars1 = [createBar(BASE_TIME, 100, 105)];
      const bars2 = [createBar(BASE_TIME, 100, 110)];

      const { result, rerender } = renderHook(
        ({ data }) => useOHLCVPriceData(data),
        { initialProps: { data: bars1 } },
      );
      const firstResult = result.current;

      rerender({ data: bars2 });

      expect(result.current).not.toBe(firstResult);
      expect(result.current.price).toBe(110);
    });
  });
});
