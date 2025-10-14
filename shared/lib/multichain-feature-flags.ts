import semver from 'semver';

/**
 * Generic feature flag type for multichain features (Bitcoin, Tron, etc.)
 */
export type MultichainFeatureFlag = {
  enabled: boolean;
  minVersion?: string;
  minimumVersion?: string; // Alternative naming
};

/**
 * Generic helper to check if a multichain feature flag is enabled with version gating.
 * Follows the same pattern as multichain-accounts feature flag.
 * Can be used for Bitcoin, Tron, or any future blockchain integrations.
 *
 * @param flagValue - The feature flag value (boolean or object with enabled/minVersion)
 * @returns True if the feature is enabled and meets version requirements
 */
export function isMultichainFeatureEnabled(flagValue: unknown): boolean {
  // Get app version dynamically to avoid circular imports
  let appVersion: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, node/global-require
    appVersion = require('../../package.json').version;
  } catch {
    // Fallback if package.json can't be loaded
    return false;
  }

  if (!flagValue || !appVersion) {
    return false;
  }

  // Simple boolean flag
  if (typeof flagValue === 'boolean') {
    return flagValue;
  }

  // Object with enabled and version properties
  if (typeof flagValue === 'object' && flagValue !== null) {
    const flag = flagValue as MultichainFeatureFlag;
    const { enabled, minVersion, minimumVersion } = flag;

    if (!enabled) {
      return false;
    }

    // Support both naming conventions
    const versionToCheck = minVersion || minimumVersion;
    if (!versionToCheck) {
      return false; // Require version for safety
    }

    try {
      return semver.gte(appVersion, versionToCheck);
    } catch {
      // If version comparison fails, default to false for safety
      return false;
    }
  }

  return false;
}

/**
 * Bitcoin-specific feature flag checker
 *
 * @param flagValue - The feature flag value
 * @returns True if Bitcoin feature is enabled
 */
export function isBitcoinFeatureEnabled(flagValue: unknown): boolean {
  return isMultichainFeatureEnabled(flagValue);
}

/**
 * Tron-specific feature flag checker (placeholder for future use)
 *
 * @param flagValue - The feature flag value
 * @returns True if Tron feature is enabled
 */
export function isTronFeatureEnabled(flagValue: unknown): boolean {
  return isMultichainFeatureEnabled(flagValue);
}
