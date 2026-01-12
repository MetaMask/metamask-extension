import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../remote-feature-flags';

/**
 * Get the state of the `perpsEnabled` remote feature flag.
 *
 * @param _state - The MetaMask state object
 * @returns `true` if Perps trading is enabled, `false` otherwise.
 */
export const getIsPerpsEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) => remoteFeatureFlags.perpsEnabled === true,
);
