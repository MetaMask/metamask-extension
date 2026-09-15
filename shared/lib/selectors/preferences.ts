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

// TDP Advanced Chart preferences — persisted via PreferencesController.
// Chart type: 1 = Candle, 2 = Line (matches TradingView + mobile conventions).
const CHART_TYPE_LINE_DEFAULT = 2;
const CHART_INTERVAL_DEFAULT = '15m';
// Stable reference so `useSelector` consumers don't re-render on every call.
const NO_INDICATORS: string[] = [];

/**
 * Returns the user's preferred chart type for Token Details Page.
 *
 * @param state - The MetaMask state
 * @returns Chart type: 1 = Candle, 2 = Line (default)
 */
export function getTdpChartType(state: PreferencesMetaMaskState): number {
  return state.metamask.preferences?.tdpChartType ?? CHART_TYPE_LINE_DEFAULT;
}

/**
 * Returns the user's preferred chart interval for Token Details Page.
 *
 * @param state - The MetaMask state
 * @returns Candle interval string (e.g., '15m', '1h', '1d')
 */
export function getTdpChartInterval(state: PreferencesMetaMaskState): string {
  return state.metamask.preferences?.tdpChartInterval ?? CHART_INTERVAL_DEFAULT;
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
  return state.metamask.preferences?.tdpChartIndicators ?? NO_INDICATORS;
}
