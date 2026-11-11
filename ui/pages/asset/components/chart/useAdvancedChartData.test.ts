import { renderHook } from '@testing-library/react';
import { useAdvancedChartData } from './useAdvancedChartData';
import { useOHLCVChart, type OHLCVBar } from './useOHLCVChart';
import { useOHLCVRealtime } from './useOHLCVRealtime';

jest.mock('./useOHLCVChart');
jest.mock('./useOHLCVRealtime');

const mockUseOHLCVChart = jest.mocked(useOHLCVChart);
const mockUseOHLCVRealtime = jest.mocked(useOHLCVRealtime);

const bar = (time: number, close: number): OHLCVBar => ({
  time,
  open: close,
  high: close,
  low: close,
  close,
  volume: 1,
});

const HISTORY = [bar(1_700_000_000_000, 10), bar(1_700_003_600_000, 20)];

function setup(
  overrides: {
    chart?: Partial<ReturnType<typeof useOHLCVChart>>;
    realtime?: Partial<ReturnType<typeof useOHLCVRealtime>>;
  } = {},
) {
  mockUseOHLCVChart.mockReturnValue({
    ohlcvData: HISTORY,
    isLoading: false,
    error: null,
    resolvedCurrency: 'eur',
    fetchOlderBars: jest.fn().mockResolvedValue({ bars: [], noData: true }),
    ...overrides.chart,
  });
  mockUseOHLCVRealtime.mockReturnValue({
    latestBar: null,
    ...overrides.realtime,
  });
}

const DEFAULT_OPTIONS = {
  assetId: 'eip155:1/slip44:60',
  interval: '15m',
  currency: 'EUR',
  needsHistory: true,
};

describe('useAdvancedChartData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setup();
  });

  describe('fetch gating', () => {
    it('fetches the candle history when the caller will plot it', () => {
      renderHook(() => useAdvancedChartData(DEFAULT_OPTIONS));

      expect(mockUseOHLCVChart).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
      );
    });

    it('skips the candle history in line mode, where nothing plots it', () => {
      renderHook(() =>
        useAdvancedChartData({ ...DEFAULT_OPTIONS, needsHistory: false }),
      );

      expect(mockUseOHLCVChart).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it('subscribes to realtime in line mode too, since the line chart shows a live price', () => {
      renderHook(() =>
        useAdvancedChartData({ ...DEFAULT_OPTIONS, needsHistory: false }),
      );

      expect(mockUseOHLCVRealtime).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
      );
    });

    it('stays idle for an asset the price API cannot identify', () => {
      renderHook(() =>
        useAdvancedChartData({ ...DEFAULT_OPTIONS, assetId: undefined }),
      );

      expect(mockUseOHLCVRealtime).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it('requests the realtime channel in lower case, as the channel name expects', () => {
      renderHook(() =>
        useAdvancedChartData({ ...DEFAULT_OPTIONS, currency: 'EUR' }),
      );

      expect(mockUseOHLCVRealtime).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'eur' }),
      );
    });
  });

  // The chart engine applies the live bar itself, so the merge is only
  // observable through the header figures. They must not lag the chart.
  describe('folding the live bar into the header', () => {
    it('reports the live price when the live bar belongs to the last candle', () => {
      setup({ realtime: { latestBar: bar(1_700_003_600_000, 25) } });

      const { result } = renderHook(() =>
        useAdvancedChartData(DEFAULT_OPTIONS),
      );

      expect(result.current.price).toBe(25);
      // The chart engine still gets the unmerged history to seed itself.
      expect(result.current.ohlcvData).toStrictEqual(HISTORY);
    });

    it('reports the live price when the live bar opens a newer candle', () => {
      setup({ realtime: { latestBar: bar(1_700_007_200_000, 30) } });

      const { result } = renderHook(() =>
        useAdvancedChartData(DEFAULT_OPTIONS),
      );

      expect(result.current.price).toBe(30);
      expect(result.current.timestamp).toBe(1_700_007_200_000);
    });

    it('ignores a live bar older than the last candle', () => {
      setup({ realtime: { latestBar: bar(1_600_000_000_000, 5) } });

      const { result } = renderHook(() =>
        useAdvancedChartData(DEFAULT_OPTIONS),
      );

      expect(result.current.price).toBe(20);
    });

    it('reports no header price from a live bar alone, with no history to anchor it', () => {
      setup({
        chart: { ohlcvData: [] },
        realtime: { latestBar: bar(1_700_003_600_000, 25) },
      });

      const { result } = renderHook(() =>
        useAdvancedChartData(DEFAULT_OPTIONS),
      );

      expect(result.current.price).toBeUndefined();
    });
  });

  describe('live price', () => {
    it('exposes the live close and timestamp, which line mode needs without any history', () => {
      setup({
        chart: { ohlcvData: [] },
        realtime: { latestBar: bar(1_700_003_600_000, 25) },
      });

      const { result } = renderHook(() =>
        useAdvancedChartData({ ...DEFAULT_OPTIONS, needsHistory: false }),
      );

      expect(result.current.realtimePrice).toBe(25);
      expect(result.current.realtimeTimestamp).toBe(1_700_003_600_000);
    });

    it('leaves the live price undefined before the first bar arrives', () => {
      const { result } = renderHook(() =>
        useAdvancedChartData(DEFAULT_OPTIONS),
      );

      expect(result.current.realtimePrice).toBeUndefined();
      expect(result.current.realtimeTimestamp).toBeUndefined();
      expect(result.current.realtimeBar).toBeUndefined();
    });
  });

  describe('header figures', () => {
    it('derives the header from the merged series, so header and chart agree', () => {
      setup({ realtime: { latestBar: bar(1_700_003_600_000, 25) } });

      const { result } = renderHook(() =>
        useAdvancedChartData(DEFAULT_OPTIONS),
      );

      expect(result.current.price).toBe(25);
      expect(result.current.timestamp).toBe(1_700_003_600_000);
      // Opened at 10, live at 25.
      expect(result.current.percentChange).toBeCloseTo(150);
    });
  });

  describe('pass-through state', () => {
    it('reports the currency the history actually came back in', () => {
      setup({ chart: { resolvedCurrency: 'usd' } });

      const { result } = renderHook(() =>
        useAdvancedChartData({ ...DEFAULT_OPTIONS, currency: 'XYZ' }),
      );

      expect(result.current.resolvedCurrency).toBe('usd');
    });

    it('surfaces loading and error state from the history fetch', () => {
      setup({ chart: { isLoading: true, error: 'OHLCV API error: 500' } });

      const { result } = renderHook(() =>
        useAdvancedChartData(DEFAULT_OPTIONS),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe('OHLCV API error: 500');
    });
  });
});
