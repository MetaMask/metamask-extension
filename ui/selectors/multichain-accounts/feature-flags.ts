import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../remote-feature-flags';

/**
 * Feature flag type for multichain accounts features
 */
export type MultichainAccountsFeatureFlag = {
  enabled: boolean;
  featureVersion: string | null;
  minimumVersion: string | null;
};

// TODO: Update the value to the decided version multichain accounts will be released
const MINIMUM_SUPPORTED_VERSION = null;
const FEATURE_VERSION_1 = '1';
const FEATURE_VERSION_2 = '2';

/**
 * Compare is the version1 is greater than or equal to version2
 *
 * @param version1 - The first version string to compare.
 * @param version2 - The second version string to compare.
 * @returns boolean - True if version1 is greater than or equal to version2, false otherwise.
 */
export const compareVersions = (version1: string, version2: string) => {
  const regex = /^\d+\.\d+\.\d+$/u;
  if (!regex.test(version1) || !regex.test(version2)) {
    return false; // Invalid version format
  }

  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;

    if (num1 > num2) {
      return true;
    }
    if (num1 < num2) {
      return false;
    }
  }

  return true; // Versions are equal
};

/**
 * Checks if the multichain accounts feature is enabled for a given state and feature version.
 *
 * @param state - The MetaMask state object
 * @param featureVersion - The specific feature version to check
 * @returns boolean - True if the feature is enabled for the given state and version, false otherwise.
 */
const isMultichainAccountsFeatureEnabled = (
  state: RemoteFeatureFlagsState,
  featureVersion: string,
) => {
  const { enableMultichainAccounts } = getRemoteFeatureFlags(state);
  const { enabled, featureVersion: currentFeatureVersion, minimumVersion } =
    enableMultichainAccounts as MultichainAccountsFeatureFlag;
  return (
    enabled &&
    currentFeatureVersion &&
    minimumVersion &&
    currentFeatureVersion === featureVersion &&
    // @ts-expect-error - this error can be ignore while the minimum version is not defined
    compareVersions(minimumVersion, MINIMUM_SUPPORTED_VERSION)
  );
};

/**
 * Checks if the multichain accounts feature is enabled for state 1.
 *
 * @param state - The MetaMask state object
 * @returns boolean - True if the feature is enabled for state 1, false otherwise.
 */
export const getIsMultichainAccountsState1Enabled = (
  state: RemoteFeatureFlagsState,
) => {
  return false;

  // TODO: Uncomment this when the feature is ready for release
  // return isMultichainAccountsFeatureEnabled(state, FEATURE_VERSION_1);
};

/**
 * Checks if the multichain accounts feature is enabled for state 2.
 *
 * @param state - The MetaMask state object
 * @returns boolean - True if the feature is enabled for state 2, false otherwise.
 */
export const getIsMultichainAccountsState2Enabled = (
  state: RemoteFeatureFlagsState,
) => {
  return false;

  // TODO: Uncomment this when the feature is ready for release
  // return isMultichainAccountsFeatureEnabled(state, FEATURE_VERSION_2);
};
