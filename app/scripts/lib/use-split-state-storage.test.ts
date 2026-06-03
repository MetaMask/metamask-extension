import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { useSplitStateStorage } from './use-split-state-storage';

jest.unmock('../../../shared/lib/stores/browser-storage-adapter');

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
    },
  },
}));

const mockGet = jest.mocked(browser.storage.local.get);

function getState({
  accountCount,
  networkCount,
  flag,
}: {
  accountCount: number;
  networkCount: number;
  flag?: {
    enabled: number;
    maxAccounts: number;
    maxNetworks: number;
  };
}): Parameters<typeof useSplitStateStorage>[0] {
  return {
    AccountsController: {
      internalAccounts: {
        accounts: Object.fromEntries(
          Array.from({ length: accountCount }, (_, index) => [
            `account-${index}`,
            {},
          ]),
        ),
      },
    },
    NetworkController: {
      networkConfigurationsByChainId: Object.fromEntries(
        Array.from({ length: networkCount }, (_, index) => [
          `0x${index + 1}`,
          {},
        ]),
      ),
    },
    RemoteFeatureFlagController: flag
      ? {
          remoteFeatureFlags: {
            platformSplitStateGradualRollout: { value: flag },
          },
        }
      : undefined,
  } as Parameters<typeof useSplitStateStorage>[0];
}

describe('useSplitStateStorage', () => {
  const originalInTest = process.env.IN_TEST;

  beforeEach(() => {
    process.env.IN_TEST = 'true';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.IN_TEST = originalInTest;
  });

  it('uses developer overrides when they are readable', async () => {
    mockGet.mockImplementation(async (key) => {
      if (key === 'splitStateMigrationEnabled') {
        return { splitStateMigrationEnabled: '1' };
      }
      if (key === 'splitStateMigrationMaxAccounts') {
        return { splitStateMigrationMaxAccounts: '2' };
      }
      if (key === 'splitStateMigrationMaxNetworks') {
        return { splitStateMigrationMaxNetworks: '2' };
      }
      return {};
    });

    const result = await useSplitStateStorage(
      getState({
        accountCount: 2,
        networkCount: 2,
        flag: {
          enabled: 0,
          maxAccounts: 0,
          maxNetworks: 0,
        },
      }),
    );

    expect(result).toBe(true);
    expect(mockGet).toHaveBeenCalledWith('splitStateMigrationEnabled');
    expect(mockGet).toHaveBeenCalledWith('splitStateMigrationMaxAccounts');
    expect(mockGet).toHaveBeenCalledWith('splitStateMigrationMaxNetworks');
    expect(mockGet).not.toHaveBeenCalledWith([
      'splitStateMigrationEnabled',
      'splitStateMigrationMaxAccounts',
      'splitStateMigrationMaxNetworks',
    ]);
  });

  it('falls back to remote flags when a developer override key is unreadable', async () => {
    mockGet.mockImplementation(async (key) => {
      if (key === 'splitStateMigrationEnabled') {
        throw new Error('block checksum mismatch');
      }
      return {};
    });

    const result = await useSplitStateStorage(
      getState({
        accountCount: 1,
        networkCount: 1,
        flag: {
          enabled: 1,
          maxAccounts: 1,
          maxNetworks: 1,
        },
      }),
    );

    expect(result).toBe(true);
  });

  it('treats generated null developer override as unset without reading legacy override keys', async () => {
    const overrideNamespace = 'SplitStateMigrationDevOverrides';
    const enabledKey = 'splitStateMigrationEnabled';
    const generatedStorageKey = `${STORAGE_KEY_PREFIX}__value:${overrideNamespace}:${enabledKey}:generated`;
    const generatedIndexKey = `${STORAGE_KEY_PREFIX}__keyIndex:${overrideNamespace}:0`;

    mockGet.mockImplementation(async (key) => {
      if (key === generatedIndexKey) {
        return {
          [key]: {
            version: 1,
            updatedAt: 1,
            keys: {
              [enabledKey]: generatedStorageKey,
            },
          },
        };
      }
      if (key === generatedStorageKey) {
        return { [generatedStorageKey]: null };
      }
      if (key === enabledKey) {
        return { [enabledKey]: '1' };
      }
      if (key === 'splitStateMigrationMaxAccounts') {
        return { splitStateMigrationMaxAccounts: '1' };
      }
      if (key === 'splitStateMigrationMaxNetworks') {
        return { splitStateMigrationMaxNetworks: '1' };
      }
      return {};
    });

    const result = await useSplitStateStorage(
      getState({
        accountCount: 0,
        networkCount: 0,
        flag: {
          enabled: 0,
          maxAccounts: 1,
          maxNetworks: 1,
        },
      }),
    );

    expect(result).toBe(false);
    expect(mockGet).not.toHaveBeenCalledWith(enabledKey);
    expect(mockGet).not.toHaveBeenCalledWith('splitStateMigrationMaxAccounts');
    expect(mockGet).not.toHaveBeenCalledWith('splitStateMigrationMaxNetworks');
  });

  it('treats a generated override pointer tombstone as authoritative without reading legacy override keys', async () => {
    const overrideNamespace = 'SplitStateMigrationDevOverrides';
    const enabledKey = 'splitStateMigrationEnabled';
    const pointerKey = `${STORAGE_KEY_PREFIX}__valuePointer:${overrideNamespace}:${enabledKey}:0`;

    mockGet.mockImplementation(async (key) => {
      if (key === pointerKey) {
        return {
          [pointerKey]: {
            version: 1,
            updatedAt: 1,
            storageKey: null,
          },
        };
      }
      if (key === enabledKey) {
        return { [enabledKey]: '1' };
      }
      if (key === 'splitStateMigrationMaxAccounts') {
        return { splitStateMigrationMaxAccounts: '1' };
      }
      if (key === 'splitStateMigrationMaxNetworks') {
        return { splitStateMigrationMaxNetworks: '1' };
      }
      return {};
    });

    const result = await useSplitStateStorage(
      getState({
        accountCount: 0,
        networkCount: 0,
        flag: {
          enabled: 0,
          maxAccounts: 1,
          maxNetworks: 1,
        },
      }),
    );

    expect(result).toBe(false);
    expect(mockGet).not.toHaveBeenCalledWith(enabledKey);
    expect(mockGet).not.toHaveBeenCalledWith('splitStateMigrationMaxAccounts');
    expect(mockGet).not.toHaveBeenCalledWith('splitStateMigrationMaxNetworks');
  });
});
