import 'navigator.locks';
import type {
  PersistenceManager,
  StorageKind,
} from '../../../shared/lib/stores/persistence-manager';
import { captureException } from '../../../shared/lib/sentry';
import { flushPromises } from '../../../test/lib/timer-helpers';
import { getRequestSafeReload } from './safe-reload';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    reload: jest.fn(),
  },
}));

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const mockLocksRequest = jest
  .fn()
  .mockImplementation((_lockName, _options, callback) => {
    return callback();
  });
navigator.locks.request = mockLocksRequest;

/**
 * Creates a persistence manager mock for exercising request-safe persistence.
 *
 * @param storageKind - Storage implementation used by the mock.
 * @returns A persistence manager with mocked write methods.
 */
function createPersistenceManager(
  storageKind: StorageKind = 'split',
): PersistenceManager {
  return {
    persist: jest.fn().mockResolvedValue([true, undefined]),
    set: jest.fn().mockResolvedValue([true, undefined]),
    storageKind,
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

  it('flushes pending split persistence when any changed controller requires an immediate write', async () => {
    const persistenceManager = createPersistenceManager();
    const { safePersist } = getRequestSafeReload(persistenceManager, [
      'KeyringController',
    ]);

    await safePersist({
      changedControllerKeys: ['SubjectMetadataController'],
    });

    expect(persistenceManager.persist).not.toHaveBeenCalled();

    await safePersist({
      changedControllerKeys: ['PreferencesController', 'KeyringController'],
    });

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);

    jest.runOnlyPendingTimers();
    await flushPromises();

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);
  });

  it('flushes queued data persistence for an immediate key', async () => {
    const persistenceManager = createPersistenceManager('data');
    const { safePersist } = getRequestSafeReload(persistenceManager, [
      'KeyringController',
    ]);
    const state = { KeyringController: { vault: 'vault' } };

    await safePersist({
      changedControllerKeys: ['KeyringController'],
      state,
    });

    expect(persistenceManager.set).toHaveBeenCalledTimes(1);
    expect(persistenceManager.set).toHaveBeenCalledWith(state);
  });

  it('does not flush pending persistence for non-immediate controllers', async () => {
    const persistenceManager = createPersistenceManager();
    const { safePersist } = getRequestSafeReload(persistenceManager, [
      'KeyringController',
    ]);

    await safePersist({
      changedControllerKeys: ['SubjectMetadataController'],
    });

    expect(persistenceManager.persist).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();
    await flushPromises();

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);
  });

  it('reports persistence write failures', async () => {
    const persistenceManager = createPersistenceManager();
    const writeError = new Error('Write failed');
    jest.mocked(persistenceManager.persist).mockRejectedValue(writeError);
    const { safePersist } = getRequestSafeReload(persistenceManager, [
      'KeyringController',
    ]);

    await expect(
      safePersist({ changedControllerKeys: ['KeyringController'] }),
    ).resolves.toBe(true);

    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        cause: writeError,
        message: 'MetaMask - Persistence failed',
      }),
    );
  });
});
