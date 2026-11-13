import { useCallback } from 'react';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { CHART_TYPE_CANDLE } from './advanced-chart-interval-bar';

/**
 * Interaction types carried by the `Chart Interacted` event.
 *
 * Mirrors mobile's `interaction_type` enum so both platforms report into the
 * same Segment schema.
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
   * Overrides the active-indicator list for cases where the value at the time
   * of the interaction differs from current state, e.g. the post-toggle set on
   * `indicator_toggled`.
   */
  indicatorsActive?: string[];
};

/**
 * Chart analytics for the Token Details Page advanced chart.
 *
 * A single place that builds both chart events. It owns the two properties
 * shared across every `Chart Interacted` call (`chart_type` and
 * `indicators_active`) so call sites pass only what is specific to their
 * interaction.
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

      // Fire-and-forget: trackEvent already swallows its own errors, so the
      // trailing no-op .catch just marks the promise as intentionally
      // unawaited (the repo forbids the `void` operator).
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
      ).catch(() => undefined);
    },
    [chartType, createEventBuilder, indicators, trackEvent],
  );

  const trackChartEmptyDisplayed = useCallback(() => {
    // Fire-and-forget, as above.
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ChartEmptyDisplayed).build(),
    ).catch(() => undefined);
  }, [createEventBuilder, trackEvent]);

  return { trackChartInteraction, trackChartEmptyDisplayed };
}
