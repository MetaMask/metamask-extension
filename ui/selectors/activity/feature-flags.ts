import { createSelector } from 'reselect';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';

/**
 * Extension UX Activity List Redesign (`extensionUxActivityListRedesign`).
 * When enabled, the home Activity tab uses the v3 activity list; otherwise activity-v2.
 *
 * @param _state - The MetaMask state object
 * @returns True when the version-gated flag is enabled for this build.
 */
export const getIsActivityListRedesignEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ extensionUxActivityListRedesign }) =>
    true
    // getBooleanFeatureFlag(extensionUxActivityListRedesign, false),
);

