import { Mutex } from 'await-semaphore';

/**
 * A custom lock (mutex) that tracks the lock status.
 * The current library (await-semaphore) does not have a way to check if the mutex is locked,
 * so we need to use a flag to track the lock state.
 *
 * This is useful for tracking the lock status of a mutex.
 */
export default class LockWithStatus {
  private isLockAcquired: boolean;

  private mutex: Mutex;

  constructor() {
    this.isLockAcquired = false;
    this.mutex = new Mutex();
  }

  isLocked() {
    return this.isLockAcquired;
  }

  async acquire() {
    const releaseLock = await this.mutex.acquire();
    this.isLockAcquired = true;
    return () => {
      this.isLockAcquired = false;
      releaseLock();
    };
  }
}
