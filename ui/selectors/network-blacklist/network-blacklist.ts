import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../remote-feature-flags';

export type AdditionalNetworksBlacklistFeatureFlag = {
  additionalNetworksBlacklist: string[];
};

/**
 * Selector to get the additional networks blacklist feature flag from remote feature flags.
 * Allows to remove a network from the additional network selection.
 * Returns an array of chain IDs that should be hidden from the Additional Networks list.
 *
 * Overrides can be configured via .manifest-overrides.json
 *
 * @param state - The Redux state
 * @returns Array of blacklisted chain IDs
 */
export const selectAdditionalNetworksBlacklistFeatureFlag = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) => {
    const remoteValue = remoteFeatureFlags.additionalNetworksBlacklist as
      | string[]
      | undefined;

    // Return the remote value or empty array if not set
    return Array.isArray(remoteValue) ? remoteValue : [];
  },
);
