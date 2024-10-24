import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Ganache } from '../../seeder/ganache';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import ModalConfirmation from '../../page-objects/pages/dialog/network-switch-modal-confirmation';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';

describe('Switch network - ', function (this: Suite) {
  it('Switch networks to existing and new networks', async function () {
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
        const networkSwitchConfirmation = new ModalConfirmation(driver);

        // Validate the default network is Localhost 8545
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');

        // Validate the switch network functionality to Ethereum Mainnet
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.clickNetworkName('Ethereum Mainnet');
        await homePage.check_expectedBalanceIsDisplayed('25');
        await headerNavbar.check_currentSelectedNetwork('Ethereum Mainnet');
        // Validate the switch network functionality to test network
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.clickToggleButton();
        await selectNetwork.clickNetworkName('Localhost 8545');
        await homePage.check_expectedBalanceIsDisplayed('25');
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');

        // Add Arbitrum network and perform the switch network functionality
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.fillNetworkSearchInput('Arbitrum One');
        await selectNetwork.clickAddButton();
        await networkSwitchConfirmation.clickApproveButton();
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.clickNetworkName('Arbitrum One');
        await homePage.check_expectedBalanceIsDisplayed('25');
        await headerNavbar.check_currentSelectedNetwork('Arbitrum One');

        // Validate the switch network functionality back to Ethereum Mainnet
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.clickNetworkName('Ethereum Mainnet');
        await homePage.check_expectedBalanceIsDisplayed('25');
        await headerNavbar.check_currentSelectedNetwork('Ethereum Mainnet');
      },
    );
  });
});
