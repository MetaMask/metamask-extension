import log from 'loglevel';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { syncAddressBookWithUserStorage } from '../../../store/actions';
import {
  selectIsAddressBookSyncingEnabled,
  selectIsBackupAndSyncEnabled,
} from '../../../selectors/identity/backup-and-sync';
import { getUseExternalServices } from '../../../selectors';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';

/**
 * A utility used internally to decide if address book syncing should be dispatched
 * Considers factors like basic functionality; unlocked; finished onboarding, is logged in, and more specific logic.
 *
 * @returns a boolean if internally we can perform account syncing or not.
 */
export const useShouldDispatchAddressBookSyncing = () => {
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isAccountSyncingEnabled = useSelector(selectIsAddressBookSyncingEnabled);
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

  return shouldDispatchAccountSyncing;
};

/**
 * Custom hook to dispatch address book syncing.
 *
 * @returns An object containing the `dispatchAddressBookSyncing` function, boolean `shouldDispatchAddressBookSyncing`,
 * and error state.
 */
export const useAddressBookSyncing = () => {
  const dispatch = useDispatch();

  const shouldDispatchAddressBookSyncing = useShouldDispatchAddressBookSyncing();

  const dispatchAddressBookSyncing = useCallback(() => {
    try {
      if (!shouldDispatchAddressBookSyncing) {
        return;
      }
      dispatch(syncAddressBookWithUserStorage());
    } catch (e) {
      log.error(e);
    }
  }, [dispatch, shouldDispatchAddressBookSyncing]);

  return {
    dispatchAddressBookSyncing,
    shouldDispatchAddressBookSyncing,
  };
};
