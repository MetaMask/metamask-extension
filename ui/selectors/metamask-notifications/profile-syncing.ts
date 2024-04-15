import { createSelector } from 'reselect';

interface AppState {
  isProfileSyncingEnabled: boolean;
}

export const selectIsProfileSyncingEnabled = createSelector(
  [(state: AppState) => state.isProfileSyncingEnabled],
  (isProfileSyncingEnabled) => isProfileSyncingEnabled,
);
