import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
  tinyDelayMs,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import AddNetworkPage from '../../page-objects/pages/add-network-page';
import NewNetworkAddedPopover from '../../page-objects/pages/popover-wrap/new-network-added';
import { sendTransaction } from '../../page-objects/flows/send-transaction.flow';


describe.skip('Switch network - ', function (this: Suite) {
  it('Ethereum Mainnet and Sepolia', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetwork = new SelectNetwork(driver);

        //Validate the switch network functionality to default Ethereum Mainnet
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.clickNetworkName("Ethereum Mainnet");
        await homePage.check_expectedBalanceIsDisplayed();
        await headerNavbar.check_networkNameSwitchDropDown('Ethereum Mainnet');

        //Validate a transaction in Ethereum network
        await sendTransaction(
          driver,
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
          '1',
          '0.000042',
          '1.000042',
        );
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txAmountInActivity();

        //Validate the switch network functionality to test network Sepolia
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.clickNetworkName("Sepolia");
        //Validate the transaction made in Ethereum network is not displayed in Sepolia network
        await homePage.check_expectedBalanceIsDisplayed();
        await headerNavbar.check_networkNameSwitchDropDown('Sepolia');

        //Validate a transaction in Sepolia network
        await sendTransaction(
          driver,
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
          '1',
          '0.000042',
          '1.000042',
        );
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txAmountInActivity();
      },
    );
  });

  it('create Tenderly network then click dismiss in switch network dialog', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetwork = new SelectNetwork(driver);
        const addNetworkPage = new AddNetworkPage(driver);
        const newNetworkAddedPopover = new NewNetworkAddedPopover(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.addNewNetwork();
        await addNetworkPage.addNewNetworkManually();
        await addNetworkPage.addNetwork({
          name: 'Tenderly',
          rpcUrl:
            'https://rpc.tenderly.co/fork/cdbcd795-097d-4624-aa16-680374d89a43',
          chainId: '1',
          symbol: 'ETH',
          explorerUrl: 'https://dashboard.tenderly.co/explorer',
        });

        // await newNetworkAddedPopover.clickSwitchButton("Tenderly");
        await newNetworkAddedPopover.clickDismissButton();
        await headerNavbar.check_networkNameSwitchDropDown('Localhost 8545');

        await driver.delay(tinyDelayMs);
      },
    );
  });

  it('Validate the networks and UI', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetwork = new SelectNetwork(driver);
        await headerNavbar.clickSwitchNetworkDropDown();

        // Validate the networks

        // Validate the search functionality in switch network dialog

        // Validate the delete functionality in switch network dialog

        // Validate the add network functionality

        // Validate the cancel functionality in switch network dialog

      },
    );
  });

  it('switch to an unsupported network and validate the error message', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetwork = new SelectNetwork(driver);
        await headerNavbar.clickSwitchNetworkDropDown();

        // switch to an unsupported network

      },
    );
  });
});
