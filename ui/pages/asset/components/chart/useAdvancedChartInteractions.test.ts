import { renderHook, act } from '@testing-library/react';
import {
  CHART_TYPE_CANDLE,
  CHART_TYPE_LINE,
} from './advanced-chart-interval-bar';
import { useAdvancedChartInteractions } from './useAdvancedChartInteractions';

const mockTrackChartInteraction = jest.fn();
const mockTrackChartEmptyDisplayed = jest.fn();

jest.mock('./useChartAnalytics', () => ({
  useChartAnalytics: () => ({
    trackChartInteraction: mockTrackChartInteraction,
    trackChartEmptyDisplayed: mockTrackChartEmptyDisplayed,
  }),
}));

type Overrides = Partial<Parameters<typeof useAdvancedChartInteractions>[0]>;

function setup(overrides?: Overrides) {
  const setChartType = jest.fn();
  const setLineTimeRange = jest.fn();
  const setCandleInterval = jest.fn();
  const applyToggleCandle = jest.fn();
  const toggleIndicator = jest.fn();

  const { result } = renderHook(() =>
    useAdvancedChartInteractions({
      chartType: CHART_TYPE_CANDLE,
      interval: '1m',
      displayInterval: '1m',
      lineTimeRange: '1D',
      indicators: new Set<string>(),
      isLineChart: false,
      caipAssetId: 'eip155:1/slip44:60',
      isOhlcvLoading: false,
      candleFailed: false,
      ohlcvBarCount: 10,
      setChartType,
      setLineTimeRange,
      setCandleInterval,
      applyToggleCandle,
      toggleIndicator,
      ...overrides,
    }),
  );

  return {
    result,
    setChartType,
    setLineTimeRange,
    setCandleInterval,
    applyToggleCandle,
    toggleIndicator,
  };
}

describe('useAdvancedChartInteractions', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('handleChartTypeSelect', () => {
    it('does nothing when the chart type is unchanged', () => {
      const { result, setChartType, setLineTimeRange, applyToggleCandle } =
        setup({ chartType: CHART_TYPE_CANDLE });

      act(() => result.current.handleChartTypeSelect(CHART_TYPE_CANDLE));

      expect(setChartType).not.toHaveBeenCalled();
      expect(setLineTimeRange).not.toHaveBeenCalled();
      expect(applyToggleCandle).not.toHaveBeenCalled();
    });

    it('seeds the nearest line range from the candle window on candle -> line', () => {
      const { result, setLineTimeRange, setChartType } = setup({
        chartType: CHART_TYPE_CANDLE,
        displayInterval: '1m',
      });

      act(() => result.current.handleChartTypeSelect(CHART_TYPE_LINE));

      // 1m candles open on a ~1h window, whose nearest line range is 1H.
      expect(setLineTimeRange).toHaveBeenCalledWith('1H');
      expect(setChartType).toHaveBeenCalledWith(CHART_TYPE_LINE);
    });

    it('keeps the saved interval on line -> candle when it fits the span', () => {
      const { result, applyToggleCandle } = setup({
        chartType: CHART_TYPE_LINE,
        isLineChart: true,
        interval: '1m',
        lineTimeRange: '1H',
      });

      act(() => result.current.handleChartTypeSelect(CHART_TYPE_CANDLE));

      expect(applyToggleCandle).toHaveBeenCalledWith('1m');
    });

    it('steps the interval on line -> candle when the saved one is too fine for the span', () => {
      const { result, applyToggleCandle } = setup({
        chartType: CHART_TYPE_LINE,
        isLineChart: true,
        interval: '1m',
        lineTimeRange: '1Y',
      });

      act(() => result.current.handleChartTypeSelect(CHART_TYPE_CANDLE));

      // A year at 1m busts the cap, so it steps to the nearest-window interval.
      expect(applyToggleCandle).toHaveBeenCalledWith('1w');
    });

    it('tracks the newly selected chart type', () => {
      const { result } = setup({ chartType: CHART_TYPE_CANDLE });

      act(() => result.current.handleChartTypeSelect(CHART_TYPE_LINE));

      expect(mockTrackChartInteraction).toHaveBeenCalledWith(
        expect.objectContaining({
          interactionType: 'chart_type_changed',
          chartType: CHART_TYPE_LINE,
        }),
      );
    });
  });
});
