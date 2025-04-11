import log from 'loglevel';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteAccountSyncingDataFromUserStorage,
  syncInternalAccountsWithUserStorage,
} from '../../../store/actions';
import {
  selectIsAccountSyncingReadyToBeDispatched,
  selectIsProfileSyncingEnabled,
} from '../../../selectors/identity/profile-syncing';
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
  const isAccountSyncingReadyToBeDispatched = useSelector(
    selectIsAccountSyncingReadyToBeDispatched,
  );
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
      completedOnboarding &&
      isAccountSyncingReadyToBeDispatched,
  );

  return shouldDispatchProfileSyncing;
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
  }, []);

  return { dispatchDeleteAccountSyncingData };
};
