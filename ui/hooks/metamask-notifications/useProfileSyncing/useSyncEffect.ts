import { useCallback, useEffect } from 'react';
import { useSyncAccounts } from './accountSyncing';
import { useSyncNetworks } from './networkSyncing';
import { useShouldDispatchProfileSyncing } from './profileSyncing';

/**
 * Callback to run all the profile synced features
 *
 * @returns callback to execute
 */
export const useSyncEffectCallback = () => {
  const { shouldSync, shouldSyncAccounts, shouldSyncNetworks } =
    useShouldDispatchProfileSyncing();
  const syncAccounts = useSyncAccounts();
  const syncNetworks = useSyncNetworks();

  // FUCK SAKE, THE CALLBACK WILL BE GENERATED TWICE
  // SO EFFECT GETS CALLED TWICE
  const callback = useCallback(async () => {
    if (shouldSync) {
      try {
        if (shouldSyncAccounts) {
          await syncAccounts();
        }

        if (shouldSyncNetworks) {
          await syncNetworks();
        }
      } catch {
        // Do Nothing
      }
    }
  }, [
    shouldSync,
    shouldSyncAccounts,
    shouldSyncNetworks,
    syncAccounts,
    syncNetworks,
  ]);

  return callback;
};

export const useSyncEffect = () => {
  // I HATE EFFECTS
  // Ideally I want all the syncing features to be done under 1 effect
  // However now we have logic SPECIFICALLY for different features
  // I don't want effects to fire multiple times, ideally I only want this only on open.
  // FUTURE - lets refactor and change the effect to instead be on page open or something.
  const effectCallback = useSyncEffectCallback();

  useEffect(() => {
    effectCallback();
  }, [effectCallback]);
};
