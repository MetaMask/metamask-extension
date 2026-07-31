import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';

/**
 * Selector to determine if the ramps feature is enabled.
 *
 * TEMP QA (`test/tram-3718-prod-ramps-qa`): forced ON. Client-config currently
 * has `rampsEnabled` enabled for `dev` but disabled for `rc`/`prod`. Forcing
 * here keeps native ramps usable while this branch points the ramps API at
 * Production. Do not merge this override to `main`.
 *
 * @param _state - The root Redux state object.
 * @returns Boolean indicating whether ramps feature is enabled.
 */
export const getIsRampsEnabled = createSelector(
  getRemoteFeatureFlags,
  // TEMP QA override — always enable native ramps for this branch.
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
