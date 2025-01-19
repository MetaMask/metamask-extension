import { getManifestFlags } from '../../shared/lib/manifestFlags';

/**
 * Gets the remote feature flags by combining flags from both the manifest and state.
 * Manifest flags take precedence and will override any duplicate flags from state.
 * This allows for both static (manifest) and dynamic (state) feature flag configuration.
 *
 * @param state - The MetaMask state object
 * @returns Combined feature flags object with manifest flags taking precedence over state flags
 */
export function getRemoteFeatureFlags(state) {
  const manifestFlags = getManifestFlags().remoteFeatureFlags;
  const stateFlags = state.metamask.remoteFeatureFlags;

  return {
    ...stateFlags,
    ...manifestFlags,
  };
}
