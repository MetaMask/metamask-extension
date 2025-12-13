import browser from 'webextension-polyfill';
import log from 'loglevel';
import { OperationSafener } from './operation-safener';
import { PersistenceManager } from './stores/persistence-manager';
import { MetaMaskStateType } from './stores/base-store';

const { sentry } = global;

/**
 * Creates a request-safe reload mechanism for the given persistence manager.
 *
 * @param persistenceManager - The PersistenceManager instance to be used for
 * updates.
 */
export function getRequestSafeReload<Type extends PersistenceManager>(
  persistenceManager: Type,
) {
  const operationSafener = new OperationSafener({
    op: async (state?: MetaMaskStateType) => {
      try {
        if (persistenceManager.storageKind === 'data') {
          if (!state) {
            throw new Error("State must be provided for 'data' storageKind");
          }
          await persistenceManager.set(state);
        } else {
          await persistenceManager.persist();
        }
      } catch (error) {
        // unlikely to have an error here, as `persistenceManager.set` handles
        // nearly all error cases internally already.
        log.error('MetaMask - Persistence failed', error);
        sentry?.captureException(error);
      }
    },
    wait: 1000,
  });

  return {
    /**
     * Safely updates the persistence manager
     *
     * @param params - Arguments to pass to the persistence operation. For
     * 'data' storage, pass the state; for 'split' storage, no arguments needed.
     * @returns true if the update was queued, false if writes are not allowed.
     */
    safePersist: async (
      ...params: Parameters<
        PersistenceManager['set'] | PersistenceManager['persist']
      >
    ) => {
      return operationSafener.execute(...params);
    },
    /**
     * Requests a safe reload of the browser. It prevents any new updates from
     * being sent to the persistence manager, and waits for any
     * pending updates to complete before calling `browser.runtime.reload()`.
     */
    requestSafeReload: async () => {
      await operationSafener.evacuate();
      browser.runtime.reload();
    },
  };
}
