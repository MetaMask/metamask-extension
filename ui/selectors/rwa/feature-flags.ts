import { createSelector } from 'reselect';
import { isRWAFeatureEnabled } from '../../../shared/lib/rwa-feature-flag';
import { getRemoteFeatureFlags } from '../remote-feature-flags';

/**
 * Get the state of the `rwaEnabledVersion` remote feature flag.
 * Expects a JSON flag with enabled/minimumVersion properties for version gating.
 *
 * @param _state - The MetaMask state object
 * @returns `true` if RWA feature is enabled and meets version requirements, `false` otherwise.
 */
export const selectRWAEnabledFlag = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    isRWAFeatureEnabled(remoteFeatureFlags.rwaEnabledVersion),
);
