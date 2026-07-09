import { BrowserStorageAdapter } from '../../../../shared/lib/stores/browser-storage-adapter';
import { getStorageServiceInstanceOptions } from './storage-service';

jest.mock('../../../../shared/lib/stores/browser-storage-adapter', () => ({
  BrowserStorageAdapter: jest
    .fn()
    .mockImplementation(() => ({ name: 'mock-storage-adapter' })),
}));

describe('getStorageServiceInstanceOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds options with a browser storage adapter', () => {
    const options = getStorageServiceInstanceOptions();

    expect(BrowserStorageAdapter).toHaveBeenCalledTimes(1);
    expect(options).toStrictEqual({
      storage: { name: 'mock-storage-adapter' },
    });
  });
});
