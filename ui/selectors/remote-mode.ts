import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from './remote-feature-flags';

/**
 * Get the state of the `vaultRemoteMode` remote feature flag.
 *
 * @param state - The MetaMask state object
 * @returns The state of the `vaultRemoteMode` remote feature flag
 */
export function getIsRemoteModeEnabled(state: RemoteFeatureFlagsState) {
  const { vaultRemoteMode } = getRemoteFeatureFlags(state);
  return Boolean(vaultRemoteMode);
}
