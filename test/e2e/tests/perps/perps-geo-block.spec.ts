/**
 * Perps Geo-block E2E tests
 *
 * Geo-blocked user: Add funds opens the modal and Got it dismisses it. Eligible user
 * can Long without the modal. (Withdraw from the balance dropdown does not open the
 * geo modal in the product today — only Add funds is gated — so there is no separate
 * Withdraw E2E without changing application code.)
 *
 * PREREQUISITE: PERPS_ENABLED=true in the extension build (.metamaskrc) so the
 * background PerpsController is included.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { getConfig, getPerpsConfigEligible } from './helpers';
import { WS_USER_WITH_FUNDED_ACCOUNT } from './mocks/websocketPositionMocks';

describe('Perps Geo-block', function (this: Suite) {
  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it('geo-blocked user: Add funds shows geo-block modal, then Got it dismisses it', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          // External services are off in getConfig so Perps eligibility does not
          // call Geolocation (not wired on PerpsControllerMessenger); non-EVM
          // account icons are not loaded in that mode.
          waitForNonEvmAccounts: false,
        });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.checkPageIsLoaded();
        await perpsHomePage.waitForBalanceSection();

        await perpsHomePage.clickAddFunds();
        await perpsHomePage.waitForGeoBlockModal();

        await perpsHomePage.dismissGeoBlockModal();
        await perpsHomePage.waitForGeoBlockModalDismissed();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it('eligible user: Long on AVAX opens order entry without geo-block modal', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.checkPageIsLoaded();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.waitForTradeCtaButtons();

        await marketDetailPage.clickLong();
        await marketDetailPage.waitForOrderEntry();
      },
    );
  });
});
