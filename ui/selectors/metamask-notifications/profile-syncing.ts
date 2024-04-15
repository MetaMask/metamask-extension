import { createSelector } from 'reselect';

type AppState = {
  isProfileSyncingEnabled: boolean;
};

export const selectIsProfileSyncingEnabled = createSelector(
  [(state: AppState) => state.isProfileSyncingEnabled],
  (isProfileSyncingEnabled) => isProfileSyncingEnabled,
);
