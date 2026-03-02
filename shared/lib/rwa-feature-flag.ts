import semver from 'semver';

import packageJson from '../../package.json';

/**
 * Feature flag type for RWA (Real World Assets) feature.
 * Follows the same pattern as PerpsFeatureFlag.
 */
export type RWAFeatureFlag = {
  enabled: boolean;
  minimumVersion: string;
};

const APP_VERSION = packageJson.version;

/**
 * Helper to check if the RWA feature flag is enabled with version gating.
 * Supports both simple boolean flags (backward compatible) and object flags
 * with enabled/minimumVersion properties.
 *
 * @param flagValue - The feature flag value (boolean or object with enabled/minimumVersion)
 * @returns True if the feature is enabled and meets version requirements
 */
export function isRWAFeatureEnabled(flagValue: unknown): boolean {
  if (!flagValue || !APP_VERSION) {
    return false;
  }

  if (typeof flagValue === 'boolean') {
    return flagValue;
  }

  if (typeof flagValue === 'object' && flagValue !== null) {
    const flag = flagValue as RWAFeatureFlag;
    const { enabled, minimumVersion } = flag;

    if (!enabled || !minimumVersion) {
      return false;
    }

    try {
      return semver.gte(APP_VERSION, minimumVersion);
    } catch {
      return false;
    }
  }

  return false;
}
