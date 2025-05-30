import { createSelector } from 'reselect';
import type { UserStorageController } from '@metamask/profile-sync-controller';

type AppState = {
  metamask: UserStorageController.UserStorageControllerState & {
    hasFinishedAddingAccountsWithBalance?: boolean;
  };
};

const getMetamask = (state: AppState) => state.metamask;

/**
 * Selector to determine if backup and sync is enabled.
 *
 * This selector uses the `createSelector` function from 'reselect' to compute whether backup and sync is enabled,
 * based on the `isBackupAndSyncEnabled` property of the `metamask` object in the Redux store.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if backup and sync is enabled, false otherwise.
 */
export const selectIsBackupAndSyncEnabled = createSelector(
  [getMetamask],
  (metamask) => metamask.isBackupAndSyncEnabled,
);

/**
 * Selector to determine if the backup and sync update is currently loading.
 *
 * This selector uses the `createSelector` function from 'reselect' to compute whether the update process for backup and sync is currently in a loading state,
 * based on the `isBackupAndSyncUpdateLoading` property of the `metamask` object in the Redux store.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the backup and sync update is loading, false otherwise.
 */
export const selectIsBackupAndSyncUpdateLoading = createSelector(
  [getMetamask],
  (metamask) => {
    return metamask.isBackupAndSyncUpdateLoading;
  },
);

/**
 * Selector to determine if account syncing is ready to be dispatched. This is set to true after all operations adding accounts are completed.
 * This is needed for account syncing in order to prevent conflicts with accounts that are being added by the above method during onboarding.
 *
 * This selector uses the `createSelector` function from 'reselect' to compute whether account syncing is ready to be dispatched,
 * based on the `hasFinishedAddingAccountsWithBalance` property of the `metamask` object in the Redux store.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if account syncing is ready to be dispatched, false otherwise.
 */
export const selectIsAccountSyncingReadyToBeDispatched = createSelector(
  [getMetamask],
  (metamask) => {
    return metamask.isAccountSyncingReadyToBeDispatched;
  },
);

/**
 * Selector to determine if account syncing is enabled.
 *
 * This selector uses the `createSelector` function from 'reselect' to compute whether account syncing is enabled,
 * based on the `hasFinishedAddingAccountsWithBalance` property of the `metamask` object in the Redux store.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if account syncing is enabled, false otherwise.
 */
export const selectIsAccountSyncingEnabled = createSelector(
  [getMetamask],
  (metamask) => {
    return metamask.isAccountSyncingEnabled;
  },
);

/**
 * Selector to determine if contact syncing is enabled.
 *
 * This selector uses the `createSelector` function from 'reselect' to compute whether contact syncing is enabled,
 * based on the `isContactSyncingEnabled` property of the `metamask` object in the Redux store.
 */
export const selectIsContactSyncingEnabled = createSelector(
  [getMetamask],
  (metamask) => {
    return metamask.isContactSyncingEnabled;
  },
);
