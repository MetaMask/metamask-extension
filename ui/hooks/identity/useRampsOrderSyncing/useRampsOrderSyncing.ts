import log from 'loglevel';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { syncRampsOrdersWithUserStorage } from '../../../store/controller-actions/ramps-controller';
import {
  selectIsRampsSyncingEnabled,
  selectIsBackupAndSyncEnabled,
} from '../../../selectors/identity/backup-and-sync';
import { getUseExternalServices } from '../../../selectors';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';

/**
 * Decides whether ramps order syncing should be dispatched.
 *
 * @returns Whether ramps order syncing can be performed.
 */
export const useShouldDispatchRampsOrderSyncing = () => {
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isRampsSyncingEnabled = useSelector(selectIsRampsSyncingEnabled);
  const basicFunctionality: boolean | undefined = useSelector(
    getUseExternalServices,
  );
  const isUnlocked: boolean | undefined = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);
  const completedOnboarding: boolean | undefined = useSelector(
    getCompletedOnboarding,
  );

  const shouldDispatchRampsOrderSyncing: boolean = Boolean(
    basicFunctionality &&
      isBackupAndSyncEnabled &&
      isRampsSyncingEnabled &&
      isUnlocked &&
      isSignedIn &&
      completedOnboarding,
  );

  return shouldDispatchRampsOrderSyncing;
};

/**
 * Dispatches bidirectional V2 ramps order sync with User Storage.
 *
 * @returns `dispatchRampsOrderSyncing` and `shouldDispatchRampsOrderSyncing`.
 */
export const useRampsOrderSyncing = () => {
  const shouldDispatchRampsOrderSyncing = useShouldDispatchRampsOrderSyncing();

  const dispatchRampsOrderSyncing = useCallback(() => {
    const action = async () => {
      if (!shouldDispatchRampsOrderSyncing) {
        return;
      }
      await syncRampsOrdersWithUserStorage();
    };
    action().catch((error) => {
      log.error(error);
    });
  }, [shouldDispatchRampsOrderSyncing]);

  return {
    dispatchRampsOrderSyncing,
    shouldDispatchRampsOrderSyncing,
  };
};
