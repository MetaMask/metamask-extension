import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import { connectStellarTestDapp } from '../../page-objects/flows/stellar-dapp.flow';
import { DEFAULT_STELLAR_ADDRESS_SHORT, WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import { addMultipleAccounts } from '../../page-objects/flows/add-account.flow';
import StellarWalletModal from '../../page-objects/pages/stellar-wallet-modal';
import { withStellarWalletSnap } from './testHelpers';

describe('Stellar - Connect', function () {
  // The Stellar Snap only supports pubnet, so this suite intentionally does not
  // test switching to unsupported Stellar networks.
  it('Connects and displays the connected Stellar account', async function () {
    await withStellarWalletSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        await addMultipleAccounts({ driver });
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);

        await testDapp.findHeaderConnectedState();
        await testDapp.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);
      },
    );
  });

  it('Connects, disconnects, and connects again', async function () {
    await withStellarWalletSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        await addMultipleAccounts({ driver });
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.findHeaderConnectedState();
        await testDapp.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);

        await testDapp.disconnect();
        await testDapp.findHeaderNotConnectedState();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.findHeaderConnectedState();
        await testDapp.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);
      },
    );
  });

  it('Cancels connection and connects again', async function () {
    await withStellarWalletSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        await addMultipleAccounts({ driver });
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await testDapp.verifySelectedNetwork('pubnet');
        await testDapp.connect();
        const walletModal = new StellarWalletModal(driver);
        await walletModal.checkPageIsLoaded();
        await walletModal.connectToMetaMaskWallet();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.cancelConnect();
        await testDapp.switchTo();

        await testDapp.findHeaderNotConnectedState();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.findHeaderConnectedState();
        await testDapp.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);
      },
    );
  });

  it('Does not disconnect the dapp after page refresh', async function () {
    await withStellarWalletSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        await addMultipleAccounts({ driver });
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);

        await driver.refresh();

        await testDapp.checkPageIsLoaded();
        await testDapp.findHeaderConnectedState();
        await testDapp.findConnectedAccount(DEFAULT_STELLAR_ADDRESS_SHORT);
      },
    );
  });
});
