import { jest } from '@jest/globals';
import browser from 'webextension-polyfill';
import { BrowserStorageAdapter } from '../../../shared/lib/stores/browser-storage-adapter';
import { migrate, version } from './190';

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
}));

jest.mock('../../../shared/lib/stores/browser-storage-adapter', () => ({
  BrowserStorageAdapter: jest.fn(),
}));

const VERSION = version;
const oldVersion = VERSION - 1;
const CONTROLLER_NAME = 'TokenListController';
const CACHE_KEY_PREFIX = 'tokensChainsCache';
const mockBrowser = jest.mocked(browser);
const MockedBrowserStorageAdapter =
  BrowserStorageAdapter as jest.MockedClass<typeof BrowserStorageAdapter>;
type StorageGetResult = Awaited<ReturnType<BrowserStorageAdapter['getItem']>>;

describe(`migration #${version}`, () => {
  let getItemMock: jest.MockedFunction<BrowserStorageAdapter['getItem']>;
  let setItemMock: jest.MockedFunction<BrowserStorageAdapter['setItem']>;

  beforeEach(() => {
    jest.clearAllMocks();
    getItemMock = jest
      .fn<BrowserStorageAdapter['getItem']>()
      .mockResolvedValue({});
    setItemMock = jest
      .fn<BrowserStorageAdapter['setItem']>()
      .mockResolvedValue(undefined);
    MockedBrowserStorageAdapter.mockImplementation(
      () =>
        ({
          getItem: getItemMock,
          setItem: setItemMock,
        }) as jest.Mocked<BrowserStorageAdapter>,
    );
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if TokenListController state does not exist', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual({});
    expect(MockedBrowserStorageAdapter).not.toHaveBeenCalled();
    expect(setItemMock).not.toHaveBeenCalled();
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if tokensChainsCache is empty', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          tokensChainsCache: {},
          preventPollingOnNetworkRestart: false,
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.TokenListController).toStrictEqual({
      tokensChainsCache: {},
      preventPollingOnNetworkRestart: false,
    });
    expect(MockedBrowserStorageAdapter).not.toHaveBeenCalled();
    expect(setItemMock).not.toHaveBeenCalled();
    expect(changedControllers.size).toBe(0);
  });

  it('migrates tokensChainsCache through the storage adapter', async () => {
    const chainCache = {
      timestamp: 1234567890,
      data: {
        '0xToken1': { name: 'Token1', symbol: 'TK1' },
        '0xToken2': { name: 'Token2', symbol: 'TK2' },
      },
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '0x1': chainCache,
          },
          preventPollingOnNetworkRestart: false,
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(getItemMock).toHaveBeenCalledWith(
      CONTROLLER_NAME,
      `${CACHE_KEY_PREFIX}:0x1`,
    );
    expect(setItemMock).toHaveBeenCalledWith(
      CONTROLLER_NAME,
      `${CACHE_KEY_PREFIX}:0x1`,
      chainCache,
    );
    expect(mockBrowser.storage.local.get).not.toHaveBeenCalled();
    expect(mockBrowser.storage.local.set).not.toHaveBeenCalled();
    expect(
      (oldStorage.data.TokenListController as Record<string, unknown>)
        .tokensChainsCache,
    ).toStrictEqual({});
    expect(
      (oldStorage.data.TokenListController as Record<string, unknown>)
        .preventPollingOnNetworkRestart,
    ).toBe(false);
    expect(changedControllers.has('TokenListController')).toBe(true);
  });

  it('migrates multiple chains independently', async () => {
    const chain1Cache = {
      timestamp: 1234567890,
      data: { '0xToken1': { name: 'Token1' } },
    };
    const chain2Cache = {
      timestamp: 1234567891,
      data: { '0xToken2': { name: 'Token2' } },
    };
    const chain3Cache = {
      timestamp: 1234567892,
      data: { '0xToken3': { name: 'Token3' } },
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '0x1': chain1Cache,
            '0x89': chain2Cache,
            '0xa86a': chain3Cache,
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(setItemMock).toHaveBeenCalledTimes(3);
    expect(setItemMock).toHaveBeenNthCalledWith(
      1,
      CONTROLLER_NAME,
      `${CACHE_KEY_PREFIX}:0x1`,
      chain1Cache,
    );
    expect(setItemMock).toHaveBeenNthCalledWith(
      2,
      CONTROLLER_NAME,
      `${CACHE_KEY_PREFIX}:0x89`,
      chain2Cache,
    );
    expect(setItemMock).toHaveBeenNthCalledWith(
      3,
      CONTROLLER_NAME,
      `${CACHE_KEY_PREFIX}:0xa86a`,
      chain3Cache,
    );
    expect(changedControllers.has('TokenListController')).toBe(true);
  });

  it('does not overwrite chains that already exist in storage', async () => {
    const existingCache = {
      timestamp: 9999999999,
      data: { '0xExisting': { name: 'Existing' } },
    };
    const newCache = {
      timestamp: 1234567890,
      data: { '0xNew': { name: 'New' } },
    };
    getItemMock.mockImplementation(async (_namespace, key) => {
      if (key === `${CACHE_KEY_PREFIX}:0x1`) {
        return { result: existingCache };
      }
      return {} as StorageGetResult;
    });

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '0x1': { timestamp: 1111111111, data: {} },
            '0x89': newCache,
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(setItemMock).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledWith(
      CONTROLLER_NAME,
      `${CACHE_KEY_PREFIX}:0x89`,
      newCache,
    );
    expect(changedControllers.has('TokenListController')).toBe(true);
  });

  it('skips storage writes if all chains already exist in storage', async () => {
    getItemMock.mockResolvedValue({ result: { timestamp: 1, data: {} } });
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '0x1': { timestamp: 1234567890, data: {} },
            '0x89': { timestamp: 1234567891, data: {} },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(setItemMock).not.toHaveBeenCalled();
    expect(
      (oldStorage.data.TokenListController as Record<string, unknown>)
        .tokensChainsCache,
    ).toStrictEqual({});
    expect(changedControllers.has('TokenListController')).toBe(true);
  });

  it('handles storage write errors gracefully and clears state', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockReturnValue();
    const storageError = new Error('Storage quota exceeded');
    setItemMock.mockRejectedValue(storageError);

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '0x1': { timestamp: 1234567890, data: {} },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.meta.version).toBe(version);
    expect(
      (oldStorage.data.TokenListController as Record<string, unknown>)
        .tokensChainsCache,
    ).toStrictEqual({});
    expect(changedControllers.has('TokenListController')).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      `Migration #${version}: Failed to migrate tokensChainsCache to StorageService:`,
      storageError,
    );
    errorSpy.mockRestore();
  });

  it('migrates when the existing-cache read returns an error', async () => {
    const storageError = new Error('Storage not available');
    const chainCache = {
      timestamp: 1234567890,
      data: {},
    };
    getItemMock.mockResolvedValue({ error: storageError });
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '0x1': chainCache,
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(setItemMock).toHaveBeenCalledWith(
      CONTROLLER_NAME,
      `${CACHE_KEY_PREFIX}:0x1`,
      chainCache,
    );
    expect(
      (oldStorage.data.TokenListController as Record<string, unknown>)
        .tokensChainsCache,
    ).toStrictEqual({});
    expect(changedControllers.has('TokenListController')).toBe(true);
  });
});
