import { createSelector } from 'reselect';
import { isBatchSellEnabled } from '../../../shared/lib/batch-sell-feature-flags';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { isHardwareWallet } from '../../../shared/lib/selectors/keyring';

/**
 * Returns whether the Batch Sell feature should be shown in the UI.
 *
 * Enabled only when the `batchSell` remote feature flag contains a
 * `minimumVersion` semver string and the current app version is greater than
 * or equal to it, and the currently selected account is not a hardware wallet.
 *
 * @param state - The MetaMask Redux state.
 * @returns `true` if Batch Sell is available for this app version and account type.
 */
export const getIsBatchSellEnabled = createSelector(
  getRemoteFeatureFlags,
  (state) => isHardwareWallet(state as never),
  (remoteFeatureFlags, hardwareWalletSelected) =>
    isBatchSellEnabled(remoteFeatureFlags.batchSell) && !hardwareWalletSelected,
);
