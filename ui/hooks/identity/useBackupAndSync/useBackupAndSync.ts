import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import log from 'loglevel';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import {
  setIsBackupAndSyncFeatureEnabled as setIsBackupAndSyncFeatureEnabledAction,
  hideLoadingIndication,
} from '../../../store/actions';

/**
 * Custom hook to set the enablement status of a backup and sync feature.
 * This hook handles the process  via dispatch actions.
 *
 * @returns An object containing the `setIsBackupAndSyncFeatureEnabled` function, loading state, and error state.
 */

export function useBackupAndSync(): {
  setIsBackupAndSyncFeatureEnabled: (
    feature: keyof typeof BACKUPANDSYNC_FEATURES,
    enabled: boolean,
  ) => Promise<void>;
  error: string | null;
} {
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  const setIsBackupAndSyncFeatureEnabled = useCallback(
    async (feature: keyof typeof BACKUPANDSYNC_FEATURES, enabled: boolean) => {
      setError(null);
      try {
        await dispatch(
          setIsBackupAndSyncFeatureEnabledAction(feature, enabled),
        );
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        log.error(errorMessage);
        setError(errorMessage);
      } finally {
        dispatch(hideLoadingIndication());
      }
    },
    [dispatch],
  );

  return { error, setIsBackupAndSyncFeatureEnabled };
}
