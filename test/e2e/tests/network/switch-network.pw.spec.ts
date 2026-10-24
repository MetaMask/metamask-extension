import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { E2E_DRIVER } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import {
  mockGasPricesArbitrum,
  mockSwapTokensArbitrum,
  mockSwapAggregatorMetadataArbitrum,
  mockTopAssetsArbitrum,
} from '../bridge/bridge-test-utils';

pwTest.describe('Switch network - ', () => {
  pwTest(
    'Switch networks to existing and new networks',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
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
          await login(driver);
          const homePage = new HomePage(driver);

          // Validate the switch network functionality to Ethereum
          await switchToNetworkFromNetworkSelect(driver, 'Ethereum');
          await homePage.checkLocalNodeBalanceIsDisplayed();

          // Validate the switch network functionality to test network
          await switchToNetworkFromNetworkSelect(driver, 'Localhost 8545');
          await homePage.checkLocalNodeBalanceIsDisplayed();

          // Add Arbitrum network and perform the switch network functionality
          await switchToNetworkFromNetworkSelect(driver, 'Arbitrum');
          await homePage.checkLocalNodeBalanceIsDisplayed();

          // Validate the switch network functionality back to Ethereum
          await switchToNetworkFromNetworkSelect(driver, 'Ethereum');
          await homePage.checkPageIsLoaded();
          await homePage.checkLocalNodeBalanceIsDisplayed();
        },
      );
    },
  );
});
