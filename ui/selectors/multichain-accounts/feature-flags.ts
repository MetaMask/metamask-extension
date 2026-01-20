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
