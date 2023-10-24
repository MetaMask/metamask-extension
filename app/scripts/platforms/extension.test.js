import browser from 'webextension-polyfill';
import ExtensionPlatform from './extension';

const TEST_URL =
  'chrome-extension://jjlgkphpeekojaidfeknpknnimdbleaf/home.html';

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      getManifest: jest.fn(),
      getURL: jest.fn(),
    },
    notifications: {
      create: jest.fn(),
    },
  };
});

describe('extension platform', () => {
  beforeEach(() => {
    // TODO: Delete this an enable 'resetMocks' in `jest.config.js` instead
    jest.resetAllMocks();
  });

  describe('getVersion', () => {
    it('should return non-prerelease version', () => {
      browser.runtime.getManifest.mockReturnValue({ version: '1.2.3' });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3');
    });

    it('should return rollback version', () => {
      browser.runtime.getManifest.mockReturnValue({ version: '1.2.3.1' });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3.1');
    });

    it('should return SemVer-formatted version for Chrome style manifest of prerelease', () => {
      browser.runtime.getManifest.mockReturnValue({
        version: '1.2.3.0',
        version_name: '1.2.3-beta.0',
      });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3-beta.0');
    });

    it('should return SemVer-formatted version for Firefox style manifest of prerelease', () => {
      browser.runtime.getManifest.mockReturnValue({
        version: '1.2.3beta0',
      });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3-beta.0');
    });

    it('should throw error if build version is missing from Chrome style prerelease manifest', () => {
      browser.runtime.getManifest.mockReturnValue({
        version: '1.2.3',
        version_name: '1.2.3-beta.0',
      });
      const extensionPlatform = new ExtensionPlatform();

      expect(() => extensionPlatform.getVersion()).toThrow(
        'Version missing build number:',
      );
    });

    it('should throw error if build version is missing from Firefox style prerelease manifest', () => {
      browser.runtime.getManifest.mockReturnValue({
        version: '1.2.3beta',
      });
      const extensionPlatform = new ExtensionPlatform();

      expect(() => extensionPlatform.getVersion()).toThrow(
        'Version contains invalid prerelease:',
      );
    });

    it('should throw error if patch is missing from Firefox style prerelease manifest', () => {
      browser.runtime.getManifest.mockReturnValue({
        version: '1.2.beta0',
      });
      const extensionPlatform = new ExtensionPlatform();

      expect(() => extensionPlatform.getVersion()).toThrow(
        'Version contains invalid prerelease:',
      );
    });
  });

  describe('getExtensionURL', () => {
    let extensionPlatform;
    beforeEach(() => {
      browser.runtime.getURL.mockReturnValue(TEST_URL);
      extensionPlatform = new ExtensionPlatform();
    });

    it('should return URL itself if no route or queryString is provided', () => {
      expect(extensionPlatform.getExtensionURL()).toStrictEqual(TEST_URL);
    });

    it('should return URL with route when provided', () => {
      const TEST_ROUTE = 'test-route';
      expect(extensionPlatform.getExtensionURL(TEST_ROUTE)).toStrictEqual(
        `${TEST_URL}#${TEST_ROUTE}`,
      );
    });

    it('should return URL with queryString when provided', () => {
      const QUERY_STRING = 'name=ferret';
      expect(
        extensionPlatform.getExtensionURL(null, QUERY_STRING),
      ).toStrictEqual(`${TEST_URL}?${QUERY_STRING}`);
    });
  });

  describe('_showFailedTransaction', () => {
    it('should show failed transaction with nonce', async () => {
      const txMeta = {
        txParams: { nonce: '0x1' },
        error: { message: 'Error message' },
      };
      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );

      await extensionPlatform._showFailedTransaction(txMeta);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Failed transaction',
        `Transaction 1 failed! ${txMeta.error.message}`,
      );
    });

    it('should show failed transaction with errorMessage', async () => {
      const errorMessage = 'Test error message';
      const txMeta = {
        txParams: { nonce: '0x1' },
        error: { message: 'Error message' },
      };
      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );

      await extensionPlatform._showFailedTransaction(txMeta, errorMessage);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Failed transaction',
        `Transaction 1 failed! ${errorMessage}`,
      );
    });

    it('should show failed transaction without nonce', async () => {
      const txMeta = {
        txParams: {},
        error: { message: 'Error message' },
      };
      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );

      await extensionPlatform._showFailedTransaction(txMeta);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Failed transaction',
        `Transaction failed! ${txMeta.error.message}`,
      );
    });
  });
});
