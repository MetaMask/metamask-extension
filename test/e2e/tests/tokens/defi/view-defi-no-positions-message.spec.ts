import { withFixtures } from '../../../helpers';

import FixtureBuilder from '../../../fixture-builder';
import Homepage from '../../../page-objects/pages/home/homepage';

import DeFiTab from '../../../page-objects/pages/defi-tab';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { Driver } from '../../../webdriver/driver';
import { mockNoDeFiPositionFeatureFlag } from '../../confirmations/helpers';

import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import { switchToNetworkFlow } from '../../../page-objects/flows/network.flow';

const isGlobalNetworkSelectorRemoved = process.env.REMOVE_GNS === 'true';

describe('Check DeFi empty state when no defi positions', function () {
  it('user should be able to view empty', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockNoDeFiPositionFeatureFlag,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await new Homepage(driver).goToDeFiTab();

        // Validate the default network is Localhost 8545
        await new HeaderNavbar(driver).check_currentSelectedNetwork(
          'Localhost 8545',
        );

        const defiTab = new DeFiTab(driver);

        // Empty state
        await defiTab.check_noPositionsMessageIsDisplayed();
        await defiTab.waitForStakeLink();

        // switch network
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');

        // check emtry state still present
        if (!isGlobalNetworkSelectorRemoved) {
          await defiTab.openNetworksFilterAndClickPopularNetworks();
        }
        await defiTab.check_noPositionsMessageIsDisplayed();
      },
    );
  });
});
