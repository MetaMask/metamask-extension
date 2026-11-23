import { renderHook } from '@testing-library/react';
import { useOHLCVPriceData } from './useOHLCVPriceData';
import type { OHLCVBar } from './useOHLCVChart';

const HOUR_MS = 60 * 60 * 1000;
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

  describe('price', () => {
    it('returns undefined values when ohlcvData is empty', () => {
      const { result } = renderHook(() => useOHLCVPriceData([]));

      expect(result.current.price).toBeUndefined();
      expect(result.current.timestamp).toBeUndefined();
    });

    it('returns the latest close as price', () => {
      const bars = [
        createBar(BASE_TIME, 100, 105),
        createBar(BASE_TIME + HOUR_MS, 105, 110),
        createBar(BASE_TIME + 2 * HOUR_MS, 110, 120),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.price).toBe(120);
    });

    it('returns the latest bar timestamp', () => {
      const bars = [
        createBar(BASE_TIME, 100, 105),
        createBar(BASE_TIME + HOUR_MS, 105, 110),
        createBar(BASE_TIME + 2 * HOUR_MS, 110, 120),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.timestamp).toBe(BASE_TIME + 2 * HOUR_MS);
    });

    it('handles single bar data', () => {
      const bars = [createBar(BASE_TIME, 100, 105)];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.price).toBe(105);
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
