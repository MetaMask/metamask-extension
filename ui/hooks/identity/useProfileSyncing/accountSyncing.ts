import log from 'loglevel';
import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  deleteAccountSyncingDataFromUserStorage,
  syncInternalAccountsWithUserStorage,
} from '../../../store/actions';
import { useShouldDispatchProfileSyncing } from './profileSyncing';

/**
 * Custom hook to dispatch account syncing.
 *
 * @returns An object containing the `dispatchAccountSyncing` function, boolean `shouldDispatchAccountSyncing`,
 * and error state.
 */
const useAccountSyncing = () => {
  const dispatch = useDispatch();

  const shouldDispatchAccountSyncing = useShouldDispatchProfileSyncing();

  const dispatchAccountSyncing = useCallback(() => {
    try {
      if (!shouldDispatchAccountSyncing) {
        return;
      }
      dispatch(syncInternalAccountsWithUserStorage());
    } catch (e) {
      log.error(e);
    }
  }, [dispatch, shouldDispatchAccountSyncing]);

  return {
    dispatchAccountSyncing,
    shouldDispatchAccountSyncing,
  };
};

/**
 * Custom hook to apply account syncing effect.
 */
export const useAccountSyncingEffect = () => {
  const shouldSync = useShouldDispatchProfileSyncing();
  const { dispatchAccountSyncing } = useAccountSyncing();

  useEffect(() => {
    if (shouldSync) {
      dispatchAccountSyncing();
    }
  }, [shouldSync, dispatchAccountSyncing]);
};

/**
 * Custom hook to delete a user's account syncing data from user storage
 */
export const useDeleteAccountSyncingDataFromUserStorage = () => {
  const dispatch = useDispatch();
  const dispatchDeleteAccountData = useCallback(async () => {
    try {
      await dispatch(deleteAccountSyncingDataFromUserStorage());
    } catch {
      // Do Nothing
    }
  }, []);

  return { dispatchDeleteAccountData };
};
