import { createSelector } from 'reselect';
import type { UserStorageControllerState } from '../../../app/scripts/controllers/user-storage/user-storage-controller';

type AppState = {
  metamask: UserStorageControllerState;
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
