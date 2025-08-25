import { strict as assert } from 'assert';
import {
  SOLANA_DEVNET_URL,
  withSolanaAccountSnap,
} from '../../tests/solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { regularDelayMs, WINDOW_TITLES } from '../../helpers';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';
import {
  account1Short,
  account2Short,
  assertConnected,
  assertDisconnected,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
  switchToAccount,
} from './testHelpers';

describe('Solana Wallet Standard - e2e tests', function () {
  describe('Solana Wallet Standard - Connect & disconnect', function () {
    it('Should onboard and connect when there are no existing Solana accounts in the wallet', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          numberOfAccounts: 0,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          await connectSolanaTestDapp(driver, testDapp, { onboard: true });

          const header = await testDapp.getHeader();

          const connectionStatus = await header.getConnectionStatus();
          assertConnected(connectionStatus);

          const account = await header.getAccount();
          assertConnected(account, account1Short);
        },
      );
    });

    it('Should connect when there is an existing Solana account in the wallet', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          numberOfAccounts: 1,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          await connectSolanaTestDapp(driver, testDapp);

          const header = await testDapp.getHeader();

          const connectionStatus = await header.getConnectionStatus();
          assertConnected(connectionStatus);

          const account = await header.getAccount();
          assertConnected(account, account1Short);
        },
      );
    });
    it('Should be able to cancel connection and connect again', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          // 1. Start connection and cancel it
          const header = await testDapp.getHeader();
          await header.connect();

          // wait to display wallet connect modal
          await driver.delay(regularDelayMs);

          const modal = await testDapp.getWalletModal();
          await modal.connectToMetaMaskWallet();

          await driver.delay(regularDelayMs);

          // Cancel the connection
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.cancelConnect();
          await testDapp.switchTo();

          // Verify we're not connected
          const connectionStatus = await header.getConnectionStatus();
          assertDisconnected(connectionStatus);

          // 2. Connect again
          await connectSolanaTestDapp(driver, testDapp);

          // Verify successful connection
          const connectionStatusAfterConnect =
            await header.getConnectionStatus();
          assertConnected(connectionStatusAfterConnect);

          const account = await header.getAccount();
          assertConnected(account, account1Short);
        },
      );
    });
    it('Should not create session when Solana permissions are deselected', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          // Start connection
          const header = await testDapp.getHeader();
          await header.connect();
          await driver.delay(regularDelayMs);
          const modal = await testDapp.getWalletModal();
          await modal.connectToMetaMaskWallet();
          await driver.delay(regularDelayMs);

          // Open the permissions modal
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();

          // Deselect all networks except "Ethereum Mainnet"
          await connectAccountConfirmation.goToPermissionsTab();
          await connectAccountConfirmation.openEditNetworksModal();

          const networkPermissionSelectModal = new NetworkPermissionSelectModal(
            driver,
          );
          await networkPermissionSelectModal.checkPageIsLoaded();
          await networkPermissionSelectModal.updateNetworkStatus([
            'Ethereum Mainnet',
          ]);
          await networkPermissionSelectModal.clickConfirmEditButton();

          // Click connect
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.confirmConnect();

          // Switch back to test dapp
          await testDapp.switchTo();

          // Verify we're not connected
          const connectionStatus = await header.getConnectionStatus();
          assertDisconnected(connectionStatus);
        },
      );
    });
    it('Should disconnect', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp);

          const header = await testDapp.getHeader();

          const connectionStatus = await header.getConnectionStatus();
          assertConnected(connectionStatus);

          const account = await header.getAccount();
          assertConnected(account, account1Short);

          await header.disconnect();

          const connectionStatusAfterDisconnect =
            await header.getConnectionStatus();
          assertDisconnected(connectionStatusAfterDisconnect);
        },
      );
    });
  });
  describe('Switch account', function () {
    it('Switching between 2 accounts should reflect in the dapp', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          numberOfAccounts: 2,
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp, {
            selectAllAccounts: true,
          });
          await driver.delay(regularDelayMs);

          // Check that we're connected to the last selected account
          const header = await testDapp.getHeader();
          const account = await header.getAccount();
          assertConnected(account, account2Short);

          // Switch to the first account
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await switchToAccount(driver, 'Solana 1');
          await testDapp.switchTo();

          // Check that we're connected to the first account
          const account2 = await header.getAccount();
          assertConnected(account2, account1Short);
        },
      );
    });
  });
  describe('Given I have connected to one of my two accounts', function () {
    it('Switching between them should NOT reflect in the dapp', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          numberOfAccounts: 2, // we create two account
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          // By default, the connection is established with the second account, which is the last one selected in the UI.
          await connectSolanaTestDapp(driver, testDapp, {
            selectAllAccounts: false,
          });

          // Check that we're connected to the second account
          const header = await testDapp.getHeader();
          let account = await header.getAccount();
          assertConnected(account, account2Short);

          // Now switch to the first account
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await switchToAccount(driver, 'Solana 1');
          await testDapp.switchTo();

          // Check that we're still connected to the second account
          account = await header.getAccount();
          assertConnected(account, account2Short);

          // Switch back to the second account
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await switchToAccount(driver, 'Solana 2');
          await testDapp.switchTo();

          // Check that we're still connected to the second account
          account = await header.getAccount();
          assertConnected(account, account2Short);
        },
      );
    });
  });
  describe('Page refresh', function () {
    it('Should not disconnect the dapp', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp);

          const header = await testDapp.getHeader();
          const account = await header.getAccount();
          assertConnected(account, account1Short);

          await driver.refresh();

          await testDapp.checkPageIsLoaded();
          const accountAfterRefresh = await header.getAccount();
          assertConnected(accountAfterRefresh, account1Short);
        },
      );
    });

    it('With 2 accounts connected, refreshing the page should keep me connected to the last selected account', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          numberOfAccounts: 2,
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp, {
            selectAllAccounts: true,
          });

          await driver.refresh();

          await testDapp.checkPageIsLoaded();
          const header = await testDapp.getHeader();
          const account = await header.getAccount();
          assertConnected(account, account2Short);
        },
      );
    });
  });
  describe('Given I have connected to Mainnet and Devnet', function () {
    it('Should use the Mainnet scope by default', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp, {
            includeDevnet: true,
          });

          // Refresh the page
          await driver.refresh();
          await testDapp.checkPageIsLoaded();

          // Set the endpoint to devnet as it has been reset after the refresh
          const header = await testDapp.getHeader();
          await header.setEndpoint(SOLANA_DEVNET_URL);
          await testDapp.clickUpdateEndpointButton();

          const signMessageTest = await testDapp.getSignMessageTest();
          await signMessageTest.setMessage('Hello, world!');
          await signMessageTest.signMessage();

          await driver.delay(regularDelayMs);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Check that mainnet appears in the dialog
          const el = await driver.waitForSelector({
            text: 'Solana Mainnet',
            tag: 'p',
          });
          assert.ok(el);
        },
      );
    });
  });
});
