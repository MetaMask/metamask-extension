import browser from 'webextension-polyfill';
import ExtensionStore from './extension-store';

const MOCK_STATE = { data: {}, meta: { version: 1 } };

global.sentry = global.sentry || {};

jest.mock('webextension-polyfill', () => ({
  runtime: { lastError: null },
  storage: { local: true },
}));

const setup = (
  options: {
    localMock?: { get?: unknown; set?: unknown; remove?: unknown } | false;
  } = {},
) => {
  if (typeof options.localMock === 'undefined') {
    // @ts-expect-error Mock used just to spy on calls, doesn't implement API
    jest.replaceProperty(browser.storage, 'local', jest.fn());
  } else if (options.localMock === false) {
    const storageApi: Partial<typeof browser.storage> = { ...browser.storage };
    delete storageApi.local;
    // @ts-expect-error Intentionally incomplete to test behavior when API is missing
    jest.replaceProperty(browser, 'storage', storageApi);
  } else {
    // @ts-expect-error Incomplete mock, it just has the properties we call
    jest.replaceProperty(browser.storage, 'local', options.localMock);
  }
  return new ExtensionStore();
};
describe('ExtensionStore', () => {
  afterEach(() => {
    jest.resetModules();
  });
  describe('constructor', () => {
    it('sets isSupported property to false when browser does not support local storage', () => {
      const localStore = setup({ localMock: false });

      expect(localStore.isSupported).toBe(false);
    });

    it('sets isSupported property to true when browser supports local storage', () => {
      const localStore = setup();
      expect(localStore.isSupported).toBe(true);
    });
  });

  describe('set', () => {
    it('throws an error if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      await expect(() => localStore.set(MOCK_STATE)).rejects.toThrow(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
      );
    });

    it('throws an error if passed a valid argument and metadata has been set', async () => {
      const setMock = jest.fn();

      const localStore = setup({ localMock: { set: setMock } });
      await expect(async function () {
        localStore.set(MOCK_STATE);
      }).not.toThrow();
    });

    it('calls the browser storage.local.set method', async () => {
      const setMock = jest.fn();
      const localStore = setup({ localMock: { set: setMock } });

      await localStore.set(MOCK_STATE);

      expect(setMock).toHaveBeenCalledWith(MOCK_STATE);
    });

    it('ends the overwrite timer when browser storage.local.set throws', async () => {
      const timeSpy = jest
        .spyOn(console, 'time')
        .mockImplementation(() => undefined);
      const timeEndSpy = jest
        .spyOn(console, 'timeEnd')
        .mockImplementation(() => undefined);
      const localStore = setup({
        localMock: {
          set: jest.fn().mockRejectedValue(new Error('Failed to write state')),
        },
      });

      try {
        await expect(localStore.set(MOCK_STATE)).rejects.toThrow(
          'Failed to write state',
        );

        expect(timeSpy).toHaveBeenCalledWith(
          '[ExtensionStore]: Overwriting local store',
        );
        expect(timeEndSpy).toHaveBeenCalledWith(
          '[ExtensionStore]: Overwriting local store',
        );
      } finally {
        timeSpy.mockRestore();
        timeEndSpy.mockRestore();
      }
    });
  });

  describe('get', () => {
    it('returns null if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      const result = await localStore.get();
      expect(result).toBe(null);
    });

    it('returns state returned by the browser storage.local.get method', async () => {
      const getMock = jest.fn().mockResolvedValue(MOCK_STATE);
      const localStore = setup({ localMock: { get: getMock } });

      const result = await localStore.get();

      expect(result).toBe(MOCK_STATE);
      expect(getMock).toHaveBeenCalledWith(['data', 'meta']);
    });
  });

  describe('reset', () => {
    it('throws an error if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      await expect(() => localStore.reset()).rejects.toThrow(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
      );
    });

    it('removes persisted manifest keys when in-memory manifest is empty', async () => {
      const getMock = jest.fn().mockResolvedValue({
        manifest: ['meta', 'KeyringController', 'PreferencesController'],
      });
      const removeMock = jest.fn().mockResolvedValue(undefined);
      const localStore = setup({
        localMock: { get: getMock, remove: removeMock },
      });

      await localStore.reset();

      expect(getMock).toHaveBeenCalledWith(['manifest']);
      expect(removeMock).toHaveBeenCalledWith([
        'manifest',
        'meta',
        'KeyringController',
        'PreferencesController',
      ]);
    });

    it('uses persisted manifest keys instead of in-memory manifest keys when available', async () => {
      const getMock = jest.fn().mockResolvedValue({
        manifest: ['KeyringController'],
      });
      const setMock = jest.fn().mockResolvedValue(undefined);
      const removeMock = jest.fn().mockResolvedValue(undefined);
      const localStore = setup({
        localMock: { get: getMock, set: setMock, remove: removeMock },
      });

      await localStore.set(MOCK_STATE);
      await localStore.reset();

      expect(getMock).toHaveBeenCalledWith(['manifest']);
      expect(removeMock).toHaveBeenCalledWith([
        'manifest',
        'KeyringController',
      ]);
    });

    it('falls back to in-memory manifest keys when reading persisted manifest fails', async () => {
      const getMock = jest
        .fn()
        .mockRejectedValue(new Error('Failed to read manifest'));
      const setMock = jest.fn().mockResolvedValue(undefined);
      const removeMock = jest.fn().mockResolvedValue(undefined);
      const localStore = setup({
        localMock: { get: getMock, set: setMock, remove: removeMock },
      });

      await localStore.set(MOCK_STATE);
      await localStore.reset();

      expect(getMock).toHaveBeenCalledWith(['manifest']);
      expect(removeMock).toHaveBeenCalledWith(['manifest', 'data', 'meta']);
    });
  });
});
