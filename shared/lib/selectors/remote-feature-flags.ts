import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { createSelector } from 'reselect';
import { getManifestFlags, ManifestFlags } from '../manifestFlags';
import { applyManifestFlagOverrides } from '../remote-feature-flag-utils';

export type RemoteFeatureFlagsState = {
  metamask: {
    remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'];
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
  // The merge itself lives in `applyManifestFlagOverrides` so that background
  // callers, which cannot use a reselect selector, share one implementation with
  // the UI rather than each reimplementing the precedence.
  (_manifestFlags, stateFlags) => applyManifestFlagOverrides(stateFlags),
);
