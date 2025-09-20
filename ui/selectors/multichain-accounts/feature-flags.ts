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

export const STATE_1_FLAG = 'enableMultichainAccounts';
export const STATE_2_FLAG = 'enableMultichainAccountsState2';

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
 * @param flagName - The name of the remote flag to use
 * @returns MultichainAccountsFeatureFlag - The feature flags for multichain accounts.
 */
export const getMultichainAccountsRemoteFeatureFlags = (
  state: RemoteFeatureFlagsState,
  flagName: string,
) => {
  const multichainAccountsFeatureFlags = getRemoteFeatureFlags(state)[flagName];

  try {
    assert(multichainAccountsFeatureFlags, MultichainAccountsFeatureFlag);
  } catch (error) {
    return undefined;
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
  const remoteFlag = getMultichainAccountsRemoteFeatureFlags(
    state,
    STATE_1_FLAG,
  );
  return isMultichainAccountsFeatureEnabled(remoteFlag, FEATURE_VERSION_1);
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
  const remoteFlag = getMultichainAccountsRemoteFeatureFlags(
    state,
    STATE_2_FLAG,
  );
  return isMultichainAccountsFeatureEnabled(remoteFlag, FEATURE_VERSION_2);
};
