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
  /** Controller keys represented by the pending persistence operation. */
  changedControllerKeys?: readonly string[];
  /** Full state to persist when the persistence manager uses data storage. */
  state?: MetaMaskStateType;
};

type RequestSafeReload = {
  safePersist: (options?: SafePersistOptions) => Promise<boolean>;
  requestSafeReload: () => Promise<void>;
  evacuate: () => Promise<void>;
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
): RequestSafeReload {
  /** Controller changes that bypass the persistence debounce. */
  const immediatePersistenceKeySet = new Set(['KeyringController']);

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
     * @param options - Persistence operation details.
     * @param options.changedControllerKeys - Controller keys represented by
     * the pending persistence operation.
     * @param options.state - Full state to persist when using data storage.
     * @returns A promise that resolves to true if the update was queued, or
     * false if writes are not allowed.
     */
    safePersist: async ({
      changedControllerKeys = [],
      state,
    }: SafePersistOptions = {}) => {
      const didQueuePersist = operationSafener.execute(state);

      if (
        didQueuePersist &&
        changedControllerKeys.some((key) => immediatePersistenceKeySet.has(key))
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
