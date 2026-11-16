import { createSelector } from 'reselect';
import { isBrazeConfigured } from '../../shared/lib/braze';
import { getBooleanFeatureFlag } from '../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';

/**
 * Whether the wallet home shows the Braze banner instead of the carousel.
 * Uses the same version-gated flag as Mobile, and requires a build with Braze
 * configuration.
 */
export const getIsBrazeBannerHomeEnabled = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    isBrazeConfigured() &&
    getBooleanFeatureFlag(flags?.brazeBannerHomeMinVersion, false),
);
