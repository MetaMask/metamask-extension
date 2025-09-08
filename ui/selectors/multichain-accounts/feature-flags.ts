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

const APP_VERSION = packageJson.version;
const FEATURE_VERSION_1 = '1';
const FEATURE_VERSION_2 = '2';

/**
 * Checks if the multichain accounts feature is enabled for a given state and feature version.
 *
 * @param enableMultichainAccounts - The MetaMask state object
 * @param featureVersion - The specific feature version to check
 * @returns boolean - True if the feature is enabled for the given state and version, false otherwise.
 */
export const isMultichainAccountsFeatureEnabled = (
  enableMultichainAccounts: MultichainAccountsFeatureFlag,
  featureVersion: string,
) => {
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
    semver.gte(APP_VERSION, minimumVersion)
  );
};

/**
 * Selector to get the multichain accounts remote feature flags.
 *
 * @param state - The MetaMask state object
 * @returns MultichainAccountsFeatureFlag - The feature flags for multichain accounts.
 */
export const getMultichainAccountsRemoteFeatureFlags = (
  state: RemoteFeatureFlagsState,
) => {
  const multichainAccountsFeatureFlags =
    getRemoteFeatureFlags(state).enableMultichainAccounts;

  try {
    assert(multichainAccountsFeatureFlags, MultichainAccountsFeatureFlag);
  } catch (error) {
    return {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    };
  }

  return multichainAccountsFeatureFlags;
};

/**
 * Selector to check if the multichain accounts feature is enabled for state 1.
 *
 * @param state - The MetaMask state object
 * @returns boolean - True if the feature is enabled for state 1, false otherwise.
 */
export const getIsMultichainAccountsState1Enabled = (
  state: RemoteFeatureFlagsState,
) => {
  const flags = getMultichainAccountsRemoteFeatureFlags(state);
  return (
    isMultichainAccountsFeatureEnabled(flags, FEATURE_VERSION_2) ||
    isMultichainAccountsFeatureEnabled(flags, FEATURE_VERSION_1)
  );
};

/**
 * Selector to check if the multichain accounts feature is enabled for state 2.
 *
 * @param state - The MetaMask state object
 * @returns boolean - True if the feature is enabled for state 2, false otherwise.
 */
export const getIsMultichainAccountsState2Enabled = (
  state: RemoteFeatureFlagsState,
) => {
  const flags = getMultichainAccountsRemoteFeatureFlags(state);
  return isMultichainAccountsFeatureEnabled(flags, FEATURE_VERSION_2) || true;
};
