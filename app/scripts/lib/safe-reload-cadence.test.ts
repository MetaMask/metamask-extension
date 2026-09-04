import 'navigator.locks';
import type { PersistenceManager } from '../../../shared/lib/stores/persistence-manager';
import { flushPromises } from '../../../test/lib/timer-helpers';
import { getRequestSafeReload } from './safe-reload';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    reload: jest.fn(),
  },
}));

const mockLocksRequest = jest
  .fn()
  .mockImplementation((_lockName, _options, callback) => callback());
navigator.locks.request = mockLocksRequest;

/**
 * Creates a split-storage persistence manager mock.
 *
 * @returns A persistence manager with a mocked persistence operation.
 */
function createPersistenceManager(): PersistenceManager {
  return {
    persist: jest.fn().mockResolvedValue([true, undefined]),
    storageKind: 'split',
  } as unknown as PersistenceManager;
}

describe('getRequestSafeReload persistence cadence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('waits five seconds after the latest update before persisting', async () => {
    const persistenceManager = createPersistenceManager();
    const { safePersist } = getRequestSafeReload(persistenceManager);

    await safePersist();
    jest.advanceTimersByTime(4_999);
    await flushPromises();

    expect(persistenceManager.persist).not.toHaveBeenCalled();

    await safePersist();
    jest.advanceTimersByTime(4_999);
    await flushPromises();

    expect(persistenceManager.persist).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await flushPromises();

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);
  });

  it('persists after thirty seconds of continuous updates', async () => {
    const persistenceManager = createPersistenceManager();
    const { safePersist } = getRequestSafeReload(persistenceManager);

    await safePersist();

    for (let elapsedMs = 4_999; elapsedMs < 30_000; elapsedMs += 4_999) {
      jest.advanceTimersByTime(4_999);
      await flushPromises();
      expect(persistenceManager.persist).not.toHaveBeenCalled();
      await safePersist();
    }

    jest.advanceTimersByTime(5);
    await flushPromises();
    expect(persistenceManager.persist).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await flushPromises();

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);
  });
});
