import semver from 'semver';
import packageJson from '../../package.json';

/**
 * Generic feature flag type for multichain features (Bitcoin, Tron, etc.)
 */
export type MultichainFeatureFlag = {
  enabled: boolean;
  minVersion?: string;
  minimumVersion?: string; // Alternative naming
};

const APP_VERSION = packageJson.version;

/**
 * Generic helper to check if a multichain feature flag is enabled with version gating.
 * Follows the same pattern as multichain-accounts feature flag.
 * Can be used for Bitcoin, Tron, or any future blockchain integrations.
 *
 * @param flagValue - The feature flag value (boolean or object with enabled/minVersion)
 * @returns boolean - True if the feature is enabled and meets version requirements
 */
export function isMultichainFeatureEnabled(flagValue: unknown): boolean {
  if (!flagValue || !APP_VERSION) {
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

    return semver.gte(APP_VERSION, versionToCheck);
  }

  return false;
}

/**
 * Bitcoin-specific feature flag checker
 */
export function isBitcoinFeatureEnabled(flagValue: unknown): boolean {
  return isMultichainFeatureEnabled(flagValue);
}
