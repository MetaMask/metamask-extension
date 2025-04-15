import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import log from 'loglevel';
import {
  disableProfileSyncing as disableProfileSyncingAction,
  enableProfileSyncing as enableProfileSyncingAction,
  hideLoadingIndication,
} from '../../../store/actions';

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
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31881
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await dispatch(enableProfileSyncingAction());
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
      // eslint-disable-next-line id-length
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
 * Custom hook to disable profile syncing. This hook handles the process of
 * disabling profile syncing.
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
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31881
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await dispatch(disableProfileSyncingAction());
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
      // eslint-disable-next-line id-length
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
