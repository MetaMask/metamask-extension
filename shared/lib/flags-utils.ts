import { merge } from 'lodash';
import {
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerState,
} from '@metamask/remote-feature-flag-controller';
import { getManifestFlags, ManifestFlags } from './manifestFlags';

/**
 *
 * Manifest flags take precedence and will override any duplicate flags from state.
 * This allows for both static (manifest) and dynamic (state) feature flag configuration.
 * @param manifestFlags - All manifest files
 * @param remoteFeatureFlags - All remote feature flags
 * @returns Combined feature flags object with manifest flags taking precedence over state flags
 */
export const mergeRemoteFeatureFlagsManifestFlags = (
  manifestFlags: ManifestFlags['remoteFeatureFlags'],
  remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'],
) => merge({}, remoteFeatureFlags, manifestFlags);

/**
 *
 * Takes remote feature flags as input and will take care of getting Manifest flags
 * @param remoteFeatureFlags - All remote feature flags
 * @returns Combined feature flags object with manifest flags taking precedence over state flags
 */
const mergeInputRemoteFeatureFlagsWithManifestFlags = (
  remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'],
): RemoteFeatureFlagControllerState['remoteFeatureFlags'] => {
  const manifestFlags = getManifestFlags().remoteFeatureFlags;
  return mergeRemoteFeatureFlagsManifestFlags(
    manifestFlags,
    remoteFeatureFlags,
  );
};

/**
 *
 * Takes remote feature flags as input and will take care of getting Manifest flags
 * @param remoteFeatureFlagController - An instance of a RemoteFeatureFlagController holding feature flags state
 * @returns Combined feature flags object with manifest flags taking precedence over state flags
 */
export const getMergedFeatureFlagsWithController = (
  remoteFeatureFlagController: RemoteFeatureFlagController,
) => {
  return mergeInputRemoteFeatureFlagsWithManifestFlags(
    remoteFeatureFlagController.state.remoteFeatureFlags,
  );
};
