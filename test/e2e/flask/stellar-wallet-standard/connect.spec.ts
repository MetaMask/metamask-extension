import { TestDappStellar } from '../../page-objects/pages/test-dapp-stellar';
import { connectStellarTestDapp } from '../../page-objects/flows/stellar-dapp.flow';
import {
  DEFAULT_STELLAR_ADDRESS_SHORT,
  WINDOW_TITLES,
} from '../../constants';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import {
  DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
  withStellarWalletSnap,
} from './testHelpers';

describe('Stellar Wallet Standard - Connect - e2e tests', function () {
  it('Connects and displays the connected Stellar account', async function () {
    await withStellarWalletSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
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
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
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
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await testDapp.selectNetwork('pubnet');
        await testDapp.connect();
        const modal = await testDapp.getWalletModal();
        await modal.connectToMetaMaskWallet();

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
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
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

  it('Reflects network change in the dapp', async function () {
    await withStellarWalletSnap(
      {
        ...DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const testDapp = new TestDappStellar(driver);
        await testDapp.openTestDappPage();

        await connectStellarTestDapp(driver, testDapp);
        await testDapp.findHeaderConnectedState();

        await testDapp.selectNetwork('testnet');
        await testDapp.verifySelectedNetwork('testnet');

        await testDapp.selectNetwork('pubnet');
        await testDapp.verifySelectedNetwork('pubnet');
        await testDapp.findHeaderConnectedState();
      },
    );
  });
});
