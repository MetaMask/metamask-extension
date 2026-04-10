import browser from 'webextension-polyfill';
import { captureException } from '../../../shared/lib/sentry';
import { createSentryError } from '../../../shared/lib/error';
import { PersistenceManager } from '../../../shared/lib/stores/persistence-manager';
import { MetaMaskStateType } from '../../../shared/lib/stores/base-store';
import { OperationSafener } from './operation-safener';

/** Time before `runtime.reload()` so popup/notification UIs can `window.close()` first (issue #29151). */
const RELOAD_AFTER_EVACUATE_MS = 150;

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
        captureException(
          createSentryError('MetaMask - Persistence failed', error),
        );
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
     * pending updates to complete before scheduling `browser.runtime.reload()`
     * after a short delay. The delay lets popup/notification windows call
     * `window.close()` before reload so Chromium does not show normal tab
     * content inside that window (see GitHub issue #29151).
     */
    requestSafeReload: async () => {
      await operationSafener.evacuate();
      globalThis.setTimeout(() => {
        browser.runtime.reload();
      }, RELOAD_AFTER_EVACUATE_MS);
    },

    /**
     * Evacuates the current operation queue, executing the latest pending
     * operation and preventing any future operations from being queued.
     *
     * DANGER: You can't come back from this without forcing a runtime reload!
     *
     * @returns A Promise that resolves when the evacuation is complete.
     */
    evacuate: () => operationSafener.evacuate(),
  };
}
