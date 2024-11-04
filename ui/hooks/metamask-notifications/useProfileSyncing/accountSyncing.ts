import log from 'loglevel';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  deleteAccountSyncingDataFromUserStorage,
  syncInternalAccountsWithUserStorage,
} from '../../../store/actions';

/**
 * Custom hook to dispatch account syncing.
 *
 * @returns An object containing the `dispatchAccountSyncing` function, boolean `shouldDispatchAccountSyncing`,
 * and error state.
 */
export const useSyncAccounts = () => {
  const dispatch = useDispatch();
  const syncAccounts = useCallback(async () => {
    try {
      await dispatch(syncInternalAccountsWithUserStorage());
    } catch (e) {
      log.error(e);
    }
  }, [dispatch]);

  return syncAccounts;
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
