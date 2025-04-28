import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import {
  SOLANA_DEVNET_URL,
  withSolanaAccountSnap,
} from '../solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { regularDelayMs, WINDOW_TITLES } from '../../helpers';
import { updateNetworkCheckboxes } from '../multichain-api/testHelpers';
import {
  account1Short,
  account2Short,
  assertConnected,
  assertDisconnected,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
  switchToAccount,
} from './testHelpers';

describe('Solana Wallet Standard - Connect', function () {
  describe('Connect to a dapp via the Solana Wallet Standard', function () {
    it('Should connect', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
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
          await driver.clickElement({ text: 'Cancel', tag: 'button' });
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

          // Start connection
          const header = await testDapp.getHeader();
          await header.connect();
          await driver.delay(regularDelayMs);
          const modal = await testDapp.getWalletModal();
          await modal.connectToMetaMaskWallet();
          await driver.delay(regularDelayMs);

          // Open the permissions modal
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.clickElement('[data-testid="permissions-tab"]');

          // Deselect all networks except "Ethereum Mainnet"
          await updateNetworkCheckboxes(driver, ['Ethereum Mainnet']);

          // Click connect
          await driver.clickElement({ text: 'Connect', tag: 'button' });

          // Switch back to test dapp
          await testDapp.switchTo();

          // Verify we're not connected
          const connectionStatus = await header.getConnectionStatus();
          assertDisconnected(connectionStatus);
        },
      );
    });
  });

  describe('Disconnect the dapp', function () {
    it('Should disconnect', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
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
    describe('Given I have connected to two accounts', function () {
      it('Switching between them should reflect in the dapp', async function () {
        await withSolanaAccountSnap(
          {
            ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
            title: this.test?.fullTitle(),
            numberOfAccounts: 2,
          },
          async (driver) => {
            const testDapp = new TestDappSolana(driver);
            await testDapp.openTestDappPage();
            await connectSolanaTestDapp(driver, testDapp, {
              selectAllAccounts: true,
            });

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
          await connectSolanaTestDapp(driver, testDapp);

          const header = await testDapp.getHeader();
          const account = await header.getAccount();
          assertConnected(account, account1Short);

          await driver.refresh();

          const accountAfterRefresh = await header.getAccount();
          assertConnected(accountAfterRefresh, account1Short);
        },
      );
    });

    describe('Given I have connected to two accounts', function () {
      it('Refreshing the page should keep me connected to the last selected account', async function () {
        await withSolanaAccountSnap(
          {
            ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
            title: this.test?.fullTitle(),
            numberOfAccounts: 2,
          },
          async (driver) => {
            const testDapp = new TestDappSolana(driver);
            await testDapp.openTestDappPage();
            await connectSolanaTestDapp(driver, testDapp, {
              selectAllAccounts: true,
            });

            await driver.refresh();

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
            await connectSolanaTestDapp(driver, testDapp, {
              includeDevnet: true,
            });

            // Refresh the page
            await driver.refresh();

            // Set the endpoint to devnet as it has been reset after the refresh
            const header = await testDapp.getHeader();
            await header.setEndpoint(SOLANA_DEVNET_URL);
            await driver.clickElement({ text: 'Update', tag: 'button' });

            await driver.delay(regularDelayMs);

            const signMessageTest = await testDapp.getSignMessageTest();
            await signMessageTest.setMessage('Hello, world!');
            await signMessageTest.signMessage();

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            // Check that mainnet appears in the dialog
            const el = await driver.findElement(
              By.xpath("//p[text()='Solana Mainnet']"),
            );
            assert.ok(el);
          },
        );
      });
    });
  });
});
