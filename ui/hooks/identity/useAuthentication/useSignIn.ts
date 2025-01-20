import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import log from 'loglevel';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';
import { selectIsProfileSyncingEnabled } from '../../../selectors/identity/profile-syncing';
import { performSignIn } from '../../../store/actions';
import { getParticipateInMetaMetrics } from '../../../selectors';

/**
 * Custom hook to manage sign-in based on the user's authentication status,
 * profile syncing preference, and participation in MetaMetrics.
 *
 * This hook encapsulates the logic for initiating a sign-in process if the user is not already signed in
 * and either profile syncing or MetaMetrics participation is enabled. It handles loading state and errors
 * during the sign-in process.
 *
 * @returns An object containing:
 * - `signIn`: A function to initiate the sign-in process.
 * - `shouldSignIn`: A function to determine if the user should sign in based on the current state.
 */
export function useSignIn(): {
  signIn: () => Promise<void>;
  shouldSignIn: () => boolean;
} {
  const dispatch = useDispatch();

  const isSignedIn = useSelector(selectIsSignedIn);
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  const isParticipateInMetaMetrics = useSelector(getParticipateInMetaMetrics);

  const shouldSignIn = useCallback(() => {
    return (
      !isSignedIn && (isProfileSyncingEnabled || isParticipateInMetaMetrics)
    );
  }, [isSignedIn, isProfileSyncingEnabled, isParticipateInMetaMetrics]);

  const signIn = useCallback(async () => {
    if (shouldSignIn()) {
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
    shouldSignIn,
  };
}
