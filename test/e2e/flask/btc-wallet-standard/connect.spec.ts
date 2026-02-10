// import { strict as assert } from 'assert';
import { withBtcAccountSnap } from '../btc/common-btc';
import { TestDappBitcoin } from '../../page-objects/pages/test-dapp-bitcoin';
import { connectBitcoinTestDapp } from '../../page-objects/flows/bitcoin-dapp.flow';
import { regularDelayMs } from '../../helpers';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';
import {
  account1Short,
  assertConnected,
  assertDisconnected,
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';

describe('Bitcoin Wallet Standard Connect - e2e tests', function () {
  const connectionLibraryOptions: ('sats-connect' | 'wallet-standard')[] = ['wallet-standard', 'sats-connect'];

  connectionLibraryOptions.forEach((connectionLibrary) => {
    it(`Cancels connection and connects again with ${connectionLibrary}`, async function () {
      await withBtcAccountSnap(
        {
          ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappBitcoin(driver);
          await testDapp.openTestDappPage();

          // 1. Start connection and cancel it
          await testDapp.connectToWallet(connectionLibrary);

          // Cancel the connection
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.cancelConnect();
          await testDapp.switchTo();

          // Verify we're not connected
          await testDapp.findHeaderNotConnectedState();

          // 2. Connect again
          await connectBitcoinTestDapp(driver, testDapp, { connectionLibrary });

          // Verify successful connection
          await testDapp.findHeaderConnectedState();
          await testDapp.findConnectedAccount(account1Short);
        },
      );
    });

    it.skip(`Connects, disconnects and connects again with ${connectionLibrary}`, async function () {
      await withBtcAccountSnap(
        {
          ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappBitcoin(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded()

          // 1. Start connection
          const header = await testDapp.getHeader();
          await header.connect();

          // wait to display wallet connect modal
          await driver.delay(regularDelayMs);

          let modal = await testDapp.getWalletModal();
          await modal.connectToMetaMaskWallet(connectionLibrary);

          await driver.delay(regularDelayMs);

          await connectBitcoinTestDapp(driver, testDapp);

          const connectionStatusAfterConnect =
            await header.getConnectionStatus();
          assertConnected(connectionStatusAfterConnect);

          const account = await header.getAccount();
          assertConnected(account, account1Short);

          // 2. Disconnect
          await header.disconnect();

          // Verify we're not connected
          const connectionStatus = await header.getConnectionStatus();
          assertDisconnected(connectionStatus);


          // 3. Connect again
          await connectBitcoinTestDapp(driver, testDapp);
          
          const connectionStatusAfterConnectAfterSecondConnect =
            await header.getConnectionStatus();
          assertConnected(connectionStatusAfterConnectAfterSecondConnect);

          const accountAfterSecondConnect = await header.getAccount();
          assertConnected(accountAfterSecondConnect, account1Short);
        },
      );
    });
 
    it(`Does not create session when Bitcoin permissions are deselected with ${connectionLibrary}`, async function () {
      await withBtcAccountSnap(
        {
          ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappBitcoin(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          // Start connection
          await testDapp.connectToWallet(connectionLibrary);

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

          // Verify we're not connected
          await testDapp.findHeaderNotConnectedState();
        },
      );
    });
  })
  /* describe('Switch account', function () {
    it('Switching between 2 accounts should reflect in the dapp', async function () {
      await withBtcAccountSnap(
        {
          ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          numberOfAccounts: 2,
        },
        async (driver) => {
          const testDapp = new TestDappBitcoin(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectBitcoinTestDapp(driver, testDapp, {
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
          assertConnected(account2, DEFAULT_BTC_ADDRESS);
        },
      );
    });
  });
  describe('Given I have connected to one of my two accounts', function () {
    it('Switching between them should NOT reflect in the dapp', async function () {
      await withBtcAccountSnap(
        {
          ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          numberOfAccounts: 2, // we create two account
        },
        async (driver) => {
          const testDapp = new TestDappBitcoin(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();

          // By default, the connection is established with the second account, which is the last one selected in the UI.
          await connectBitcoinTestDapp(driver, testDapp, {
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
  }); */
});
