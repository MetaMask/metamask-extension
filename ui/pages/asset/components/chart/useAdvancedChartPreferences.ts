import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getTdpChartType,
  getTdpChartInterval,
  getTdpChartIndicators,
} from '../../../../../shared/lib/selectors/preferences';
import type { Preferences } from '../../../../../shared/types/preferences';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { CHART_TYPE_LINE } from './advanced-chart-interval-bar';
import { DEFAULT_LINE_RANGE } from './chart-window-mapping';

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
 * - interval: Saved (persisted) candle interval ('15m', '1h', etc.)
 * - displayInterval: Candle interval actually rendered; equals `interval` unless
 *   a chart-type toggle temporarily stepped it to keep the tendency readable
 * - lineTimeRange: Current time range ('1H', '1D', etc.) for line mode
 * - indicators: Set of active indicator names
 * - setChartType: Update chart type
 * - setCandleInterval: Update interval (candle mode); persists
 * - applyToggleCandle: Seed candle interval from a toggle (no persist)
 * - setLineTimeRange: Update time range (line mode)
 * - toggleIndicator: Toggle indicator on/off
 * - isLineChart: Convenience flag for line chart
 */
export function useAdvancedChartPreferences() {
  const chartType = useSelector(getTdpChartType);
  const interval = useSelector(getTdpChartInterval);
  const persistedIndicators = useSelector(getTdpChartIndicators);

  const [lineTimeRange, setLineTimeRange] =
    useState<string>(DEFAULT_LINE_RANGE);

  // Rendered interval. Equals the saved `interval` unless a toggle stepped it
  // (e.g. line 1Y → candle 1w while saved 1m is kept). Never persisted.
  const [displayInterval, setDisplayInterval] = useState<string>(interval);

  // When the persisted interval changes (an explicit pick, or a change from
  // elsewhere), fall back to showing the saved interval. Done during render
  // rather than in an effect so the stale display interval is never painted.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [lastPersistedInterval, setLastPersistedInterval] = useState(interval);
  if (lastPersistedInterval !== interval) {
    setLastPersistedInterval(interval);
    setDisplayInterval(interval);
  }

  // Memoized so consumers can use the set as an effect dependency.
  const indicators = useMemo(
    () => new Set(persistedIndicators),
    [persistedIndicators],
  );

  // The latest selection, updated synchronously on every toggle. `indicators`
  // only refreshes after the async `setPreference` round-trips through Redux,
  // so two quick toggles would both read the same stale set and the first
  // change would be lost. This ref gives back-to-back toggles an up-to-date
  // base to build on; it re-syncs whenever the persisted value settles.
  const pendingIndicatorsRef = useRef(indicators);
  useEffect(() => {
    pendingIndicatorsRef.current = indicators;
  }, [indicators]);

  const setChartType = useCallback((next: number) => {
    persistPreference('tdpChartType', next);
  }, []);

  // An explicit interval pick: show it immediately and persist it as the saved
  // preference.
  const setCandleInterval = useCallback((next: string) => {
    setDisplayInterval(next);
    persistPreference('tdpChartInterval', next);
  }, []);

  // A chart-type toggle (line -> candle) seeding the candle view: show the
  // resolved interval without persisting, so a cap-triggered step never
  // overwrites the user's saved interval.
  const applyToggleCandle = useCallback((next: string) => {
    setDisplayInterval(next);
  }, []);

  // `next` is built from the synchronous ref (not the Redux-derived `indicators`
  // snapshot) so rapid successive toggles accumulate instead of racing the
  // async write. Computed outside any state updater, which React may call more
  // than once and would otherwise double-write the preference.
  const toggleIndicator = useCallback((name: string) => {
    const next = new Set(pendingIndicatorsRef.current);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    pendingIndicatorsRef.current = next;
    persistPreference('tdpChartIndicators', [...next]);
  }, []);

  return {
    chartType,
    interval,
    displayInterval,
    lineTimeRange,
    indicators,
    setChartType,
    setCandleInterval,
    applyToggleCandle,
    setLineTimeRange,
    toggleIndicator,
    /** Convenience: whether the current chart type is line (hides indicators). */
    isLineChart: chartType === CHART_TYPE_LINE,
  };
}
