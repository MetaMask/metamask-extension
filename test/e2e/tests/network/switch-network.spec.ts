import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Ganache } from '../../seeder/ganache';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import {
  switchToNetworkFlow,
  searchAndSwitchToNetworkFlow,
} from '../../page-objects/flows/network.flow';

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

        // Validate the default network is Localhost 8545
        await new HeaderNavbar(driver).check_currentSelectedNetwork(
          'Localhost 8545',
        );

        // Validate the switch network functionality to Ethereum Mainnet
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');
        await homePage.check_localBlockchainBalanceIsDisplayed(ganacheServer);

        // Validate the switch network functionality to test network
        await switchToNetworkFlow(driver, 'Localhost 8545', true);
        await homePage.check_localBlockchainBalanceIsDisplayed(ganacheServer);

        // Add Arbitrum network and perform the switch network functionality
        await searchAndSwitchToNetworkFlow(driver, 'Arbitrum One');
        await homePage.check_localBlockchainBalanceIsDisplayed(ganacheServer);

        // Validate the switch network functionality back to Ethereum Mainnet
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');
        await homePage.check_localBlockchainBalanceIsDisplayed(ganacheServer);
      },
    );
  });
});
