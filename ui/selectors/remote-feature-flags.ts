import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { createSelector } from 'reselect';
import {
  getManifestFlags,
  ManifestFlags,
} from '../../shared/lib/manifestFlags';
import { mergeRemoteFeatureFlagsManifestFlags } from '../../shared/lib/flags-utils';

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
  mergeRemoteFeatureFlagsManifestFlags,
);
