import { createSelector } from 'reselect';
import type { UserStorageController } from '@metamask/profile-sync-controller';

type AppState = {
  metamask: UserStorageController.UserStorageControllerState & {
    hasFinishedAddingAccountsWithBalance: boolean;
  };
};

const getMetamask = (state: AppState) => state.metamask;

/**
 * Selector to determine if profile syncing is enabled.
 *
 * This selector uses the `createSelector` function from 'reselect' to compute whether profile syncing is enabled,
 * based on the `isProfileSyncingEnabled` property of the `metamask` object in the Redux store.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if profile syncing is enabled, false otherwise.
 */
export const selectIsProfileSyncingEnabled = createSelector(
  [getMetamask],
  (metamask) => metamask.isProfileSyncingEnabled,
);

/**
 * Selector to determine if the profile syncing update is currently loading.
 *
 * This selector uses the `createSelector` function from 'reselect' to compute whether the update process for profile syncing is currently in a loading state,
 * based on the `isProfileSyncingUpdateLoading` property of the `metamask` object in the Redux store.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the profile syncing update is loading, false otherwise.
 */
export const selectIsProfileSyncingUpdateLoading = createSelector(
  [getMetamask],
  (metamask) => {
    return metamask.isProfileSyncingUpdateLoading;
  },
);

/**
 * Selector to determine if the method _addAccountsWithBalance has finished adding accounts after onboarding.
 * This is needed for account syncing in order to prevent conflicts with accounts that are being added by the above method during onboarding.
 *
 * This selector uses the `createSelector` function from 'reselect' to compute whether the update process for profile syncing is currently in a loading state,
 * based on the `hasFinishedAddingAccountsWithBalance` property of the `metamask` object in the Redux store.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the profile syncing update is loading, false otherwise.
 */
export const selectHasFinishedAddingAccountsWithBalance = createSelector(
  [getMetamask],
  (metamask) => {
    return metamask.hasFinishedAddingAccountsWithBalance;
  },
);
