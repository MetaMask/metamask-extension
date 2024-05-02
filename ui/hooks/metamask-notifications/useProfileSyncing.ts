import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-api';
import {
  selectIsSignedIn,
  selectParticipateInMetaMetrics,
} from '../../selectors/metamask-notifications/authentication';
import { selectIsProfileSyncingEnabled } from '../../selectors/metamask-notifications/profile-syncing';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import {
  disableProfileSyncing as disableProfileSyncingAction,
  enableProfileSyncing as enableProfileSyncingAction,
  performSignIn,
  performSignOut,
  showLoadingIndication,
  hideLoadingIndication,
} from '../../store/actions';
import { useDisableNotifications } from './useNotifications';

// Define KeyringType interface
export type KeyringType = {
  type: string;
};

// Define AccountType interface
export type AccountType = InternalAccount & {
  balance: string;
  keyring: KeyringType;
  label: string;
};

/**
 * Custom hook to enable profile syncing. This hook handles the process of signing in
 * and enabling profile syncing via dispatch actions.
 *
 * @returns An object containing the `enableProfileSyncing` function, loading state, and error state.
 */
export function useEnableProfileSyncing(): {
  enableProfileSyncing: () => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();

  const isSignedIn = useSelector(selectIsSignedIn);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const enableProfileSyncing = useCallback(async () => {
    setLoading(true);
    showLoadingIndication();
    setError(null);

    try {
      // if the user is not signed in, perform sign in
      if (!isSignedIn) {
        await dispatch(performSignIn());
      }

      // set profile syncing to true
      await dispatch(enableProfileSyncingAction());
    } catch (e) {
      // if an error occurs, we need to be sure that the
      // profileSyncing is not enabled
      await dispatch(disableProfileSyncingAction());

      const errorMessage =
        e instanceof Error ? e.message : JSON.stringify(e ?? '');
      setError(errorMessage);
    } finally {
      setLoading(false);
      hideLoadingIndication();
    }

    setLoading(false);
    hideLoadingIndication();
  }, [dispatch, isSignedIn]);

  return { enableProfileSyncing, loading, error };
}

/**
 * Custom hook to disable profile syncing. This hook handles the process of disabling notifications,
 * disabling profile syncing, and signing out if MetaMetrics participation is not enabled.
 *
 * @returns An object containing the `disableProfileSyncing` function, current profile syncing state,
 * loading state, and error state.
 */
export function useDisableProfileSyncing(): {
  disableProfileSyncing: () => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();
  const isSignedIn = useSelector(selectIsSignedIn);
  const isParticipateInMetaMetrics = useSelector(
    selectParticipateInMetaMetrics,
  );
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  const { disableNotifications } = useDisableNotifications();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const disableProfileSyncing = useCallback(async () => {
    setLoading(true);
    showLoadingIndication();
    setError(null);

    try {
      // if the notifications are enabled, disable them
      // and set the states to false
      if (isMetamaskNotificationsEnabled) {
        disableNotifications();
      }

      // disable profile syncing
      await dispatch(disableProfileSyncingAction());

      // if metametrics is not enabled, perform sign out
      if (!isParticipateInMetaMetrics) {
        // perform sign out
        await dispatch(performSignOut());
      }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : JSON.stringify(e ?? '');
      setError(errorMessage);
    } finally {
      setLoading(false);
      hideLoadingIndication();
    }

    setLoading(false);
    hideLoadingIndication();
  }, [dispatch, isSignedIn, isMetamaskNotificationsEnabled]);

  return { disableProfileSyncing, loading, error };
}

/**
 * Custom hook to check if profile syncing is enabled. This hook uses a selector to retrieve
 * the profile syncing state from the Redux store.
 *
 * @returns An object containing the current state of profile syncing.
 */
export function useIsProfileSyncingEnabled(): {
  isProfileSyncingEnabled: boolean;
} {
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  return { isProfileSyncingEnabled };
}
