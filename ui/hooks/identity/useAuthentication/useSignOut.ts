import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import log from 'loglevel';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';
import { performSignOut } from '../../../store/actions';

/**
 * Custom hook to manage sign-out
 *
 * Use this hook to manually sign out the user.
 * Any automatic sign-out should be handled by the `MetamaskIdentityProvider` with the `useAutoSignOut` hook.
 * IMPORTANT: nothing other than basic functionality being turned off should trigger a sign out.
 *
 * This hook encapsulates the logic for initiating a sign-out process if the user is signed in.
 * It handles loading state and errors during the sign-out process.
 *
 * @returns An object containing:
 * - `signOut`: A function to initiate the sign-out process.
 */
export function useSignOut(): {
  signOut: () => Promise<void>;
} {
  const dispatch = useDispatch();

  const isSignedIn = useSelector(selectIsSignedIn);

  const shouldSignOut = useMemo(() => Boolean(isSignedIn), [isSignedIn]);

  const signOut = useCallback(async () => {
    if (shouldSignOut) {
      try {
        // TODO: Fix Redux dispatch typing - implement useAppDispatch pattern
        // Discussion: https://github.com/MetaMask/metamask-extension/pull/32052#discussion_r2195789610
        // Solution: Update MetaMaskReduxDispatch type to properly handle async thunks
        // Extract thunk dispatch calls to separate issue - these are TypeScript/ESLint typing issues
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await dispatch(performSignOut());
      } catch (e) {
        // If an error occurs during the sign-out process, silently fail
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        log.error(errorMessage);
      }
    }
  }, [dispatch, shouldSignOut]);

  return {
    signOut,
  };
}
