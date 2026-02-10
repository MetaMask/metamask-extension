// import { strict as assert } from 'assert';
import { withBtcAccountSnap } from '../btc/common-btc';
import { TestDappBitcoin } from '../../page-objects/pages/test-dapp-bitcoin';
import { connectBitcoinTestDapp } from '../../page-objects/flows/bitcoin-dapp.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { regularDelayMs } from '../../helpers';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';
import EditConnectedAccountsModal from '../../page-objects/pages/dialog/edit-connected-accounts-modal';
import {
  account1Short,
  account2Short,
  assertConnected,
  assertDisconnected,
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';

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

    it(`Switching between 2 accounts should reflects in the dapp with ${connectionLibrary}`, async function () {
      await withBtcAccountSnap(
        {
          ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          numberOfAccounts: 2,
        },
        async (driver) => {
          const testDapp = new TestDappBitcoin(driver);
          await testDapp.openTestDappPage();

          // 1. Connect
          await testDapp.connectToWallet(connectionLibrary);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.openEditAccountsModal();
          const editConnectedAccountsModal = new EditConnectedAccountsModal(
            driver,
          );
          await editConnectedAccountsModal.selectAccount(2);
          await editConnectedAccountsModal.clickOnConnect();
          await connectAccountConfirmation.confirmConnect();

          await testDapp.switchTo();

          // Verify successful connection
          await testDapp.findConnectedAccount(account1Short);

          // 2. Switch to the second account
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const nonEvmHomepage = new NonEvmHomepage(driver);
          await nonEvmHomepage.headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.switchToAccount('Account 2');

          await testDapp.switchTo();

          await testDapp.findConnectedAccount(account2Short);
        },
      );
    });
  })
});
