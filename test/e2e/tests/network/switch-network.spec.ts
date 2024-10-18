import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
  tinyDelayMs,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Ganache } from '../../seeder/ganache';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';

describe('Switch network - ', function (this: Suite) {
  it('Ethereum Mainnet and Sepolia', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const homePage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetwork = new SelectNetwork(driver);

        //Validate the switch network functionality to default Ethereum Mainnet
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.clickNetworkName("Ethereum Mainnet");
        await homePage.check_expectedBalanceIsDisplayed("25");
        await headerNavbar.check_networkNameSwitchDropDown('Ethereum Mainnet');
        //Validate the switch network functionality to test network Sepolia
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.clickToggleButton();
        await selectNetwork.clickNetworkName("Sepolia");
        //Validate the transaction made in Ethereum network is not displayed in Sepolia network
        await homePage.check_expectedBalanceIsDisplayed("25 Sepolia");
        await headerNavbar.check_networkNameSwitchDropDown("Sepolia");
        await driver.delay(tinyDelayMs);
      },
    );
  });

  it.skip('Validate the networks and UI', async function () {
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

        await driver.isElementPresent({
          tag: 'h6',
          text: '“Tenderly” was successfully added!',
        });

        // Validate the networks

        // Validate the search functionality in switch network dialog
        // Enter this Localhost 8545
        //data-testid="network-redesign-modal-search-input"
        // Validate the delete functionality in switch network dialog

        // Validate the add network functionality

        // Validate the cancel functionality in switch network dialog
        //aria-label="Close"
      },
    );
  });

});
