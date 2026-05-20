import { createSelector } from 'reselect';
import { isBatchSellEnabled } from '../../../shared/lib/batch-sell-feature-flags';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';

/**
 * Returns whether the Batch Sell feature should be shown in the UI.
 *
 * Enabled only when the `batchSell` remote feature flag contains a
 * `minimumVersion` semver string and the current app version is greater than
 * or equal to it.
 *
 * @param state - The MetaMask Redux state.
 * @returns `true` if Batch Sell is available for this app version.
 */
export const getIsBatchSellEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) => isBatchSellEnabled(remoteFeatureFlags.batchSell),
);
