import browser from 'webextension-polyfill';
import { checkForLastError } from '../../../../shared/modules/browser-runtime.utils';
import ExtensionStore from './ExtensionStore';

const MOCK_STATE = { data: {}, meta: { version: 1 } };

jest.mock('webextension-polyfill', () => ({
  runtime: { lastError: null },
  storage: { local: true },
}));

jest.mock('../../../../shared/modules/browser-runtime.utils', () => ({
  checkForLastError: jest.fn(),
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

    it('throws an error if checkForLastError returns an error after setting', async () => {
      const setMock = jest.fn();
      setMock.mockResolvedValueOnce(undefined);
      const fakeError = new Error('Some set error');
      (checkForLastError as jest.Mock).mockReturnValueOnce(fakeError);

      const localStore = setup({ localMock: { set: setMock } });
      await expect(
        localStore.set({ data: { abc: 123 }, meta: { version: 10 } }),
      ).rejects.toThrow('Some set error');
    });
  });

  describe('get', () => {
    it('should return null if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      const result = await localStore.get();
      expect(result).toBe(null);
    });

    it('should call the browser storage.local.get method', async () => {
      const getMock = jest.fn();
      const localStore = setup({ localMock: { get: getMock } });

      await localStore.get();

      expect(getMock).toHaveBeenCalledWith(null);
    });

    it('throws an error if checkForLastError returns an error', async () => {
      const getMock = jest.fn();
      getMock.mockResolvedValueOnce({ test: true });
      const fakeError = new Error('Some browser error');
      (checkForLastError as jest.Mock).mockReturnValueOnce(fakeError);

      const localStore = setup({ localMock: { get: getMock } });
      await expect(localStore.get()).rejects.toThrow('Some browser error');
    });
  });
});
