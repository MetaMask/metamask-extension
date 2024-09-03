import { createSelector } from 'reselect';
import type { AuthenticationController } from '@metamask/profile-sync-controller';

type AppState = {
  metamask: AuthenticationController.AuthenticationControllerState & {
    participateInMetaMetrics: boolean;
  };
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
 * Selector to determine if the user participates in MetaMetrics.
 *
 * This selector accesses the `participateInMetaMetrics` property from the `metamask` state using the `createSelector` function.
 * It provides a memoized selector that returns whether the user has opted into MetaMetrics.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the user participates in MetaMetrics, false otherwise.
 */
export const selectParticipateInMetaMetrics = createSelector(
  [getMetamask],
  (metamask) => metamask.participateInMetaMetrics,
);

/**
 * Selector to retrieve session data.
 *
 * This selector fetches the `sessionData` from the `metamask` state using the `createSelector` function.
 * It provides a memoized selector that returns the session data stored in the MetaMask state.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {any} Returns the session data associated with the current user session.
 */
export const selectSessionData = createSelector(
  [getMetamask],
  (metamask) => metamask.sessionData,
);
