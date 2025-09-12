import {
  Infer,
  object,
  boolean,
  nullable,
  string,
  assert,
} from '@metamask/superstruct';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../remote-feature-flags';
import {
  FEATURE_VERSION_1,
  FEATURE_VERSION_2,
  isMultichainAccountsFeatureEnabled,
} from '../../../shared/lib/multichain-accounts/remote-feature-flag';

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
  return isMultichainAccountsFeatureEnabled(flags, FEATURE_VERSION_2);
};
