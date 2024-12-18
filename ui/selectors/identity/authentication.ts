import { createSelector } from 'reselect';
import { BackgroundStateProxy } from '../../../shared/types/metamask';

type AuthenticationState = {
  metamask: Pick<
    BackgroundStateProxy,
    'AuthenticationController' | 'MetaMetricsController'
  >;
};

const getMetamask = (state: AuthenticationState) => state.metamask;

/**
 * Selector to determine if the user is signed in.
 *
 * This selector retrieves the `isSignedIn` property from the `metamask` state using the `createSelector` function from 'reselect'.
 * It provides a memoized selector that returns the sign-in status of the user.
 *
 * @param {AuthenticationState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the user is signed in, false otherwise.
 */
export const selectIsSignedIn = createSelector(
  [getMetamask],
  (metamask) => metamask.AuthenticationController.isSignedIn,
);

/**
 * Selector to retrieve session data.
 *
 * This selector fetches the `sessionData` from the `metamask` state using the `createSelector` function.
 * It provides a memoized selector that returns the session data stored in the MetaMask state.
 *
 * @param {AuthenticationState} state - The current state of the Redux store.
 * @returns {any} Returns the session data associated with the current user session.
 */
export const selectSessionData = createSelector(
  [getMetamask],
  (metamask) => metamask.AuthenticationController.sessionData,
);
