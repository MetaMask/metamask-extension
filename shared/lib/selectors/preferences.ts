import {
  DEFAULT_TDP_CHART_INDICATORS,
  DEFAULT_TDP_CHART_INTERVAL,
  DEFAULT_TDP_CHART_TYPE,
} from '../../constants/preferences';
import type { Preferences } from '../../types/preferences';

export type PreferencesMetaMaskState = {
  metamask: { preferences?: Partial<Preferences> };
};

// Returns the runtime value as-is (a partial of `Preferences` from state, or
// `{}` when absent) but typed as the full `Preferences` to preserve the
// implicit contract callers had under the original JS implementation.
export function getPreferences({
  metamask,
}: PreferencesMetaMaskState): Preferences {
  return (metamask.preferences ?? {}) as Preferences;
}

// TDP Advanced Chart preference defaults are shared with the
// `PreferencesController` default state (see `shared/constants/preferences`) so
// the persisted defaults and these selector fallbacks can never drift apart.
// `DEFAULT_TDP_CHART_INDICATORS` is a module-level constant, so it also gives a
// stable reference that keeps `useSelector` consumers from re-rendering.

/**
 * Returns the user's preferred chart type for Token Details Page.
 *
 * @param state - The MetaMask state
 * @returns Chart type: 1 = Candle, 2 = Line (default)
 */
export function getTdpChartType(state: PreferencesMetaMaskState): number {
  return state.metamask.preferences?.tdpChartType ?? DEFAULT_TDP_CHART_TYPE;
}

/**
 * Returns the user's preferred chart interval for Token Details Page.
 *
 * @param state - The MetaMask state
 * @returns Candle interval string (e.g., '15m', '1h', '1d')
 */
export function getTdpChartInterval(state: PreferencesMetaMaskState): string {
  return (
    state.metamask.preferences?.tdpChartInterval ?? DEFAULT_TDP_CHART_INTERVAL
  );
}

/**
 * Returns the user's selected chart indicators for Token Details Page.
 *
 * @param state - The MetaMask state
 * @returns Array of indicator names (e.g., ['RSI', 'MACD', 'MA20'])
 */
export function getTdpChartIndicators(
  state: PreferencesMetaMaskState,
): string[] {
  return (
    state.metamask.preferences?.tdpChartIndicators ??
    DEFAULT_TDP_CHART_INDICATORS
  );
}
