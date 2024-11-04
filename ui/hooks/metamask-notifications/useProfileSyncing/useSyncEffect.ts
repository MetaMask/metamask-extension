import { useCallback, useEffect } from 'react';
import { useSyncAccounts } from './accountSyncing';
import { useSyncNetworks } from './networkSyncing';
import { useShouldDispatchProfileSyncing } from './profileSyncing';

/**
 * Callback to run all the profile synced features
 * @returns callback to execute
 */
export const useSyncEffectCallback = () => {
  const shouldSync = useShouldDispatchProfileSyncing();
  const syncAccounts = useSyncAccounts();
  const syncNetworks = useSyncNetworks();

  const callback = useCallback(async () => {
    if (shouldSync) {
      try {
        await syncAccounts();
        await syncNetworks();
      } catch {
        // Do Nothing
      }
    }
  }, [shouldSync, syncAccounts, syncNetworks]);

  return callback;
};

export const useSyncEffect = () => {
  const effectCallback = useSyncEffectCallback();

  useEffect(() => {
    effectCallback();
  }, [effectCallback]);
};
