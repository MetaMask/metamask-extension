import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import { useMetamaskNotificationsContext } from '../../../contexts/metamask-notifications/metamask-notifications';
import {
  disableProfileSyncing as disableProfileSyncingAction,
  enableProfileSyncing as enableProfileSyncingAction,
  setIsProfileSyncingEnabled as setIsProfileSyncingEnabledAction,
  hideLoadingIndication,
} from '../../../store/actions';

import { selectIsSignedIn } from '../../../selectors/metamask-notifications/authentication';
import { selectIsProfileSyncingEnabled } from '../../../selectors/metamask-notifications/profile-syncing';
import { getUseExternalServices } from '../../../selectors';
import {
  getIsUnlocked,
  getCompletedOnboarding,
} from '../../../ducks/metamask/metamask';

/**
 * Custom hook to enable profile syncing. This hook handles the process of signing in
 * and enabling profile syncing via dispatch actions.
 *
 * @returns An object containing the `enableProfileSyncing` function, loading state, and error state.
 */
export function useEnableProfileSyncing(): {
  enableProfileSyncing: () => Promise<void>;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [error, setError] = useState<string | null>(null);

  const enableProfileSyncing = useCallback(async () => {
    setError(null);

    try {
      // set profile syncing to true
      await dispatch(enableProfileSyncingAction());
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : JSON.stringify(e ?? '');
      log.error(errorMessage);
      setError(errorMessage);
    }
  }, [dispatch]);

  return { enableProfileSyncing, error };
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
  error: string | null;
} {
  const dispatch = useDispatch();
  const { listNotifications } = useMetamaskNotificationsContext();

  const [error, setError] = useState<string | null>(null);

  const disableProfileSyncing = useCallback(async () => {
    setError(null);

    try {
      // disable profile syncing
      await dispatch(disableProfileSyncingAction());

      // list notifications to update the counter
      await listNotifications();
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : JSON.stringify(e ?? '');
      setError(errorMessage);
      log.error(errorMessage);
    } finally {
      dispatch(hideLoadingIndication());
    }
  }, [dispatch]);

  return { disableProfileSyncing, error };
}

export function useSetIsProfileSyncingEnabled(): {
  setIsProfileSyncingEnabled: (state: boolean) => Promise<void>;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [error, setError] = useState<string | null>(null);

  const setIsProfileSyncingEnabled = useCallback(
    async (state: boolean) => {
      setError(null);

      try {
        await dispatch(setIsProfileSyncingEnabledAction(state));
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        setError(errorMessage);
        log.error(errorMessage);
      }
    },
    [dispatch],
  );

  return { setIsProfileSyncingEnabled, error };
}

/**
 * A utility used internally to decide if syncing features should be dispatched
 * Considers factors like basic functionality; unlocked; finished onboarding, and is logged in
 *
 * @returns a boolean if internally we can perform syncing features or not.
 */
export const useShouldDispatchProfileSyncing = () => {
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  const basicFunctionality: boolean | undefined = useSelector(
    getUseExternalServices,
  );
  const isUnlocked: boolean | undefined = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);
  const completedOnboarding: boolean | undefined = useSelector(
    getCompletedOnboarding,
  );

  const shouldDispatchProfileSyncing: boolean = Boolean(
    basicFunctionality &&
      isProfileSyncingEnabled &&
      isUnlocked &&
      isSignedIn &&
      completedOnboarding,
  );

  return shouldDispatchProfileSyncing;
};
