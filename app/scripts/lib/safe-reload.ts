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
     * @param params
     * @returns true if the update was queued, false if writes are not allowed.
     */
    persist: async (
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
     *
     * @param callback - An optional callback to be executed after all
     * pending operations have completed, but before the reload is triggered.
     */
    requestSafeReload: async (callback?: () => Promise<void> | void) => {
      await operationSafener.evacuate();
      if (callback) {
        try {
          const v = callback();
          if (v instanceof Promise) {
            await v;
          }
        } catch (error) {
          log.error('MetaMask - Error in safe reload callback', error);
          sentry?.captureException(error);
          throw error;
        }
      }
      browser.runtime.reload();
    },
  };
}
