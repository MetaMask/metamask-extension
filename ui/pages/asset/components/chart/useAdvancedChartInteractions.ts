import { useCallback, useEffect, useRef } from 'react';
import { useChartAnalytics } from './useChartAnalytics';

type UseAdvancedChartInteractionsParams = {
  /** Active chart type, as the numeric `CHART_TYPE_*` value. */
  chartType: number;
  /** Currently active indicator names. */
  indicators: Set<string>;
  /** Whether the chart is in line mode. */
  isLineChart: boolean;
  /** CAIP asset id, absent for assets the price API cannot identify. */
  caipAssetId?: string;
  /** Whether the candle (OHLCV) history is still loading. */
  isOhlcvLoading: boolean;
  /** Whether the candle chart is in an error state. */
  candleFailed: boolean;
  /** Number of loaded candles. */
  ohlcvBarCount: number;
  setChartType: (type: number) => void;
  setLineTimeRange: (range: string) => void;
  setCandleInterval: (interval: string) => void;
  toggleIndicator: (name: string) => void;
};

/**
 * Builds the chart's interaction handlers and tracks the empty-candle state,
 * keeping that wiring out of the section component. Each handler both performs
 * its UI action and reports the matching `Chart Interacted` event; the
 * empty-state effect reports `Chart Empty Displayed` once per empty episode.
 *
 * @param params - Current chart state and the preference setters to drive.
 * @param params.chartType - Active chart type, as the numeric `CHART_TYPE_*` value.
 * @param params.indicators - Currently active indicator names.
 * @param params.isLineChart - Whether the chart is in line mode.
 * @param params.caipAssetId - CAIP asset id, absent for unidentifiable assets.
 * @param params.isOhlcvLoading - Whether the candle history is still loading.
 * @param params.candleFailed - Whether the candle chart is in an error state.
 * @param params.ohlcvBarCount - Number of loaded candles.
 * @param params.setChartType - Sets the active chart type.
 * @param params.setLineTimeRange - Sets the line-mode time range.
 * @param params.setCandleInterval - Sets the candle-mode interval.
 * @param params.toggleIndicator - Toggles an indicator on or off.
 * @returns The handlers the section wires into its toolbar, iframe, and bars.
 */
export function useAdvancedChartInteractions({
  chartType,
  indicators,
  isLineChart,
  caipAssetId,
  isOhlcvLoading,
  candleFailed,
  ohlcvBarCount,
  setChartType,
  setLineTimeRange,
  setCandleInterval,
  toggleIndicator,
}: UseAdvancedChartInteractionsParams) {
  const { trackChartInteraction, trackChartEmptyDisplayed } = useChartAnalytics(
    {
      chartType,
      indicators,
    },
  );

  const handleChartTypeSelect = useCallback(
    (next: number) => {
      if (next === chartType) {
        return;
      }
      // Report the newly selected type, not the one still in state.
      trackChartInteraction({
        interactionType: 'chart_type_changed',
        chartType: next,
      });
      setChartType(next);
    },
    [chartType, setChartType, trackChartInteraction],
  );

  const handleLineTimeRangeSelect = useCallback(
    (next: string) => {
      trackChartInteraction({
        interactionType: 'timeframe_changed',
        chartTimeframe: next,
      });
      setLineTimeRange(next);
    },
    [setLineTimeRange, trackChartInteraction],
  );

  const handleCandleIntervalSelect = useCallback(
    (next: string) => {
      trackChartInteraction({
        interactionType: 'granularity_changed',
        chartGranularity: next.toLowerCase(),
      });
      setCandleInterval(next);
    },
    [setCandleInterval, trackChartInteraction],
  );

  const handleIndicatorToggle = useCallback(
    (name: string) => {
      // The pills apply immediately (there is no Done button), so each click
      // emits one event in the on or off direction with the post-toggle set.
      const wasActive = indicators.has(name);
      const nextIndicators = new Set(indicators);
      if (wasActive) {
        nextIndicators.delete(name);
      } else {
        nextIndicators.add(name);
      }
      trackChartInteraction({
        interactionType: 'indicator_toggled',
        indicatorType: name,
        indicatorAction: wasActive ? 'off' : 'on',
        indicatorsActive: [...nextIndicators],
      });
      toggleIndicator(name);
    },
    [indicators, toggleIndicator, trackChartInteraction],
  );

  const handleMASelectorOpen = useCallback(() => {
    trackChartInteraction({
      interactionType: 'indicator_selector_opened',
      selectorType: 'moving_averages',
    });
  }, [trackChartInteraction]);

  const handleChartInteracted = useCallback(
    (interactionType: 'zoom' | 'pan' | 'tooltip') => {
      trackChartInteraction({ interactionType });
    },
    [trackChartInteraction],
  );

  const handleTradingViewClicked = useCallback(() => {
    trackChartInteraction({ interactionType: 'tradingview_clicked' });
  }, [trackChartInteraction]);

  // A completed candle fetch that returned no bars. Load failures are
  // deliberately excluded: the event describes a chart that loaded without
  // enough data, not one that errored. Scoped to candle mode because only
  // there does the OHLCV series drive what is on screen.
  const isChartEmpty =
    !isLineChart &&
    Boolean(caipAssetId) &&
    !isOhlcvLoading &&
    !candleFailed &&
    ohlcvBarCount === 0;

  const chartEmptyTrackedRef = useRef(false);
  useEffect(() => {
    if (!isChartEmpty) {
      // Reset so a later empty episode is reported again.
      chartEmptyTrackedRef.current = false;
      return;
    }
    if (chartEmptyTrackedRef.current) {
      return;
    }
    chartEmptyTrackedRef.current = true;
    trackChartEmptyDisplayed();
  }, [isChartEmpty, trackChartEmptyDisplayed]);

  return {
    handleChartTypeSelect,
    handleLineTimeRangeSelect,
    handleCandleIntervalSelect,
    handleIndicatorToggle,
    handleMASelectorOpen,
    handleChartInteracted,
    handleTradingViewClicked,
  };
}
