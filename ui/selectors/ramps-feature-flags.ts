import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';
import { getBooleanFeatureFlag } from '../../shared/lib/remote-feature-flag-utils';

/**
 * Selector to determine if the ramps feature is enabled.
 * Supports version-gated and progressive rollout flag formats, e.g.
 * `{ enabled: true, minimumVersion: '13.41.0' }` or
 * `{ name: 'rollout', value: { enabled: true, minimumVersion: '13.41.0' } }`.
 *
 * @param state - The root Redux state object.
 * @returns Boolean indicating whether ramps feature is enabled.
 */
export const getIsRampsEnabled = createSelector(
  getRemoteFeatureFlags,
  (flags) => getBooleanFeatureFlag(flags?.rampsEnabled, false),
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
