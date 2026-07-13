import browser from 'webextension-polyfill';
import { TransactionStatus } from '@metamask/transaction-controller';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { t } from '../../../shared/lib/translate';
import ExtensionPlatform from './extension';

const TEST_URL =
  'chrome-extension://jjlgkphpeekojaidfeknpknnimdbleaf/home.html';

jest.mock('webextension-polyfill', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest ESM interop
  __esModule: true,
  default: {
    runtime: {
      getManifest: jest.fn(),
      getURL: jest.fn(),
    },
    notifications: {
      create: jest.fn(),
      onClicked: {
        hasListener: jest.fn(),
        addListener: jest.fn(),
      },
    },
    tabs: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@metamask/etherscan-link', () => ({
  getBlockExplorerLink: jest.fn(),
}));

type TestTxMeta = Parameters<ExtensionPlatform['_showConfirmedTransaction']>[0];
type TestRpcPrefs = Parameters<
  ExtensionPlatform['showTransactionNotification']
>[1];

const mockedBrowser = jest.mocked(browser);
const mockGetBlockExplorerLink = getBlockExplorerLink as jest.MockedFunction<
  typeof getBlockExplorerLink
>;

function createTxMeta(overrides: Partial<TestTxMeta> = {}): TestTxMeta {
  return {
    chainId: '0x1',
    hash: '0x123',
    metamaskNetworkId: '1',
    status: TransactionStatus.confirmed,
    txParams: { nonce: '0x1' },
    error: { message: 'Error message' },
    ...overrides,
  } as TestTxMeta;
}

describe('extension platform', () => {
  const metamaskVersion = process.env.METAMASK_VERSION;

  beforeEach(() => {
    // TODO: Delete this an enable 'resetMocks' in `jest.config.js` instead
    jest.resetAllMocks();
  });

  afterEach(() => {
    process.env.METAMASK_VERSION = metamaskVersion;
  });

  describe('getVersion', () => {
    it('should return non-prerelease version', () => {
      process.env.METAMASK_VERSION = 'should.not.return.me';
      mockedBrowser.runtime.getManifest.mockReturnValue({
        version: '1.2.3',
      } as ReturnType<typeof browser.runtime.getManifest>);
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3');
    });

    it('should return rollback version', () => {
      process.env.METAMASK_VERSION = 'should.not.return.me';
      mockedBrowser.runtime.getManifest.mockReturnValue({
        version: '1.2.3.1',
      } as ReturnType<typeof browser.runtime.getManifest>);
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3.1');
    });

    it('should return SemVer-formatted version manifest of prerelease', () => {
      process.env.METAMASK_VERSION = 'should.not.return.me';
      mockedBrowser.runtime.getManifest.mockReturnValue({
        version: '1.2.3-beta.0',
      } as ReturnType<typeof browser.runtime.getManifest>);
      const extensionPlatform = new ExtensionPlatform();

      const version = extensionPlatform.getVersion();

      expect(version).toBe('1.2.3-beta.0');
    });
  });

  describe('getExtensionURL', () => {
    let extensionPlatform: ExtensionPlatform;

    beforeEach(() => {
      mockedBrowser.runtime.getURL.mockReturnValue(TEST_URL);
      extensionPlatform = new ExtensionPlatform();
    });

    it('should return URL itself if no route or queryString is provided', () => {
      expect(extensionPlatform.getExtensionURL()).toStrictEqual(TEST_URL);
    });

    it('should return URL with route when provided', () => {
      const testRoute = 'test-route';
      expect(extensionPlatform.getExtensionURL(testRoute)).toStrictEqual(
        `${TEST_URL}#${testRoute}`,
      );
    });

    it('should return URL with queryString when provided', () => {
      const queryString = 'name=ferret';
      expect(
        extensionPlatform.getExtensionURL(null, queryString),
      ).toStrictEqual(`${TEST_URL}?${queryString}`);
    });
  });

  describe('_showConfirmedTransaction', () => {
    it('should show confirmed transaction with nonce', async () => {
      const txMeta = createTxMeta();
      mockedBrowser.notifications.onClicked.hasListener.mockReturnValue(true);
      mockGetBlockExplorerLink.mockReturnValue('http://explorer-mock');

      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );

      await extensionPlatform._showConfirmedTransaction(txMeta);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Confirmed transaction',
        'Transaction 1 confirmed! View on Explorer Mock',
        'http://explorer-mock',
      );
    });

    it('should show confirmed transaction without nonce', async () => {
      const txMeta = createTxMeta({
        txParams: { nonce: undefined } as TestTxMeta['txParams'],
      });
      mockedBrowser.notifications.onClicked.hasListener.mockReturnValue(true);
      mockGetBlockExplorerLink.mockReturnValue('http://explorer-mock');

      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );

      await extensionPlatform._showConfirmedTransaction(txMeta);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Confirmed transaction',
        'Transaction confirmed! View on Explorer Mock',
        'http://explorer-mock',
      );
    });
  });

  describe('_showFailedTransaction', () => {
    it('should show failed transaction with nonce', async () => {
      const txMeta = createTxMeta();
      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );

      await extensionPlatform._showFailedTransaction(txMeta);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Failed transaction',
        `Transaction 1 failed! ${txMeta.error?.message}`,
      );
    });

    it('should show failed transaction without nonce', async () => {
      const txMeta = createTxMeta({
        txParams: { nonce: undefined } as TestTxMeta['txParams'],
      });
      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );

      await extensionPlatform._showFailedTransaction(txMeta);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Failed transaction',
        `Transaction failed! ${txMeta.error?.message}`,
      );
    });

    it('should show failed transaction with nonce and with errorMessage', async () => {
      const errorMessage = 'Test error message';
      const txMeta = createTxMeta();
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

    it('should show failed transaction without nonce and with errorMessage', async () => {
      const errorMessage = 'Test error message';
      const txMeta = createTxMeta({
        txParams: { nonce: undefined } as TestTxMeta['txParams'],
      });
      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );

      await extensionPlatform._showFailedTransaction(txMeta, errorMessage);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Failed transaction',
        `Transaction failed! ${errorMessage}`,
      );
    });
  });

  describe('showTransactionNotification', () => {
    it('shows failed transaction with EthAppNftNotSupported error message', async () => {
      const txMeta = createTxMeta({
        status: TransactionStatus.failed,
        error: { name: 'EthAppNftNotSupported', message: 'EthAppNftNotSupported' },
      });
      const rpcPrefs = {
        chainId: 1,
      } as TestRpcPrefs;
      const extensionPlatform = new ExtensionPlatform();
      const showNotificationSpy = jest.spyOn(
        extensionPlatform,
        '_showNotification',
      );
      const expectedErrorMessage = t(
        'ledgerEthAppNftNotSupportedNotification',
      );

      await extensionPlatform.showTransactionNotification(txMeta, rpcPrefs);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Failed transaction',
        `Transaction 1 failed! ${expectedErrorMessage}`,
      );
    });
  });
});
