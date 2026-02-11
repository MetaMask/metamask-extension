import { INSTALL_TYPE } from '../../../shared/constants/app';

describe('install-type', () => {
  let mockGetSelf: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    mockGetSelf = jest.fn();
    jest.doMock('webextension-polyfill', () => ({
      management: {
        getSelf: mockGetSelf,
      },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initInstallType', () => {
    it('fetches install type from browser API', async () => {
      mockGetSelf.mockResolvedValue({ installType: 'development' });

      const { initInstallType } = await import('./install-type');
      const result = await initInstallType();

      expect(mockGetSelf).toHaveBeenCalled();
      expect(result).toBe('development');
    });

    it('caches the install type for subsequent getInstallType calls', async () => {
      mockGetSelf.mockResolvedValue({ installType: 'normal' });

      const { initInstallType, getInstallType } = await import(
        './install-type'
      );
      await initInstallType();

      expect(getInstallType()).toBe('normal');
    });

    it('returns UNKNOWN when browser API fails', async () => {
      mockGetSelf.mockRejectedValue(new Error('API not available'));

      const { initInstallType } = await import('./install-type');
      const result = await initInstallType();

      expect(result).toBe(INSTALL_TYPE.UNKNOWN);
    });
  });

  describe('getInstallType', () => {
    it('returns UNKNOWN before initialization', async () => {
      const { getInstallType } = await import('./install-type');
      const result = getInstallType();

      expect(result).toBe(INSTALL_TYPE.UNKNOWN);
    });
  });
});
