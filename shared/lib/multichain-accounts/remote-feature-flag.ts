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

  // Some e2e/integration tests can force multichain accounts state 1 and 2 to be enabled.
  // We also enable it by default for all e2e (IN_TEST).
  if (
    process.env.IN_TEST === 'true' ||
    process.env.FORCE_MULTICHAIN_ACCOUNTS_FEATURE_FLAG === 'true'
  ) {
    return true;
  }

  if (featureVersion === FEATURE_VERSION_2) {
    // But now, state 2 is enabled by default in production and development environments.
    return true;
  }

  // For feature version 1, we still rely on the feature flag.
  return isFeatureEnabled();
};
