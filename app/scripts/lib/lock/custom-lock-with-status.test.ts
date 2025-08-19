import LockWithStatus from './custom-lock-with-status';

describe('LockWithStatus', () => {
  it('should lock and unlock', async () => {
    const lock = new LockWithStatus();

    // before lock, the lock should be unlocked
    expect(lock.isLocked()).toBe(false);

    // after lock, the lock should be locked
    const releaseLock = await lock.acquire();
    expect(lock.isLocked()).toBe(true);

    // after release, the lock should be unlocked
    releaseLock();
    expect(lock.isLocked()).toBe(false);
  });
});
