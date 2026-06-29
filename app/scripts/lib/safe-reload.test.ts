import 'navigator.locks';
import browser from 'webextension-polyfill';
import type { PersistenceManager } from '../../../shared/lib/stores/persistence-manager';
import {
  PERSISTENCE_OPERATION_DEBOUNCE_MS,
  PERSISTENCE_OPERATION_MAX_WAIT_MS,
} from '../../../shared/lib/stores/persistence-manager';
import { getRequestSafeReload } from './safe-reload';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    reload: jest.fn(),
  },
}));

const mockLocksRequest = jest
  .fn()
  .mockImplementation((_lockName, _options, callback) => {
    return callback();
  });
navigator.locks.request = mockLocksRequest;

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

function createPersistenceManager() {
  return {
    persist: jest.fn().mockResolvedValue([true, undefined]),
    set: jest.fn().mockResolvedValue([true, undefined]),
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

  it('debounces persistence for the configured wait', async () => {
    const persistenceManager = createPersistenceManager();
    const { safePersist } = getRequestSafeReload(persistenceManager);

    await safePersist();
    await safePersist();

    jest.advanceTimersByTime(PERSISTENCE_OPERATION_DEBOUNCE_MS - 1);
    await flushPromises();

    expect(persistenceManager.persist).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await flushPromises();

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);
  });

  it('flushes queued persistence without evacuating future writes', async () => {
    const persistenceManager = createPersistenceManager();
    const { safePersist, flushPersist } =
      getRequestSafeReload(persistenceManager);

    await safePersist();
    await flushPersist();

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);

    await safePersist();
    jest.advanceTimersByTime(PERSISTENCE_OPERATION_DEBOUNCE_MS);
    await flushPromises();

    expect(persistenceManager.persist).toHaveBeenCalledTimes(2);
  });

  it('persists at maxWait when updates keep arriving before the debounce expires', async () => {
    const persistenceManager = createPersistenceManager();
    const { safePersist } = getRequestSafeReload(persistenceManager);
    const intervalMs = PERSISTENCE_OPERATION_DEBOUNCE_MS - 1;

    for (
      let elapsedMs = 0;
      elapsedMs < PERSISTENCE_OPERATION_MAX_WAIT_MS;
      elapsedMs += intervalMs
    ) {
      await safePersist();
      jest.advanceTimersByTime(intervalMs);
      await flushPromises();
    }

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);
  });

  it('requests runtime reload after evacuating pending persistence', async () => {
    const persistenceManager = createPersistenceManager();
    const { safePersist, requestSafeReload } =
      getRequestSafeReload(persistenceManager);

    await safePersist();
    const reloadPromise = requestSafeReload();

    await flushPromises();

    expect(persistenceManager.persist).toHaveBeenCalledTimes(1);
    expect(browser.runtime.reload).not.toHaveBeenCalled();

    jest.advanceTimersByTime(150);
    await reloadPromise;

    expect(browser.runtime.reload).toHaveBeenCalledTimes(1);
  });
});
