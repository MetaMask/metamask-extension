import browser from 'webextension-polyfill';
import LocalStore from './local-store';

jest.mock('webextension-polyfill', () => ({
  runtime: { lastError: null },
  storage: { local: true },
}));

const setup = ({ localMock = jest.fn() } = {}) => {
  browser.storage.local = localMock;
  return new LocalStore();
};
describe('LocalStore', () => {
  afterEach(() => {
    jest.resetModules();
  });
  describe('contructor', () => {
    it('should set isSupported property to false when browser does not support local storage', () => {
      const localStore = setup({ localMock: false });

      expect(localStore.isSupported).toBe(false);
    });

    it('should set isSupported property to true when browser supports local storage', () => {
      const localStore = setup();
      expect(localStore.isSupported).toBe(true);
    });

    it('should initialize mostRecentRetrievedState to null', () => {
      const localStore = setup({ localMock: false });

      expect(localStore.mostRecentRetrievedState).toBeNull();
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
    it('should throw an error if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      await expect(() => localStore.set()).rejects.toThrow(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    });

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
      await expect(async function () {
        localStore.set({ appState: { test: true } });
      }).not.toThrow();
    });
  });

  describe('get', () => {
    it('should return undefined if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      const result = await localStore.get();
      expect(result).toStrictEqual(undefined);
    });

    it('should update mostRecentRetrievedState', async () => {
      const localStore = setup({
        localMock: {
          get: jest
            .fn()
            .mockImplementation(() =>
              Promise.resolve({ appState: { test: true } }),
            ),
        },
      });

      await localStore.get();

      expect(localStore.mostRecentRetrievedState).toStrictEqual({
        appState: { test: true },
      });
    });

    it('should reset mostRecentRetrievedState to null if storage.local is empty', async () => {
      const localStore = setup({
        localMock: {
          get: jest.fn().mockImplementation(() => Promise.resolve({})),
        },
      });

      await localStore.get();

      expect(localStore.mostRecentRetrievedState).toStrictEqual(null);
    });
  });
});
