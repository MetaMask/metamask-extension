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
  flagName: typeof STATE_1_FLAG | typeof STATE_2_FLAG,
) => {
  try {
    const multichainAccountsFeatureFlags =
      getRemoteFeatureFlags(state)[flagName];

    assert(multichainAccountsFeatureFlags, MultichainAccountsFeatureFlag);

    return multichainAccountsFeatureFlags;
  } catch (error) {
    return undefined;
  }
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
  const remoteFlagState1 = getMultichainAccountsRemoteFeatureFlags(
    state,
    STATE_1_FLAG,
  );
  const remoteFlagState2 = getMultichainAccountsRemoteFeatureFlags(
    state,
    STATE_2_FLAG,
  );

  return (
    isMultichainAccountsFeatureEnabled(remoteFlagState1, FEATURE_VERSION_1) ||
    isMultichainAccountsFeatureEnabled(remoteFlagState2, FEATURE_VERSION_2)
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
  const remoteFlag = getMultichainAccountsRemoteFeatureFlags(
    state,
    STATE_2_FLAG,
  );
  return isMultichainAccountsFeatureEnabled(remoteFlag, FEATURE_VERSION_2);
};
