import browser from 'webextension-polyfill';
import { TransactionStatus } from '@metamask/transaction-controller';
import { t } from '../../../shared/lib/translate';
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
    windows: {
      update: jest.fn(),
    },
  };
});

describe('extension platform', () => {
  const metamaskVersion = process.env.METAMASK_VERSION;
  beforeEach(() => {
    // TODO: Delete this an enable 'resetMocks' in `jest.config.js` instead
    jest.resetAllMocks();
  });

  afterEach(() => {
    // reset `METAMASK_VERSION` env var
    process.env.METAMASK_VERSION = metamaskVersion;
  });

  describe('getVersion', () => {
    it('should return non-prerelease version', () => {
      process.env.METAMASK_VERSION = 'should.not.return.me';
      browser.runtime.getManifest.mockReturnValue({
        version: '1.2.3',
      });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3');
    });

    it('should return rollback version', () => {
      process.env.METAMASK_VERSION = 'should.not.return.me';
      browser.runtime.getManifest.mockReturnValue({
        version: '1.2.3.1',
      });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3.1');
    });

    it('should return SemVer-formatted version manifest of prerelease', () => {
      process.env.METAMASK_VERSION = 'should.not.return.me';
      browser.runtime.getManifest.mockReturnValue({
        version: '1.2.3-beta.0',
      });
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3-beta.0');
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
  });

  describe('showTransactionNotification', () => {
    it('shows failed transaction with EthAppNftNotSupported error message', async () => {
      const txMeta = {
        status: TransactionStatus.failed,
        txParams: { nonce: '0x1' },
        error: { message: 'EthAppNftNotSupported' },
      };
      const rpcPrefs = {
        chainId: 1,
      };
      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );
      const expectedErrorMessage = t('ledgerEthAppNftNotSupportedNotification');

      await extensionPlatform.showTransactionNotification(txMeta, rpcPrefs);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Failed transaction',
        `Transaction 1 failed! ${expectedErrorMessage}`,
      );
    });
  });

  describe('focusWindow', () => {
    it('should focus window successfully', async () => {
      const windowId = 123;
      browser.windows.update.mockResolvedValue({ id: windowId });
      const extensionPlatform = new ExtensionPlatform();

      await extensionPlatform.focusWindow(windowId);

      expect(browser.windows.update).toHaveBeenCalledWith(windowId, {
        focused: true,
      });
    });

    it('should handle error gracefully when window does not exist', async () => {
      const windowId = 123;
      const error = new Error('No window with id: 123.');
      browser.windows.update.mockRejectedValue(error);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const extensionPlatform = new ExtensionPlatform();

      // Should not throw an error
      await expect(
        extensionPlatform.focusWindow(windowId),
      ).resolves.toBeUndefined();

      expect(browser.windows.update).toHaveBeenCalledWith(windowId, {
        focused: true,
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to focus window ${windowId}:`,
        error.message,
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('updateWindowPosition', () => {
    it('should update window position successfully', async () => {
      const windowId = 123;
      const left = 100;
      const top = 200;
      browser.windows.update.mockResolvedValue({ id: windowId });
      const extensionPlatform = new ExtensionPlatform();

      await extensionPlatform.updateWindowPosition(windowId, left, top);

      expect(browser.windows.update).toHaveBeenCalledWith(windowId, {
        left,
        top,
      });
    });

    it('should handle error gracefully when window does not exist', async () => {
      const windowId = 123;
      const left = 100;
      const top = 200;
      const error = new Error('No window with id: 123.');
      browser.windows.update.mockRejectedValue(error);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const extensionPlatform = new ExtensionPlatform();

      // Should not throw an error
      await expect(
        extensionPlatform.updateWindowPosition(windowId, left, top),
      ).resolves.toBeUndefined();

      expect(browser.windows.update).toHaveBeenCalledWith(windowId, {
        left,
        top,
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to update window ${windowId} position:`,
        error.message,
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
