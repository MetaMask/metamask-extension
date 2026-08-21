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

describe('getRequestSafeReload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('persists pending work immediately', async () => {
    const persistenceManager = createPersistenceManager();
    const { safePersist } = getRequestSafeReload(persistenceManager);

    await safePersist();

    expect(persistenceManager.persist).not.toHaveBeenCalled();

    await safePersist({ immediate: true });

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);

    jest.runOnlyPendingTimers();
    await flushPromises();

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);
  });
});
