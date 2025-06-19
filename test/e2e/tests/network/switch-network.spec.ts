import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  switchToNetworkFromSendFlow,
  searchAndSwitchToNetworkFromSendFlow,
} from '../../page-objects/flows/network.flow';

describe('Switch network - ', function (this: Suite) {
  it('Switch networks to existing and new networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);

        // Validate the switch network functionality to Ethereum Mainnet
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await homePage.check_localNodeBalanceIsDisplayed();

        // Validate the switch network functionality to test network
        await switchToNetworkFromSendFlow(driver, 'Localhost 8545');
        await homePage.check_localNodeBalanceIsDisplayed();

        // Add Arbitrum network and perform the switch network functionality
        await searchAndSwitchToNetworkFromSendFlow(driver, 'Arbitrum One');
        await homePage.check_localNodeBalanceIsDisplayed();

        // Validate the switch network functionality back to Ethereum Mainnet
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await homePage.check_localNodeBalanceIsDisplayed();
      },
    );
  });
});
