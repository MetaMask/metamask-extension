import { renderHook } from '@testing-library/react';
import { useOHLCVPriceData } from './useOHLCVPriceData';
import type { OHLCVBar } from './useOHLCVChart';

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
        createBar(1700000000, 100, 105),
        createBar(1700003600, 105, 110),
        createBar(1700007200, 110, 120),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.price).toBe(120); // Latest bar's close
    });

    it('returns latest bar timestamp', () => {
      const bars = [
        createBar(1700000000, 100, 105),
        createBar(1700003600, 105, 110),
        createBar(1700007200, 110, 120),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.timestamp).toBe(1700007200);
    });
  });

  describe('percentChange calculation', () => {
    it('calculates positive percent change correctly', () => {
      // First bar open: 100, Latest bar close: 120
      // Expected: ((120 - 100) / 100) * 100 = 20%
      const bars = [
        createBar(1700000000, 100, 105),
        createBar(1700003600, 105, 110),
        createBar(1700007200, 110, 120),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.percentChange).toBe(20);
    });

    it('calculates negative percent change correctly', () => {
      // First bar open: 100, Latest bar close: 80
      // Expected: ((80 - 100) / 100) * 100 = -20%
      const bars = [
        createBar(1700000000, 100, 95),
        createBar(1700003600, 95, 90),
        createBar(1700007200, 90, 80),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.percentChange).toBe(-20);
    });

    it('returns 0 percent change when price unchanged', () => {
      // First bar open: 100, Latest bar close: 100
      const bars = [
        createBar(1700000000, 100, 105),
        createBar(1700003600, 105, 100),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.percentChange).toBe(0);
    });

    it('returns undefined percent change when first bar open is 0', () => {
      // Guard against division by zero
      const bars = [
        createBar(1700000000, 0, 100),
        createBar(1700003600, 100, 150),
      ];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.percentChange).toBeUndefined();
    });
  });

  describe('single bar', () => {
    it('handles single bar data', () => {
      // First bar open: 100, Same bar close: 105
      // Expected: ((105 - 100) / 100) * 100 = 5%
      const bars = [createBar(1700000000, 100, 105)];

      const { result } = renderHook(() => useOHLCVPriceData(bars));

      expect(result.current.price).toBe(105);
      expect(result.current.percentChange).toBe(5);
      expect(result.current.timestamp).toBe(1700000000);
    });
  });

  describe('memoization', () => {
    it('returns same reference when data unchanged', () => {
      const bars = [
        createBar(1700000000, 100, 105),
        createBar(1700003600, 105, 110),
      ];

      const { result, rerender } = renderHook(() => useOHLCVPriceData(bars));
      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
    });

    it('returns new reference when data changes', () => {
      const bars1 = [createBar(1700000000, 100, 105)];
      const bars2 = [createBar(1700000000, 100, 110)];

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
