/* eslint-disable @typescript-eslint/no-unused-vars */
// We can ignore the unused vars warning while the flag is not active

import semver from 'semver';
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
  const {
    enabled,
    featureVersion: currentFeatureVersion,
    minimumVersion,
  } = enableMultichainAccounts as MultichainAccountsFeatureFlag;
  return (
    enabled &&
    currentFeatureVersion &&
    minimumVersion &&
    currentFeatureVersion === featureVersion &&
    // @ts-expect-error - this error can be ignored while the minimum version is not defined
    semver.gt(minimumVersion, MINIMUM_SUPPORTED_VERSION)
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
