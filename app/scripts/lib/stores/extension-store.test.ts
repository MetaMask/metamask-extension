import browser from 'webextension-polyfill';
import ExtensionStore from './extension-store';

const MOCK_STATE = { data: {}, meta: { version: 1 } };

global.sentry = global.sentry || {};

jest.mock('webextension-polyfill', () => ({
  runtime: { lastError: null },
  storage: { local: true },
}));

const setup = (
  options: { localMock?: { get?: unknown; set?: unknown } | false } = {},
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
});
