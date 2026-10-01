import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';

export type RemoteFeatureFlagsState = {
  metamask: {
    remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'];
    featureFlagThresholdGroups?: RemoteFeatureFlagControllerState['featureFlagThresholdGroups'];
  };
};

/**
 * Gets the effective remote feature flags from controller state.
 *
 * The RemoteFeatureFlagController applies remote, local, and client-provided
 * manifest overrides before publishing its state. Reading it directly keeps
 * every consumer on the same effective flag values.
 *
 * @param state - The MetaMask state object
 * @returns The effective remote feature flags
 */
export function getRemoteFeatureFlags(
  state: RemoteFeatureFlagsState,
): RemoteFeatureFlagControllerState['remoteFeatureFlags'] {
  return state.metamask.remoteFeatureFlags;
}

// Stable reference for the empty case so the selector does not return a fresh
// object each call (which would break referential equality and cause redundant
// rerenders / useSelector stability warnings).
const EMPTY_THRESHOLD_GROUPS: Record<string, string> = {};

/**
 * Gets the selected threshold group name per feature flag, stored separately
 * from the flag value for threshold and A/B flags.
 *
 * @param state - The MetaMask state object
 * @returns A map of feature flag name to its selected threshold group name
 */
export function getFeatureFlagThresholdGroups(
  state: RemoteFeatureFlagsState,
): Record<string, string> {
  return state.metamask.featureFlagThresholdGroups ?? EMPTY_THRESHOLD_GROUPS;
}
