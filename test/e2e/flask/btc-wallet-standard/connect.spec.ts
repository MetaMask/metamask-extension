// import { strict as assert } from 'assert';
import {
  TestDappBitcoin,
  WalletConnectionType,
  availableConnectionTypes,
} from '../../page-objects/pages/test-dapp-bitcoin';
import { connectBitcoinTestDapp } from '../../page-objects/flows/bitcoin-dapp.flow';
import { switchToAccount } from '../../page-objects/flows/account-list.flow';
import { DAPP_HOST_ADDRESS, WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsModal from '../../page-objects/pages/dialog/edit-connected-accounts-modal';
import {
  account1Short,
  account2Short,
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
  withBtcWalletStandardSnap,
} from './testHelpers';

describe('Bitcoin Wallet Standard Connect - e2e tests', function () {
  availableConnectionTypes.forEach((connectionLibrary) => {
    it(`Cancels connection and connects again with ${connectionLibrary}`, async function () {
      await withBtcWalletStandardSnap(
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

    it(`Connects, disconnects and connects again with ${connectionLibrary}`, async function () {
      await withBtcWalletStandardSnap(
        {
          ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappBitcoin(driver);
          await testDapp.openTestDappPage();

          // 1. Connect
          await connectBitcoinTestDapp(driver, testDapp, { connectionLibrary });
          await testDapp.findHeaderConnectedState();
          await testDapp.findConnectedAccount(account1Short);

          // 2. Disconnect
          await testDapp.disconnect();
          await testDapp.findHeaderNotConnectedState();

          // 3. Connect again
          await connectBitcoinTestDapp(driver, testDapp, { connectionLibrary });
          await testDapp.findHeaderConnectedState();
          await testDapp.findConnectedAccount(account1Short);
        },
      );
    });

    it(`Switching between 2 accounts should reflects in the dapp with ${connectionLibrary}`, async function () {
      await withBtcWalletStandardSnap(
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
          await switchToAccount(driver, 'Account 2');

          await testDapp.switchTo();

          await testDapp.findConnectedAccount(account2Short);
        },
      );
    });
  });

  describe('Page refresh', function () {
    it('Should not disconnect the dapp', async function () {
      await withBtcWalletStandardSnap(
        {
          ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappBitcoin(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectBitcoinTestDapp(driver, testDapp, {
            connectionLibrary: WalletConnectionType.Standard,
          });

          await testDapp.findConnectedAccount(account1Short);

          await driver.refresh();

          await testDapp.checkPageIsLoaded();
          await testDapp.findConnectedAccount(account1Short);
        },
      );
    });
  });
});
