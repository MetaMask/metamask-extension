import semver from 'semver';

import packageJson from '../../package.json';

/**
 * Shape of the `batchSell` remote feature flag.
 */
export type BatchSellFeatureFlag = {
  minimumVersion: string;
};

const APP_VERSION = packageJson.version;

/**
 * Checks whether the Batch Sell feature is enabled for the current app version.
 *
 * The `batchSell` remote feature flag is an object with a `minimumVersion`
 * semver string (e.g. `{ minimumVersion: "14.11.0" }`). The feature is
 * considered enabled when the running app version is greater than or equal to
 * that minimum. If the flag is absent, malformed, or unparseable the function
 * returns `false` for safety.
 *
 * @param flagValue - The raw `batchSell` value from remote config.
 * @returns `true` if the current app version satisfies the minimum requirement.
 */
export function isBatchSellEnabled(flagValue: unknown): boolean {
  if (
    !flagValue ||
    typeof flagValue !== 'object' ||
    !('minimumVersion' in flagValue) ||
    typeof (flagValue as BatchSellFeatureFlag).minimumVersion !== 'string' ||
    !APP_VERSION
  ) {
    return false;
  }

  try {
    return semver.gte(
      APP_VERSION,
      (flagValue as BatchSellFeatureFlag).minimumVersion,
    );
  } catch {
    // If version comparison fails, default to false for safety
    return false;
  }
}
