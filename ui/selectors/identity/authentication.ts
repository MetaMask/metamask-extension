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
 * Selector that exposes the `needsProfilePairing` flag from the
 * `AuthenticationController` state.
 *
 * Used by `useAutoSignIn` to drive the auto-sign-in / pairing cycle: when
 * `needsProfilePairing` is `true`, the gate fires and `useAutoSignIn`
 * dispatches `signIn(true)` so `performSignIn` re-runs and pairing executes
 * (or retries on the next eligible trigger if it fails).
 *
 * Defaults to `true` when the field is absent from state — this mirrors the
 * controller's `defaultState`, ensures the upgrade path works even before a
 * `:stateChange` event has populated the field, and matches the controller's
 * own JSDoc guidance for handling `undefined`.
 *
 * @param state - The current state of the Redux store.
 * @returns `true` if profile pairing is needed, `false` otherwise.
 */
export const selectNeedsProfilePairing = createSelector(
  [getMetamask],
  (metamask) => metamask.needsProfilePairing ?? true,
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
