import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import log from 'loglevel';
import {
  selectIsSignedIn,
  selectParticipateInMetaMetrics,
} from '../../selectors/metamask-notifications/authentication';
import { selectIsProfileSyncingEnabled } from '../../selectors/metamask-notifications/profile-syncing';
import { performSignIn, disableProfileSyncing } from '../../store/actions';

/**
 * Custom hook to manage the creation of a session based on the user's authentication status,
 * profile syncing preference, and participation in MetaMetrics.
 *
 * This hook encapsulates the logic for initiating a sign-in process if the user is not already signed in
 * and either profile syncing or MetaMetrics participation is enabled. It handles loading state and errors
 * during the sign-in process.
 *
 * @returns An object containing:
 * - `createSession`: A function to initiate the session creation process.
 */
export function useCreateSession(): {
  createSession: () => Promise<void>;
} {
  const dispatch = useDispatch();

  const isSignedIn = useSelector(selectIsSignedIn);
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  const isParticipateInMetaMetrics = useSelector(
    selectParticipateInMetaMetrics,
  );

  const createSession = useCallback(async () => {
    // If the user is already signed in, no need to create a new session
    if (isSignedIn) {
      return;
    }

    // If profile syncing and MetaMetrics participation are disabled, no need to create a session
    if (!isProfileSyncingEnabled && !isParticipateInMetaMetrics) {
      return;
    }

    // Perform sign-in process if profile syncing or MetaMetrics participation is enabled
    if (isProfileSyncingEnabled || isParticipateInMetaMetrics) {
      try {
        await dispatch(performSignIn());
      } catch (e) {
        // If an error occurs during the sign-in process, disable profile syncing
        await dispatch(disableProfileSyncing());
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        log.error(errorMessage);
      }
    }
  }, [
    dispatch,
    isSignedIn,
    isProfileSyncingEnabled,
    isParticipateInMetaMetrics,
  ]);

  return {
    createSession,
  };
}
