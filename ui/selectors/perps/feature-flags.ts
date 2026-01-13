import { createSelector } from 'reselect';
import { isPerpsFeatureEnabled } from '../../../shared/lib/perps-feature-flags';
import { getRemoteFeatureFlags } from '../remote-feature-flags';

/**
 * Get the state of the `perpsEnabled` remote feature flag.
 * Supports both simple boolean flags (backward compatible) and object flags
 * with enabled/minimumVersion properties for version gating.
 *
 * @param _state - The MetaMask state object
 * @returns `true` if Perps trading is enabled and meets version requirements, `false` otherwise.
 */
export const getIsPerpsEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    isPerpsFeatureEnabled(remoteFeatureFlags.perpsEnabled),
);
