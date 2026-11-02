import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';
import { getBooleanFeatureFlag } from '../../shared/lib/remote-feature-flag-utils';

/**
 * Selector to determine if the X.com dapp connection warning is enabled.
 * This warning shows an interstitial when a dapp connection request originates
 * from x.com or its subdomains.
 *
 * The feature is enabled by default (kill switch pattern) - it will show
 * unless the remote flag is explicitly set to false.
 *
 * @param state - The root Redux state object.
 * @returns Boolean indicating whether the X.com warning should be shown.
 */
export const getIsXDappConnectionWarningEnabled = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    getBooleanFeatureFlag(flags?.extensionXDappConnectionWarning, true),
);
