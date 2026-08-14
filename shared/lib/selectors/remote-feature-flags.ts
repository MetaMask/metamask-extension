import merge from 'lodash/merge';
import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { createSelector } from 'reselect';
import { getManifestFlags, ManifestFlags } from '../manifestFlags';

export type RemoteFeatureFlagsState = {
  metamask: {
    remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'];
    featureFlagThresholdGroups?: RemoteFeatureFlagControllerState['featureFlagThresholdGroups'];
  };
};

/**
 * Gets the remote feature flags by combining flags from both the manifest and state.
 * Manifest flags take precedence and will override any duplicate flags from state.
 * This allows for both static (manifest) and dynamic (state) feature flag configuration.
 *
 * @param state - The MetaMask state object
 * @returns Combined feature flags object with manifest flags taking precedence over state flags
 */
export const getRemoteFeatureFlags = createSelector(
  (): ManifestFlags['remoteFeatureFlags'] =>
    getManifestFlags().remoteFeatureFlags,
  (
    state: RemoteFeatureFlagsState,
  ): RemoteFeatureFlagControllerState['remoteFeatureFlags'] =>
    state.metamask.remoteFeatureFlags,
  (manifestFlags, stateFlags) => merge({}, stateFlags, manifestFlags),
);

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
