import browser from 'webextension-polyfill';
import ExtensionStore from './extension-store';

const MOCK_STATE = { data: {}, meta: { version: 1 } };

jest.mock('webextension-polyfill', () => ({
  runtime: { lastError: null },
  storage: { local: true },
}));

const setup = (
  options: { localMock?: { get?: unknown; set?: unknown } | false } = {},
) => {
  if (typeof options.localMock === 'undefined') {
    browser.storage.local =
      jest.fn() as unknown as browser.Storage.LocalStorageArea;
  } else if (options.localMock === false) {
    browser.storage.local =
      undefined as unknown as browser.Storage.LocalStorageArea;
  } else {
    browser.storage.local =
      options.localMock as unknown as browser.Storage.LocalStorageArea;
  }
  return new ExtensionStore();
};
describe('ExtensionStore', () => {
  beforeEach(() => {
    global.sentry = {
      captureException: jest.fn(),
    };
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    browser.storage.local =
      undefined as unknown as browser.Storage.LocalStorageArea;
  });
  describe('constructor', () => {
    it('should set isSupported property to false when browser does not support local storage', () => {
      const localStore = setup({ localMock: false });

      expect(localStore.isSupported).toBe(false);
    });

    it('should set isSupported property to true when browser supports local storage', () => {
      const localStore = setup();
      expect(localStore.isSupported).toBe(true);
    });
  });

  describe('set', () => {
    it('should throw an error if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      await expect(() => localStore.set(MOCK_STATE)).rejects.toThrow(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    });

    it('should not throw if passed a valid argument and metadata has been set', async () => {
      const setMock = jest.fn();

      const localStore = setup({ localMock: { set: setMock } });
      await expect(async function () {
        localStore.set(MOCK_STATE);
      }).not.toThrow();
    });

    it('should call the browser storage.local.set method', async () => {
      const setMock = jest.fn();
      const localStore = setup({ localMock: { set: setMock } });

      await localStore.set(MOCK_STATE);

      expect(setMock).toHaveBeenCalledWith(MOCK_STATE);
    });
  });

  describe('get', () => {
    it('should return null if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      const result = await localStore.get();
      expect(result).toBe(null);
    });

    it('should return state returned by the browser storage.local.get method', async () => {
      const getMock = jest.fn().mockResolvedValue(MOCK_STATE);
      const localStore = setup({ localMock: { get: getMock } });

      const result = await localStore.get();

      expect(result).toBe(MOCK_STATE);
      expect(getMock).toHaveBeenCalledWith(null);
    });
  });
});
