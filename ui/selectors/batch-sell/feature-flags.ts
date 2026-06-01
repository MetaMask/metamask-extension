import semver from 'semver';
import { createSelector } from 'reselect';

import packageJson from '../../../package.json';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { isHardwareWallet } from '../../../shared/lib/selectors/keyring';

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

/**
 * Returns whether the Batch Sell feature should be shown in the UI.
 *
 * Enabled only when the `batchSell` remote feature flag contains a
 * `minimumVersion` semver string and the current app version is greater than
 * or equal to it, and the currently selected account is not a hardware wallet.
 *
 * @param state - The MetaMask Redux state.
 * @returns `true` if Batch Sell is available for this app version and account type.
 */
export const getIsBatchSellEnabled = createSelector(
  getRemoteFeatureFlags,
  (state) => isHardwareWallet(state as never),
  (remoteFeatureFlags, hardwareWalletSelected) =>
    isBatchSellEnabled(remoteFeatureFlags.batchSell) && !hardwareWalletSelected,
);
