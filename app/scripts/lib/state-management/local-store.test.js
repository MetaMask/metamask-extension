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
                get: jest.fn(() =>
                  mockIDBRequest({ appState: { test: true } }),
                ),
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

  describe('setMetadata', () => {
    it('should set the metadata property on LocalStore', () => {
      const metadata = { version: 74 };
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
      await expect(() =>
        localStore.set({ appState: { test: true } }),
      ).rejects.toThrow(
        'MetaMask - metadata must be set on instance of ExtensionStore before calling "set"',
      );
    });

    it('should not throw if passed a valid argument and metadata has been set', async () => {
      const localStore = setup();
      localStore.setMetadata({ version: 74 });
      await expect(async () => {
        await localStore.set({ appState: { test: true } });
      }).not.toThrow();
    });

    it('should set isExtensionInitialized if data is set with no error', async () => {
      const localStore = setup();
      localStore.setMetadata({ version: 74 });
      await localStore.set({ appState: { test: true } });
      expect(localStore.isExtensionInitialized).toBeTruthy();
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

      expect(localStore.mostRecentRetrievedState).toStrictEqual({
        appState: { test: true },
      });
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
      localStore.setMetadata({ version: 74 });
      await localStore.set({ appState: { test: true } });
      await localStore.get();
      expect(localStore.mostRecentRetrievedState).toStrictEqual(null);
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
