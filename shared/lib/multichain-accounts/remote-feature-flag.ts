import semver from 'semver';
import packageJson from '../../../package.json';

export const FEATURE_VERSION_1 = '1';
export const FEATURE_VERSION_2 = '2';

export type MultichainAccountsFeatureFlag = {
  enabled: boolean;
  featureVersion: string | null;
  minimumVersion: string | null;
};

const APP_VERSION = packageJson.version;

/**
 * Shared helper to check whether a multichain accounts feature version is enabled
 * for a given application version. This keeps background and UI gating logic in sync.
 *
 * @param enableMultichainAccounts - The multichain accounts feature flag.
 * @param featureVersion - The feature version to check.
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const isMultichainAccountsFeatureEnabled = (
  enableMultichainAccounts: MultichainAccountsFeatureFlag | undefined | null,
  featureVersion: string,
) => {
  const isFeatureEnabled = () => {
    if (!enableMultichainAccounts || !APP_VERSION) {
      return false;
    }

    const {
      enabled,
      featureVersion: currentFeatureVersion,
      minimumVersion,
    } = enableMultichainAccounts;

    if (!enabled || !currentFeatureVersion || !minimumVersion) {
      return false;
    }

    if (currentFeatureVersion !== featureVersion) {
      return false;
    }

    return semver.gte(APP_VERSION, minimumVersion);
  };

  if (featureVersion === FEATURE_VERSION_2) {
    if (process.env.IN_TEST) {
      // Some E2E tests depend on multichain accounts v2 being disabled, so we run
      // this logic only for those.
      return isFeatureEnabled();
    }

    // But now, state 2 is enabled by default in production and development environments.
    return true;
  }

  // For feature version 1, we still rely on the feature flag.
  return isFeatureEnabled();
};
