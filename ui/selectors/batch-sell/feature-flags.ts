import { createSelector } from 'reselect';

import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { isHardwareWallet } from '../../../shared/lib/selectors/keyring';

/**
 * Shape of the `batchSell` remote feature flag after it has been resolved by
 * `RemoteFeatureFlagController`. The controller processes the raw
 * version-scoped format (`{ versions: { "11.0.0": { enabled: true } } }`)
 * and stores only the matching version's value, so the UI receives a flat
 * `{ enabled: boolean }` object.
 */
export type BatchSellFeatureFlag = {
  enabled?: boolean;
};

/**
 * Returns whether the Batch Sell feature should be shown in the UI.
 *
 * Enabled only when the resolved `batchSell` remote feature flag has
 * `enabled: true` and the currently selected account is not a hardware wallet.
 *
 * @param state - The MetaMask Redux state.
 * @returns `true` if Batch Sell is available for this account and feature flag.
 */
export const getIsBatchSellEnabled = createSelector(
  getRemoteFeatureFlags,
  (state) => isHardwareWallet(state as never),
  (remoteFeatureFlags, hardwareWalletSelected) =>
    Boolean(remoteFeatureFlags.batchSell?.enabled) && !hardwareWalletSelected,
);
