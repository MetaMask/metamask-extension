import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { NETWORK_CLIENT_ID } from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { CHAIN_IDS } from '../../../../shared/constants/network';

describe('Sort By Networks Icon', function (this: Suite) {
  it('should display the correct network icon when only Ethereum Mainnet is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: { '0x1': true },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const tokensTab = new TokensTab(driver);

        // Wait for the sort-by-networks button to be present
        await driver.waitForSelector('[data-testid="sort-by-networks"]');

        // Check that the button text shows the correct network name
        const networkLabel = await tokensTab.getNetworksFilterLabel();
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
        ];

        await tokensTab.checkNetworkIconContains(expectedIconIndicators);
      },
    );
  });

});
