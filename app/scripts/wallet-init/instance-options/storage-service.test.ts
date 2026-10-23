import { IndexedDBStorageAdapter } from '../../../../shared/lib/stores/indexeddb-storage-adapter';
import { getStorageServiceInstanceOptions } from './storage-service';

jest.mock('../../../../shared/lib/stores/indexeddb-storage-adapter', () => ({
  IndexedDBStorageAdapter: jest
    .fn()
    .mockImplementation(() => ({ name: 'mock-storage-adapter' })),
}));

describe('getStorageServiceInstanceOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds options with an IndexedDB storage adapter', () => {
    const options = getStorageServiceInstanceOptions();

    expect(IndexedDBStorageAdapter).toHaveBeenCalledTimes(1);
    expect(options).toStrictEqual({
      storage: { name: 'mock-storage-adapter' },
    });
  });
});
