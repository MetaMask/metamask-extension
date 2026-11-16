/**
 * Client-config / RemoteFeatureFlagController key (camelCase). LaunchDarkly
 * uses kebab-case `token-details-advanced-charts`, which is converted
 * before it reaches extension state.
 */
export const TOKEN_DETAILS_ADVANCED_CHARTS_FLAG = 'tokenDetailsAdvancedCharts';

/**
 * Client-config / RemoteFeatureFlagController key (camelCase) for colouring the
 * Token Details Page line chart by its range direction. LaunchDarkly uses
 * kebab-case `token-details-advanced-charts-theming`, which is converted before
 * it reaches extension state.
 */
export const TOKEN_DETAILS_ADVANCED_CHARTS_THEMING_FLAG =
  'tokenDetailsAdvancedChartsTheming';
