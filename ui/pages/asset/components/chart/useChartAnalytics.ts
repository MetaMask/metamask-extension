import { useCallback } from 'react';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { CHART_TYPE_CANDLE } from './advanced-chart-interval-bar';

/**
 * Interaction types carried by the `Chart Interacted` event.
 *
 * Mirrors the `interaction_type` enum in the segment-schema definition at
 * `libraries/events/metamask-assets/chart-interacted.yaml`.
 */
export type ChartInteractionType =
  | 'zoom'
  | 'pan'
  | 'tooltip'
  | 'chart_type_changed'
  | 'timeframe_changed'
  | 'granularity_changed'
  | 'indicator_toggled'
  | 'indicator_selector_opened'
  | 'tradingview_clicked';

type TrackChartInteractionArgs = {
  interactionType: ChartInteractionType;
  /**
   * Overrides the chart type reported for this interaction. Used by
   * `chart_type_changed`, which reports the newly selected type rather than the
   * one still held in state.
   */
  chartType?: number;
  /** Selected range label on `timeframe_changed`, e.g. `1W`. */
  chartTimeframe?: string;
  /** Selected candle interval on `granularity_changed`, e.g. `15m`. */
  chartGranularity?: string;
  /** Indicator that changed on `indicator_toggled`, e.g. `RSI` or `MA20`. */
  indicatorType?: string;
  indicatorAction?: 'on' | 'off';
  selectorType?: 'moving_averages';
  /**
   * Overrides the active-indicator list, for cases where the value at the time
   * of the interaction differs from current state: the post-toggle set for
   * `indicator_toggled`, and the pre-change set for `indicator_selector_opened`.
   */
  indicatorsActive?: string[];
};

/**
 * Chart analytics for the token details page advanced chart.
 *
 * Owns the two properties shared across every `Chart Interacted` call so that
 * individual call sites pass only what is specific to their interaction.
 *
 * @param options - Current chart state.
 * @param options.chartType - Active chart type, as the numeric `CHART_TYPE_*` value.
 * @param options.indicators - Currently active indicator names.
 * @returns Trackers for the chart events.
 */
export function useChartAnalytics({
  chartType,
  indicators,
}: {
  chartType: number;
  indicators: Set<string>;
}) {
  const { trackEvent, createEventBuilder } = useAnalytics();

  const trackChartInteraction = useCallback(
    ({
      interactionType,
      chartType: chartTypeOverride,
      chartTimeframe,
      chartGranularity,
      indicatorType,
      indicatorAction,
      selectorType,
      indicatorsActive,
    }: TrackChartInteractionArgs) => {
      // Matches mobile, which omits the active-indicator list on timeframe
      // changes. Coherent here too: the range pills only render in line mode,
      // where indicators are hidden.
      const resolvedIndicatorsActive =
        interactionType === 'timeframe_changed'
          ? undefined
          : (indicatorsActive ?? [...indicators]);

      trackEvent(
        createEventBuilder(MetaMetricsEventName.ChartInteracted)
          // Undefined values are stripped by the builder, so optional
          // properties can be passed unconditionally.
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            interaction_type: interactionType,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chart_type:
              (chartTypeOverride ?? chartType) === CHART_TYPE_CANDLE
                ? 'candlestick'
                : 'line',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chart_timeframe: chartTimeframe,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chart_granularity: chartGranularity,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            indicator_type: indicatorType,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            indicator_action: indicatorAction,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            selector_type: selectorType,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            indicators_active: resolvedIndicatorsActive,
          })
          .build(),
      );
    },
    [chartType, createEventBuilder, indicators, trackEvent],
  );

  const trackChartEmptyDisplayed = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ChartEmptyDisplayed).build(),
    );
  }, [createEventBuilder, trackEvent]);

  return { trackChartInteraction, trackChartEmptyDisplayed };
}
