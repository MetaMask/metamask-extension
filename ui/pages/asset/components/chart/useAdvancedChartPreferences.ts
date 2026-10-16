import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getTdpChartType,
  getTdpChartInterval,
  getTdpChartIndicators,
} from '../../../../../shared/lib/selectors/preferences';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { CHART_TYPE_LINE } from './advanced-chart-interval-bar';

/**
 * React hook for managing Token Details Page Advanced Chart preferences.
 *
 * Persists chart type, interval, and indicator selection via PreferencesController.
 * Uses local state for instant UI updates while background sync is in progress
 * (fire-and-forget pattern matching the perpsSelectedCandlePeriod approach).
 *
 * Preferences are global (not per-token) — navigating between tokens reuses
 * the same saved chart configuration, matching mobile behavior.
 *
 * @returns Object containing chart preferences and setter functions:
 * - chartType: Current chart type (1 = Candle, 2 = Line)
 * - interval: Current interval ('15m', '1h', etc.)
 * - indicators: Set of active indicator names
 * - setChartType: Update chart type
 * - setInterval: Update interval
 * - toggleIndicator: Toggle indicator on/off
 * - isLineChart: Convenience flag for line chart
 */
export function useAdvancedChartPreferences() {
  // Read persisted values from PreferencesController via selectors.
  const persistedChartType = useSelector(getTdpChartType);
  const persistedInterval = useSelector(getTdpChartInterval);
  const persistedIndicators = useSelector(getTdpChartIndicators);

  // Local overrides for instant UI feedback — avoids waiting for the
  // background round-trip before the UI updates.
  const [localChartType, setLocalChartType] = useState<number | null>(null);
  const [localInterval, setLocalInterval] = useState<string | null>(null);
  const [localIndicators, setLocalIndicators] = useState<Set<string> | null>(
    null,
  );

  // Resolved values: local override ?? persisted ?? default.
  const chartType = localChartType ?? persistedChartType;
  const interval = localInterval ?? persistedInterval;
  // Memoized so consumers can use the set as an effect dependency.
  const indicators = useMemo(
    () => localIndicators ?? new Set<string>(persistedIndicators),
    [localIndicators, persistedIndicators],
  );

  const setChartType = useCallback((next: number) => {
    setLocalChartType(next);
    submitRequestToBackground('setPreference', ['tdpChartType', next]).catch(
      () => {
        // Best-effort persist — chart still updates via local state.
      },
    );
  }, []);

  // Named to avoid shadowing the global `setInterval`; exposed as `setInterval`.
  const setChartInterval = useCallback((next: string) => {
    setLocalInterval(next);
    submitRequestToBackground('setPreference', [
      'tdpChartInterval',
      next,
    ]).catch(() => {
      // Best-effort persist.
    });
  }, []);

  const toggleIndicator = useCallback(
    (name: string) => {
      setLocalIndicators((prev) => {
        const next = new Set(prev ?? indicators);
        if (next.has(name)) {
          next.delete(name);
        } else {
          next.add(name);
        }
        submitRequestToBackground('setPreference', [
          'tdpChartIndicators',
          [...next],
        ]).catch(() => {
          // Best-effort persist.
        });
        return next;
      });
    },
    [indicators],
  );

  return {
    chartType,
    interval,
    indicators,
    setChartType,
    setInterval: setChartInterval,
    toggleIndicator,
    /** Convenience: whether the current chart type is line (hides indicators). */
    isLineChart: chartType === CHART_TYPE_LINE,
  };
}
