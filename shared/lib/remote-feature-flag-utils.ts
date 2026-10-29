/**
 * Remote Feature Flag Utilities
 *
 * Utilities for parsing and validating remote feature flags from LaunchDarkly.
 * Supports version-gated flags and progressive rollout wrapper formats.
 *
 * Ported from mobile: app/util/remoteFeatureFlag/index.ts
 */

import semver from 'semver';
import packageJson from '../../package.json';

/**
 * Version-gated feature flag structure.
 * A flag that is only enabled if the app version meets the minimum requirement.
 */
export type VersionGatedFeatureFlag = {
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Minimum app version required (semver format, e.g., "12.5.0") */
  minimumVersion: string;
};

/**
 * Progressive rollout wrapper format from LaunchDarkly.
 * Some flags are wrapped in this structure for gradual rollouts.
 */
export type ProgressiveRolloutWrapper<FlagValue = VersionGatedFeatureFlag> = {
  /** Optional rollout name/identifier */
  name?: string;
  /** The actual flag value */
  value: FlagValue;
};

/** The current app version from package.json */
const APP_VERSION = packageJson.version;

/**
 * Type guard to check if a value is a VersionGatedFeatureFlag.
 * Useful for narrowing types before accessing flag properties.
 *
 * @param value - The value to check
 * @returns True if the value is a valid VersionGatedFeatureFlag structure
 */
export function isVersionGatedFeatureFlag(
  value: unknown,
): value is VersionGatedFeatureFlag {
  return (
    typeof value === 'object' &&
    value !== null &&
    'enabled' in value &&
    'minimumVersion' in value &&
    typeof (value as { enabled: unknown }).enabled === 'boolean' &&
    typeof (value as { minimumVersion: unknown }).minimumVersion === 'string'
  );
}

/**
 * Check if a progressive rollout wrapper structure.
 *
 * @param value - The value to check
 * @returns True if wrapped in { name?, value: T } format
 */
export function isProgressiveRolloutWrapper(
  value: unknown,
): value is ProgressiveRolloutWrapper<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    typeof (value as { value: unknown }).value === 'object' &&
    (value as { value: unknown }).value !== null
  );
}

/**
 * Check if the current app version meets the minimum required version.
 *
 * @param minimumVersion - Minimum version required (semver format)
 * @returns True if current version >= minimum version
 */
export function hasMinimumRequiredVersion(minimumVersion: string): boolean {
  if (!minimumVersion || !APP_VERSION) {
    return false;
  }

  try {
    return semver.gte(APP_VERSION, minimumVersion);
  } catch {
    // If version comparison fails, default to false for safety
    return false;
  }
}

/**
 * Normalizes version-gated remote feature flags from two possible runtime shapes.
 *
 * 1) Direct shape: `{ enabled: true, minimumVersion: '12.5.0' }`
 * 2) Progressive rollout wrapper: `{ name: 'rollout', value: { enabled, minimumVersion } }`
 *
 * @param remoteFlag - The raw flag value from remote config
 * @returns The unwrapped VersionGatedFeatureFlag or undefined if invalid
 */
export function unwrapVersionGatedFeatureFlag(
  remoteFlag: unknown,
): VersionGatedFeatureFlag | undefined {
  // Direct shape: { enabled, minimumVersion }
  if (isVersionGatedFeatureFlag(remoteFlag)) {
    return remoteFlag;
  }

  // Progressive rollout wrapper: { name?, value: { enabled, minimumVersion } }
  if (isProgressiveRolloutWrapper(remoteFlag)) {
    const wrappedValue = remoteFlag.value;
    if (isVersionGatedFeatureFlag(wrappedValue)) {
      return wrappedValue;
    }
  }

  return undefined;
}

/**
 * Validates a version-gated feature flag and checks version requirements.
 *
 * This is the main function to use when checking if a feature should be enabled.
 * It handles unwrapping progressive rollout wrappers, validating the flag
 * structure, and checking version requirements.
 *
 * @param remoteFlag - The raw flag value from remote config
 * @returns True if feature is enabled and version requirements are met,
 * false if explicitly disabled or version not met,
 * undefined if flag is invalid/missing
 */
export function validatedVersionGatedFeatureFlag(
  remoteFlag: unknown,
): boolean | undefined {
  // Support both direct flags and progressive rollout wrapper objects
  const normalizedFlag = unwrapVersionGatedFeatureFlag(remoteFlag);

  if (!normalizedFlag) {
    return undefined;
  }

  return (
    normalizedFlag.enabled &&
    hasMinimumRequiredVersion(normalizedFlag.minimumVersion)
  );
}

/**
 * Gets a boolean feature flag value with version gating support.
 * Handles both simple boolean flags and version-gated object flags.
 *
 * @param flagValue - The flag value (boolean, VersionGatedFeatureFlag, or wrapper)
 * @param defaultValue - Default value if flag is invalid/missing
 * @returns The resolved boolean value
 */
export function getBooleanFeatureFlag(
  flagValue: unknown,
  defaultValue: boolean,
): boolean {
  // Simple boolean flag
  if (typeof flagValue === 'boolean') {
    return flagValue;
  }

  // Version-gated or wrapped flag
  const validated = validatedVersionGatedFeatureFlag(flagValue);
  if (validated !== undefined) {
    return validated;
  }

  return defaultValue;
}
