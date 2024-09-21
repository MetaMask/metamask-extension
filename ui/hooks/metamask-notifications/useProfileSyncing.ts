import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-api';
import log from 'loglevel';
import {
  disableProfileSyncing as disableProfileSyncingAction,
  enableProfileSyncing as enableProfileSyncingAction,
  setIsProfileSyncingEnabled as setIsProfileSyncingEnabledAction,
  hideLoadingIndication,
  syncInternalAccountsWithUserStorage,
} from '../../store/actions';

import { selectIsSignedIn } from '../../selectors/metamask-notifications/authentication';
import { selectIsProfileSyncingEnabled } from '../../selectors/metamask-notifications/profile-syncing';
import { getUseExternalServices } from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/metamask';

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

/**
 * Custom hook to dispatch account syncing.
 *
 * @returns An object containing the `dispatchAccountSyncing` function, boolean `shouldDispatchAccountSyncing`,
 * and error state.
 */
export const useAccountSyncing = () => {
  const dispatch = useDispatch();

  const [error, setError] = useState<unknown>(null);

  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  const basicFunctionality = useSelector(getUseExternalServices);
  const isUnlocked = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);

  const shouldDispatchAccountSyncing = useMemo(
    () =>
      basicFunctionality && isProfileSyncingEnabled && isUnlocked && isSignedIn,
    [basicFunctionality, isProfileSyncingEnabled, isUnlocked, isSignedIn],
  );

  const dispatchAccountSyncing = useCallback(async () => {
    setError(null);

    try {
      if (!shouldDispatchAccountSyncing) {
        return;
      }
      await dispatch(syncInternalAccountsWithUserStorage());
    } catch (e) {
      log.error(e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    }
  }, [dispatch, shouldDispatchAccountSyncing]);

  return {
    dispatchAccountSyncing,
    shouldDispatchAccountSyncing,
    error,
  };
};

/**
 * Custom hook to apply account syncing effect.
 */
export const useAccountSyncingEffect = () => {
  const { dispatchAccountSyncing } = useAccountSyncing();

  useEffect(() => {
    dispatchAccountSyncing();
  }, [dispatchAccountSyncing]);
};
