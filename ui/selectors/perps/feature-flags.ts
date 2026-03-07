import { createSelector } from 'reselect';
import { isPerpsFeatureEnabled } from '../../../shared/lib/perps-feature-flags';
import { getRemoteFeatureFlags } from '../remote-feature-flags';

/**
 * Default HIP-3 market sources when feature flag is not configured.
 * Empty by default - HIP-3 markets require explicit feature flag configuration.
 */
const DEFAULT_HIP3_SOURCES: string[] = [];

/**
 * Get the state of the `perpsEnabledVersion` remote feature flag.
 * Expects a JSON flag with enabled/minimumVersion properties for version gating.
 *
 * @param _state - The MetaMask state object
 * @returns `true` if Perps trading is enabled and meets version requirements, `false` otherwise.
 */
export const getIsPerpsEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    isPerpsFeatureEnabled(remoteFeatureFlags.perpsEnabledVersion),
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
