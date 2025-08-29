import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { emptyHtmlPage } from '../../mock-e2e';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../page-objects/flows/network.flow';

async function mockPortfolioPage(mockServer: Mockttp) {
  return await mockServer
    .forGet(`https://app.metamask.io/explore/networks/linea`)
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage(),
      };
    });
}

describe('Linea Network Discover Button', function (this: Suite) {
  it('should locate the Discover button and navigate to the correct URL when clicking the Discover button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            neNetworkDiscoverButton: {
              [CHAIN_IDS.LINEA_MAINNET]: true,
            },
          },
        },
        testSpecificMock: mockPortfolioPage,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // Open network dropdown
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        // Search for Linea Mainnet
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.fillNetworkSearchInput('Linea Mainnet');
        await selectNetworkDialog.openNetworkListOptions('eip155:59144');

        // Verify Discover button is visible
        await selectNetworkDialog.checkDiscoverButtonIsVisible();

        // Click Discover button
        await selectNetworkDialog.clickDiscoverButton();

        // Switch to the new tab that was opened
        await driver.switchToWindowWithTitle('E2E Test Page');

        // Verify the URL is correct
        await driver.waitForUrlContaining({
          url: 'app.metamask.io/explore/networks/linea',
        });
      },
    );
  });
});
