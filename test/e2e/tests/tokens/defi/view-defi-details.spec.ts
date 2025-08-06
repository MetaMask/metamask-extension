import { withFixtures } from '../../../helpers';

import FixtureBuilder from '../../../fixture-builder';
import Homepage from '../../../page-objects/pages/home/homepage';
import DeFiDetailsPage from '../../../page-objects/pages/defi-details-page';
import DeFiTab from '../../../page-objects/pages/defi-tab';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { Driver } from '../../../webdriver/driver';
import { mockDeFiPositionFeatureFlag } from '../../confirmations/helpers';

import { switchToNetworkFromSendFlow } from '../../../page-objects/flows/network.flow';
import { CHAIN_IDS } from '../../../../../shared/constants/network';

describe('View DeFi details', function () {
  it('user should be able to view Aave Positions details', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.LOCALHOST]: true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockDeFiPositionFeatureFlag,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        await new Homepage(driver).goToDeFiTab();

        const defiTab = new DeFiTab(driver);

        // check ethereum positions present
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await defiTab.checkGroupIconIsDisplayed();
        await defiTab.defiTabCells.checkTokenName('Aave V3');
        await defiTab.defiTabCells.checkTokenMarketValue('$14.74');
        await defiTab.defiTabCells.checkTokenName('Aave V2');
        await defiTab.defiTabCells.checkTokenMarketValue('$0.33');
        await defiTab.defiTabCells.checkTokenName('UniswapV3');
        await defiTab.defiTabCells.checkTokenMarketValue('$8.48');
        await defiTab.defiTabCells.checkTokenName('UniswapV2');
        await defiTab.defiTabCells.checkTokenMarketValue('$4.24');

        // click detils page for AaveV3
        await defiTab.clickIntoAaveV3DetailsPage();
        const defiDetailsTab = new DeFiDetailsPage(driver);
        await defiDetailsTab.checkSuppliedHeadingIsDisplayed();

        // Check totoal value and protocol name in AaveV3
        await defiDetailsTab.checkDeFiProtocolNameIsDisplayed('Aave V3');
        await defiDetailsTab.checkDefiDetailsTotalValueIsDisplayed('$14.74');

        // check first underlying position in AaveV3
        await defiDetailsTab.checkTokenName('Tether USD');
        await defiDetailsTab.checkTokenBalanceWithName('0.30011 Tether USD');
        await defiDetailsTab.checkTokenMarketValue('$0.30');

        // check second underlying position in AaveV3
        await defiDetailsTab.checkTokenName('Wrapped Ether');
        await defiDetailsTab.checkTokenBalanceWithName('0.00903 Wrapped Ether');
        await defiDetailsTab.checkTokenMarketValue('$14.44');

        // click back button
        await defiDetailsTab.clickBackButton();
        // so we know we are back on the list page
        await defiTab.checkGroupIconIsDisplayed();
      },
    );
  });
});
