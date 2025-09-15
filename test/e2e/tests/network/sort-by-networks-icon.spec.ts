import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { CHAIN_IDS } from '../../../../shared/constants/network';

describe('Sort By Networks Icon', function (this: Suite) {
  it('should display the correct network icon when only Ethereum Mainnet is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);

        // Wait for the sort-by-networks button to be present
        await driver.waitForSelector('[data-testid="sort-by-networks"]');

        // Check that the button text shows the correct network name
        const networkLabel = await assetListPage.getNetworksFilterLabel();
        console.log(`Network label: ${networkLabel}`);

        // For single network, it should show the network name (e.g., "Ethereum Mainnet")
        const expectedNetworkNames = [
          'Ethereum Mainnet',
          'Mainnet',
          'Ethereum',
        ];
        const isCorrectNetworkName = expectedNetworkNames.some((name) =>
          networkLabel.includes(name),
        );

        if (!isCorrectNetworkName) {
          throw new Error(
            `Expected network name to include one of ${expectedNetworkNames.join(', ')}, but got: ${networkLabel}`,
          );
        }

        // Check that the network icon is displayed and has the correct source
        const expectedIconIndicators = [
          'ethereum',
          'eth',
          'ETH',
          // Could also be a data URL or contain the token image URL path
          'images/icons',
          '/images/',
        ];

        await assetListPage.checkNetworkIconContains(expectedIconIndicators);
      },
    );
  });

  it('should display the correct network icon when only Linea Mainnet is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnLinea()
          .withEnabledNetworks({ eip155: { [CHAIN_IDS.LINEA_MAINNET]: true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);

        // Wait for the sort-by-networks button to be present
        await driver.waitForSelector('[data-testid="sort-by-networks"]');

        // Check that the button text shows the correct network name
        const networkLabel = await assetListPage.getNetworksFilterLabel();
        console.log(`Network label: ${networkLabel}`);

        // For Linea, it should show "Linea Mainnet" or similar
        const expectedNetworkNames = ['Linea Mainnet', 'Linea'];
        const isCorrectNetworkName = expectedNetworkNames.some((name) =>
          networkLabel.includes(name),
        );

        if (!isCorrectNetworkName) {
          throw new Error(
            `Expected network name to include one of ${expectedNetworkNames.join(', ')}, but got: ${networkLabel}`,
          );
        }

        // Check that the network icon is displayed and has the correct source
        const expectedIconIndicators = [
          'linea',
          'LINEA',
          'Linea',
          // Could also be a data URL or contain the token image URL path
          'images/icons',
          '/images/',
        ];

        await assetListPage.checkNetworkIconContains(expectedIconIndicators);
      },
    );
  });

  it('should display the correct network icon when only Polygon is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnPolygon()
          .withEnabledNetworks({ eip155: { [CHAIN_IDS.POLYGON]: true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);

        // Wait for the sort-by-networks button to be present
        await driver.waitForSelector('[data-testid="sort-by-networks"]');

        // Check that the button text shows the correct network name
        const networkLabel = await assetListPage.getNetworksFilterLabel();
        console.log(`Network label: ${networkLabel}`);

        // For Polygon, it should show "Polygon Mainnet" or similar
        const expectedNetworkNames = ['Polygon', 'POL'];
        const isCorrectNetworkName = expectedNetworkNames.some((name) =>
          networkLabel.includes(name),
        );

        if (!isCorrectNetworkName) {
          throw new Error(
            `Expected network name to include one of ${expectedNetworkNames.join(', ')}, but got: ${networkLabel}`,
          );
        }

        // Check that the network icon is displayed and has the correct source
        const expectedIconIndicators = [
          'polygon',
          'POLYGON',
          'Polygon',
          'pol',
          'POL',
          'matic',
          'MATIC',
          // Could also be a data URL or contain the token image URL path
          'images/icons',
          '/images/',
        ];

        await assetListPage.checkNetworkIconContains(expectedIconIndicators);
      },
    );
  });
});
