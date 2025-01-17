// IndexedDBStore.test.ts
import { captureException } from '@sentry/browser';
import log from 'loglevel';
import { IndexedDBStore } from './IndexedDBStore';
import type { MetaMaskStorageStructure } from './BaseStore';

global.indexedDB = {
  open: jest.fn(),
  cmp: jest.fn(),
  databases: jest.fn(),
  deleteDatabase: jest.fn(),
};

jest.mock('loglevel');
jest.mock('@sentry/browser', () => ({
  captureException: jest.fn(),
}));

/**
 * A helper that constructs a minimal set of IndexedDB mocks. We can simulate:
 * - `openError`: Whether opening the DB fails immediately.
 * - `openSuccess`: Whether the DB opens successfully.
 * - `onUpgradeNeeded`: Optional callback to simulate an upgradeneeded event
 * (e.g., creation of object stores).
 *
 * @param options
 * @param options.openError
 * @param options.openSuccess
 * @param options.onUpgradeNeeded
 */
function buildMockIDBDatabase(
  options: {
    openError?: boolean;
    openSuccess?: boolean;
    onUpgradeNeeded?: (db: IDBDatabase) => void;
  } = {},
) {
  const openRequest = {
    onerror: null as null | (() => void),
    onsuccess: null as null | ((event: Event) => void),
    onupgradeneeded: null as null | ((event: IDBVersionChangeEvent) => void),
    result: null as unknown,
    oldVersion: 0,
  } as unknown as IDBOpenDBRequest;

  const mockObjectStore: IDBObjectStore = {
    put: jest.fn(),
    get: jest.fn(),
  } as unknown as IDBObjectStore;

  const mockTransaction: IDBTransaction = {
    objectStore: jest.fn().mockReturnValue(mockObjectStore),
  } as unknown as IDBTransaction;

  const mockDatabase: IDBDatabase = {
    transaction: jest
      .fn()
      .mockImplementation(
        (_storeNames: string[], _mode?: IDBTransactionMode) => {
          return mockTransaction;
        },
      ),
    objectStoreNames: {
      contains: jest.fn().mockReturnValue(false),
    },
    createObjectStore: jest.fn().mockReturnValue(mockObjectStore),
    close: jest.fn(),
  } as unknown as IDBDatabase;

  function resolveOpenRequest() {
    if (options.onUpgradeNeeded && openRequest.onupgradeneeded) {
      (openRequest as { result: unknown }).result = mockDatabase;

      const upgradeEvent = {
        target: openRequest,
        oldVersion: 0,
        newVersion: 1,
      } as unknown as IDBVersionChangeEvent;

      openRequest.onupgradeneeded(upgradeEvent);
    }
    if (options.openError && openRequest.onerror) {
      openRequest.onerror(new Event('error'));
    } else if (options.openSuccess && openRequest.onsuccess) {
      (openRequest as { result: unknown }).result = mockDatabase;

      const successEvent = {
        target: openRequest,
      } as unknown as Event;

      openRequest.onsuccess(successEvent);
    }
  }

  return {
    openRequest,
    mockDatabase,
    mockTransaction,
    mockObjectStore,
    resolveOpenRequest,
  };
}

/**
 * A helper that replaces `indexedDB.open` with a mocked implementation returning
 * the objects from `buildMockIDBDatabase`.
 *
 * @param options
 * @param options.openError
 * @param options.openSuccess
 * @param options.onUpgradeNeeded
 */
function mockIndexedDBOpenOnce(
  options: {
    openError?: boolean;
    openSuccess?: boolean;
    onUpgradeNeeded?: (db: IDBDatabase) => void;
  } = {},
) {
  const {
    openRequest,
    mockDatabase,
    mockTransaction,
    mockObjectStore,
    resolveOpenRequest,
  } = buildMockIDBDatabase(options);

  const openSpy = jest.spyOn(indexedDB, 'open').mockImplementation(() => {
    return openRequest;
  });

  return {
    openSpy,
    openRequest,
    mockDatabase,
    mockTransaction,
    mockObjectStore,
    resolveOpenRequest,
  };
}

describe('IndexedDBStore', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('initializes with default store name and version, and opens the DB', async () => {
      const { openSpy } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const store = new IndexedDBStore();

      expect(openSpy).toHaveBeenCalledWith('ExtensionStore', 1);
      expect(store).toBeDefined();
    });

    it('initializes with given store name and version, and opens the DB', async () => {
      const { openSpy } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const storeName = 'MyTestDB';
      const version = 5;
      const store = new IndexedDBStore(storeName, version);

      expect(openSpy).toHaveBeenCalledWith(storeName, version);
      expect(store).toBeDefined();
    });

    it('rejects if IndexedDB fails to open', async () => {
      const { resolveOpenRequest } = mockIndexedDBOpenOnce({
        openError: true,
      });
      const store = new IndexedDBStore();
      resolveOpenRequest();
      await expect(store.dbReady).rejects.toThrow('Failed to open IndexedDB.');
      expect(store).toBeDefined();
    });

    it('creates the object store on upgrade', async () => {
      const onUpgradeNeededMock = jest.fn((db: IDBDatabase) => {
        db.createObjectStore('ExtensionStore', { keyPath: 'id' });
      });
      const { mockDatabase, resolveOpenRequest } = mockIndexedDBOpenOnce({
        openSuccess: true,
        onUpgradeNeeded: onUpgradeNeededMock,
      });

      const store = new IndexedDBStore();
      resolveOpenRequest();
      expect(mockDatabase.createObjectStore).toHaveBeenCalledWith(
        'ExtensionStore',
        {
          keyPath: 'id',
        },
      );
      expect(store).toBeDefined();
    });
  });

  describe('set', () => {
    it('throws an error if the passed state is null/undefined', async () => {
      const { resolveOpenRequest } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const store = new IndexedDBStore();
      resolveOpenRequest();
      await expect(
        store.set(null as unknown as MetaMaskStorageStructure),
      ).rejects.toThrow('MetaMask - updated state is missing');
    });

    it('stores the given state in IndexedDB', async () => {
      const { mockObjectStore, resolveOpenRequest } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const store = new IndexedDBStore();
      resolveOpenRequest();
      const mockPutRequest = {
        onerror: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
      };
      (mockObjectStore.put as jest.Mock).mockReturnValue(mockPutRequest);

      const testState: MetaMaskStorageStructure = {
        data: {
          key1: 'value1',
        },
      };

      const promise = store.set(testState);

      setTimeout(() => {
        mockPutRequest.onsuccess?.();
      }, 0);

      await expect(promise).resolves.toBeUndefined();
      expect(mockObjectStore.put).toHaveBeenCalledWith({
        id: 'metamaskState',
        state: testState,
      });
    });

    it('catches errors when writing the state and logs them/captures exception', async () => {
      const { mockObjectStore, resolveOpenRequest } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const store = new IndexedDBStore();
      resolveOpenRequest();
      const mockPutRequest = {
        onerror: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        error: new Error('put failed'),
      };
      (mockObjectStore.put as jest.Mock).mockReturnValue(mockPutRequest);

      const testState: MetaMaskStorageStructure = { data: { x: 42 } };
      const promise = store.set(testState);

      setTimeout(() => {
        mockPutRequest.onerror?.();
      }, 0);

      await promise;
      expect(log.error).toHaveBeenCalledWith(
        'Error setting state in IndexedDB:',
        mockPutRequest.error,
      );
      expect(captureException).toHaveBeenCalledWith(mockPutRequest.error);
    });

    it('re-initializes the DB if the transaction fails with InvalidStateError, then tries again', async () => {
      /**
       * We test the scenario:
       * 1. The first transaction to store data throws InvalidStateError.
       * 2. The code handles it, reinitializes the DB.
       * 3. The DB is open again, and the set call eventually succeeds.
       */
      const { mockDatabase, mockObjectStore, resolveOpenRequest } =
        mockIndexedDBOpenOnce({
          openSuccess: true,
        });
      const store = new IndexedDBStore();
      (mockDatabase.transaction as jest.Mock).mockImplementationOnce(() => {
        const error = new Error('InvalidStateError');
        (error as Error).name = 'InvalidStateError';
        throw error;
      });

      const mockPutRequest = {
        onerror: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
      };
      (mockObjectStore.put as jest.Mock).mockReturnValue(mockPutRequest);
      resolveOpenRequest();

      const testState: MetaMaskStorageStructure = { data: { reinit: true } };
      const promise = store.set(testState);

      setTimeout(() => {
        mockPutRequest.onsuccess?.();
      }, 15);
      await new Promise((resolve) => setTimeout(resolve, 10));
      resolveOpenRequest();

      await expect(promise).resolves.toBeUndefined();
      expect(log.info).toHaveBeenCalledWith(
        'Database connection was closed. Attempting to reinitialize IndexedDB.',
        expect.any(Error),
      );
      expect(mockObjectStore.put).toHaveBeenCalledWith({
        id: 'metamaskState',
        state: testState,
      });
    });

    it('throws non-InvalidStateError exceptions when setting', async () => {
      const { mockDatabase, resolveOpenRequest } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const store = new IndexedDBStore();
      resolveOpenRequest();

      const err = new Error('RandomTransactionError');
      (mockDatabase.transaction as jest.Mock).mockImplementationOnce(() => {
        throw err;
      });

      await store.set({ data: { foo: 'bar' } });

      expect(log.error).toHaveBeenCalledWith(
        'Error setting state in IndexedDB:',
        err,
      );
      expect(captureException).toHaveBeenCalledWith(err);
    });
  });

  describe('get', () => {
    it('returns the stored data if found', async () => {
      const { mockObjectStore, resolveOpenRequest } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const store = new IndexedDBStore();
      resolveOpenRequest();
      const mockGetRequest = {
        onerror: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        result: {
          data: { hello: 'world' },
        },
      };
      (mockObjectStore.get as jest.Mock).mockReturnValue(mockGetRequest);

      const promise = store.get();

      setTimeout(() => {
        mockGetRequest.onsuccess?.();
      }, 0);

      await expect(promise).resolves.toStrictEqual({
        data: { hello: 'world' },
      });
      expect(mockObjectStore.get).toHaveBeenCalledWith('metamaskState');
    });

    it('returns null if no data is found', async () => {
      const { mockObjectStore, resolveOpenRequest } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const store = new IndexedDBStore();
      resolveOpenRequest();
      const mockGetRequest = {
        onerror: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        result: undefined,
      };
      (mockObjectStore.get as jest.Mock).mockReturnValue(mockGetRequest);

      const promise = store.get();

      setTimeout(() => {
        mockGetRequest.onsuccess?.();
      }, 0);

      await expect(promise).resolves.toBeNull();
    });

    it('logs the error and returns null on read failure', async () => {
      const { mockObjectStore, resolveOpenRequest } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const store = new IndexedDBStore();
      resolveOpenRequest();
      const mockGetRequest = {
        onerror: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        error: new Error('GetFail'),
      };
      (mockObjectStore.get as jest.Mock).mockReturnValue(mockGetRequest);

      const promise = store.get();

      setTimeout(() => {
        mockGetRequest.onerror?.();
      }, 0);

      const result = await promise;
      expect(result).toBeNull();
      expect(log.error).toHaveBeenCalledWith(
        'Error getting state from IndexedDB:',
        mockGetRequest.error,
      );
    });

    it('re-initializes the DB if the transaction fails with InvalidStateError, then tries again', async () => {
      const { mockDatabase, mockObjectStore, resolveOpenRequest } =
        mockIndexedDBOpenOnce({
          openSuccess: true,
        });
      const store = new IndexedDBStore();
      resolveOpenRequest();
      (mockDatabase.transaction as jest.Mock).mockImplementationOnce(() => {
        const error = new Error('InvalidStateError');
        (error as Error).name = 'InvalidStateError';
        throw error;
      });

      const mockGetRequest = {
        onerror: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        result: { data: { reInitCheck: true } },
      };
      (mockObjectStore.get as jest.Mock).mockReturnValue(mockGetRequest);

      const promise = store.get();

      setTimeout(() => {
        mockGetRequest.onsuccess?.();
      }, 15);
      await new Promise((resolve) => setTimeout(resolve, 10));
      resolveOpenRequest();

      await expect(promise).resolves.toStrictEqual({
        data: { reInitCheck: true },
      });
      expect(log.info).toHaveBeenCalledWith(
        'Database connection was closed. Attempting to reinitialize IndexedDB.',
        expect.any(Error),
      );
    });

    it('throws non-InvalidStateError exceptions when getting', async () => {
      const { mockDatabase, resolveOpenRequest } = mockIndexedDBOpenOnce({
        openSuccess: true,
      });
      const store = new IndexedDBStore();
      resolveOpenRequest();

      const err = new Error('RandomGetError');
      (mockDatabase.transaction as jest.Mock).mockImplementationOnce(() => {
        throw err;
      });

      const promise = store.get();
      const result = await promise;
      expect(result).toBeNull();
      expect(log.error).toHaveBeenCalledWith(
        'Error getting state from IndexedDB:',
        err,
      );
    });
  });
});
