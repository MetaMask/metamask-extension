import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';

/**
 * Selector to determine if the ramps feature is enabled.
 *
 * @param state - The root Redux state object.
 * @returns Boolean indicating whether ramps feature is enabled.
 */
export const getIsRampsEnabled = createSelector(
  getRemoteFeatureFlags,
  (flags) => Boolean(flags?.rampsEnabled),
);

/**
 * Selector to determine if the ramps service disruption is active.
 *
 * @param state - The root Redux state object.
 * @returns Boolean indicating whether ramps service disruption is active.
 */
export const getIsRampsServiceDisruptionActive = createSelector(
  getRemoteFeatureFlags,
  (flags) => Boolean(flags?.rampsServiceDisruption),
);
