import log from 'loglevel';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  deleteNetworkSyncingDataFromUserStorage,
  syncNetworks as syncNetworksAction,
} from '../../../store/actions';

/**
 * Network Syncing - Callback used to delete synced networks
 * This is used internally in dev builds.
 * @returns callback to delete synced networks
 */
export const useDeleteNetworkSyncingDataFromUserStorage = () => {
  const dispatch = useDispatch();
  const dispatchDeleteNetworkData = useCallback(async () => {
    try {
      await dispatch(deleteNetworkSyncingDataFromUserStorage());
    } catch {
      // Do Nothing
    }
  }, []);

  return { dispatchDeleteNetworkData };
};

/**
 * returns a callback to perform network syncing (sync local and remote networks)
 */
export const useSyncNetworks = () => {
  const dispatch = useDispatch();
  const syncNetworks = useCallback(async () => {
    try {
      await dispatch(syncNetworksAction());
    } catch (e) {
      log.error(e);
    }
  }, [dispatch]);

  return syncNetworks;
};
