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

    it('shows failed transaction with ledgerEthAppNftNotSupported error message', async () => {
      const errorMessage = 'ledgerEthAppNftNotSupported';
      const txMeta = {
        status: TransactionStatus.failed,
        txParams: { nonce: '0x1' },
        error: { message: errorMessage },
      };
      const rpcPrefs = {
        chainId: 1,
      };
      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );
      const expectedErrorMessage = t('ledgerEthAppNftNotSupported');

      await extensionPlatform.showTransactionNotification(txMeta, rpcPrefs);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Failed transaction',
        `Transaction 1 failed! ${expectedErrorMessage}`,
      );
    });
  });
});
