import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { NetworkId, NetworkName } from '../../helpers/network-constants';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import NetworkPillSelector from '../../page-objects/pages/networks/network-pill-selector';
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
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: { extensionUxFullscreenRedesign: false },
        },
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
        await switchToNetworkFromNetworkSelect(driver, NetworkName.ETHEREUM);
        await homePage.checkLocalNodeBalanceIsDisplayed();

        // Validate the switch network functionality to test network
        await switchToNetworkFromNetworkSelect(driver, NetworkName.LOCALHOST);
        await homePage.checkLocalNodeBalanceIsDisplayed();

        // Add Arbitrum network and perform the switch network functionality
        await switchToNetworkFromNetworkSelect(driver, NetworkName.ARBITRUM);
        await homePage.checkLocalNodeBalanceIsDisplayed();

        // Validate the switch network functionality back to Ethereum
        await switchToNetworkFromNetworkSelect(driver, NetworkName.ETHEREUM);
        await homePage.checkPageIsLoaded();
        await homePage.checkLocalNodeBalanceIsDisplayed();
      },
    );
  });

  // The network pills only offer default networks the wallet already has. Custom
  // networks (the local node) and networks that still have to be added
  // (Arbitrum) can only be switched to from the network filter modal, which is
  // covered by the previous test.
  it('Switch networks using network pills available in wide layout', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: { extensionUxFullscreenRedesign: true },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        const networkFilter = new NetworkFilter(driver);
        const networkPillSelector = new NetworkPillSelector(driver);

        await networkPillSelector.selectNetwork(NetworkId.ETHEREUM);
        await networkFilter.waitUntilLabelIs(
          `Network: ${NetworkName.ETHEREUM}`,
        );
        await homePage.checkLocalNodeBalanceIsDisplayed();

        await networkPillSelector.selectNetwork(NetworkId.LINEA);
        await networkFilter.waitUntilLabelIs(`Network: ${NetworkName.LINEA}`);

        await networkPillSelector.selectNetwork(NetworkId.ETHEREUM);
        await networkFilter.waitUntilLabelIs(
          `Network: ${NetworkName.ETHEREUM}`,
        );
        await homePage.checkPageIsLoaded();
        await homePage.checkLocalNodeBalanceIsDisplayed();
        await networkPillSelector.checkNetworkPillIsSelected(
          NetworkId.ETHEREUM,
        );
      },
    );
  });
});
