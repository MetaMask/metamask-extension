import { createSelector } from 'reselect';
import type { AuthenticationController } from '@metamask/profile-sync-controller';

type AppState = {
  metamask: AuthenticationController.AuthenticationControllerState;
};

const getMetamask = (state: AppState) => state.metamask;

/**
 * Selector to determine if the user is signed in.
 *
 * This selector retrieves the `isSignedIn` property from the `metamask` state using the `createSelector` function from 'reselect'.
 * It provides a memoized selector that returns the sign-in status of the user.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the user is signed in, false otherwise.
 */
export const selectIsSignedIn = createSelector(
  [getMetamask],
  (metamask) => metamask.isSignedIn,
);

/**
 * Selector to retrieve the primary SRP session data.
 *
 * This selector fetches the `srpSessionData` from the `metamask` state using the `createSelector` function, and gets the first entry.
 * It provides a memoized selector that returns the session data stored in the MetaMask state.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {any} Returns the session data associated with the current user session.
 */
export const selectSessionData = createSelector([getMetamask], (metamask) =>
  metamask.srpSessionData
    ? Object.entries(metamask.srpSessionData)?.[0]?.[1]
    : undefined,
);
