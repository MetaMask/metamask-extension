import LockWithStatus from './custom-lock-with-status';

describe('LockWithStatus', () => {
  it('should lock and unlock', async () => {
    const lock = new LockWithStatus();
    const releaseLock = await lock.acquire();
    expect(lock.isLocked()).toBe(true);
    releaseLock();
    expect(lock.isLocked()).toBe(false);
  });
});
