import type { Backup } from '../../../shared/lib/backup';
import { RELOAD_WINDOW } from '../../../shared/constants/start-up-errors';
import { tryPostMessage } from './start-up-errors/start-up-errors';

const REPAIR_LOCK_NAME = 'repairDatabase';

/**
 * Requests a lock for the repair operation. This is used to ensure that only
 * one repair operation is happening at a time. If the lock is available it will
 * call and await the provided `repairDatabase` function then return true. If
 * the lock is not available, it will return false and the callback will *not*
 * be called.
 *
 * @param repairDatabase - A function that is called only when the request is
 * granted.
 */
export async function requestRepair(
  repairDatabase: () => Promise<void> | (() => void),
): Promise<boolean> {
  return await navigator.locks.request(
    REPAIR_LOCK_NAME,
    { ifAvailable: true },
    async function requestRepairLockCallback(lock: Lock | null) {
      // something is already repairing the database
      if (lock === null) {
        return false;
      }

      await repairDatabase();
      return true;
    },
  );
}

/**
 * Runs the repair callback under the repair lock, then sends RELOAD_WINDOW to
 * all given ports. Used by both state-corruption and critical-error restore flows.
 *
 * @param backup - Backup to pass to the repair callback.
 * @param repairCallback - Called with backup when the repair lock is acquired.
 * @param connectedPorts - Ports to send RELOAD_WINDOW to after repair (e.g. all UI windows).
 */
export async function runRepairAndReloadPorts(
  backup: Backup | null,
  repairCallback: (backup: Backup | null) => void | Promise<void>,
  connectedPorts: Set<chrome.runtime.Port>,
): Promise<void> {
  await requestRepair(async () => {
    // this callback might be ignored if another repair request
    // is already in progress.

    try {
      await repairCallback(backup);
    } finally {
      // always reload the UI because if `initBackground` worked, the UI
      // will redirect to the login screen, and if it didn't work, it'll
      // show them a new error message (which could be the same as the
      // error that sent them here in the first place, but hopefully
      // not!)
      connectedPorts.forEach((port) => {
        // as each page reloads, it will remove itself from the
        // `connectedPorts` on disconnection.
        tryPostMessage(port, RELOAD_WINDOW);
      });
    }
  });
}
