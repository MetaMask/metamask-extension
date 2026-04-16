import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../remote-feature-flags';

/**
 * Get the state of the `rwaTokensEnabled` remote feature flag.
 *
 * @param _state - The MetaMask state object
 * @returns `true` if RWA token features are enabled, `false` otherwise.
 */
export const getIsRWATokensEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) => remoteFeatureFlags.rwaTokensEnabled === true,
);
