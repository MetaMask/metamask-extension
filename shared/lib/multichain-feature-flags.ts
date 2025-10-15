import semver from 'semver';

/**
 * Generic feature flag type for multichain features (Bitcoin, Tron, etc.)
 */
export type MultichainFeatureFlag = {
  enabled: boolean;
  minimumVersion?: string;
};

/**
 * Get app version from package.json with fallback handling.
 * Works in both development and bundled production environments.
 */
function getAppVersion(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, node/global-require, @typescript-eslint/no-require-imports
    return require('../../package.json').version;
  } catch {
    // In bundled environments where package.json is not available,
    // default to assuming version requirements are met to avoid blocking features
    console.warn(
      'Unable to determine app version for feature flag evaluation - assuming requirements met',
    );
    return '99.99.99'; // High version number to pass version checks
  }
}

/**
 * Generic helper to check if a multichain feature flag is enabled with version gating.
 * Follows the same pattern as multichain-accounts feature flag.
 * Can be used for Bitcoin, Tron, or any future blockchain integrations.
 *
 * @param flagValue - The feature flag value (boolean or object with enabled/minVersion)
 * @returns True if the feature is enabled and meets version requirements
 */
export function isMultichainFeatureEnabled(flagValue: unknown): boolean {
  const appVersion = getAppVersion();

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
    const { enabled, minimumVersion } = flag;

    if (!enabled) {
      return false;
    }
    if (!minimumVersion) {
      return false; // Require version for safety
    }

    try {
      return semver.gte(appVersion, minimumVersion);
    } catch {
      // If version comparison fails, default to false for safety
      return false;
    }
  }

  return false;
}

// Export the generic function for direct use - no need for blockchain-specific wrappers
// Individual files can import and use isMultichainFeatureEnabled directly
