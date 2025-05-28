/* eslint-disable @typescript-eslint/no-unused-vars */
// We can ignore the unused vars warning while the flag is not active

import {
  Infer,
  object,
  boolean,
  nullable,
  string,
  assert,
} from '@metamask/superstruct';
import semver from 'semver';
import packageJson from '../../../package.json';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../remote-feature-flags';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';

/**
 * Feature flag structure for multichain accounts features
 */
const MultichainAccountsFeatureFlag = object({
  enabled: boolean(),
  featureVersion: nullable(string()),
  minimumVersion: nullable(string()),
});

/**
 * Feature flag type for multichain accounts features
 */
export type MultichainAccountsFeatureFlag = Infer<
  typeof MultichainAccountsFeatureFlag
>;

// TODO: Update the value to the decided version multichain accounts will be released
const APP_VERSION = packageJson.version;
const FEATURE_VERSION_1 = '1';
const FEATURE_VERSION_2 = '2';

/**
 * Checks if the multichain accounts feature is enabled for a given state and feature version.
 *
 * @param state - The MetaMask state object
 * @param featureVersion - The specific feature version to check
 * @returns boolean - True if the feature is enabled for the given state and version, false otherwise.
 */
export const isMultichainAccountsFeatureEnabled = (
  state: RemoteFeatureFlagsState,
  featureVersion: string,
) => {
  const { enableMultichainAccounts } = getRemoteFeatureFlags(state);
  try {
    assert(enableMultichainAccounts, MultichainAccountsFeatureFlag);
  } catch (error) {
    console.error(error);
    return false;
  }

  const {
    enabled,
    featureVersion: currentFeatureVersion,
    minimumVersion,
  } = enableMultichainAccounts;
  return (
    enabled &&
    currentFeatureVersion &&
    minimumVersion &&
    currentFeatureVersion === featureVersion &&
    semver.gt(minimumVersion, APP_VERSION)
  );
};

/**
 * Selector to check if the multichain accounts feature is enabled for state 1.
 */
export const getIsMultichainAccountsState1Enabled = createDeepEqualSelector(
  (state: RemoteFeatureFlagsState) => state,
  (state) => {
    return false;
    // TODO: Uncomment this when the feature is ready for release
    // return isMultichainAccountsFeatureEnabled(state, FEATURE_VERSION_1);
  },
);

/**
 * Selector to check if the multichain accounts feature is enabled for state 2.
 */
export const getIsMultichainAccountsState2Enabled = createDeepEqualSelector(
  (state: RemoteFeatureFlagsState) => state,
  (state) => {
    return false;
    // TODO: Uncomment this when the feature is ready for release
    // return isMultichainAccountsFeatureEnabled(state, FEATURE_VERSION_2);
  },
);
