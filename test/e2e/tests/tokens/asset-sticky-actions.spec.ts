import { Mockttp } from 'mockttp';
import { Context } from 'mocha';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import AssetStickyActions from '../../page-objects/pages/asset/asset-sticky-actions';
import { login } from '../../page-objects/flows/login.flow';
import { mockHistoricalPricesV3, mockSpotPrices } from './utils/mocks';

describe('Asset sticky actions', function () {
  const chainId = CHAIN_IDS.MAINNET;

  it('keeps Buy and Swap pinned to the bottom while the token detail page scrolls', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { [chainId]: true } })
          .build(),
        title: (this as Context).test?.fullTitle(),
        ethConversionInUsd: 1700,
        // Known SubscriptionsController startup race, unrelated to this page.
        // Tracked in https://github.com/MetaMask/metamask-extension/issues/45612
        ignoredConsoleErrors: ['getSubscriptions'],
        localNodeOptions: {
          chainId: parseInt(chainId, 16),
        },
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          }),
          await mockHistoricalPricesV3(mockServer, 'eip155:1', 'slip44:60'),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const tokensTab = new TokensTab(driver);
        await tokensTab.openTokenDetails('Ethereum');

        const stickyActions = new AssetStickyActions(driver);
        await stickyActions.checkPageIsLoaded();
        await stickyActions.checkPinnedToViewportBottom();

        await stickyActions.scrollToBottom();

        await stickyActions.checkPageIsLoaded();
        await stickyActions.checkPinnedToViewportBottom();
      },
    );
  });
});
