import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';
import { getBooleanFeatureFlag } from '../../shared/lib/remote-feature-flag-utils';

/** Home campaigns are opt-in via the same version-gated flag as Mobile. */
export const selectBrazeBannerHomeEnabled = createSelector(
  getRemoteFeatureFlags,
  (flags) => getBooleanFeatureFlag(flags?.brazeBannerHomeMinVersion, false),
);
