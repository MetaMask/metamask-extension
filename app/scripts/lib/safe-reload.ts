import browser from 'webextension-polyfill';
import { captureException } from '../../../shared/lib/sentry';
import { createSentryError } from '../../../shared/lib/error';
import {
  PersistenceManager,
  PERSISTENCE_MANAGER_OPERATION_SAFENER_DEBOUNCE_MS,
} from '../../../shared/lib/stores/persistence-manager';
import { MetaMaskStateType } from '../../../shared/lib/stores/base-store';
import { OperationSafener } from './operation-safener';

type SafePersistOptions = {
  /** Whether to flush pending split-state persistence without waiting for the debounce. */
  flush?: boolean;
};

/** Time before `runtime.reload()` so popup/notification UIs can `window.close()` first (issue #29151). */
const RELOAD_AFTER_EVACUATE_MS = 150;

/**
 * Creates a request-safe reload mechanism for the given persistence manager.
 *
 * @param persistenceManager - The PersistenceManager instance to be used for
 * updates.
 * @returns Operations for queueing persistence and safely reloading the
 * extension.
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
    wait: PERSISTENCE_MANAGER_OPERATION_SAFENER_DEBOUNCE_MS,
  });

  return {
    /**
     * Safely updates the persistence manager
     *
     * @param stateOrOptions - For 'data' storage, the state to persist. For
     * 'split' storage, options that control how the state is persisted.
     * @returns true if the update was queued, false if writes are not allowed.
     */
    safePersist: async (
      stateOrOptions?: MetaMaskStateType | SafePersistOptions,
    ) => {
      const isSplitStorage = persistenceManager.storageKind === 'split';
      const didQueuePersist = isSplitStorage
        ? operationSafener.execute()
        : operationSafener.execute(stateOrOptions as MetaMaskStateType);

      if (
        didQueuePersist &&
        isSplitStorage &&
        (stateOrOptions as SafePersistOptions | undefined)?.flush
      ) {
        await operationSafener.flush();
      }

      return didQueuePersist;
    },
    /**
     * Requests a safe reload of the browser. It prevents any new updates from
     * being sent to the persistence manager, and waits for any
     * pending updates to complete before scheduling `browser.runtime.reload()`
     * after a short delay. The delay lets popup/notification windows call
     * `window.close()` before reload so Chromium does not show normal tab
     * content inside that window (see GitHub issue #29151).
     *
     * @returns A promise that resolves after persistence is evacuated and the
     * reload is scheduled.
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
