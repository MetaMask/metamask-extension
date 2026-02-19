import { Suite } from 'mocha';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import PerpsTabPage from '../../page-objects/pages/perps/perps-tab-page';
import { DEFAULT_PERPS_REMOTE_FEATURE_FLAGS } from './helpers';
import { mockPerpsHyperliquidApis } from './mocks/hyperliquid';
import { DEFAULT_PERPS_WS_MOCKS } from './mocks/websocketDefaultMocks';

describe('Perps tab', function (this: Suite) {
  it('opens the Perps tab and navigates to market detail', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: DEFAULT_PERPS_REMOTE_FEATURE_FLAGS,
        },
        perpsWebSocketSpecificMocks: DEFAULT_PERPS_WS_MOCKS,
        testSpecificMock: mockPerpsHyperliquidApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const perpsTabPage = new PerpsTabPage(driver);
        await perpsTabPage.checkPerpsTabIsVisible();
        await perpsTabPage.openPerpsTab();
        await perpsTabPage.checkPerpsTabViewIsLoaded();
        await perpsTabPage.clickPositionCard('ETH');
        await perpsTabPage.checkMarketDetailPageIsLoaded();
      },
    );
  });
});
