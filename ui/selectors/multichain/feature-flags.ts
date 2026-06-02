// TODO: remove dead code in this file and related files now that code fences are gone

import { createSelector } from 'reselect';
import { isMultichainFeatureEnabled } from '../../../shared/lib/multichain-feature-flags';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';

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
    enabled = isMultichainFeatureEnabled(bitcoinAccounts);
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
    enabled = isMultichainFeatureEnabled(tronAccounts);
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

export const getIsTransactionLabelsEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ extensionTransactionLabels }) => Boolean(extensionTransactionLabels),
);

/**
 * Get the state of the `extensionUxTokenManagementFilter` remote feature flag.
 * When enabled, the asset list import-tokens entry point opens a full-screen
 * Token Management page where users can toggle tokens on/off, replacing the
 * legacy import-tokens modal.
 *
 * @param _state - The MetaMask state object
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const getIsTokenManagementFilterEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ extensionUxTokenManagementFilter }) =>
    getBooleanFeatureFlag(extensionUxTokenManagementFilter, false),
);

/**
 * Get the state of the `extensionUxNetworkManagement` remote feature flag.
 *
 * @param _state - The MetaMask state object
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const getIsNetworkManagementEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ extensionUxNetworkManagement }) =>
    getBooleanFeatureFlag(extensionUxNetworkManagement, false),
);
