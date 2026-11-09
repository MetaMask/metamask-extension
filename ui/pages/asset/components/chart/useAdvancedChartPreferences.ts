import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getTdpChartType,
  getTdpChartInterval,
  getTdpChartIndicators,
} from '../../../../../shared/lib/selectors/preferences';
import type { Preferences } from '../../../../../shared/types/preferences';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { CHART_TYPE_LINE } from './advanced-chart-interval-bar';

/** Default time range for line chart mode (matches mobile). */
const DEFAULT_LINE_TIME_RANGE = '1D';

/**
 * Writes one preference through the PreferencesController.
 *
 * The namespaced messenger action is the only registered entry point. A bare
 * `setPreference` reaches the legacy background API, which has no such method,
 * and comes back as `methodNotFound`.
 *
 * @param key - The preference to write.
 * @param value - Its new value.
 */
function persistPreference<Key extends keyof Preferences>(
  key: Key,
  value: Preferences[Key],
): void {
  submitRequestToBackground('PreferencesController:setPreference', [
    key,
    value,
  ]).catch((error) => {
    // Nothing useful to do for the user: the chart still works, it just
    // forgets. Logged rather than swallowed because a silent write failure is
    // indistinguishable from the preference never having been set.
    console.error(`Failed to persist ${key}`, error);
  });
}

/**
 * React hook for managing Token Details Page Advanced Chart preferences.
 *
 * Chart type, interval and indicator selection round-trip through
 * PreferencesController, so they survive navigating between tokens and
 * reopening the extension. Preferences are global rather than per-token,
 * matching mobile.
 *
 * The line chart's time range is deliberately not persisted, also matching
 * mobile: it resets to 1D each time the page is opened.
 *
 * @returns Object containing chart preferences and setter functions:
 * - chartType: Current chart type (1 = Candle, 2 = Line)
 * - interval: Current interval ('15m', '1h', etc.) for candle mode
 * - lineTimeRange: Current time range ('1H', '1D', etc.) for line mode
 * - indicators: Set of active indicator names
 * - setChartType: Update chart type
 * - setCandleInterval: Update interval (candle mode)
 * - setLineTimeRange: Update time range (line mode)
 * - toggleIndicator: Toggle indicator on/off
 * - isLineChart: Convenience flag for line chart
 */
export function useAdvancedChartPreferences() {
  const chartType = useSelector(getTdpChartType);
  const interval = useSelector(getTdpChartInterval);
  const persistedIndicators = useSelector(getTdpChartIndicators);

  const [lineTimeRange, setLineTimeRange] = useState<string>(
    DEFAULT_LINE_TIME_RANGE,
  );

  // Memoized so consumers can use the set as an effect dependency.
  const indicators = useMemo(
    () => new Set(persistedIndicators),
    [persistedIndicators],
  );

  const setChartType = useCallback((next: number) => {
    persistPreference('tdpChartType', next);
  }, []);

  const setCandleInterval = useCallback((next: string) => {
    persistPreference('tdpChartInterval', next);
  }, []);

  // `next` is computed outside any state updater: React may invoke an updater
  // more than once, which would double-write the preference.
  const toggleIndicator = useCallback(
    (name: string) => {
      const next = new Set(indicators);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      persistPreference('tdpChartIndicators', [...next]);
    },
    [indicators],
  );

  return {
    chartType,
    interval,
    lineTimeRange,
    indicators,
    setChartType,
    setCandleInterval,
    setLineTimeRange,
    toggleIndicator,
    /** Convenience: whether the current chart type is line (hides indicators). */
    isLineChart: chartType === CHART_TYPE_LINE,
  };
}
