export enum ThemeType {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  light = 'light',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dark = 'dark',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  os = 'os',
}

export const DEFAULT_AUTO_LOCK_TIME_LIMIT = 0;

// Token Details Page (TDP) advanced-chart preference defaults. Shared between
// the `PreferencesController` default state and the preference selectors so the
// persisted defaults and the selector fallbacks can never drift apart.
// Chart type: 1 = Candle, 2 = Line (matches TradingView + mobile conventions).
export const DEFAULT_TDP_CHART_TYPE = 2;
export const DEFAULT_TDP_CHART_INTERVAL = '15m';
export const DEFAULT_TDP_CHART_INDICATORS: string[] = [];
