import { createSelector } from 'reselect';

type AppState = {
  isSignedIn: boolean;
  metametricsId: string;
};

export const getMetametricsId = createSelector(
  [(state: AppState) => state.metametricsId],
  (metametricsId) => metametricsId,
);

export const selectIsSignedIn = createSelector(
  [(state: AppState) => state.isSignedIn],
  (isSignedIn) => isSignedIn,
);
