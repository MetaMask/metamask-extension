import log from 'loglevel';
import LocalStore from './local-store';

const mockIDBRequest = (result, isError) => {
  const request = {
    onsuccess: null,
    onerror: null,
    result,
  };

  // Delay execution to simulate async behavior of IDBRequest
  setTimeout(() => {
    if (isError) {
      if (typeof request.onerror === 'function') {
        request.onerror({ target: { error: 'Mock error' } });
      }
    } else if (typeof request.onsuccess === 'function') {
      request.onsuccess({ target: request });
    }
  }, 0);

  return request;
};

const createEmptySetup = () =>
  (global.indexedDB = {
    open: jest.fn(() =>
      mockIDBRequest({
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            get: jest.fn(() => mockIDBRequest({})),
            put: jest.fn(() => mockIDBRequest({})),
          })),
        })),
      }),
    ),
  });

const MOCK_STATE = { appState: { test: true } };
const MOCK_VERSION_DATA = { version: 74 };

describe('LocalStore', () => {
  let setup;
  beforeEach(() => {
    setup = () => {
      // Mock the indexedDB open function
      global.indexedDB = {
        open: jest.fn(() =>
          mockIDBRequest({
            transaction: jest.fn(() => ({
              objectStore: jest.fn(() => ({
                get: jest.fn(() => mockIDBRequest(MOCK_STATE)),
                put: jest.fn(() => mockIDBRequest({})),
              })),
            })),
          }),
        ),
      };
      return new LocalStore();
    };
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize mostRecentRetrievedState to null', () => {
      const localStore = setup();
      expect(localStore.mostRecentRetrievedState).toBeNull();
    });

    it('should initialize isExtensionInitialized to false', () => {
      const localStore = setup();
      expect(localStore.isExtensionInitialized).toBeFalsy();
    });
  });

  describe('_getObjectStore', () => {
    it('should reinitialize IndexedDB and return the object store when INVALID_STATE_ERROR occurs', async () => {
      const localStore = setup();

      // Mock initial failure with INVALID_STATE_ERROR
      const error = new Error('Mock InvalidStateError');
      error.name = 'InvalidStateError';
      localStore.dbReady = Promise.reject(error);

      // Mock the _init function to resolve successfully after reinitialization
      const mockDb = {
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => MOCK_STATE),
        })),
      };
      jest.spyOn(localStore, '_init').mockResolvedValueOnce(mockDb);
      const objectStore = await localStore._getObjectStore('readonly');
      expect(localStore._init).toHaveBeenCalled();
      expect(objectStore).toStrictEqual(MOCK_STATE);
    });
  });

  describe('setMetadata', () => {
    it('should set the metadata property on LocalStore', () => {
      const metadata = MOCK_VERSION_DATA;
      const localStore = setup();
      localStore.setMetadata(metadata);

      expect(localStore.metadata).toStrictEqual(metadata);
    });
  });

  describe('set', () => {
    it('should throw an error if not passed a truthy value as an argument', async () => {
      const localStore = setup();
      await expect(() => localStore.set()).rejects.toThrow(
        'MetaMask - updated state is missing',
      );
    });

    it('should throw an error if passed a valid argument but metadata has not yet been set', async () => {
      const localStore = setup();
      await expect(() => localStore.set(MOCK_STATE)).rejects.toThrow(
        'MetaMask - metadata must be set on instance of ExtensionStore before calling "set"',
      );
    });

    it('should not throw if passed a valid argument and metadata has been set', async () => {
      const localStore = setup();
      localStore.setMetadata(MOCK_VERSION_DATA);
      await expect(async () => {
        await localStore.set(MOCK_STATE);
      }).not.toThrow();
    });

    it('should set isExtensionInitialized if data is set with no error', async () => {
      const localStore = setup();
      localStore.setMetadata(MOCK_VERSION_DATA);
      await localStore.set(MOCK_STATE);
      expect(localStore.isExtensionInitialized).toBeTruthy();
    });

    it('should fallback to in-memory cache if IndexedDB is not available', async () => {
      const localStore = setup();
      localStore.setMetadata(MOCK_VERSION_DATA);
      jest.spyOn(localStore, '_writeToDB').mockImplementationOnce(() => {
        const error = new Error('Mock error');
        error.name = 'InvalidStateError';
        throw error;
      });

      await localStore.set({ appState: { test: true } });
      expect(localStore.inMemoryCache).toStrictEqual({
        id: 'metamaskState',
        data: MOCK_STATE,
        meta: MOCK_VERSION_DATA,
      });
    });

    it('should handle IndexedDB error and log the error', async () => {
      const localStore = setup();
      localStore.setMetadata(MOCK_VERSION_DATA);
      const logSpy = jest
        .spyOn(log, 'error')
        .mockImplementation(() => undefined);
      jest
        .spyOn(localStore, '_writeToDB')
        .mockRejectedValueOnce(new Error('Mock error'));

      await localStore.set(MOCK_STATE);
      expect(logSpy).toHaveBeenCalledWith(
        'Error setting state in IndexedDB:',
        expect.any(Error),
      );
    });

    it('should set dataPersistenceFailing to true when IndexedDB fails', async () => {
      const localStore = setup();
      localStore.setMetadata(MOCK_VERSION_DATA);
      jest
        .spyOn(localStore, '_writeToDB')
        .mockRejectedValueOnce(new Error('InvalidStateError'));

      await localStore.set(MOCK_STATE);
      expect(localStore.dataPersistenceFailing).toBe(true);
    });
  });

  describe('get', () => {
    it('should return undefined if no state is stored', async () => {
      setup = () => {
        createEmptySetup();
        return new LocalStore();
      };

      const localStore = setup();
      const result = await localStore.get();
      expect(result).toStrictEqual(undefined);
    });

    it('should update mostRecentRetrievedState', async () => {
      const localStore = setup();

      await localStore.get();

      expect(localStore.mostRecentRetrievedState).toStrictEqual(MOCK_STATE);
    });

    it('should reset mostRecentRetrievedState to null if storage is empty', async () => {
      setup = () => {
        createEmptySetup();
        return new LocalStore();
      };

      const localStore = setup();
      await localStore.get();
      expect(localStore.mostRecentRetrievedState).toStrictEqual(null);
    });

    it('should set mostRecentRetrievedState to current state if isExtensionInitialized is true', async () => {
      const localStore = setup();
      localStore.setMetadata(MOCK_VERSION_DATA);
      await localStore.set(MOCK_STATE);
      await localStore.get();
      expect(localStore.mostRecentRetrievedState).toStrictEqual(null);
    });

    it('should fallback to in-memory cache if IndexedDB is not available', async () => {
      const localStore = setup();
      jest.spyOn(localStore, '_readFromDB').mockResolvedValueOnce(null);
      // Set the in-memory cache
      localStore.inMemoryCache = {
        id: 'metamaskState',
        data: MOCK_STATE,
        meta: MOCK_VERSION_DATA,
      };
      const result = await localStore.get();
      expect(result).toStrictEqual(localStore.inMemoryCache);
    });
  });

  describe('cleanUpMostRecentRetrievedState', () => {
    it('should set mostRecentRetrievedState to null if it is defined', async () => {
      const localStore = setup();
      await localStore.get();
      await localStore.cleanUpMostRecentRetrievedState();
      expect(localStore.mostRecentRetrievedState).toStrictEqual(null);
    });

    it('should not set mostRecentRetrievedState if it is null', async () => {
      const localStore = setup();
      expect(localStore.mostRecentRetrievedState).toStrictEqual(null);
      await localStore.cleanUpMostRecentRetrievedState();
      expect(localStore.mostRecentRetrievedState).toStrictEqual(null);
    });
  });
});
