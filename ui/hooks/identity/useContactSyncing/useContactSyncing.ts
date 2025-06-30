import log from 'loglevel';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { syncContactsWithUserStorage } from '../../../store/actions';
import {
  selectIsContactSyncingEnabled,
  selectIsBackupAndSyncEnabled,
} from '../../../selectors/identity/backup-and-sync';
import { getUseExternalServices } from '../../../selectors';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';

/**
 * A utility used internally to decide if contact syncing should be dispatched
 * Considers factors like basic functionality; unlocked; finished onboarding, is logged in, and more specific logic.
 *
 * @returns a boolean if internally we can perform contact syncing or not.
 */
export const useShouldDispatchContactSyncing = () => {
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isContactSyncingEnabled = useSelector(selectIsContactSyncingEnabled);
  const basicFunctionality: boolean | undefined = useSelector(
    getUseExternalServices,
  );
  const isUnlocked: boolean | undefined = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);
  const completedOnboarding: boolean | undefined = useSelector(
    getCompletedOnboarding,
  );

  const shouldDispatchContactSyncing: boolean = Boolean(
    basicFunctionality &&
      isBackupAndSyncEnabled &&
      isContactSyncingEnabled &&
      isUnlocked &&
      isSignedIn &&
      completedOnboarding,
  );

  return shouldDispatchContactSyncing;
};

/**
 * Custom hook to dispatch contact syncing.
 *
 * @returns An object containing the `dispatchContactSyncing` function, boolean `shouldDispatchContactSyncing`,
 * and error state.
 */
export const useContactSyncing = () => {
  const dispatch = useDispatch();

  const shouldDispatchContactSyncing = useShouldDispatchContactSyncing();

  const dispatchContactSyncing = useCallback(() => {
    try {
      if (!shouldDispatchContactSyncing) {
        return;
      }
      dispatch(syncContactsWithUserStorage());
    } catch (e) {
      log.error(e);
    }
  }, [dispatch, shouldDispatchContactSyncing]);

  return {
    dispatchContactSyncing,
    shouldDispatchContactSyncing,
  };
};
