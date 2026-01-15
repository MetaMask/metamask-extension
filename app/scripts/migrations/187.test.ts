import { jest } from '@jest/globals';
import browser from 'webextension-polyfill';
import { migrate, version } from './187';

// Mock browser.storage.local
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
}));

const mockBrowser = jest.mocked(browser);

const VERSION = version;
const oldVersion = VERSION - 1;

describe(`migration #${version}`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBrowser.storage.local.get.mockResolvedValue({});
    mockBrowser.storage.local.set.mockResolvedValue(undefined);
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if TokenListController state does not exist', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({});
    expect(mockBrowser.storage.local.set).not.toHaveBeenCalled();
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

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.TokenListController).toStrictEqual({
      tokensChainsCache: {},
      preventPollingOnNetworkRestart: false,
    });
    expect(mockBrowser.storage.local.set).not.toHaveBeenCalled();
  });

  it('migrates tokensChainsCache to browser.storage.local', async () => {
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

    const newStorage = await migrate(oldStorage);

    // Should save to storage
    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
      'storageService:TokenListController:tokensChainsCache:0x1': chainCache,
    });

    // Should clear state
    expect(
      (newStorage.data.TokenListController as Record<string, unknown>)
        .tokensChainsCache,
    ).toStrictEqual({});

    // Should preserve other state
    expect(
      (newStorage.data.TokenListController as Record<string, unknown>)
        .preventPollingOnNetworkRestart,
    ).toBe(false);
  });

  it('migrates multiple chains in a single storage call', async () => {
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

    await migrate(oldStorage);

    // Should save all chains in a single call
    expect(mockBrowser.storage.local.set).toHaveBeenCalledTimes(1);
    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
      'storageService:TokenListController:tokensChainsCache:0x1': chain1Cache,
      'storageService:TokenListController:tokensChainsCache:0x89': chain2Cache,
      'storageService:TokenListController:tokensChainsCache:0xa86a':
        chain3Cache,
    });
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

    // Mock that chain 0x1 already exists in storage
    mockBrowser.storage.local.get.mockResolvedValue({
      'storageService:TokenListController:tokensChainsCache:0x1': existingCache,
    });

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '0x1': { timestamp: 1111111111, data: {} }, // Should be skipped
            '0x89': newCache, // Should be migrated
          },
        },
      },
    };

    await migrate(oldStorage);

    // Should only save the new chain, not overwrite existing
    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
      'storageService:TokenListController:tokensChainsCache:0x89': newCache,
    });
  });

  it('skips storage.set if all chains already exist in storage', async () => {
    // Mock that all chains already exist in storage
    mockBrowser.storage.local.get.mockResolvedValue({
      'storageService:TokenListController:tokensChainsCache:0x1': {
        timestamp: 1,
        data: {},
      },
      'storageService:TokenListController:tokensChainsCache:0x89': {
        timestamp: 2,
        data: {},
      },
    });

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

    const newStorage = await migrate(oldStorage);

    // Should not call set since all chains already exist
    expect(mockBrowser.storage.local.set).not.toHaveBeenCalled();

    // Should still clear state
    expect(
      (newStorage.data.TokenListController as Record<string, unknown>)
        .tokensChainsCache,
    ).toStrictEqual({});
  });

  it('handles storage errors gracefully and clears state', async () => {
    mockBrowser.storage.local.set.mockRejectedValue(
      new Error('Storage quota exceeded'),
    );

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

    // Should not throw
    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta.version).toBe(version);

    // Should still clear state even on error
    expect(
      (newStorage.data.TokenListController as Record<string, unknown>)
        .tokensChainsCache,
    ).toStrictEqual({});
  });

  it('handles storage.get errors gracefully', async () => {
    mockBrowser.storage.local.get.mockRejectedValue(
      new Error('Storage not available'),
    );

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

    // Should not throw
    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta.version).toBe(version);

    // Should clear state even on error
    expect(
      (newStorage.data.TokenListController as Record<string, unknown>)
        .tokensChainsCache,
    ).toStrictEqual({});
  });
});
