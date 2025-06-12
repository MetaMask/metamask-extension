import { withFixtures } from '../../../helpers';

import FixtureBuilder from '../../../fixture-builder';
import Homepage from '../../../page-objects/pages/home/homepage';
import DeFiDetailsPage from '../../../page-objects/pages/defi-details-page';
import DeFiTab from '../../../page-objects/pages/defi-tab';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { Driver } from '../../../webdriver/driver';
import { mockDeFiPositionFeatureFlag } from '../../confirmations/helpers';

import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import { switchToNetworkFlow } from '../../../page-objects/flows/network.flow';

describe('View DeFi details', function () {
  it('user should be able to view Aave Positions details', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockDeFiPositionFeatureFlag,
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

        // check ethereum positions present
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');
        await defiTab.check_groupIconIsDisplayed();
        await defiTab.defiTabCells.check_tokenName('Aave V3');
        await defiTab.defiTabCells.check_tokenMarketValue('$14.74');
        await defiTab.defiTabCells.check_tokenName('Aave V2');
        await defiTab.defiTabCells.check_tokenMarketValue('$0.33');

        // switch popular networks and check linea positions present
        await defiTab.openNetworksFilterAndClickPopularNetworks();
        await defiTab.defiTabCells.check_tokenName('UniswapV3');
        await defiTab.defiTabCells.check_tokenMarketValue('$8.48');
        await defiTab.defiTabCells.check_tokenName('UniswapV2');
        await defiTab.defiTabCells.check_tokenMarketValue('$4.24');

        // click detils page for AaveV3
        await defiTab.clickIntoAaveV3DetailsPage();
        const defiDetailsTab = new DeFiDetailsPage(driver);
        await defiDetailsTab.check_suppliedHeadingIsDisplayed();

        // Check totoal value and protocol name in AaveV3
        await defiDetailsTab.check_deFiProtocolNameIsDisplayed('Aave V3');
        await defiDetailsTab.check_defiDetailsTotalValueIsDisplayed('$14.74');

        // check first underlying position in AaveV3
        await defiDetailsTab.check_tokenName('Tether USD');
        await defiDetailsTab.check_tokenBalanceWithName('0.30011 Tether USD');
        await defiDetailsTab.check_tokenMarketValue('$0.30');

        // check second underlying position in AaveV3
        await defiDetailsTab.check_tokenName('Wrapped Ether');
        await defiDetailsTab.check_tokenBalanceWithName(
          '0.00903 Wrapped Ether',
        );
        await defiDetailsTab.check_tokenMarketValue('$14.44');

        // click back button
        await defiDetailsTab.click_backButton();
        // so we know we are back on the list page
        await defiTab.check_groupIconIsDisplayed();
      },
    );
  });
});
