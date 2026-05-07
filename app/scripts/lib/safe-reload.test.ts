import 'navigator.locks';
import type { PersistenceManager } from '../../../shared/lib/stores/persistence-manager';
import { getRequestSafeReload } from './safe-reload';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    reload: jest.fn(),
  },
}));

jest.mock('../../../shared/lib/error', () => ({
  createSentryError: jest.fn((message) => new Error(message)),
}));

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockLocksRequest = jest
  .fn()
  .mockImplementation((_name, _options, callback) => {
    return callback();
  });
navigator.locks.request = mockLocksRequest;

describe('getRequestSafeReload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flushes queued persistence without blocking future persistence', async () => {
    const persist = jest.fn().mockResolvedValue([true, undefined]);
    const set = jest.fn().mockResolvedValue([true, undefined]);
    const persistenceManager = {
      storageKind: 'split',
      persist,
      set,
    } as unknown as PersistenceManager;

    const { flushPersistence, safePersist } =
      getRequestSafeReload(persistenceManager);

    await expect(safePersist()).resolves.toBe(true);
    expect(persist).not.toHaveBeenCalled();

    await flushPersistence();
    expect(persist).toHaveBeenCalledTimes(1);

    await expect(safePersist()).resolves.toBe(true);
    await flushPersistence();

    expect(persist).toHaveBeenCalledTimes(2);
    expect(set).not.toHaveBeenCalled();
    expect(mockLocksRequest).toHaveBeenCalledTimes(2);
  });
});
