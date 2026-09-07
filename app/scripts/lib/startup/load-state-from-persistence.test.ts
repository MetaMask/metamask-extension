import type { MetaMaskStorageStructure } from '../../../../shared/lib/stores/base-store';
import type { Backup } from '../../../../shared/lib/stores/persistence-manager';
import type { FirstTimeState } from './load-state-from-persistence';

const mockGet = jest.fn();
const mockGetBackup = jest.fn();
const mockSet = jest.fn();
const mockSetMetadata = jest.fn();
const mockGetMetaData = jest.fn();
const mockUpdate = jest.fn();
const mockPersist = jest.fn();
const mockMigrateToSplitState = jest.fn();
const mockUseSplitStateStorage = jest.fn();

let mockStorageKind: 'data' | 'split' = 'split';

const mockMigrateData = jest.fn();
const mockGenerateInitialState = jest.fn();

jest.mock('../setup-initial-state-hooks', () => ({
  persistenceManager: {
    get storageKind() {
      return mockStorageKind;
    },
    set storageKind(value: 'data' | 'split') {
      mockStorageKind = value;
    },
    get: (...args: unknown[]) => mockGet(...args),
    getBackup: (...args: unknown[]) => mockGetBackup(...args),
    set: (...args: unknown[]) => mockSet(...args),
    setMetadata: (...args: unknown[]) => mockSetMetadata(...args),
    getMetaData: (...args: unknown[]) => mockGetMetaData(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    persist: (...args: unknown[]) => mockPersist(...args),
    migrateToSplitState: (...args: unknown[]) =>
      mockMigrateToSplitState(...args),
  },
}));

jest.mock('../migrator', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    migrateData: (...args: unknown[]) => mockMigrateData(...args),
    generateInitialState: (...args: unknown[]) =>
      mockGenerateInitialState(...args),
  }));
});

jest.mock('../use-split-state-storage', () => ({
  useSplitStateStorage: (...args: unknown[]) =>
    mockUseSplitStateStorage(...args),
}));

jest.mock('../../migrations', () => []);

const mockGenerateWalletState = jest.fn();

jest.mock('../../fixtures/generate-wallet-state', () => ({
  generateWalletState: (...args: unknown[]) => mockGenerateWalletState(...args),
}));

jest.mock('../getObjStructure', () => jest.fn(() => ({})));

const defaultFirstTimeState: FirstTimeState = { config: {} };

const migratedState: MetaMaskStorageStructure = {
  data: {
    KeyringController: { vault: 'encrypted' },
    AppMetadataController: { firstTimeInfo: { version: '1.0.0' } },
    NetworkController: { networkConfigurationsByChainId: {} },
  },
  meta: { version: 200, storageKind: 'split' },
};

describe('loadStateFromPersistence', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockStorageKind = 'split';
    mockGet.mockResolvedValue({
      data: { KeyringController: { vault: 'encrypted' } },
      meta: { version: 199, storageKind: 'split' },
    });
    mockMigrateData.mockResolvedValue({
      state: migratedState,
      changedKeys: new Set(['KeyringController']),
    });
    mockUseSplitStateStorage.mockResolvedValue(false);
    mockGetMetaData.mockReturnValue({ version: 200, storageKind: 'split' });
    delete process.env.WITH_STATE;
  });

  async function loadState(
    backup: Backup | null = null,
    firstTimeState: FirstTimeState = defaultFirstTimeState,
  ) {
    const { loadStateFromPersistence } =
      await import('./load-state-from-persistence');
    return loadStateFromPersistence(backup, firstTimeState);
  }

  it('loads persisted state when no backup is provided', async () => {
    const { versionedData } = await loadState();

    expect(mockGet).toHaveBeenCalledWith({ validateVault: true });
    expect(mockMigrateData).toHaveBeenCalled();
    expect(mockPersist).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      'KeyringController',
      migratedState.data?.KeyringController,
    );
    expect(versionedData).toStrictEqual(migratedState);
  });

  it('restores from backup and sets storageKind from backup meta', async () => {
    mockStorageKind = 'data';
    const backup: Backup = {
      KeyringController: { vault: 'from-backup' },
      AppMetadataController: { firstTimeInfo: { version: '1.0.0' } },
      meta: { version: 157, storageKind: 'split' },
    };

    await loadState(backup);

    expect(mockGet).not.toHaveBeenCalled();
    expect(mockStorageKind).toBe('split');
    expect(mockMigrateData).toHaveBeenCalledWith({
      data: {
        KeyringController: { vault: 'from-backup' },
        AppMetadataController: { firstTimeInfo: { version: '1.0.0' } },
      },
      meta: { version: 157, storageKind: 'split' },
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      'KeyringController',
      migratedState.data?.KeyringController,
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      'AppMetadataController',
      migratedState.data?.AppMetadataController,
    );
    expect(mockPersist).toHaveBeenCalled();
  });

  it('defaults backup storageKind to data when meta.storageKind is missing', async () => {
    mockStorageKind = 'split';
    const backup: Backup = {
      KeyringController: { vault: 'from-backup' },
      meta: { version: 155 },
    };

    await loadState(backup);

    expect(mockStorageKind).toBe('data');
  });

  it('migrates data storage to split state when rollout criteria are met', async () => {
    mockStorageKind = 'data';
    const dataStorageState: MetaMaskStorageStructure = {
      data: { KeyringController: { vault: 'encrypted' } },
      meta: { version: 200, storageKind: 'data' },
    };
    mockGet.mockResolvedValue(dataStorageState);
    mockMigrateData.mockResolvedValue({
      state: dataStorageState,
      changedKeys: new Set(['KeyringController']),
    });
    mockUseSplitStateStorage.mockResolvedValue(true);
    mockGetMetaData.mockReturnValue({ version: 200, storageKind: 'split' });

    const { versionedData } = await loadState();

    expect(mockUseSplitStateStorage).toHaveBeenCalledWith(
      dataStorageState.data,
    );
    expect(mockSet).toHaveBeenCalledWith(dataStorageState.data);
    expect(mockMigrateToSplitState).toHaveBeenCalledWith(dataStorageState.data);
    expect(mockPersist).toHaveBeenCalled();
    expect(versionedData.meta).toStrictEqual({
      version: 200,
      storageKind: 'split',
    });
  });

  it('generates initial state for brand-new installs', async () => {
    mockGet.mockResolvedValue(undefined);
    const initialVersionedData: MetaMaskStorageStructure = {
      data: { config: { onboarding: true } },
      meta: { version: 200, storageKind: 'split' },
    };
    mockGenerateInitialState.mockReturnValue(initialVersionedData);
    mockMigrateData.mockResolvedValue({
      state: initialVersionedData,
      changedKeys: new Set(Object.keys(initialVersionedData.data ?? {})),
    });

    await loadState(null, { config: { onboarding: true } });

    expect(mockGenerateInitialState).toHaveBeenCalledWith({
      config: { onboarding: true },
    });
    expect(mockUpdate).toHaveBeenCalledWith('config', { onboarding: true });
  });

  it('returns updated firstTimeState when WITH_STATE overrides are applied', async () => {
    process.env.WITH_STATE = JSON.stringify({ seedPhrase: 'test' });
    mockGenerateWalletState.mockResolvedValue({
      fixture: { data: { config: { fromFixture: true } } },
    });

    const { firstTimeState } = await loadState(null, { config: {} });

    expect(firstTimeState).toStrictEqual({
      config: { fromFixture: true },
    });
  });
});
