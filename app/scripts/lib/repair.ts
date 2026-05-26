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
