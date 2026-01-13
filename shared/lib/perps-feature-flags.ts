import semver from 'semver';

import packageJson from '../../package.json';

/**
 * Feature flag type for Perps trading feature.
 * Follows the same pattern as MultichainFeatureFlag.
 */
export type PerpsFeatureFlag = {
  enabled: boolean;
  minimumVersion: string;
};

const APP_VERSION = packageJson.version;

/**
 * Helper to check if the Perps feature flag is enabled with version gating.
 * Supports both simple boolean flags (backward compatible) and object flags
 * with enabled/minimumVersion properties.
 *
 * @param flagValue - The feature flag value (boolean or object with enabled/minimumVersion)
 * @returns True if the feature is enabled and meets version requirements
 */
export function isPerpsFeatureEnabled(flagValue: unknown): boolean {
  if (!flagValue || !APP_VERSION) {
    return false;
  }

  // Simple boolean flag (backward compatible)
  if (typeof flagValue === 'boolean') {
    return flagValue;
  }

  // Object with enabled and version properties
  if (typeof flagValue === 'object' && flagValue !== null) {
    const flag = flagValue as PerpsFeatureFlag;
    const { enabled, minimumVersion } = flag;

    if (!enabled || !minimumVersion) {
      return false;
    }

    try {
      return semver.gte(APP_VERSION, minimumVersion);
    } catch {
      // If version comparison fails, default to false for safety
      return false;
    }
  }

  return false;
}

