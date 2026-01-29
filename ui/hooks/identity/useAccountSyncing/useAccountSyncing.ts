import log from 'loglevel';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteAccountSyncingDataFromUserStorage,
  syncAccountTreeWithUserStorage,
} from '../../../store/actions';
import {
  selectIsAccountSyncingEnabled,
  selectIsBackupAndSyncEnabled,
} from '../../../selectors/identity/backup-and-sync';
import { getUseExternalServices } from '../../../selectors';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';

/**
 * A utility used internally to decide if account syncing should be dispatched
 * Considers factors like basic functionality; unlocked; finished onboarding, is logged in, and more specific logic.
 *
 * @returns a boolean if internally we can perform account syncing or not.
 */
export const useShouldDispatchAccountSyncing = () => {
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isAccountSyncingEnabled = useSelector(selectIsAccountSyncingEnabled);
  const basicFunctionality: boolean | undefined = useSelector(
    getUseExternalServices,
  );
  const isUnlocked: boolean | undefined = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);
  const completedOnboarding: boolean | undefined = useSelector(
    getCompletedOnboarding,
  );

  const shouldDispatchAccountSyncing: boolean = Boolean(
    basicFunctionality &&
      isBackupAndSyncEnabled &&
      isAccountSyncingEnabled &&
      isUnlocked &&
      isSignedIn &&
      completedOnboarding,
  );

  // #region agent log
  console.log(
    '[DEBUG:useShouldDispatchAccountSyncing] Conditions:',
    JSON.stringify({
      isBackupAndSyncEnabled,
      isAccountSyncingEnabled,
      basicFunctionality,
      isUnlocked,
      isSignedIn,
      completedOnboarding,
      shouldDispatchAccountSyncing,
    }),
  );
  // #endregion

  return shouldDispatchAccountSyncing;
};

/**
 * Custom hook to dispatch account syncing.
 *
 * @returns An object containing the `dispatchAccountSyncing` function, boolean `shouldDispatchAccountSyncing`,
 * and error state.
 */
export const useAccountSyncing = () => {
  const dispatch = useDispatch();

  const shouldDispatchAccountSyncing = useShouldDispatchAccountSyncing();

  const dispatchAccountSyncing = useCallback(() => {
    // #region agent log
    console.log(
      '[DEBUG:dispatchAccountSyncing] Called, shouldDispatchAccountSyncing=',
      shouldDispatchAccountSyncing,
    );
    // #endregion
    try {
      if (!shouldDispatchAccountSyncing) {
        // #region agent log
        console.log(
          '[DEBUG:dispatchAccountSyncing] Skipping - conditions not met',
        );
        // #endregion
        return;
      }
      // #region agent log
      console.log(
        '[DEBUG:dispatchAccountSyncing] Dispatching syncAccountTreeWithUserStorage action...',
      );
      // #endregion
      dispatch(syncAccountTreeWithUserStorage());
    } catch (e) {
      // #region agent log
      console.log('[DEBUG:dispatchAccountSyncing] Error:', e);
      // #endregion
      log.error(e);
    }
  }, [dispatch, shouldDispatchAccountSyncing]);

  return {
    dispatchAccountSyncing,
    shouldDispatchAccountSyncing,
  };
};

/**
 * Custom hook to delete a user's account syncing data from user storage
 */
export const useDeleteAccountSyncingDataFromUserStorage = () => {
  const dispatch = useDispatch();
  const dispatchDeleteAccountSyncingData = useCallback(async () => {
    try {
      await dispatch(deleteAccountSyncingDataFromUserStorage());
    } catch {
      // Do Nothing
    }
  }, [dispatch]);

  return { dispatchDeleteAccountSyncingData };
};
