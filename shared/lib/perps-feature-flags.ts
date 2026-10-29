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
 * Remote rollout only: evaluates `perpsEnabledVersion` from LaunchDarkly (or overrides).
 * Does not consider compile-time `PERPS_ENABLED` — use `getIsPerpsExperienceAvailable` for that.
 *
 * Supports simple boolean flags (backward compatible) and object flags with enabled/minimumVersion.
 *
 * @param flagValue - The remote flag value (boolean or object with enabled/minimumVersion)
 * @returns True if remote config allows this app version to use perps
 */
export function isPerpsRemoteConfigSatisfied(flagValue: unknown): boolean {
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
