import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import log from 'loglevel';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';
import { performSignIn } from '../../../store/actions';

/**
 * Custom hook to manage sign-in
 * Use this hook to manually sign in the user.
 * Any automatic sign-in should be handled by the `MetamaskIdentityProvider` with the `useAutoSignIn` hook.
 *
 * This hook encapsulates the logic for initiating a sign-in process if the user is not already signed in
 * and at least one auth dependent feature is enabled. It needs the user to have basic functionality on.
 * It handles loading state and errors during the sign-in process.
 *
 * @returns An object containing:
 * - `signIn`: A function to initiate the sign-in process.
 */
export function useSignIn(): {
  signIn: () => Promise<void>;
} {
  const dispatch = useDispatch();

  const isSignedIn = useSelector(selectIsSignedIn);

  const shouldSignIn = useMemo(() => !isSignedIn, [isSignedIn]);

  const signIn = useCallback(async () => {
    if (shouldSignIn) {
      try {
        await dispatch(performSignIn());
      } catch (e) {
        // If an error occurs during the sign-in process, silently fail
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        log.error(errorMessage);
      }
    }
  }, [dispatch, shouldSignIn]);

  return {
    signIn,
  };
}
