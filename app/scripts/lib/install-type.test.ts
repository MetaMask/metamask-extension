import browser from 'webextension-polyfill';
import { INSTALL_TYPE } from '../../../shared/constants/app';
import { initInstallType, getInstallType } from './install-type';

jest.mock('webextension-polyfill', () => ({
  management: {
    getSelf: jest.fn(),
  },
}));

const mockedGetSelf = jest.mocked(browser.management.getSelf);

describe('install-type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initInstallType', () => {
    it('fetches install type from browser API', async () => {
      mockedGetSelf.mockResolvedValue({
        installType: 'development',
      } as browser.Management.ExtensionInfo);

      const result = await initInstallType();

      expect(mockedGetSelf).toHaveBeenCalled();
      expect(result).toBe('development');
    });

    it('caches the install type for subsequent getInstallType calls', async () => {
      mockedGetSelf.mockResolvedValue({
        installType: 'normal',
      } as browser.Management.ExtensionInfo);

      await initInstallType();

      expect(getInstallType()).toBe('normal');
    });

    it('returns cached value when browser API fails', async () => {
      mockedGetSelf.mockRejectedValue(new Error('API not available'));

      // The function catches errors and returns the cached value
      const result = await initInstallType();

      expect(typeof result).toBe('string');
    });
  });

  describe('getInstallType', () => {
    it('returns the cached install type synchronously', () => {
      const result = getInstallType();

      // After the previous tests, some value is cached
      expect(typeof result).toBe('string');
    });
  });
});
