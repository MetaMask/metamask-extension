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
 * Get app version from multiple sources with robust fallbacks.
 * Works in both development and bundled production environments.
 */
function getAppVersion(): string | null {
  // Try process.env first (available in build environments)
  if (process.env.npm_package_version) {
    return process.env.npm_package_version;
  }

  // Try require as fallback (works in development)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, node/global-require, @typescript-eslint/no-require-imports
    return require('../../package.json').version;
  } catch {
    // In bundled environments where package.json is not available,
    // we should have the version available via process.env
    console.warn('Unable to determine app version for feature flag evaluation');
    return null;
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
