import { createSelector } from 'reselect';
import { isMultichainFeatureEnabled } from '../../../shared/lib/multichain-feature-flags';
import { getRemoteFeatureFlags } from '../remote-feature-flags';

/**
 * Get the state of the `bitcoinAccounts` feature flag with version check.
 *
 * @param _state - The MetaMask state object
 * @returns The state of the `bitcoinAccounts` feature flag.
 */
export const getIsBitcoinSupportEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ bitcoinAccounts }) => {
    // When bitcoin is not enabled, always return false
    let enabled = false;
    ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
    enabled = isMultichainFeatureEnabled(bitcoinAccounts);
    ///: END:ONLY_INCLUDE_IF
    return enabled;
  },
);

/**
 * Get the state of the `solanaAccounts` feature flag with version check.
 *
 * @param _state - The MetaMask state object
 * @returns The state of the `solanaAccounts` feature flag.
 */
export const getIsSolanaSupportEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ solanaAccounts }) => isMultichainFeatureEnabled(solanaAccounts),
);

/**
 * Get the state of the `tronSupportEnabled` remote feature flag.
 *
 * @param _state - The MetaMask state object
 * @returns The state of the `tronSupportEnabled` remote feature flag.
 */
export const getIsTronSupportEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ tronAccounts }) => {
    let enabled = false;
    ///: BEGIN:ONLY_INCLUDE_IF(tron)
    enabled = isMultichainFeatureEnabled(tronAccounts);
    ///: END:ONLY_INCLUDE_IF
    return enabled;
  },
);

/**
 * Get the state of the `solanaTestnetsEnabled` remote feature flag.
 *
 * @param _state - The MetaMask state object
 * @returns The state of the `solanaTestnetsEnabled` remote feature flag.
 */
export const getIsSolanaTestnetSupportEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ solanaTestnetsEnabled }) => Boolean(solanaTestnetsEnabled),
);

/**
 * Get the state of the `bitcoinTestnetsEnabled` remote feature flag.
 *
 * @param _state - The MetaMask state object
 * @returns The state of the `bitcoinTestnetsEnabled` remote feature flag.
 */
export const getIsBitcoinTestnetSupportEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ bitcoinTestnetsEnabled }) => Boolean(bitcoinTestnetsEnabled),
);

/**
 * Get the state of the `tronTestnetsEnabled` remote feature flag.
 *
 * @param _state - The MetaMask state object
 * @returns The state of the `tronTestnetsEnabled` remote feature flag.
 */
export const getIsTronTestnetSupportEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ tronTestnetsEnabled }) => Boolean(tronTestnetsEnabled),
);
