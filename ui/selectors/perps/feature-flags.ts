import { createSelector } from 'reselect';
import { getIsPerpsIncludedInBuild } from '../../../shared/lib/environment';
import { isPerpsRemoteConfigSatisfied } from '../../../shared/lib/perps-feature-flags';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';

/**
 * Default HIP-3 market sources when feature flag is not configured.
 * Empty by default - HIP-3 markets require explicit feature flag configuration.
 */
const DEFAULT_HIP3_SOURCES: string[] = [];

/**
 * Perps is available in the UI only when **both** are true:
 * - Compile-time: `getIsPerpsIncludedInBuild()` (`PERPS_ENABLED` at build)
 * - Remote rollout: `perpsEnabledVersion` satisfies `isPerpsRemoteConfigSatisfied`
 *
 * @param _state - The MetaMask state object
 * @returns Whether the user should see and use the perps experience.
 */
export const getIsPerpsExperienceAvailable = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    getIsPerpsIncludedInBuild() &&
    isPerpsRemoteConfigSatisfied(remoteFeatureFlags.perpsEnabledVersion),
);

/**
 * Parse a market source pattern from the feature flag.
 *
 * Patterns can be:
 * - 'xyz:*' - wildcard, extracts 'xyz' as the source
 * - 'xyz' - plain source identifier
 *
 * @param pattern - The pattern string from the feature flag
 * @returns The extracted source identifier
 */
const parseSourcePattern = (pattern: string): string => {
  const trimmed = pattern.trim();
  // Handle wildcard pattern like 'xyz:*' - extract the source part
  if (trimmed.endsWith(':*')) {
    return trimmed.slice(0, -2);
  }
  return trimmed;
};

/**
 * Get the list of allowed HIP-3 market sources from the feature flag.
 *
 * The `perpsHip3AllowlistMarkets` feature flag can be:
 * - A string pattern (e.g., 'xyz:*') - wildcard for all markets from xyz source
 * - A comma-separated string (e.g., 'xyz:*,abc:*') - multiple sources
 * - An array of patterns (e.g., ['xyz:*', 'abc:*']) - multiple sources
 *
 * If not configured, defaults to empty array (no HIP-3 markets allowed).
 *
 * @param _state - The MetaMask state object
 * @returns Array of allowed HIP-3 market source identifiers
 */
export const getHip3AllowedSources = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): string[] => {
    const flagValue = remoteFeatureFlags.perpsHip3AllowlistMarkets;

    // String value - could be single pattern or comma-separated
    if (typeof flagValue === 'string' && flagValue.trim()) {
      return flagValue.split(',').map(parseSourcePattern).filter(Boolean);
    }

    // Array of strings/patterns
    if (
      Array.isArray(flagValue) &&
      flagValue.every((v) => typeof v === 'string')
    ) {
      return flagValue.map(parseSourcePattern).filter(Boolean);
    }

    // Default to empty if flag is not configured or invalid
    return DEFAULT_HIP3_SOURCES;
  },
);

/**
 * Get the set of allowed HIP-3 market sources for efficient lookup.
 *
 * @param _state - The MetaMask state object
 * @returns Set of allowed HIP-3 market source identifiers
 */
export const getHip3AllowedSourcesSet = createSelector(
  getHip3AllowedSources,
  (allowedSources): Set<string> => new Set(allowedSources),
);

/**
 * Whether the perps slippage configuration UI is enabled.
 *
 * Remote flag `perpsSlippageConfig2` — the RemoteFeatureFlagController camelCases
 * LaunchDarkly keys, so the stored key is camelCase (not kebab). The value follows
 * the same `{ enabled, minimumVersion }` rollout shape as `perpsEnabledVersion`
 * (boolean still supported for backward compatibility).
 */
export const getIsPerpsSlippageConfigEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    isPerpsRemoteConfigSatisfied(remoteFeatureFlags.perpsSlippageConfig2),
);

/**
 * Whether limit orders are enabled in the single-position close flow.
 *
 * Remote flag `perpsClosePositionLimitOrderEnabled` — the camel-cased form of
 * `perps-close-position-limit-order-enabled`. The flag defaults to disabled
 * and supports the standard boolean or version-gated rollout shape.
 */
export const getIsPerpsCloseLimitOrderEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    isPerpsRemoteConfigSatisfied(
      remoteFeatureFlags.perpsClosePositionLimitOrderEnabled,
    ),
);

/**
 * Whether perps surfaces should render full asset names (e.g. "Bitcoin")
 * instead of just the ticker (e.g. "BTC").
 *
 * Gated behind the `perpsShowFullAssetNames` remote rollout flag (default OFF)
 * so full names can be shipped dark and rolled out independently. Follows the
 * same `{ enabled, minimumVersion }` rollout shape as `perpsEnabledVersion`
 * (boolean still supported for backward compatibility). When disabled, consumers
 * fall back to the ticker via `getDisplaySymbol(symbol)`.
 */
export const getIsPerpsShowFullAssetNamesEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    isPerpsRemoteConfigSatisfied(remoteFeatureFlags.perpsShowFullAssetNames),
);

/**
 * Whether the Terminal API backend is enabled for perps market data.
 *
 * When true, REST calls for market metadata (`getMarkets`,
 * `getMarketDataWithPrices`) route through the MetaMask Terminal API to
 * enrich listings with display names, keywords, tags, and categories.
 * When false, data is fetched directly from the provider (HyperLiquid).
 *
 * Remote flag `perpsTerminalBackendEnabled` — same version-gated shape.
 */
export const getIsPerpsTerminalBackendEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    isPerpsRemoteConfigSatisfied(
      remoteFeatureFlags.perpsTerminalBackendEnabled,
    ),
);

// Re-export the VIP program flag so perps consumers can import from this
// domain module without reaching into the rewards duck directly.
export { selectVipProgramEnabled as getIsVipProgramEnabled } from '../../ducks/rewards/selectors';
