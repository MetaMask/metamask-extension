import 'navigator.locks';
import { PersistenceManager } from '../../../shared/lib/stores/persistence-manager';
import type { BaseStore } from '../../../shared/lib/stores/base-store';
import { getRequestSafeReload } from './safe-reload';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    reload: jest.fn(),
  },
}));

navigator.locks.request = jest
  .fn()
  .mockImplementation((_lockName, _options, callback) => callback());

describe('getRequestSafeReload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('batches same-turn updates into a forced flush', async () => {
    const setKeyValues: jest.MockedFunction<BaseStore['setKeyValues']> = jest
      .fn()
      .mockResolvedValue(undefined);
    const persistenceManager = new PersistenceManager({
      localStore: {
        get: jest.fn().mockResolvedValue(null),
        reset: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(undefined),
        setKeyValues,
      },
    });
    persistenceManager.storageKind = 'split';
    persistenceManager.setMetadata({ version: 1, storageKind: 'split' });
    jest.spyOn(persistenceManager, 'open').mockResolvedValue(undefined);
    const persist = jest.spyOn(persistenceManager, 'persist');
    const { safePersist } = getRequestSafeReload(persistenceManager);
    persistenceManager.update('KeyringController', {
      vault: 'encrypted-vault',
    });

    const keyringPersistence = safePersist({ flush: true });

    expect(persist).not.toHaveBeenCalled();

    persistenceManager.update('SeedlessOnboardingController', {
      vault: 'encrypted-seedless-vault',
    });
    const seedlessPersistence = safePersist();

    await Promise.all([keyringPersistence, seedlessPersistence]);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(setKeyValues).toHaveBeenCalledTimes(1);
    const persistedPairs = setKeyValues.mock.calls[0][0];
    expect(persistedPairs.get('KeyringController')).toEqual({
      vault: 'encrypted-vault',
    });
    expect(persistedPairs.get('SeedlessOnboardingController')).toEqual({
      vault: 'encrypted-seedless-vault',
    });
  });
});
