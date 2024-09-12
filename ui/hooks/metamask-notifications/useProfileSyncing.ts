import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import log from 'loglevel';
import {
  disableProfileSyncing as disableProfileSyncingAction,
  enableProfileSyncing as enableProfileSyncingAction,
  setIsProfileSyncingEnabled as setIsProfileSyncingEnabledAction,
  hideLoadingIndication,
} from '../../store/actions';

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

  const [error, setError] = useState<string | null>(null);

  const disableProfileSyncing = useCallback(async () => {
    setError(null);

    try {
      // disable profile syncing
      await dispatch(disableProfileSyncingAction());
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
