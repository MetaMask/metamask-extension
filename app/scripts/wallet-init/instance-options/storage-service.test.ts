import { getManifestFlags } from '../../../../shared/lib/manifestFlags';
import { BrowserStorageAdapter } from '../../../../shared/lib/stores/browser-storage-adapter';
import { IndexedDBStorageAdapter } from '../../../../shared/lib/stores/indexeddb-storage-adapter';
import { STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG } from '../../../../shared/lib/stores/indexeddb-storage-constants';
import { getStorageServiceInstanceOptions } from './storage-service';

jest.mock('../../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: jest.fn(() => ({})),
}));
jest.mock('../../../../shared/lib/stores/browser-storage-adapter', () => ({
  BrowserStorageAdapter: jest
    .fn()
    .mockImplementation(() => ({ name: 'mock-browser-storage-adapter' })),
}));
jest.mock('../../../../shared/lib/stores/indexeddb-storage-adapter', () => ({
  IndexedDBStorageAdapter: jest
    .fn()
    .mockImplementation(() => ({ name: 'mock-indexeddb-storage-adapter' })),
}));

describe('getStorageServiceInstanceOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getManifestFlags).mockReturnValue({});
  });

  it('uses browser storage when the rollout flag is missing', () => {
    const options = getStorageServiceInstanceOptions({ state: {} });

    expect(BrowserStorageAdapter).toHaveBeenCalledTimes(1);
    expect(IndexedDBStorageAdapter).not.toHaveBeenCalled();
    expect(options).toStrictEqual({
      storage: { name: 'mock-browser-storage-adapter' },
    });
  });

  it('uses browser storage when the persisted rollout flag is disabled', () => {
    const options = getStorageServiceInstanceOptions({
      state: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            [STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG]: false,
          },
        },
      },
    });

    expect(BrowserStorageAdapter).toHaveBeenCalledTimes(1);
    expect(IndexedDBStorageAdapter).not.toHaveBeenCalled();
    expect(options).toStrictEqual({
      storage: { name: 'mock-browser-storage-adapter' },
    });
  });

  it('uses IndexedDB when the persisted rollout flag is enabled', () => {
    const options = getStorageServiceInstanceOptions({
      state: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            [STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG]: true,
          },
        },
      },
    });

    expect(IndexedDBStorageAdapter).toHaveBeenCalledTimes(1);
    expect(BrowserStorageAdapter).not.toHaveBeenCalled();
    expect(options).toStrictEqual({
      storage: { name: 'mock-indexeddb-storage-adapter' },
    });
  });

  it('prefers an enabled manifest override to a disabled persisted flag', () => {
    jest.mocked(getManifestFlags).mockReturnValue({
      remoteFeatureFlags: {
        [STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG]: true,
      },
    });

    const options = getStorageServiceInstanceOptions({
      state: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            [STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG]: false,
          },
        },
      },
    });

    expect(IndexedDBStorageAdapter).toHaveBeenCalledTimes(1);
    expect(BrowserStorageAdapter).not.toHaveBeenCalled();
    expect(options).toStrictEqual({
      storage: { name: 'mock-indexeddb-storage-adapter' },
    });
  });

  it('prefers a disabled manifest override to an enabled persisted flag', () => {
    jest.mocked(getManifestFlags).mockReturnValue({
      remoteFeatureFlags: {
        [STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG]: false,
      },
    });

    const options = getStorageServiceInstanceOptions({
      state: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            [STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG]: true,
          },
        },
      },
    });

    expect(BrowserStorageAdapter).toHaveBeenCalledTimes(1);
    expect(IndexedDBStorageAdapter).not.toHaveBeenCalled();
    expect(options).toStrictEqual({
      storage: { name: 'mock-browser-storage-adapter' },
    });
  });
});
