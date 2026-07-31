import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';

/**
 * Selector to determine if the ramps feature is enabled.
 *
 * TEST PR (`test/tram-3718-prod-ramps-qa`): force ON so QA does not depend on
 * client-config `rc`/`prod` (where `rampsEnabled` is currently false).
 *
 * @param _state - The root Redux state object.
 * @returns Boolean indicating whether ramps feature is enabled.
 */
export const getIsRampsEnabled = createSelector(
  getRemoteFeatureFlags,
  // TEST PR override — always enable native ramps for this QA branch.
  (_flags) => true,
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
