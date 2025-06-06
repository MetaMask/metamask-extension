import browser from 'webextension-polyfill';
import { OperationSafener } from './operation-safener';
import { PersistenceManager } from './stores/persistence-manager';

/**
 * Creates a request-safe reload mechanism for the given persistence manager.
 *
 * @param persistenceManager - The PersistenceManager instance to be used for
 * updates.
 */
export function getRequestSafeReload(persistenceManager: PersistenceManager) {
  const operationSafener = new OperationSafener({
    op: persistenceManager.set.bind(persistenceManager),
    wait: 1000,
  });

  return {
    /**
     * Safely updates the persistence manager with the provided parameters.
     *
     * @param params - Parameters to be passed to the persistence manager's
     * `set` method.
     * @returns true if the update was queued, false if writes are not allowed.
     */
    update: async (...params: Parameters<PersistenceManager['set']>) => {
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
