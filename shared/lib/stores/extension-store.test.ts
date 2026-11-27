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
    localMock?:
      | {
          get?: unknown;
          getBytesInUse?: unknown;
          set?: unknown;
          remove?: unknown;
        }
      | false;
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

  describe('getBytesInUseByKey', () => {
    it('throws an error if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });

      await expect(localStore.getBytesInUseByKey(['foo'])).rejects.toThrow(
        'MetaMask - cannot measure state size in local store as this browser does not support this action',
      );
    });

    it('throws an error if getBytesInUse is unavailable', async () => {
      const localStore = setup({ localMock: { get: jest.fn() } });

      await expect(localStore.getBytesInUseByKey(['foo'])).rejects.toThrow(
        'MetaMask - cannot measure state size because getBytesInUse is not available',
      );
    });

    it('returns bytes in use for each requested key', async () => {
      const getBytesInUse = jest
        .fn()
        .mockResolvedValueOnce(42)
        .mockResolvedValueOnce(7);
      const localStore = setup({
        localMock: { getBytesInUse },
      });

      await expect(
        localStore.getBytesInUseByKey(['FooController', 'BarController']),
      ).resolves.toStrictEqual(
        new Map([
          ['FooController', 42],
          ['BarController', 7],
        ]),
      );
      expect(getBytesInUse).toHaveBeenCalledTimes(2);
      expect(getBytesInUse).toHaveBeenNthCalledWith(1, 'FooController');
      expect(getBytesInUse).toHaveBeenNthCalledWith(2, 'BarController');
    });
  });

  describe('getTotalBytesInUse', () => {
    it('throws an error if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });

      await expect(localStore.getTotalBytesInUse(['foo'])).rejects.toThrow(
        'MetaMask - cannot measure state size in local store as this browser does not support this action',
      );
    });

    it('throws an error if getBytesInUse is unavailable', async () => {
      const localStore = setup({ localMock: { get: jest.fn() } });

      await expect(localStore.getTotalBytesInUse(['foo'])).rejects.toThrow(
        'MetaMask - cannot measure state size because getBytesInUse is not available',
      );
    });

    it('returns the total bytes for all requested keys in one call', async () => {
      const getBytesInUse = jest.fn().mockResolvedValue(49);
      const localStore = setup({
        localMock: { getBytesInUse },
      });

      await expect(
        localStore.getTotalBytesInUse(['FooController', 'BarController']),
      ).resolves.toBe(49);
      expect(getBytesInUse).toHaveBeenCalledTimes(1);
      expect(getBytesInUse).toHaveBeenCalledWith([
        'FooController',
        'BarController',
      ]);
    });
  });

  describe('getSplitStateReadDiagnostics', () => {
    it('reports unsupported storage as a failed manifest read', async () => {
      const localStore = setup({ localMock: false });

      await expect(
        localStore.getSplitStateReadDiagnostics(),
      ).resolves.toStrictEqual({
        manifestStatus: 'failed',
        manifestErrorName: 'UnsupportedStorage',
        readableKeys: [],
        missingKeys: [],
        failedKeys: [],
      });
    });

    it('reports a missing manifest for legacy data storage', async () => {
      const get = jest.fn().mockResolvedValue({
        data: { KeyringController: { vault: 'secret-vault' } },
        meta: { version: 1 },
      });
      const localStore = setup({ localMock: { get } });

      await expect(
        localStore.getSplitStateReadDiagnostics(),
      ).resolves.toStrictEqual({
        manifestStatus: 'missing',
        readableKeys: [],
        missingKeys: [],
        failedKeys: [],
      });
      expect(JSON.stringify(get.mock.results)).not.toContain('secret-vault');
    });

    it('reports a failed manifest read and does not read controller keys', async () => {
      const manifestError = new Error('manifest unavailable');
      manifestError.name = 'QuotaExceededError';
      const get = jest.fn().mockRejectedValue(manifestError);
      const localStore = setup({ localMock: { get } });

      await expect(
        localStore.getSplitStateReadDiagnostics(),
      ).resolves.toStrictEqual({
        manifestStatus: 'failed',
        manifestErrorName: 'QuotaExceededError',
        readableKeys: [],
        missingKeys: [],
        failedKeys: [],
      });
      expect(get).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith(['manifest']);
    });

    it('classifies readable, missing, and failed keys without keeping values', async () => {
      const keyError = new Error('key unavailable');
      keyError.name = 'QuotaExceededError';
      const get = jest.fn(async (keys: string[]) => {
        if (keys.length === 1 && keys[0] === 'manifest') {
          return {
            manifest: [
              'AccountsController',
              'KeyringController',
              'FooController',
              1,
            ],
          };
        }
        if (keys[0] === 'AccountsController') {
          return { AccountsController: { address: '0xsecret' } };
        }
        if (keys[0] === 'KeyringController') {
          return {};
        }
        throw keyError;
      });
      const localStore = setup({ localMock: { get } });

      const diagnostics = await localStore.getSplitStateReadDiagnostics();

      expect(diagnostics).toStrictEqual({
        manifestStatus: 'readable',
        manifestKeyCount: 3,
        readableKeys: ['AccountsController'],
        missingKeys: ['KeyringController'],
        failedKeys: [{ key: 'FooController', errorName: 'QuotaExceededError' }],
      });
      expect(JSON.stringify(diagnostics)).not.toContain('0xsecret');
      expect(get).toHaveBeenCalledWith(['AccountsController']);
      expect(get).toHaveBeenCalledWith(['KeyringController']);
      expect(get).toHaveBeenCalledWith(['FooController']);
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

    it('removes the union of persisted and in-memory manifest keys', async () => {
      const getMock = jest.fn().mockResolvedValue({
        manifest: ['KeyringController', 'PreferencesController'],
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
        'data',
        'meta',
        'KeyringController',
        'PreferencesController',
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
