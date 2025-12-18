import semver from 'semver';

import packageJson from '../../package.json';

/**
 * Generic feature flag type for multichain features (Bitcoin, Tron, etc.)
 * Follows the same pattern as MultichainAccountsFeatureFlag
 */
export type MultichainFeatureFlag = {
  enabled: boolean;
  minimumVersion: string;
};

const APP_VERSION = packageJson.version;

/**
 * Generic helper to check if a multichain feature flag is enabled with version gating.
 * Follows the same pattern as multichain-accounts feature flag.
 * Can be used for Bitcoin, Tron, or any future blockchain integrations.
 *
 * @param flagValue - The feature flag value (boolean or object with enabled/minVersion)
 * @returns True if the feature is enabled and meets version requirements
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

// Export the generic function for direct use - no need for blockchain-specific wrappers
// Individual files can import and use isMultichainFeatureEnabled directly
