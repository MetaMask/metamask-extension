import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  searchAndSwitchToNetworkFromGlobalMenuFlow,
  switchToNetworkFromSendFlow,
} from '../../page-objects/flows/network.flow';
import {
  mockGasPricesArbitrum,
  mockSwapTokensArbitrum,
  mockSwapAggregatorMetadataArbitrum,
  mockTopAssetsArbitrum,
} from '../bridge/bridge-test-utils';

describe('Switch network - ', function (this: Suite) {
  it('Switch networks to existing and new networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })
          .withEnabledNetworks({
            eip155: {
              '0x539': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          const standardMocks = [
            await mockGasPricesArbitrum(mockServer),
            await mockTopAssetsArbitrum(mockServer),
            await mockSwapTokensArbitrum(mockServer),
            await mockSwapAggregatorMetadataArbitrum(mockServer),
          ];
          return standardMocks;
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);

        // Validate the switch network functionality to Ethereum
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await homePage.checkLocalNodeBalanceIsDisplayed();

        // Validate the switch network functionality to test network
        await switchToNetworkFromSendFlow(driver, 'Localhost 8545');
        await homePage.checkLocalNodeBalanceIsDisplayed();

        // Add Arbitrum network and perform the switch network functionality
        await searchAndSwitchToNetworkFromGlobalMenuFlow(driver, 'Arbitrum');
        await homePage.checkLocalNodeBalanceIsDisplayed();

        // Validate the switch network functionality back to Ethereum
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await homePage.checkPageIsLoaded();
        await homePage.checkLocalNodeBalanceIsDisplayed();
      },
    );
  });
});
