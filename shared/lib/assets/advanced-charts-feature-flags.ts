/**
 * Client-config / RemoteFeatureFlagController key (camelCase). LaunchDarkly
 * uses kebab-case `token-details-advanced-charts`, which is converted
 * before it reaches extension state.
 */
export const TOKEN_DETAILS_ADVANCED_CHARTS_FLAG = 'tokenDetailsAdvancedCharts';

/**
 * Client-config / RemoteFeatureFlagController key (camelCase). LaunchDarkly
 * uses kebab-case `token-details-advanced-charts-theming`, which is converted
 * before it reaches extension state.
 *
 * When enabled, applies ambient theming to advanced charts — coloring
 * candles/line and price header based on price direction (green up, orange down).
 */
export const TOKEN_DETAILS_ADVANCED_CHARTS_THEMING_FLAG =
  'tokenDetailsAdvancedChartsTheming';
