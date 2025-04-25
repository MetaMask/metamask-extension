import { strict as assert } from 'assert';
import {
  SOLANA_DEVNET_URL,
  withSolanaAccountSnap,
} from '../solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  assertConnected,
  assertDisconnected,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
  switchToAccount,
} from './testHelpers';
import { regularDelayMs, WINDOW_TITLES } from '../../helpers';
import { By } from 'selenium-webdriver';

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
          assertConnected(account, '4tE7...Uxer');
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
          assertConnected(account, '4tE7...Uxer');
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
          const editButtons = await driver.findElements('[data-testid="edit"]');
          await editButtons[1].click();
          await driver.delay(regularDelayMs);
          const networkListItems = await driver.findElements(
            '.multichain-network-list-item',
          );

          // Deselect Solana permission and select Ethereum mainnet
          for (const item of networkListItems) {
            const networkNameDiv = await item.findElement(By.css('div[data-testid]'));
            const network = await networkNameDiv.getAttribute('data-testid');
            // Deselect Solana permission
            if (network === 'Solana') {
              const checkbox = await item.findElement(By.css('input[type="checkbox"]'));
              const isChecked = await checkbox.isSelected();

              if (isChecked) {
                await checkbox.click();
              }
              break;
            } else if (network === 'Ethereum Mainnet') {
              const checkbox = await item.findElement(By.css('input[type="checkbox"]'));
              const isChecked = await checkbox.isSelected();

              if (!isChecked) {
                await checkbox.click();
              }
            }
          }
          await driver.clickElement({ text: 'Update', tag: 'button' });

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
          assertConnected(account, '4tE7...Uxer');

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
            assertConnected(account, 'ExTE...GNtt');

            // Switch to the first account
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            await switchToAccount(driver, 'Solana 1');
            await testDapp.switchTo();

            // Check that we're connected to the first account
            const account2 = await header.getAccount();
            assertConnected(account2, '4tE7...Uxer');
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
            numberOfAccounts: 2,
          },
          async (driver) => {
            const testDapp = new TestDappSolana(driver);
            await testDapp.openTestDappPage();
            await connectSolanaTestDapp(driver, testDapp, {
              selectAllAccounts: false,
            });

            // Check that we're connected to the last selected account
            const header = await testDapp.getHeader();
            let account = await header.getAccount();
            assertConnected(account, 'ExTE...GNtt');

            // Switch to the first account
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            await switchToAccount(driver, 'Solana 1');
            await testDapp.switchTo();

            // Check that we're connected to the first account
            account = await header.getAccount();
            assertConnected(account, 'ExTE...GNtt');

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            await switchToAccount(driver, 'Solana 2');
            await testDapp.switchTo();

            // Check that we're connected to the first account
            account = await header.getAccount();
            assertConnected(account, 'ExTE...GNtt');
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
          assertConnected(account, '4tE7...Uxer');

          await driver.refresh();

          const accountAfterRefresh = await header.getAccount();
          assertConnected(accountAfterRefresh, '4tE7...Uxer');
        },
      );
    });

    describe('Given I have connected to two accounts', function () {
      it.only('Refreshing the page should keep me connected to the last selected account', async function () {
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
            assertConnected(account, 'ExTE...GNtt');
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

            // Check that devnet appears in the dialog
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
