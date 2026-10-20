import { createSelector } from 'reselect';
import { getBooleanFeatureFlag } from '../remote-feature-flag-utils';
import { getRemoteFeatureFlags } from './remote-feature-flags';

/**
 * Whether the ramps feature is enabled: the `rampsEnabled` remote flag,
 * supporting boolean, version-gated, and progressive rollout formats.
 * Resolved from the manifest-merged flags so `.manifest-overrides.json`
 * applies to UI selectors and background callers alike.
 *
 * @param state - The state holding the remote feature flags.
 * @returns True if the ramps feature is enabled.
 */
export const getIsRampsEnabled = createSelector(
  getRemoteFeatureFlags,
  (flags) => getBooleanFeatureFlag(flags.rampsEnabled, false),
);
