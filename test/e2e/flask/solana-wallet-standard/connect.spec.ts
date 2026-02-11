import { strict as assert } from 'assert';
import {
  SOLANA_DEVNET_URL,
  withSolanaAccountSnap,
} from '../../tests/solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { WINDOW_TITLES } from '../../constants';
import { regularDelayMs } from '../../helpers';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';
import {
  account1Short,
  account2Short,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
  switchToAccount,
} from './testHelpers';

describe('Solana Wallet Standard - e2e tests', function () {
  describe('Solana Wallet Standard - Connect & disconnect', function () {
    it('Should connect and check there is existing Solana accounts in the wallet', async function () {
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

          await connectSolanaTestDapp(driver, testDapp);

          const header = await testDapp.getHeader();

          await header.verifyConnectionStatus('Connected');
          await header.verifyAccount(account1Short);
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

          await header.verifyConnectionStatus('Connected');
          await header.verifyAccount(account1Short);
        },
      );
    });

    // TODO: Need to check and update the test.
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('Should be able to cancel connection and connect again', async function () {
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

          // TODO: Currently, the Status is "Not connected", but the expected status is "Disconnected", need to check and update the test if this is expected.
          // Verify we're not connected
          await header.verifyConnectionStatus('Disconnected');

          // 2. Connect again
          await connectSolanaTestDapp(driver, testDapp);

          // Verify successful connection
          await header.verifyConnectionStatus('Connected');
          await header.verifyAccount(account1Short);
        },
      );
    });

    // TODO: Need to check and update the test.
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('Should not create session when Solana permissions are deselected', async function () {
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

          // Deselect all networks except "Ethereum"
          await connectAccountConfirmation.goToPermissionsTab();
          await connectAccountConfirmation.openEditNetworksModal();

          const networkPermissionSelectModal = new NetworkPermissionSelectModal(
            driver,
          );
          await networkPermissionSelectModal.checkPageIsLoaded();
          await networkPermissionSelectModal.updateNetworkStatus(['Ethereum']);
          await networkPermissionSelectModal.clickConfirmEditButton();

          // Click connect
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.confirmConnect();

          // Switch back to test dapp
          await testDapp.switchTo();

          // TODO: Currently, the Status is "Not connected", but the expected status is "Disconnected", need to check and update the test if this is expected.
          // Verify we're not connected
          await header.verifyConnectionStatus('Disconnected');
        },
      );
    });

    // TODO: Need to check and update the test.
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('Should disconnect', async function () {
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

          await header.verifyConnectionStatus('Connected');
          await header.verifyAccount(account1Short);

          await header.disconnect();

          // TODO: Currently, the Status is "Not connected", but the expected status is "Disconnected", need to check and update the test if this is expected.
          await header.verifyConnectionStatus('Disconnected');
        },
      );
    });
  });
  describe('Switch account', function () {
    // TODO: Need to check and update the test.
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('Switching between 2 accounts should reflect in the dapp', async function () {
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
          await connectSolanaTestDapp(driver, testDapp);
          await driver.delay(regularDelayMs);

          // Check that we're connected to the last selected account
          const header = await testDapp.getHeader();

          // TODO: Currently, the account is "4tE7...Uxer", but the expected account is "ExTE...GNtt", need to check and update the test.
          await header.verifyAccount(account2Short);

          // Switch to the first account
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await switchToAccount(driver, 'Account 1');
          await testDapp.switchTo();

          // Check that we're connected to the first account
          await header.verifyAccount(account1Short);
        },
      );
    });
  });

  describe('Given I have connected to one of my two accounts', function () {
    // TODO: Need to check and update the test.
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('Switching between them should NOT reflect in the dapp', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          numberOfAccounts: 2, // we create 1 more account
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          await connectSolanaTestDapp(driver, testDapp);

          // TODO: Currently, the account is "4tE7...Uxer", but the expected account is "ExTE...GNtt", need to check and update the test.
          // Check that we're connected to the second account
          const header = await testDapp.getHeader();
          await header.verifyAccount(account2Short);

          // Now switch to the first account
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await switchToAccount(driver, 'Account 1');
          await testDapp.switchTo();

          // Check that we're still connected to the second account
          await header.verifyAccount(account2Short);

          // Switch back to the second account
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await switchToAccount(driver, 'Account 2');
          await testDapp.switchTo();

          // Check that we're still connected to the second account
          await header.verifyAccount(account2Short);
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
          await header.verifyAccount(account1Short);

          await driver.refresh();

          await testDapp.checkPageIsLoaded();
          await header.verifyAccount(account1Short);
        },
      );
    });

    // TODO: Need to check and update the test.
    // 1. the test title is With 2 accounts connected, refreshing the page should keep me connected to the last selected account, but in the test body, it only connected account 1 to dapp, not the account2, so the test itself is not testing the expected behaviour
    // 2. the method assertConnected is buggy, it checks connect status, then it uses status as account address to assert, which is very buggy and messy, so it could not do the correct assertions, need re-implement
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('With 2 accounts connected, refreshing the page should keep me connected to the last selected account', async function () {
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
          await connectSolanaTestDapp(driver, testDapp);

          await driver.refresh();

          await testDapp.checkPageIsLoaded();
          const header = await testDapp.getHeader();

          // TODO: Currently, the account is "4tE7...Uxer", but the expected account is "ExTE...GNtt", need to check and update the test.
          await header.verifyAccount(account2Short);
        },
      );
    });
  });

  // BUG #37690 Sending a transaction on TestDapp with BIP44 on fails with exception
  // eslint-disable-next-line mocha/no-skipped-tests
  describe.skip('Given I have connected to Mainnet and Devnet', function () {
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
          await connectSolanaTestDapp(driver, testDapp, {});

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
