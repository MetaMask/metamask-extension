import 'navigator.locks';
import { PersistenceManager } from '../../../shared/lib/stores/persistence-manager';
import type { BaseStore } from '../../../shared/lib/stores/base-store';
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
 * Creates a split-storage persistence manager backed by a mocked local store.
 *
 * @returns A persistence manager and its local-store write mock.
 */
function createPersistenceManager(): {
  persistenceManager: PersistenceManager;
  setKeyValues: jest.MockedFunction<BaseStore['setKeyValues']>;
} {
  const setKeyValues = jest.fn().mockResolvedValue(undefined);
  const localStore: BaseStore = {
    get: jest.fn().mockResolvedValue(null),
    reset: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    setKeyValues,
  };
  const persistenceManager = new PersistenceManager({ localStore });
  persistenceManager.storageKind = 'split';
  persistenceManager.setMetadata({ version: 1, storageKind: 'split' });
  jest.spyOn(persistenceManager, 'open').mockResolvedValue(undefined);

  return { persistenceManager, setKeyValues };
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

  it('flushes pending work without waiting for the debounce', async () => {
    const { persistenceManager, setKeyValues } = createPersistenceManager();
    const { safePersist } = getRequestSafeReload(persistenceManager);
    persistenceManager.update('KeyringController', {
      vault: 'encrypted-vault',
    });

    await safePersist();

    expect(setKeyValues).not.toHaveBeenCalled();

    await safePersist({ flush: true });

    expect(setKeyValues).toHaveBeenCalledTimes(1);
    const persistedPairs = setKeyValues.mock.calls[0][0];
    expect(persistedPairs.size).toBe(2);
    expect(persistedPairs.get('meta')).toEqual({
      version: 1,
      storageKind: 'split',
    });
    expect(persistedPairs.get('KeyringController')).toEqual({
      vault: 'encrypted-vault',
    });

    jest.runOnlyPendingTimers();
    await flushPromises();

    expect(setKeyValues).toHaveBeenCalledTimes(1);
  });
});
