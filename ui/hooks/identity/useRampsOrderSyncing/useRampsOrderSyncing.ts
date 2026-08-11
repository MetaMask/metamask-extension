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

/** @returns Whether ramps order syncing can be performed. */
export const useShouldDispatchRampsOrderSyncing = () => {
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isRampsSyncingEnabled = useSelector(selectIsRampsSyncingEnabled);
  const basicFunctionality: boolean | undefined =
    useSelector(getUseExternalServices);
  const isUnlocked: boolean | undefined = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);
  const completedOnboarding: boolean | undefined =
    useSelector(getCompletedOnboarding);
  return Boolean(
    basicFunctionality &&
      isBackupAndSyncEnabled &&
      isRampsSyncingEnabled &&
      isUnlocked &&
      isSignedIn &&
      completedOnboarding,
  );
};

/** @returns `dispatchRampsOrderSyncing` and `shouldDispatchRampsOrderSyncing`. */
export const useRampsOrderSyncing = () => {
  const shouldDispatchRampsOrderSyncing = useShouldDispatchRampsOrderSyncing();
  const dispatchRampsOrderSyncing = useCallback(() => {
    if (!shouldDispatchRampsOrderSyncing) {
      return;
    }
    syncRampsOrdersWithUserStorage().catch((error) => {
      log.error(error);
    });
  }, [shouldDispatchRampsOrderSyncing]);
  return { dispatchRampsOrderSyncing, shouldDispatchRampsOrderSyncing };
};
